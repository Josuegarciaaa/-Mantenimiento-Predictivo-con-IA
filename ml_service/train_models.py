"""
train_models.py
===============
Script de entrenamiento mejorado para el ML Service.

Mejoras sobre la versión anterior:
- Degradación multimodo: gradual + acelerada + súbita
- Ruido correlacionado entre sensores (más realista)
- Ensemble XGBoost Bagging para estimación de incertidumbre
- BiLSTM con Attention para predicción temporal
- Exportación de métricas (RMSE, MAE, R²) en JSON
- Cálculo dinámico de confianza basado en varianza del ensemble
"""

import os
import json
import time
import datetime
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import IsolationForest
import joblib
import sqlalchemy as sa
import mlflow
import optuna
optuna.logging.set_verbosity(optuna.logging.WARNING)

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
WINDOW_SIZE = 30
N_ENGINES_TRAIN = 200
RANDOM_SEED = 42

# Sensores críticos (basados en la literatura C-MAPSS)
CRITICAL_SENSORS = [2, 3, 4, 7, 8, 9, 11, 12, 14, 15, 20, 21]

# Valores base para cada sensor (alineados con simulator.js del frontend)
BASE_SENSOR_VALUES = [
    15.00,    # sensor_1  — Temp fan inlet (C)
    83.41,    # sensor_2  — Temp LPC outlet (C)
    610.01,   # sensor_3  — Temp HPC outlet (C)
    504.96,   # sensor_4  — Temp LPT outlet (C)
    14.62,    # sensor_5  — Presión fan inlet
    21.61,    # sensor_6  — Presión bypass
    554.36,   # sensor_7  — Presión HPC outlet
    2388.06,  # sensor_8  — Velocidad fan (rpm)
    9046.19,  # sensor_9  — Velocidad core (rpm)
    1.30,     # sensor_10 — Engine pressure ratio
    47.47,    # sensor_11 — Presión estática HPC
    521.66,   # sensor_12 — Ratio combustible/Ps30
    2388.02,  # sensor_13 — Velocidad fan corregida
    8138.62,  # sensor_14 — Velocidad core corregida
    8.4195,   # sensor_15 — Bypass Ratio
    0.03,     # sensor_16 — Burner fuel-air ratio
    392,      # sensor_17 — Bleed Enthalpy
    2388,     # sensor_18 — Demanded fan speed
    100.0,    # sensor_19 — Demanded corrected fan speed
    39.06,    # sensor_20 — HPT coolant bleed (lbm/s)
    23.4190   # sensor_21 — LPT coolant bleed (lbm/s)
]


def generate_correlated_noise(n_sensors: int, n_cycles: int,
                               correlation: float = 0.3) -> np.ndarray:
    """
    Genera ruido correlacionado entre sensores para simular datos más realistas.
    En una turbina real, los sensores están físicamente acoplados.
    """
    rng = np.random.RandomState()
    # Ruido base independiente
    base_noise = rng.randn(n_cycles, n_sensors)
    # Ruido compartido (correlación sistémica)
    shared_noise = rng.randn(n_cycles, 1) * correlation
    # Combinar
    correlated = base_noise * (1 - correlation) + shared_noise
    return correlated


def degradation_profile(cycle: int, max_rul: int, mode: str = 'gradual') -> float:
    """
    Genera un perfil de degradación según el modo de fallo.

    Modos:
    - 'gradual': Desgaste lineal constante (más común)
    - 'accelerated': Degradación lenta luego acelerada al final (exponencial)
    - 'sudden': Degradación muy baja seguida de fallo súbito
    - 'step': Degradación en escalones (típico en componentes con fatiga)
    """
    t = cycle / max_rul  # Tiempo normalizado [0, 1]

    if mode == 'gradual':
        return t

    elif mode == 'accelerated':
        # Curva S: lento al inicio, rápido al final
        return (np.exp(3 * t) - 1) / (np.exp(3) - 1)

    elif mode == 'sudden':
        # Degradación mínima hasta el 80% de vida, luego fallo rápido
        if t < 0.8:
            return t * 0.2
        else:
            return 0.2 + (t - 0.8) * 4.0

    elif mode == 'step':
        # Degradación en escalones
        step = int(t * 5) / 5.0
        return step + (t - step) * 0.3

    return t


def generate_realistic_data(n_engines: int = N_ENGINES_TRAIN,
                             window_size: int = WINDOW_SIZE,
                             seed: int = RANDOM_SEED) -> tuple:
    """
    Genera datos sintéticos realistas tipo C-MAPSS con:
    - Múltiples modos de degradación (gradual, acelerado, súbito, escalones)
    - Ruido correlacionado entre sensores
    - Variabilidad en condiciones operativas
    - Sensores que degradan en diferentes direcciones

    Returns:
        df: DataFrame con todos los datos
        feature_cols: Lista de columnas de features
    """
    np.random.seed(seed)
    rng = np.random.RandomState(seed)

    feature_cols = (
        [f'op_setting_{i}' for i in range(1, 4)] +
        [f'sensor_{i}' for i in range(1, 22)]
    )

    # Modos de degradación y sus proporciones
    degradation_modes = ['gradual', 'accelerated', 'sudden', 'step']
    mode_weights = [0.45, 0.30, 0.15, 0.10]

    all_data = []

    for engine_id in range(1, n_engines + 1):
        # Vida útil aleatoria entre 100 y 300 ciclos
        max_rul = rng.randint(100, 300)

        # Seleccionar modo de degradación aleatoriamente
        mode = rng.choice(degradation_modes, p=mode_weights)

        # Factor de variabilidad individual del motor
        motor_health_factor = rng.uniform(0.85, 1.15)

        for cycle in range(1, max_rul + 1):
            rul = max_rul - cycle
            deg = degradation_profile(cycle, max_rul, mode) * motor_health_factor

            row = {
                'engine_id': engine_id,
                'cycle': cycle,
                'RUL': rul,
                'op_setting_1': rng.normal(0, 0.05),
                'op_setting_2': rng.normal(0, 0.05),
                'op_setting_3': rng.choice([0, 100]),
            }

            # Ruido correlacionado entre sensores
            noise_factor = rng.randn(21)
            shared_noise = rng.randn() * 0.3

            for i in range(1, 22):
                base = BASE_SENSOR_VALUES[i - 1]

                # Los sensores de temperatura y vibraciones suben con el desgaste
                # Los de presión y eficiencia bajan
                if i in [2, 3, 4, 8, 9, 12, 20, 21]:
                    direction = 1   # Sube con degradación
                elif i in [7, 11, 14, 15]:
                    direction = -1  # Baja con degradación
                else:
                    direction = 0   # Relativamente constante

                # Magnitud del cambio proporcional al valor base
                degradation_effect = direction * deg * (base * 0.05)

                # Ruido combinado (individual + compartido)
                noise = (noise_factor[i - 1] * 0.7 + shared_noise * 0.3) * base * 0.002

                row[f'sensor_{i}'] = base + degradation_effect + noise

            all_data.append(row)

    df = pd.DataFrame(all_data)
    print(f"  Dataset generado: {len(df):,} filas, {n_engines} motores")
    print(f"  Modos de degradación: {degradation_modes}")
    return df, feature_cols


def fetch_data_from_db(n_engines=N_ENGINES_TRAIN, window_size=WINDOW_SIZE):
    """
    Intenta extraer datos reales de PostgreSQL o SQLite.
    Si falla o no hay suficientes datos, hace fallback a datos sintéticos.
    """
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///../database.sqlite')
    print(f"\n  Conectando a BD: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    
    try:
        engine = sa.create_engine(db_url)
        query = """
        SELECT sr.*, e.total_cycles 
        FROM "SensorReadings" sr
        JOIN "Engines" e ON sr.engine_id = e.id
        ORDER BY sr.engine_id, sr.cycle
        """
        df = pd.read_sql(query, engine)
        
        if len(df) < 1000:
            print("  Insuficientes datos en BD (menos de 1000 filas). Usando sintéticos...")
            return generate_realistic_data(n_engines, window_size)
            
        print(f"  Datos extraídos de BD: {len(df)} filas.")
        df['RUL'] = df['total_cycles'] - df['cycle']
        df['RUL'] = df['RUL'].apply(lambda x: max(0, x))
        
        feature_cols = [f'op_setting_{i}' for i in range(1, 4)] + [f'sensor_{i}' for i in range(1, 22)]
        return df, feature_cols
        
    except Exception as e:
        print(f"  Error extrayendo de BD: {e}. Usando sintéticos...")
        return generate_realistic_data(n_engines, window_size)


def prepare_sequences(df: pd.DataFrame, feature_cols: list,
                       window_size: int = WINDOW_SIZE) -> tuple:
    """
    Prepara las secuencias para LSTM y los datos planos para XGBoost.
    Aplica StandardScaler a los features.

    Returns:
        X_seq: (n_sequences, window_size, n_features) para LSTM
        y_seq: (n_sequences,) para LSTM
        X_flat: (n_samples, n_features) para XGBoost
        y_flat: (n_samples,) para XGBoost
        scaler: StandardScaler entrenado
    """
    scaler = StandardScaler()
    df = df.copy()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])

    X_seq, y_seq = [], []
    X_flat, y_flat = [], []

    for engine_id, group in df.groupby('engine_id'):
        group_data = group[feature_cols].values
        group_labels = group['RUL'].values

        # Secuencias para BiLSTM
        for i in range(len(group_data) - window_size + 1):
            X_seq.append(group_data[i:i + window_size])
            y_seq.append(group_labels[i + window_size - 1])

        # Datos planos para XGBoost
        X_flat.extend(group_data)
        y_flat.extend(group_labels)

    return (
        np.array(X_seq), np.array(y_seq),
        np.array(X_flat), np.array(y_flat),
        scaler
    )


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Calcula métricas de regresión estándar para RUL."""
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    # NASA score: penaliza más las predicciones optimistas que las pesimistas
    diff = y_pred - y_true
    nasa_score = float(np.mean(
        np.where(diff < 0, np.exp(-diff / 13) - 1, np.exp(diff / 10) - 1)
    ))
    return {'rmse': rmse, 'mae': mae, 'r2_score': r2, 'nasa_score': nasa_score}


def train_xgboost_ensemble(X_flat: np.ndarray, y_flat: np.ndarray,
                            n_estimators_ensemble: int = 8) -> tuple:
    """
    Entrena un ensemble de XGBoost con Bootstrap Aggregating (Bagging).
    Usa Optuna para encontrar los mejores hiperparámetros antes del ensemble.
    """
    rng = np.random.RandomState(RANDOM_SEED)
    n_samples = len(X_flat)
    ensemble_models = []

    X_tr, X_val, y_tr, y_val = train_test_split(
        X_flat, y_flat, test_size=0.15, random_state=RANDOM_SEED
    )

    print("    Iniciando Optuna Hyperparameter Tuning...")
    def objective(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 100, 400),
            'max_depth': trial.suggest_int('max_depth', 4, 8),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
            'subsample': trial.suggest_float('subsample', 0.6, 0.9),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 0.9),
            'random_state': RANDOM_SEED,
            'n_jobs': -1,
            'eval_metric': 'rmse'
        }
        model = xgb.XGBRegressor(**params)
        model.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)
        return float(np.sqrt(mean_squared_error(y_val, model.predict(X_val))))
        
    study = optuna.create_study(direction='minimize')
    study.optimize(objective, n_trials=8)
    best_params = study.best_params
    best_params['random_state'] = RANDOM_SEED
    best_params['n_jobs'] = -1
    best_params['eval_metric'] = 'rmse'
    print(f"    Mejores parámetros: {best_params}")

    for i in range(n_estimators_ensemble):
        idx = rng.choice(len(X_tr), size=int(len(X_tr) * 0.8), replace=True)
        X_boot, y_boot = X_tr[idx], y_tr[idx]

        model = xgb.XGBRegressor(**best_params)
        model.fit(
            X_boot, y_boot,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        ensemble_models.append(model)
        print(f"    Ensemble modelo {i + 1}/{n_estimators_ensemble} entrenado")

    return ensemble_models, X_val, y_val, best_params


def train():
    """Pipeline de entrenamiento completo con mejoras."""
    os.makedirs('models', exist_ok=True)
    training_metadata = {
        'trained_at': datetime.datetime.utcnow().isoformat(),
        'window_size': WINDOW_SIZE,
        'n_engines': N_ENGINES_TRAIN,
        'models': {}
    }

    print("=" * 60)
    print("  ENTRENAMIENTO ML - MANTENIMIENTO PREDICTIVO")
    print("=" * 60)

    # Configuración de MLflow
    mlflow_uri = os.environ.get("MLFLOW_TRACKING_URI", "http://localhost:5001")
    try:
        mlflow.set_tracking_uri(mlflow_uri)
        mlflow.set_experiment("Predictive_Maintenance_Models")
        mlflow_active = True
        print(f"  Conectado a MLflow en {mlflow_uri}")
    except Exception as e:
        mlflow_active = False
        print(f"  MLflow no disponible, omitiendo tracking: {e}")

    # 1. Generar / Extraer datos
    print("\nExtrayendo datos...")
    t0 = time.time()
    df, feature_cols = fetch_data_from_db(
        n_engines=N_ENGINES_TRAIN,
        window_size=WINDOW_SIZE
    )
    print(f"  Tiempo: {time.time() - t0:.1f}s")

    # 2. Preparar secuencias
    print("\nPreparando secuencias y escalando...")
    t0 = time.time()
    X_seq, y_seq, X_flat, y_flat, scaler = prepare_sequences(
        df, feature_cols, WINDOW_SIZE
    )
    print(f"  X_seq shape: {X_seq.shape}, X_flat shape: {X_flat.shape}")
    print(f"  Tiempo: {time.time() - t0:.1f}s")

    # Guardar scaler
    joblib.dump(scaler, 'models/scaler.pkl')
    print("  Scaler guardado → models/scaler.pkl")

    # 2.5 Entrenar Isolation Forest para detección de anomalías multivariante
    print("\nEntrenando Isolation Forest (Anomalías)...")
    t_if = time.time()
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=RANDOM_SEED, n_jobs=-1)
    iso_forest.fit(X_flat)
    joblib.dump(iso_forest, 'models/isolation_forest.pkl')
    print(f"  Isolation Forest guardado → models/isolation_forest.pkl. Tiempo: {time.time() - t_if:.1f}s")

    # 3. Entrenar XGBoost
    print("\nEntrenando XGBoost Ensemble con Optuna...")
    t0 = time.time()
    ensemble_models, X_val, y_val, xgb_best_params = train_xgboost_ensemble(X_flat, y_flat)

    # Evaluar ensemble en validación
    val_preds = np.array([m.predict(X_val) for m in ensemble_models])
    val_mean = val_preds.mean(axis=0)
    xgb_metrics = compute_metrics(y_val, val_mean)

    print(f"\n  XGBoost Ensemble — Validación:")
    for k, v in xgb_metrics.items():
        print(f"    {k.upper():<4} : {v:.4f}")
    print(f"  Tiempo: {time.time() - t0:.1f}s")

    for i, m in enumerate(ensemble_models):
        joblib.dump(m, f'models/xgb_ensemble_{i}.pkl')
    best_idx = np.argmin([np.sqrt(mean_squared_error(y_val, m.predict(X_val))) for m in ensemble_models])
    joblib.dump(ensemble_models[best_idx], 'models/xgb_model.pkl')
    
    training_metadata['models']['xgboost_ensemble'] = {
        'n_models': len(ensemble_models),
        'best_model_idx': int(best_idx),
        **xgb_metrics
    }

    # Tracking en MLflow
    if mlflow_active:
        with mlflow.start_run(run_name="XGBoost_Ensemble"):
            mlflow.log_params(xgb_best_params)
            mlflow.log_metrics({f"xgb_{k}": v for k, v in xgb_metrics.items()})
            # mlflow.xgboost.log_model(ensemble_models[best_idx], "best_xgb_model")

    # 4. Entrenar modelo
    print("\nEntrenando BiLSTM + Attention...")
    t0 = time.time()
    try:
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

        # Importar el modelo mejorado
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__),
                                         '..', 'ml', 'src'))
        try:
            from models.deep_learning_model import build_bilstm_attention_model, get_training_callbacks
            build_fn = build_bilstm_attention_model
            use_bilstm = True
        except ImportError:
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
            use_bilstm = False

        # Split para validación temporal
        split_idx = int(len(X_seq) * 0.85)
        X_tr_seq, X_vl_seq = X_seq[:split_idx], X_seq[split_idx:]
        y_tr_seq, y_vl_seq = y_seq[:split_idx], y_seq[split_idx:]

        if use_bilstm:
            lstm_model = build_bilstm_attention_model(
                input_shape=(WINDOW_SIZE, len(feature_cols)),
                units=[64, 32],
                dropout_rate=0.3
            )
            callbacks = get_training_callbacks(patience=10)
        else:
            # Fallback LSTM estándar mejorado
            lstm_model = Sequential([
                LSTM(128, return_sequences=True,
                     input_shape=(WINDOW_SIZE, len(feature_cols))),
                Dropout(0.3),
                BatchNormalization(),
                LSTM(64, return_sequences=False),
                Dropout(0.3),
                BatchNormalization(),
                Dense(64, activation='relu'),
                Dropout(0.2),
                Dense(32, activation='relu'),
                Dense(1)
            ])
            from tensorflow.keras.optimizers import Adam
            lstm_model.compile(optimizer=Adam(0.001), loss='huber', metrics=['mae'])
            callbacks = [
                EarlyStopping(monitor='val_loss', patience=10,
                              restore_best_weights=True, verbose=1),
                ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                  patience=5, min_lr=1e-6, verbose=1)
            ]

        history = lstm_model.fit(
            X_tr_seq, y_tr_seq,
            epochs=50,
            batch_size=128,
            validation_data=(X_vl_seq, y_vl_seq),
            callbacks=callbacks,
            verbose=1
        )

        # Evaluar en validación
        y_pred_lstm = lstm_model.predict(X_vl_seq, verbose=0).flatten()
        lstm_metrics = compute_metrics(y_vl_seq, y_pred_lstm)
        print(f"\n  BiLSTM Attention — Validación:")
        for k, v in lstm_metrics.items():
            print(f"    {k.upper():<4} : {v:.4f}")

        lstm_model.save('models/lstm_model.keras')
        training_metadata['models']['bilstm_attention'] = lstm_metrics

        if mlflow_active:
            with mlflow.start_run(run_name="BiLSTM_Attention"):
                mlflow.log_metrics({f"lstm_{k}": v for k, v in lstm_metrics.items()})

    except Exception as e:
        print(f"  Error entrenando LSTM: {e}")
        print("  Intentando con LSTM básico...")
        try:
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
            from tensorflow.keras.optimizers import Adam
            from tensorflow.keras.callbacks import EarlyStopping

            split_idx = int(len(X_seq) * 0.85)
            X_tr_seq, X_vl_seq = X_seq[:split_idx], X_seq[split_idx:]
            y_tr_seq, y_vl_seq = y_seq[:split_idx], y_seq[split_idx:]

            lstm_model = Sequential([
                LSTM(64, return_sequences=True,
                     input_shape=(WINDOW_SIZE, len(feature_cols))),
                Dropout(0.2),
                LSTM(32),
                Dropout(0.2),
                Dense(16, activation='relu'),
                Dense(1)
            ])
            lstm_model.compile(optimizer=Adam(0.001), loss='mse', metrics=['mae'])
            lstm_model.fit(
                X_tr_seq, y_tr_seq,
                epochs=20, batch_size=64,
                validation_data=(X_vl_seq, y_vl_seq),
                callbacks=[EarlyStopping(patience=5, restore_best_weights=True)],
                verbose=1
            )
            lstm_model.save('models/lstm_model.keras')
            print("  Modelo LSTM básico guardado → models/lstm_model.keras")
        except Exception as e2:
            print(f"  Error con LSTM básico también: {e2}")

    print(f"  Tiempo: {time.time() - t0:.1f}s")

    # 5. Guardar metadata
    print("\nGuardando metadata de entrenamiento...")
    training_metadata['n_ensemble_models'] = len(ensemble_models)
    with open('models/training_metadata.json', 'w') as f:
        json.dump(training_metadata, f, indent=2)
    print("  Metadata guardada → models/training_metadata.json")

    print("\n" + "=" * 60)
    print("  ENTRENAMIENTO COMPLETADO")
    print("=" * 60)
    print("\nModelos guardados:")
    print("  - models/xgb_model.pkl      (XGBoost mejor individual)")
    print("  - models/xgb_ensemble_*.pkl (Ensemble Bagging)")
    print("  - models/lstm_model.keras   (BiLSTM + Attention)")
    print("  - models/isolation_forest.pkl (Unsupervised Anomaly Detection)")
    print("  - models/scaler.pkl         (StandardScaler)")
    print("  - models/training_metadata.json")


if __name__ == '__main__':
    train()
