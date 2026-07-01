import os
import sys
import traceback
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

# Configurar path para importar modulos locales
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

from features.feature_builder import FeatureBuilder
from data.preprocessor import DataPreprocessor

app = Flask(__name__)
CORS(app)

MODEL_DIR = current_dir.parent / 'trained_models'

# Cargar modelos y scalers
rf_model = None
rf_scaler = None
lstm_model = None
lstm_scaler = None

try:
    if (MODEL_DIR / 'rf_rul_model.pkl').exists():
        rf_model = joblib.load(MODEL_DIR / 'rf_rul_model.pkl')
        logger_name = 'predict_service'
        print("Modelo Random Forest cargado con exito.")
    if (MODEL_DIR / 'scaler.pkl').exists():
        rf_scaler = joblib.load(MODEL_DIR / 'scaler.pkl')
        print("Scaler para Random Forest cargado con exito.")
except Exception as e:
    print(f"Error al cargar Random Forest: {e}")

try:
    if (MODEL_DIR / 'lstm_rul_model.keras').exists():
        # Importamos tensorflow localmente solo si el modelo existe
        from tensorflow.keras.models import load_model
        lstm_model = load_model(str(MODEL_DIR / 'lstm_rul_model.keras'))
        print("Modelo LSTM de Keras cargado con exito.")
    if (MODEL_DIR / 'dl_scaler.pkl').exists():
        lstm_scaler = joblib.load(MODEL_DIR / 'dl_scaler.pkl')
        print("Scaler para LSTM cargado con exito.")
except Exception as e:
    print(f"Error al cargar LSTM: {e}")

# Columnas esperadas en el input (orden exacto del C-MAPSS)
SENSOR_COLS = [f'sensor_{i}' for i in range(1, 22)]
OP_SETTINGS = ['op_setting_1', 'op_setting_2', 'op_setting_3']
ALL_INPUT_COLS = ['engine_id', 'cycle'] + OP_SETTINGS + SENSOR_COLS

def predict_rf(history_df):
    """Predice RUL usando Random Forest"""
    # 1. Escalar columnas de entrada activas (las que espera el scaler de 16 features)
    scaled_history = history_df.copy()
    active_cols = [
        'sensor_2', 'sensor_3', 'sensor_4', 'sensor_6', 'sensor_7', 'sensor_8', 
        'sensor_9', 'sensor_11', 'sensor_12', 'sensor_13', 'sensor_14', 'sensor_15', 'sensor_17', 
        'sensor_20', 'sensor_21', 'op_setting_1'
    ]
    scaled_history[active_cols] = rf_scaler.transform(scaled_history[active_cols].fillna(0))
    
    # 2. Feature Engineering sobre los datos ya escalados
    feature_builder = FeatureBuilder(window_sizes=[5, 10])
    df_features = feature_builder.build_features(scaled_history)
    
    # 3. Obtener ultima fila (lectura mas reciente con todas sus rolling features)
    latest_row = df_features.iloc[[-1]].copy()
    
    # 4. Filtrar columnas de entrada para el modelo (130 features)
    feature_cols = [c for c in df_features.columns if c not in ['engine_id', 'cycle', 'rul']]
    X_raw = latest_row[feature_cols].fillna(0).values
    
    # 5. Predecir (el modelo RF ya espera las features estructuradas directamente)
    pred = rf_model.predict(X_raw)[0]
    return float(pred)

def predict_lstm(history_df):
    """Predice RUL usando LSTM"""
    sequence_length = 30
    
    if len(history_df) < sequence_length:
        raise ValueError(f"Se requieren al menos {sequence_length} ciclos de historial para el modelo LSTM")
        
    # 1. Filtrar solo los ultimos 30 ciclos
    recent_df = history_df.tail(sequence_length).copy()
    
    # 2. Escalar columnas de entrada activas (las que espera el scaler de 16 features)
    scaled_df = recent_df.copy()
    active_cols = [
        'sensor_2', 'sensor_3', 'sensor_4', 'sensor_6', 'sensor_7', 'sensor_8', 
        'sensor_9', 'sensor_11', 'sensor_12', 'sensor_13', 'sensor_14', 'sensor_15', 'sensor_17', 
        'sensor_20', 'sensor_21', 'op_setting_1'
    ]
    scaled_df[active_cols] = lstm_scaler.transform(scaled_df[active_cols].fillna(0))
    
    # 3. Obtener matriz de 24 features (todas las variables en orden)
    feature_cols = OP_SETTINGS + SENSOR_COLS
    X_seq = scaled_df[feature_cols].fillna(0).values
    
    # Reshape a (1, timesteps, features) -> (1, 30, 24)
    X_seq = np.expand_dims(X_seq, axis=0)
    
    # 4. Predecir
    pred = lstm_model.predict(X_seq, verbose=0)[0][0]
    return float(pred)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "rf_model_loaded": rf_model is not None,
        "lstm_model_loaded": lstm_model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or 'history' not in data:
            return jsonify({"error": "Historial de mediciones no proporcionado"}), 400
            
        history = data['history']
        model_type = data.get('model_type', 'rf') # 'rf' o 'lstm'
        
        if not history or len(history) == 0:
            return jsonify({"error": "Historial vacio"}), 400

        # Convertir historial a DataFrame
        history_df = pd.DataFrame(history)
        
        # Completar columnas faltantes si es necesario
        for col in ALL_INPUT_COLS:
            if col not in history_df.columns:
                if col == 'engine_id':
                    history_df[col] = 1
                elif col == 'cycle':
                    history_df[col] = history_df.index + 1
                else:
                    history_df[col] = 0.0
                    
        # Filtrar para quedarse unicamente con las columnas de entrada validas
        history_df = history_df[ALL_INPUT_COLS]

        # Ordenar por ciclo
        history_df = history_df.sort_values('cycle').reset_index(drop=True)
        total_cycles = int(history_df.iloc[-1]['cycle'])

        # Decidir que modelo ejecutar
        predicted_rul = None
        model_version = "simulado"
        
        if model_type == 'lstm' and lstm_model is not None and lstm_scaler is not None:
            try:
                predicted_rul = predict_lstm(history_df)
                model_version = "lstm_v1.0"
            except Exception as ex:
                print(f"Fallo prediccion LSTM, cayendo a RF: {ex}")
                model_type = 'rf' # Caida automatica
                
        if model_type == 'rf' and rf_model is not None and rf_scaler is not None:
            predicted_rul = predict_rf(history_df)
            model_version = "rf_v1.0"
            
        # Si ningun modelo esta disponible, usar logica de simulacion
        if predicted_rul is None:
            latest = history[-1]
            s3 = latest.get('sensor_3', 1580)
            s9 = latest.get('sensor_9', 9040)
            s11 = latest.get('sensor_11', 47)
            
            temp_score = max(0, (1620 - s3) / 50)
            core_score = max(0, (9100 - s9) / 80)
            pressure_score = max(0, (49 - s11) / 4)
            
            raw_rul = (temp_score * 40 + core_score * 35 + pressure_score * 25)
            cycle_adjust = max(0, 1 - total_cycles / 400)
            predicted_rul = round(raw_rul * cycle_adjust)
            model_version = "rf_v1.0_flask_sim"

        predicted_rul = max(0, min(125, int(round(predicted_rul))))
        
        # Determinar nivel de riesgo
        if predicted_rul <= 15:
            risk_level = 'critical'
        elif predicted_rul <= 30:
            risk_level = 'high'
        elif predicted_rul <= 50:
            risk_level = 'medium'
        else:
            risk_level = 'low'
            
        confidence = 0.85 + min(0.1, total_cycles / 2000)
        
        return jsonify({
            "predicted_rul": predicted_rul,
            "confidence": round(confidence, 2),
            "risk_level": risk_level,
            "model_version": model_version
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
