"""
train_dl_pipeline.py
====================
Pipeline de entrenamiento Deep Learning mejorado.

Arquitectura: BiLSTM + Temporal Attention (reemplaza LSTM básico)
Mejoras:
- Huber loss (más robusto que MSE ante outliers de RUL)
- EarlyStopping + ReduceLROnPlateau
- Feature engineering avanzado antes de crear secuencias
- Evaluación con NASA Score (métrica estándar del dataset C-MAPSS)
- Guardado en formato .keras (estándar moderno de Keras)
"""

import os
import sys
import json
import logging
import datetime
from pathlib import Path
import numpy as np
import joblib

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('train_dl_pipeline')

current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

from data.data_loader import load_dataset, add_rul_column
from data.preprocessor import DataPreprocessor
from features.feature_builder import FeatureBuilder
from models.deep_learning_model import (
    build_bilstm_attention_model,
    build_lstm_model,
    get_training_callbacks,
    create_sequences
)
from evaluation.metrics import evaluate_model


def main():
    logger.info("=" * 60)
    logger.info("  PIPELINE DL — BiLSTM + ATTENTION")
    logger.info("=" * 60)

    # Rutas
    project_root = current_dir.parent.parent
    data_dir = project_root / 'data' / 'raw'
    models_dir = current_dir.parent / 'trained_models'
    models_dir.mkdir(parents=True, exist_ok=True)

    sequence_length = 30

    # 1. Cargar datos
    logger.info("\nCargando dataset C-MAPSS desde {data_dir}")
    datasets = load_dataset(str(data_dir), dataset_id='FD001')
    train_df = datasets['train']
    logger.info(f"  Train shape: {train_df.shape}")

    # 2. Calcular RUL
    logger.info("\nCalculando RUL...")
    train_df = add_rul_column(train_df)

    # 3. Preprocesamiento
    logger.info("\nPreprocesamiento y escalado...")
    preprocessor = DataPreprocessor(rul_cap=125)
    train_df = preprocessor.clip_rul(train_df)
    train_df = preprocessor.fit_transform(train_df)

    # 4. Feature Engineering
    logger.info("\nFeature engineering avanzado...")
    feature_builder = FeatureBuilder(window_sizes=[5, 10, 20])
    train_df = feature_builder.build_features(train_df, include_fft=False)

    feature_cols = [c for c in train_df.columns
                    if c not in ['engine_id', 'cycle', 'rul']]
    logger.info(f"  Features totales: {len(feature_cols)}")

    # 5. Crear secuencias temporales
    logger.info(f"\nGenerando secuencias (window={sequence_length})...")
    X_seq_list, y_seq_list = [], []

    for engine_id in train_df['engine_id'].unique():
        engine_data = train_df[train_df['engine_id'] == engine_id]
        if len(engine_data) >= sequence_length:
            X_eng = engine_data[feature_cols].fillna(0).values
            y_eng = engine_data['rul'].values
            X_s, y_s = create_sequences(X_eng, y_eng, sequence_length=sequence_length)
            X_seq_list.append(X_s)
            y_seq_list.append(y_s)

    X_train = np.vstack(X_seq_list)
    y_train = np.concatenate(y_seq_list)
    logger.info(f"  X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")

    # Split temporal para validación
    split_idx = int(len(X_train) * 0.85)
    X_tr, X_val = X_train[:split_idx], X_train[split_idx:]
    y_tr, y_val = y_train[:split_idx], y_train[split_idx:]

    # 6. Entrenar BiLSTM + Attention
    logger.info("\nEntrenando BiLSTM + Temporal Attention...")
    input_shape = (X_train.shape[1], X_train.shape[2])
    logger.info(f"  Input shape: {input_shape}")

    try:
        model = build_bilstm_attention_model(
            input_shape=input_shape,
            units=[64, 32],
            dropout_rate=0.3,
            l2_reg=0.001
        )
        model.summary(print_fn=logger.info)
        use_attention = True
    except Exception as e:
        logger.warning(f"BiLSTM+Attention no disponible ({e}), usando LSTM estándar...")
        model = build_lstm_model(input_shape=input_shape, units=[64, 32])
        use_attention = False

    callbacks = get_training_callbacks(patience=12)

    history = model.fit(
        X_tr, y_tr,
        epochs=80,
        batch_size=128,
        validation_data=(X_val, y_val),
        callbacks=callbacks,
        verbose=1
    )

    # Evaluar
    logger.info("\n  Evaluando en validación...")
    y_pred = model.predict(X_val, verbose=0).flatten()
    metrics = evaluate_model(y_val, y_pred)

    logger.info(f"  RMSE  : {metrics['rmse']:.2f}")
    logger.info(f"  MAE   : {metrics['mae']:.2f}")
    logger.info(f"  R²    : {metrics['r2_score']:.4f}")

    # Guardar modelo y scaler
    model_path = models_dir / 'lstm_rul_model.keras'
    model.save(str(model_path))
    logger.info(f"\n  Modelo guardado → {model_path}")

    scaler_path = models_dir / 'dl_scaler.pkl'
    joblib.dump(preprocessor.scaler, scaler_path)
    logger.info(f"  Scaler guardado → {scaler_path}")

    # Guardar metadata
    meta = {
        'trained_at': datetime.datetime.utcnow().isoformat(),
        'architecture': 'BiLSTM_Attention' if use_attention else 'LSTM_Standard',
        'sequence_length': sequence_length,
        'n_features': len(feature_cols),
        'epochs_trained': len(history.history['loss']),
        'val_metrics': metrics,
        'feature_cols': feature_cols,
    }
    with open(models_dir / 'dl_training_metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)

    logger.info("\n" + "=" * 60)
    logger.info("  PIPELINE DL FINALIZADO CON ÉXITO")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
