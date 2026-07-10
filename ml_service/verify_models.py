import os, sys, json, glob
import numpy as np
from pathlib import Path

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import joblib
import pandas as pd

models_dir = Path('models')
print('=== Verificando modelos generados ===')

# Scaler
scaler = joblib.load(models_dir / 'scaler.pkl')
print(f'Scaler: OK -> {type(scaler).__name__}')

# XGBoost ensemble
ensemble_paths = sorted(glob.glob(str(models_dir / 'xgb_ensemble_*.pkl')))
ensemble_models = [joblib.load(p) for p in ensemble_paths]
print(f'XGBoost Ensemble: {len(ensemble_models)} modelos OK')

# Probar prediccion del ensemble
feature_cols = [f'op_setting_{i}' for i in range(1, 4)] + [f'sensor_{i}' for i in range(1, 22)]
test_reading = {col: 0.0 for col in feature_cols}
test_df = pd.DataFrame([test_reading])
X_test = scaler.transform(test_df)
preds = np.array([m.predict(X_test)[0] for m in ensemble_models])
mean_pred = preds.mean()
std_pred = preds.std()
lower95 = max(0, mean_pred - 1.96 * std_pred)
upper95 = mean_pred + 1.96 * std_pred
print(f'Prediccion ensemble: mean={mean_pred:.1f}, std={std_pred:.2f}, IC95=[{lower95:.1f}, {upper95:.1f}]')

# LSTM
try:
    from tensorflow.keras.models import load_model
    lstm = load_model(str(models_dir / 'lstm_model.keras'), compile=False)
    print(f'LSTM: OK -> {lstm.name}, params={lstm.count_params():,}')
except Exception as e:
    print(f'LSTM: ERROR -> {e}')

# Metadata
with open(models_dir / 'training_metadata.json') as f:
    meta = json.load(f)
xgb_meta = meta['models']['xgboost_ensemble']
print(f"XGBoost ensemble -> RMSE={xgb_meta['rmse']:.2f}, MAE={xgb_meta['mae']:.2f}, R2={xgb_meta['r2_score']:.4f}")
print('=== Verificacion completada ===')
