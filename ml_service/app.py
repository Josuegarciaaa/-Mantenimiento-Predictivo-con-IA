"""
app.py
======
ML Service Flask API mejorado para predicción de RUL.

Nuevos endpoints:
- POST /predict          → Predicción RUL con intervalo de confianza + tendencia
- POST /anomaly          → Detección de anomalías en lecturas actuales
- GET  /model_info       → Métricas del modelo y fecha de entrenamiento
- GET  /health           → Estado del servicio

Mejoras sobre la versión anterior:
- Confianza dinámica basada en varianza del ensemble
- Detección de anomalías por z-score en sensores críticos
- Cálculo de tendencia (slope) de RUL para detección de degradación acelerada
- Intervalos de confianza al 95% (lower_bound, upper_bound)
- Soporte para ensemble de XGBoost (múltiples modelos)
- Manejo de errores mejorado con códigos de estado específicos
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import glob
import json
import traceback
import shap
from pathlib import Path

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

app = Flask(__name__)
CORS(app)

models_dir = Path(os.path.dirname(__file__)) / 'models'

# ---------------------------------------------------------------------------
# Carga de modelos
# ---------------------------------------------------------------------------
ensemble_models = []      # Lista de modelos XGBoost del ensemble
xgb_single_model = None   # Mejor modelo XGBoost individual
lstm_model = None
scaler = None
training_metadata = {}
shap_explainer = None     # Explainer para XAI
isolation_forest = None   # Modelo no supervisado de anomalías



def load_all_models():
    """Carga todos los modelos y artefactos disponibles."""
    global ensemble_models, xgb_single_model, lstm_model, scaler, training_metadata

    # 1. Scaler
    scaler_path = models_dir / 'scaler.pkl'
    if scaler_path.exists():
        scaler = joblib.load(scaler_path)
        print("Scaler cargado.")

    # 2. XGBoost ensemble (múltiples modelos para incertidumbre)
    ensemble_paths = sorted(glob.glob(str(models_dir / 'xgb_ensemble_*.pkl')))
    if ensemble_paths:
        ensemble_models = [joblib.load(p) for p in ensemble_paths]
        print(f"XGBoost Ensemble cargado: {len(ensemble_models)} modelos.")
    else:
        print("No se encontró ensemble XGBoost.")

    # 3. XGBoost individual (fallback o mejor modelo)
    xgb_path = models_dir / 'xgb_model.pkl'
    if xgb_path.exists():
        xgb_single_model = joblib.load(xgb_path)
        print("XGBoost individual cargado.")
        try:
            shap_explainer = shap.TreeExplainer(xgb_single_model)
            print("SHAP Explainer inicializado.")
        except Exception as e:
            print(f"Error inicializando SHAP: {e}")

    # 4. LSTM / BiLSTM
    for lstm_name in ['lstm_model.keras', 'lstm_model.h5']:
        lstm_path = models_dir / lstm_name
        if lstm_path.exists():
            try:
                from tensorflow.keras.models import load_model
                lstm_model = load_model(str(lstm_path), compile=False)
                print(f"Modelo LSTM cargado desde {lstm_name}.")
                break
            except Exception as e:
                print(f"Error cargando {lstm_name}: {e}")

    # 5. Metadata de entrenamiento
    meta_path = models_dir / 'training_metadata.json'
    if meta_path.exists():
        with open(meta_path, 'r') as f:
            training_metadata = json.load(f)
        print("Metadata de entrenamiento cargada.")

    # 6. Isolation Forest
    iso_path = models_dir / 'isolation_forest.pkl'
    if iso_path.exists():
        isolation_forest = joblib.load(iso_path)
        print("Isolation Forest cargado.")


load_all_models()

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
WINDOW_SIZE = 30
FEATURE_COLS = [f'op_setting_{i}' for i in range(1, 4)] + \
               [f'sensor_{i}' for i in range(1, 22)]

# Sensores críticos con sus valores base y umbral de anomalía
CRITICAL_SENSOR_CONFIG = {
    'sensor_2':  {'base': 83.41,   'std_factor': 0.05, 'direction': 'up'},
    'sensor_3':  {'base': 610.01,  'std_factor': 0.03, 'direction': 'up'},
    'sensor_4':  {'base': 504.96,  'std_factor': 0.03, 'direction': 'up'},
    'sensor_7':  {'base': 554.36,  'std_factor': 0.03, 'direction': 'down'},
    'sensor_9':  {'base': 9046.19, 'std_factor': 0.02, 'direction': 'down'},
    'sensor_11': {'base': 47.47,   'std_factor': 0.04, 'direction': 'down'},
    'sensor_14': {'base': 8138.62, 'std_factor': 0.02, 'direction': 'down'},
    'sensor_15': {'base': 8.4195,  'std_factor': 0.04, 'direction': 'down'},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_risk_level(rul: int) -> str:
    """Clasifica el nivel de riesgo basado en RUL."""
    if rul <= 15:
        return 'critical'
    elif rul <= 30:
        return 'high'
    elif rul <= 60:
        return 'medium'
    else:
        return 'low'


def compute_trend(history: list, col: str = 'predicted_rul',
                   n_points: int = 5) -> float:
    """
    Calcula la tendencia (pendiente) de los últimos N valores de una métrica.
    Positivo = mejorando, Negativo = degradando.
    """
    if len(history) < 2:
        return 0.0
    n = min(n_points, len(history))
    values = [h.get(col, 0) for h in history[-n:]]
    x = np.arange(len(values), dtype=float)
    if len(x) < 2:
        return 0.0
    slope = np.polyfit(x, values, 1)[0]
    return float(slope)


def detect_sensor_anomalies(reading: dict, features_scaled: np.ndarray = None) -> dict:
    """
    Detecta anomalías en una lectura de sensores usando Z-score univariante y 
    Isolation Forest multivariante.
    """
    anomalies = {}
    total_anomaly_score = 0.0

    for sensor, config in CRITICAL_SENSOR_CONFIG.items():
        value = reading.get(sensor)
        if value is None:
            continue

        base = config['base']
        std = base * config['std_factor']
        z_score = abs((value - base) / (std + 1e-6))
        total_anomaly_score += z_score

        if z_score > 2.0:   # Umbral 2-sigma
            direction = config['direction']
            deviation_pct = ((value - base) / base) * 100
            anomalies[sensor] = {
                'z_score': round(z_score, 2),
                'value': round(value, 4),
                'base': base,
                'deviation_pct': round(deviation_pct, 2),
                'direction': direction,
                'severity': 'critical' if z_score > 3.0 else 'warning'
            }

    multivariate_anomaly = False
    if features_scaled is not None and isolation_forest is not None:
        try:
            # IsolationForest devuelve -1 para anomalías y 1 para datos normales
            pred = isolation_forest.predict(features_scaled)
            multivariate_anomaly = bool(pred[0] == -1)
        except Exception as e:
            print(f"Error en Isolation Forest: {e}")

    return {
        'anomalies': anomalies,
        'anomaly_count': len(anomalies),
        'total_anomaly_score': round(total_anomaly_score, 2),
        'is_anomalous': len(anomalies) > 0,
        'multivariate_anomaly': multivariate_anomaly
    }


def predict_with_ensemble(X: np.ndarray) -> dict:
    """
    Predicción usando el ensemble XGBoost para obtener incertidumbre real.

    Returns:
        dict con mean, std, lower_95, upper_95, confidence
    """
    if ensemble_models:
        preds = np.array([m.predict(X) for m in ensemble_models])
        mean = float(preds.mean())
        std = float(preds.std())
    elif xgb_single_model is not None:
        mean = float(xgb_single_model.predict(X)[0])
        std = mean * 0.10   # Incertidumbre estimada del 10%
    else:
        return None

    lower_95 = max(0, mean - 1.96 * std)
    upper_95 = min(200, mean + 1.96 * std)

    # Confianza basada en incertidumbre relativa
    relative_uncertainty = std / (abs(mean) + 1e-6)
    confidence = float(np.clip(1.0 - relative_uncertainty * 2, 0.5, 0.99))

    return {
        'mean': mean,
        'std': std,
        'lower_95': lower_95,
        'upper_95': upper_95,
        'confidence': round(confidence, 3),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predicción RUL con intervalo de confianza y detección de tendencia.

    Body JSON:
        history: lista de lecturas de sensores (cronológica)
        model_type: 'rf' | 'lstm' (default: 'rf')
        include_anomaly_check: bool (default: true)
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Body JSON requerido'}), 400

        history = data.get('history', [])
        model_type = data.get('model_type', 'rf')
        include_anomaly = data.get('include_anomaly_check', True)

        if not history or len(history) == 0:
            return jsonify({'error': 'Historial vacío'}), 400

        result = {}
        predicted_rul = None
        ensemble_result = None
        model_version = 'simulado'

        # ---- Predicción con LSTM ----
        if model_type == 'lstm' and lstm_model is not None and scaler is not None:
            try:
                pad_length = max(0, WINDOW_SIZE - len(history))
                padded = [history[0]] * pad_length + history[-WINDOW_SIZE:]

                df = pd.DataFrame(padded).reindex(columns=FEATURE_COLS, fill_value=0)
                X_scaled = scaler.transform(df)
                X_tensor = X_scaled.reshape(1, WINDOW_SIZE, len(FEATURE_COLS))

                raw_pred = lstm_model.predict(X_tensor, verbose=0)[0][0]
                predicted_rul = float(raw_pred)

                # Confianza del LSTM (menor si hay mucho padding)
                lstm_confidence = 0.90 - (pad_length / WINDOW_SIZE) * 0.20
                result['model_version'] = 'bilstm_attention_v3.0'
                result['confidence'] = round(max(0.65, lstm_confidence), 3)
                result['lower_95'] = max(0, predicted_rul - predicted_rul * 0.15)
                result['upper_95'] = min(200, predicted_rul + predicted_rul * 0.15)
                model_version = 'bilstm_attention_v3.0'

            except Exception as e:
                print(f"LSTM falló, cayendo a XGBoost: {e}")
                model_type = 'rf'

        # ---- Predicción con XGBoost Ensemble ----
        if model_type == 'rf' and scaler is not None:
            latest = history[-1]
            features = {col: latest.get(col, 0) for col in FEATURE_COLS}
            df_input = pd.DataFrame([features])
            X_scaled = scaler.transform(df_input)

            ensemble_result = predict_with_ensemble(X_scaled)
            if ensemble_result is not None:
                predicted_rul = ensemble_result['mean']
                result['confidence'] = ensemble_result['confidence']
                result['lower_95'] = round(max(0, ensemble_result['lower_95']), 1)
                result['upper_95'] = round(min(200, ensemble_result['upper_95']), 1)
                result['prediction_std'] = round(ensemble_result['std'], 2)
                n_models = len(ensemble_models) if ensemble_models else 1
                result['model_version'] = f'xgb_ensemble_{n_models}_v3.0'
                model_version = result['model_version']

                # --- SHAP EXPLAINER ---
                if shap_explainer is not None:
                    try:
                        shap_vals = shap_explainer.shap_values(X_scaled)[0]
                        # Emparejar valores SHAP con los nombres de las features
                        shap_dict = {FEATURE_COLS[i]: round(float(shap_vals[i]), 3) for i in range(len(FEATURE_COLS))}
                        # Ordenar por magnitud absoluta de contribución
                        sorted_shap = dict(sorted(shap_dict.items(), key=lambda item: abs(item[1]), reverse=True))
                        result['shap_values'] = sorted_shap
                    except Exception as e:
                        print(f"Error calculando SHAP: {e}")

        # ---- Shadow Mode: BiLSTM (A/B Testing) ----
        if model_type == 'rf' and lstm_model is not None and scaler is not None:
            try:
                pad_length = max(0, WINDOW_SIZE - len(history))
                padded = [history[0]] * pad_length + history[-WINDOW_SIZE:]
                df_shadow = pd.DataFrame(padded).reindex(columns=FEATURE_COLS, fill_value=0)
                X_scaled_shadow = scaler.transform(df_shadow)
                X_tensor_shadow = X_scaled_shadow.reshape(1, WINDOW_SIZE, len(FEATURE_COLS))
                raw_pred_shadow = lstm_model.predict(X_tensor_shadow, verbose=0)[0][0]
                result['shadow_rul'] = float(raw_pred_shadow)
            except Exception as e:
                print(f"Shadow LSTM falló: {e}")

        # ---- Fallback simulación ----
        if predicted_rul is None:
            latest = history[-1]
            s3 = latest.get('sensor_3', 610)
            s9 = latest.get('sensor_9', 9046)
            s11 = latest.get('sensor_11', 47.5)

            temp_score = max(0, (650 - s3) / 50)
            core_score = max(0, (9100 - s9) / 80)
            pressure_score = max(0, (49 - s11) / 4)

            n_cycles = len(history)
            cycle_factor = max(0.3, 1 - n_cycles / 400)
            predicted_rul = round((temp_score * 40 + core_score * 35 + pressure_score * 25) * cycle_factor)
            result['confidence'] = 0.65
            result['lower_95'] = max(0, predicted_rul - 20)
            result['upper_95'] = min(200, predicted_rul + 20)
            result['model_version'] = 'fallback_heuristic_v1.0'

        # ---- Postprocessing ----
        predicted_rul = max(0, min(200, int(round(predicted_rul))))

        # Cálculo de tendencia RUL (basado en variaciones del historial)
        if len(history) >= 3:
            # Usar sensor_3 como proxy de degradación (temp HPC sube con desgaste)
            recent_s3 = [h.get('sensor_3', 610) for h in history[-5:]]
            if len(recent_s3) >= 2:
                trend_slope = float(np.polyfit(range(len(recent_s3)), recent_s3, 1)[0])
                # Pendiente positiva en temp → degradación → RUL baja
                rul_trend = -trend_slope * 10
            else:
                rul_trend = 0.0
        else:
            rul_trend = 0.0

        result.update({
            'predicted_rul': predicted_rul,
            'risk_level': get_risk_level(predicted_rul),
            'rul_trend': round(rul_trend, 3),  # ciclos/ciclo — negativo = empeorando
            'n_history_points': len(history),
        })

        # ---- Detección de anomalías ----
        if include_anomaly:
            latest_reading = history[-1]
            features_dict = {col: latest_reading.get(col, 0) for col in FEATURE_COLS}
            df_latest = pd.DataFrame([features_dict])
            X_scaled_latest = scaler.transform(df_latest) if scaler else None

            anomaly_result = detect_sensor_anomalies(latest_reading, X_scaled_latest)
            result['anomaly_check'] = anomaly_result

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/anomaly', methods=['POST'])
def anomaly_check():
    """
    Detección de anomalías en tiempo real para una o múltiples lecturas.

    Body JSON:
        readings: lista de lecturas de sensores (o un solo dict)
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Body JSON requerido'}), 400

        readings = data.get('readings', [])
        if not readings:
            # Compatibilidad: acepta también 'reading' singular
            single = data.get('reading', {})
            if single:
                readings = [single]

        if not readings:
            return jsonify({'error': 'Lecturas vacías'}), 400

        results = []
        for i, reading in enumerate(readings):
            X_scaled_single = None
            if scaler is not None:
                features_dict = {col: reading.get(col, 0) for col in FEATURE_COLS}
                X_scaled_single = scaler.transform(pd.DataFrame([features_dict]))
                
            anomaly = detect_sensor_anomalies(reading, X_scaled_single)
            anomaly['index'] = i
            results.append(anomaly)

        total_anomalous = sum(1 for r in results if r['is_anomalous'])
        avg_score = np.mean([r['total_anomaly_score'] for r in results]) if results else 0

        return jsonify({
            'readings_analyzed': len(results),
            'anomalous_count': total_anomalous,
            'avg_anomaly_score': round(float(avg_score), 2),
            'results': results
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/simulate', methods=['POST'])
def simulate():
    """
    Inferencia What-If para Gemelo Digital.
    Recibe la última lectura + deltas de sensores y devuelve RUL y SHAP instantáneo.
    """
    try:
        data = request.json
        reading = data.get('reading', {})
        if not reading or scaler is None:
            return jsonify({'error': 'Faltan datos o scaler no cargado'}), 400

        features = {col: reading.get(col, 0) for col in FEATURE_COLS}
        df_input = pd.DataFrame([features])
        X_scaled = scaler.transform(df_input)

        result = {}
        
        ensemble_result = predict_with_ensemble(X_scaled)
        if ensemble_result is not None:
            result['simulated_rul'] = max(0, min(200, int(round(ensemble_result['mean']))))
            
            if shap_explainer is not None:
                try:
                    shap_vals = shap_explainer.shap_values(X_scaled)[0]
                    shap_dict = {FEATURE_COLS[i]: round(float(shap_vals[i]), 3) for i in range(len(FEATURE_COLS))}
                    result['shap_values'] = dict(sorted(shap_dict.items(), key=lambda item: abs(item[1]), reverse=True))
                except Exception as e:
                    print(f"Error calculando SHAP en simulación: {e}")

        # Añadir chequeo de anomalía a la simulación
        anomaly_result = detect_sensor_anomalies(reading, X_scaled)
        result['anomaly_check'] = anomaly_result

        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """
    Información sobre los modelos cargados y sus métricas de entrenamiento.
    """
    info = {
        'models_loaded': {
            'xgb_ensemble': len(ensemble_models) > 0,
            'xgb_ensemble_size': len(ensemble_models),
            'xgb_single': xgb_single_model is not None,
            'lstm': lstm_model is not None,
            'scaler': scaler is not None,
        },
        'training_metadata': training_metadata,
        'window_size': WINDOW_SIZE,
        'feature_count': len(FEATURE_COLS),
        'risk_thresholds': {
            'critical': '<= 15 ciclos',
            'high': '<= 30 ciclos',
            'medium': '<= 60 ciclos',
            'low': '> 60 ciclos'
        }
    }
    return jsonify(info)


@app.route('/health', methods=['GET'])
def health():
    """Estado del servicio."""
    return jsonify({
        'status': 'ok',
        'models_loaded': {
            'ensemble': len(ensemble_models),
            'xgb_single': xgb_single_model is not None,
            'lstm': lstm_model is not None,
            'scaler': scaler is not None,
        }
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
