import os
import sys
import logging
from pathlib import Path
import joblib

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('train_dl_pipeline')

# Agregar src al path
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

from data.data_loader import load_dataset, add_rul_column
from data.preprocessor import DataPreprocessor
from models.deep_learning_model import build_lstm_model, create_sequences
from evaluation.metrics import evaluate_model

def main():
    logger.info("Iniciando pipeline de entrenamiento Deep Learning (LSTM)...")
    
    # 1. Definir rutas
    project_root = current_dir.parent.parent
    data_dir = project_root / 'data' / 'raw'
    models_dir = current_dir.parent / 'trained_models'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # 2. Cargar datos
    logger.info(f"Cargando dataset desde {data_dir}")
    datasets = load_dataset(str(data_dir), dataset_id='FD001')
    train_df = datasets['train']
    logger.info(f"Dataset cargado. Train shape: {train_df.shape}")
    
    # 3. Calcular RUL
    logger.info("Calculando RUL...")
    train_df = add_rul_column(train_df)
    
    # 4. Preprocesamiento
    logger.info("Iniciando preprocesamiento y escalado...")
    preprocessor = DataPreprocessor(rul_cap=125)
    train_df = preprocessor.clip_rul(train_df)
    train_df = preprocessor.fit_transform(train_df)
    
    # Preparar features (eliminamos id, cycle, rul)
    feature_cols = [c for c in train_df.columns if c not in ['engine_id', 'cycle', 'rul']]
    
    # 5. Agrupar en secuencias temporales para cada motor
    logger.info("Generando secuencias temporales para LSTM...")
    sequence_length = 30
    import numpy as np
    
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
    
    logger.info(f"Secuencias creadas. X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
    
    # 6. Construir y entrenar el modelo DL
    logger.info("Construyendo modelo LSTM...")
    input_shape = (X_train.shape[1], X_train.shape[2])
    model = build_lstm_model(input_shape, units=[64, 32])
    
    logger.info("Entrenando modelo (esto puede tomar varios minutos)...")
    # Reducimos los epochs y batch_size para un entrenamiento rapido de prueba
    model.fit(
        X_train, y_train,
        epochs=10,
        batch_size=64,
        validation_split=0.1,
        verbose=1
    )
    
    # 7. Evaluar
    logger.info("Evaluando modelo en conjunto de entrenamiento...")
    y_pred = model.predict(X_train).flatten()
    metrics = evaluate_model(y_train, y_pred)
    logger.info(f"Metricas (Train DL): RMSE={metrics['rmse']:.2f}, R2={metrics['r2_score']:.2f}")
    
    # 8. Guardar artefactos
    logger.info("Guardando modelo y scaler...")
    model.save(str(models_dir / 'lstm_rul_model.keras'))
    joblib.dump(preprocessor.scaler, models_dir / 'dl_scaler.pkl')
    
    logger.info("Pipeline Deep Learning finalizado con exito.")

if __name__ == "__main__":
    main()
