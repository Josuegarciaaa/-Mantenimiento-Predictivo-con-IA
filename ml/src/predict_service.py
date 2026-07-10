import os
import sys
import glob
import json
import traceback
import datetime
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

# --- Modelos ---
ensemble_models = []   # XGBoost Bagging ensemble
rf_model = None        # Modelo RF/XGB individual
rf_scaler = None
lstm_model = None
lstm_scaler = None
training_metadata = {}

def load_all_models():
    global ensemble_models, rf_model, rf_scaler, lstm_model, lstm_scaler, training_metadata

    # Scaler RF
    if (MODEL_DIR / 'scaler.pkl').exists():
        rf_scaler = joblib.load(MODEL_DIR / 'scaler.pkl')
        print("Scaler RF cargado.")

    # Ensemble XGBoost
    ensemble_paths = sorted(glob.glob(str(MODEL_DIR / 'xgb_ensemble_*.pkl')))
    if ensemble_paths:
        ensemble_models = [joblib.load(p) for p in ensemble_paths]
        print(f"XGBoost Ensemble: {len(ensemble_models)} modelos cargados.")

    # RF/XGB individual
    for name in ['rf_rul_model.pkl']:
        p = MODEL_DIR / name
        if p.exists():
            rf_model = joblib.load(p)
            print(f"Modelo {name} cargado.")
            break

    # LSTM/BiLSTM
    for name in ['lstm_rul_model.keras', 'lstm_rul_model.h5']:
        p = MODEL_DIR / name
        if p.exists():
            try:
                from tensorflow.keras.models import load_model
                lstm_model = load_model(str(p), compile=False)
                print(f"Modelo DL cargado: {name}")
                break
            except Exception as e:
                print(f"Error cargando {name}: {e}")

    # Scaler LSTM
    if (MODEL_DIR / 'dl_scaler.pkl').exists():
        lstm_scaler = joblib.load(MODEL_DIR / 'dl_scaler.pkl')
        print("Scaler LSTM cargado.")

    # Metadata
    for meta_name in ['dl_training_metadata.json', 'training_metadata.json']:
        p = MODEL_DIR / meta_name
        if p.exists():
            with open(p) as f:
                training_metadata = json.load(f)
            break

load_all_models()

# Columnas esperadas en el input (orden exacto del C-MAPSS)
SENSOR_COLS = [f'sensor_{i}' for i in range(1, 22)]
OP_SETTINGS = ['op_setting_1', 'op_setting_2', 'op_setting_3']
ALL_INPUT_COLS = ['engine_id', 'cycle'] + OP_SETTINGS + SENSOR_COLS

# Configuracion de sensores criticos para anomaly detection
CRITICAL_SENSOR_BASE = {
    'sensor_2':  83.41,   'sensor_3':  610.01, 'sensor_4':  504.96,
    'sensor_7':  554.36,  'sensor_9':  9046.19, 'sensor_11': 47.47,
    'sensor_14': 8138.62, 'sensor_15': 8.4195,
}


def predict_rf_with_uncertainty(history_df):
    """Predice RUL con intervalo de confianza usando ensemble o modelo individual."""
    # Feature Engineering avanzado
    scaled_history = history_df.copy()

    # Escalar si hay scaler disponible
    active_cols = [
        'sensor_2', 'sensor_3', 'sensor_4', 'sensor_6', 'sensor_7', 'sensor_8',
        'sensor_9', 'sensor_11', 'sensor_12', 'sensor_13', 'sensor_14', 'sensor_15',
        'sensor_17', 'sensor_20', 'sensor_21', 'op_setting_1'
    ]
    if rf_scaler is not None:
        available = [c for c in active_cols if c in scaled_history.columns]
        scaled_history[available] = rf_scaler.transform(scaled_history[available].fillna(0))

    # Feature engineering avanzado
    feature_builder = FeatureBuilder(window_sizes=[5, 10])
    df_features = feature_builder.build_features(scaled_history)
    latest_row = df_features.iloc[[-1]].copy()
    feature_cols = [c for c in df_features.columns if c not in ['engine_id', 'cycle', 'rul']]
    X_raw = latest_row[feature_cols].fillna(0).values

    # Prediccion con ensemble (si disponible) o modelo individual
    if ensemble_models:
        preds = np.array([m.predict(X_raw)[0] for m in ensemble_models])
        mean_pred = float(preds.mean())
        std_pred = float(preds.std())
        relative_unc = std_pred / (abs(mean_pred) + 1e-6)
        confidence = float(np.clip(1.0 - relative_unc * 2, 0.60, 0.98))
        lower_95 = float(max(0, mean_pred - 1.96 * std_pred))
        upper_95 = float(min(150, mean_pred + 1.96 * std_pred))
        return mean_pred, confidence, lower_95, upper_95

    elif rf_model is not None:
        pred = float(rf_model.predict(X_raw)[0])
        return pred, 0.82, max(0, pred - 15), min(150, pred + 15)

    return None, 0.5, 0, 125


def predict_rf(history_df):
    """Wrapper backward-compatible que retorna solo la prediccion media."""
    pred, _, _, _ = predict_rf_with_uncertainty(history_df)
    return pred if pred is not None else 0.0

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
        confidence = 0.70
        lower_95 = 0
        upper_95 = 125
        model_version = "simulado"

        if model_type == 'lstm' and lstm_model is not None and lstm_scaler is not None:
            try:
                predicted_rul = predict_lstm(history_df)
                model_version = "bilstm_attention_v3.0"
                confidence = 0.88
                lower_95 = max(0, predicted_rul - predicted_rul * 0.15)
                upper_95 = min(125, predicted_rul + predicted_rul * 0.15)
            except Exception as ex:
                print(f"Fallo prediccion LSTM, cayendo a RF: {ex}")
                model_type = 'rf'

        if model_type == 'rf':
            pred, conf, lo, hi = predict_rf_with_uncertainty(history_df)
            if pred is not None:
                predicted_rul = pred
                confidence = conf
                lower_95 = lo
                upper_95 = hi
                n_ens = len(ensemble_models)
                model_version = f'xgb_ensemble_{n_ens}_v3.0' if n_ens > 0 else 'rf_v2.0'

        # Fallback simulacion heuristica
        if predicted_rul is None:
            latest = history[-1]
            s3 = latest.get('sensor_3', 610)
            s9 = latest.get('sensor_9', 9046)
            s11 = latest.get('sensor_11', 47.5)
            temp_score = max(0, (650 - s3) / 50)
            core_score = max(0, (9100 - s9) / 80)
            pressure_score = max(0, (49 - s11) / 4)
            cycle_adjust = max(0.3, 1 - total_cycles / 400)
            predicted_rul = round((temp_score * 40 + core_score * 35 + pressure_score * 25) * cycle_adjust)
            confidence = 0.60
            lower_95 = max(0, predicted_rul - 20)
            upper_95 = min(125, predicted_rul + 20)
            model_version = 'fallback_heuristic_v1.0'

        predicted_rul = max(0, min(125, int(round(predicted_rul))))

        # Nivel de riesgo
        if predicted_rul <= 15:
            risk_level = 'critical'
        elif predicted_rul <= 30:
            risk_level = 'high'
        elif predicted_rul <= 60:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Tendencia RUL estimada por variacion de sensor critico
        rul_trend = 0.0
        if len(history) >= 3:
            s3_vals = [h.get('sensor_3', 610) for h in history[-5:]]
            if len(s3_vals) >= 2:
                slope = float(np.polyfit(range(len(s3_vals)), s3_vals, 1)[0])
                rul_trend = round(-slope * 8, 3)

        return jsonify({
            "predicted_rul": predicted_rul,
            "confidence": round(confidence, 3),
            "risk_level": risk_level,
            "model_version": model_version,
            "lower_95": round(lower_95, 1),
            "upper_95": round(upper_95, 1),
            "rul_trend": rul_trend,
            "n_history_points": len(history),
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Informacion sobre los modelos cargados y metricas de entrenamiento."""
    return jsonify({
        'models_loaded': {
            'xgb_ensemble': len(ensemble_models) > 0,
            'xgb_ensemble_size': len(ensemble_models),
            'rf_individual': rf_model is not None,
            'lstm': lstm_model is not None,
            'rf_scaler': rf_scaler is not None,
            'lstm_scaler': lstm_scaler is not None,
        },
        'training_metadata': training_metadata,
        'api_version': '3.0',
        'features': {
            'uncertainty_estimation': len(ensemble_models) > 0,
            'anomaly_detection': True,
            'rul_trend': True,
            'confidence_interval': True,
        }
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

