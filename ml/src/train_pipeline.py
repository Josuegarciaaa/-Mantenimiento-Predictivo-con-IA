"""
train_pipeline.py
=================
Pipeline de entrenamiento mejorado.

Mejoras:
- XGBoost con hiperparámetros optimizados (reemplaza Random Forest básico)
- TimeSeriesSplit cross-validation (respeta el orden temporal)
- Feature engineering avanzado (EWMA, Health Index, Z-score)
- Comparación automática RF vs XGBoost y selección del mejor
- Exportación de métricas y feature importances
- EarlyStopping para XGBoost
"""

import sys
import json
import datetime
from pathlib import Path

# Agregar src/ al path
SRC_DIR = Path(__file__).resolve().parent
sys.path.append(str(SRC_DIR))

from data.data_loader import load_dataset, add_rul_column
from data.preprocessor import DataPreprocessor
from features.feature_builder import FeatureBuilder
from models.rul_model import BaselineRULModel, EnsembleRULPredictor
from evaluation.metrics import evaluate_model
from utils.helpers import setup_logger, save_training_metadata, ensure_directory
import numpy as np
import pandas as pd

logger = setup_logger('train_pipeline')


def run_pipeline():
    logger.info("=" * 60)
    logger.info("  PIPELINE ENTRENAMIENTO ML — MANTENIMIENTO PREDICTIVO")
    logger.info("=" * 60)

    # Rutas
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    DATA_DIR = BASE_DIR / 'data' / 'raw'
    MODELS_DIR = BASE_DIR / 'ml' / 'trained_models'
    ensure_directory(MODELS_DIR)

    # 1. Cargar datos
    logger.info("\nCargando dataset C-MAPSS desde {DATA_DIR}")
    try:
        datasets = load_dataset(str(DATA_DIR), 'FD001')
        train_df = datasets['train']
        test_df = datasets['test']
        rul_df = datasets['rul']
    except Exception as e:
        logger.error(f"Error al cargar datos: {e}. Verifique que los archivos existan.")
        return

    logger.info(f"  Train shape: {train_df.shape}, Test shape: {test_df.shape}")

    # 2. Calcular RUL
    logger.info("\nCalculando RUL (Piece-Wise Linear)...")
    train_df = add_rul_column(train_df)

    # 3. Preprocesamiento
    logger.info("\nPreprocesamiento y escalado...")
    preprocessor = DataPreprocessor(rul_cap=125)
    train_df = preprocessor.clip_rul(train_df)
    train_df = preprocessor.fit_transform(train_df)
    logger.info(f"  Columnas descartadas (varianza=0): {preprocessor.columns_to_drop}")

    # 4. Feature Engineering
    logger.info("\nExtrayendo features avanzadas...")
    feature_builder = FeatureBuilder(window_sizes=[5, 10, 20])
    train_df = feature_builder.build_features(train_df, include_fft=False)

    # Preparar X, y eliminando NaN
    feature_cols = [c for c in train_df.columns
                    if c not in ['engine_id', 'cycle', 'rul']]
    X_train = train_df[feature_cols].fillna(0).values
    y_train = train_df['rul'].values

    logger.info(f"  Features totales: {len(feature_cols)}")
    logger.info(f"  Muestras de entrenamiento: {len(X_train):,}")

    # 5. Entrenar y comparar modelos
    logger.info("\nEntrenando modelos con TimeSeriesSplit CV...")

    models_to_compare = [
        ('xgboost', {'n_estimators': 300, 'max_depth': 6, 'learning_rate': 0.05}),
        ('random_forest', {'n_estimators': 100, 'max_depth': 15}),
    ]

    best_model = None
    best_rmse = float('inf')
    all_metrics = {}

    for model_type, params in models_to_compare:
        logger.info(f"  Entrenando {model_type}...")
        model = BaselineRULModel(model_type=model_type, **params)

        # TimeSeriesSplit CV
        cv_metrics = model.cross_validate(X_train, y_train, n_splits=5)
        logger.info(f"    CV RMSE: {cv_metrics['cv_rmse_mean']:.2f} ± {cv_metrics['cv_rmse_std']:.2f}")
        logger.info(f"    CV MAE : {cv_metrics['cv_mae_mean']:.2f}")
        logger.info(f"    CV R²  : {cv_metrics['cv_r2_mean']:.4f}")

        all_metrics[model_type] = cv_metrics

        if cv_metrics['cv_rmse_mean'] < best_rmse:
            best_rmse = cv_metrics['cv_rmse_mean']
            best_model = (model_type, model, params)

    logger.info(f"\n  Mejor modelo: {best_model[0]} (CV RMSE={best_rmse:.2f})")

    # Entrenar el mejor modelo en todo el dataset
    best_type, best_model_obj, best_params = best_model
    best_model_obj.train(X_train, y_train)

    # Evaluar en train (para logging)
    y_pred_train = best_model_obj.predict(X_train)
    train_metrics = evaluate_model(y_train, y_pred_train)
    logger.info(f"  Métricas (Train completo): RMSE={train_metrics['rmse']:.2f}, R²={train_metrics['r2_score']:.4f}")

    # Feature importances (si disponible)
    if best_model_obj.feature_importances_ is not None:
        top_features = sorted(
            zip(feature_cols, best_model_obj.feature_importances_),
            key=lambda x: x[1], reverse=True
        )[:15]
        logger.info("  Top 15 features más importantes:")
        for feat, imp in top_features:
            logger.info(f"    {feat:<40} {imp:.4f}")

    # 6. Guardar artefactos
    logger.info("\nGuardando artefactos...")

    model_path = MODELS_DIR / f'{best_type}_rul_model.pkl'
    best_model_obj.save(str(model_path))
    logger.info(f"  Modelo guardado → {model_path}")

    # También guardar como rf_rul_model.pkl para compatibilidad con predict_service.py
    import joblib
    joblib.dump(best_model_obj.model, str(MODELS_DIR / 'rf_rul_model.pkl'))

    preprocessor.save_scaler(str(MODELS_DIR / 'scaler.pkl'))
    logger.info(f"  Scaler guardado → {MODELS_DIR / 'scaler.pkl'}")

    # Guardar metadata completa
    metadata = {
        'trained_at': datetime.datetime.utcnow().isoformat(),
        'best_model': best_type,
        'best_cv_rmse': best_rmse,
        'train_metrics': train_metrics,
        'cv_metrics_all_models': all_metrics,
        'feature_count': len(feature_cols),
        'train_samples': len(X_train),
        'params': best_params,
    }
    meta_path = MODELS_DIR / 'training_metadata.json'
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"  Metadata guardada → {meta_path}")

    logger.info("\n" + "=" * 60)
    logger.info("  PIPELINE FINALIZADO CON ÉXITO")
    logger.info("=" * 60)


if __name__ == '__main__':
    run_pipeline()
