"""
train_pipeline.py
=================
Pipeline de entrenamiento completo.
Lee los datos crudos, preprocesa, extrae features, entrena modelos y evalua.
Guarda los artefactos resultantes en trained_models/.
"""

import sys
from pathlib import Path

# Agregar src/ al path para importar modulos
SRC_DIR = Path(__file__).resolve().parent
sys.path.append(str(SRC_DIR))

from data.data_loader import load_dataset, add_rul_column
from data.preprocessor import DataPreprocessor
from features.feature_builder import FeatureBuilder
from models.rul_model import BaselineRULModel
from evaluation.metrics import evaluate_model
from utils.helpers import setup_logger, save_training_metadata, ensure_directory
import pandas as pd

logger = setup_logger('train_pipeline')

def run_pipeline():
    logger.info("Iniciando pipeline de entrenamiento...")
    
    # Rutas
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    DATA_DIR = BASE_DIR / 'data' / 'raw'
    MODELS_DIR = BASE_DIR / 'ml' / 'trained_models'
    
    ensure_directory(MODELS_DIR)
    
    # 1. Cargar datos
    logger.info(f"Cargando dataset desde {DATA_DIR}")
    try:
        datasets = load_dataset(str(DATA_DIR), 'FD001')
        train_df = datasets['train']
        test_df = datasets['test']
        rul_df = datasets['rul']
    except Exception as e:
        logger.error(f"Error al cargar datos: {e}. Asegurese de que los archivos existan.")
        return
        
    logger.info(f"Dataset cargado. Train shape: {train_df.shape}")
    
    # 2. Calcular RUL para train
    logger.info("Calculando RUL...")
    train_df = add_rul_column(train_df)
    
    # 3. Preprocesamiento
    logger.info("Iniciando preprocesamiento...")
    preprocessor = DataPreprocessor(rul_cap=125)
    train_df = preprocessor.clip_rul(train_df)
    train_df = preprocessor.fit_transform(train_df)
    
    # 4. Feature Engineering
    logger.info("Extrayendo features...")
    feature_builder = FeatureBuilder(window_sizes=[5, 10])
    train_df = feature_builder.build_features(train_df)
    
    # Preparar X, y
    feature_cols = [c for c in train_df.columns if c not in ['engine_id', 'cycle', 'rul']]
    X_train = train_df[feature_cols].fillna(0).values
    y_train = train_df['rul'].values
    
    # 5. Entrenar Modelo Baseline
    logger.info("Entrenando modelo Random Forest...")
    rf_model = BaselineRULModel(model_type='random_forest', n_estimators=50, max_depth=10)
    rf_model.train(X_train, y_train)
    
    # Evaluar en el mismo train (para simplificar la simulacion)
    logger.info("Evaluando modelo...")
    y_pred = rf_model.predict(X_train)
    metrics = evaluate_model(y_train, y_pred)
    logger.info(f"Metricas (Train): RMSE={metrics['rmse']:.2f}, R2={metrics['r2_score']:.2f}")
    
    # 6. Guardar artefactos
    logger.info("Guardando artefactos...")
    rf_model.save(str(MODELS_DIR / 'rf_rul_model.pkl'))
    preprocessor.save_scaler(str(MODELS_DIR / 'scaler.pkl'))
    
    save_training_metadata(
        model_name="rf_rul_model",
        metrics=metrics,
        params={"n_estimators": 50, "max_depth": 10},
        output_dir=str(MODELS_DIR)
    )
    
    logger.info("Pipeline finalizado con exito.")

if __name__ == '__main__':
    run_pipeline()
