"""
rul_model.py
============
Modelos de predicción de Remaining Useful Life (RUL).

Implementaciones:
1. XGBoost con hiperparámetros optimizados (modelo principal)
2. Random Forest Regressor (baseline)
3. Gradient Boosting Regressor
4. Ensemble Bagging para estimación de incertidumbre
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, BaggingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import json
from pathlib import Path


class BaselineRULModel:
    """Modelo baseline usando Random Forest o XGBoost para predicción de RUL."""

    def __init__(self, model_type: str = 'xgboost', **kwargs):
        """
        Args:
            model_type: 'xgboost', 'random_forest', 'gradient_boosting', 'linear'
        """
        self.model_type = model_type
        self.model = self._build_model(model_type, **kwargs)
        self.feature_importances_ = None
        self.cv_metrics_ = {}

    def _build_model(self, model_type: str, **kwargs):
        """Construye el modelo según el tipo especificado."""
        if model_type == 'xgboost':
            try:
                import xgboost as xgb
                return xgb.XGBRegressor(
                    n_estimators=kwargs.get('n_estimators', 300),
                    max_depth=kwargs.get('max_depth', 6),
                    learning_rate=kwargs.get('learning_rate', 0.05),
                    subsample=kwargs.get('subsample', 0.8),
                    colsample_bytree=kwargs.get('colsample_bytree', 0.8),
                    min_child_weight=kwargs.get('min_child_weight', 5),
                    gamma=kwargs.get('gamma', 0.1),
                    reg_alpha=kwargs.get('reg_alpha', 0.1),    # L1
                    reg_lambda=kwargs.get('reg_lambda', 1.0),  # L2
                    random_state=kwargs.get('random_state', 42),
                    n_jobs=-1,
                    eval_metric='rmse',
                )
            except ImportError:
                print("XGBoost no disponible, usando GradientBoosting como fallback.")
                return GradientBoostingRegressor(
                    n_estimators=200,
                    max_depth=5,
                    learning_rate=0.05,
                    random_state=42
                )

        elif model_type == 'random_forest':
            return RandomForestRegressor(
                n_estimators=kwargs.get('n_estimators', 100),
                max_depth=kwargs.get('max_depth', 15),
                min_samples_leaf=kwargs.get('min_samples_leaf', 3),
                random_state=kwargs.get('random_state', 42),
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            return GradientBoostingRegressor(
                n_estimators=kwargs.get('n_estimators', 200),
                max_depth=kwargs.get('max_depth', 5),
                learning_rate=kwargs.get('learning_rate', 0.05),
                subsample=kwargs.get('subsample', 0.8),
                random_state=kwargs.get('random_state', 42)
            )
        else:
            return LinearRegression()

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None):
        """
        Entrena el modelo.

        Args:
            X_train: Features de entrenamiento
            y_train: Labels de entrenamiento (RUL)
            X_val: Features de validación (opcional, para early stopping en XGBoost)
            y_val: Labels de validación (opcional)
        """
        if self.model_type == 'xgboost' and X_val is not None and y_val is not None:
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
        else:
            self.model.fit(X_train, y_train)

        # Guardar feature importances si el modelo las soporta
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importances_ = self.model.feature_importances_

        return self

    def cross_validate(self, X: np.ndarray, y: np.ndarray,
                        n_splits: int = 5) -> dict:
        """
        Realiza TimeSeriesSplit cross-validation (respeta el orden temporal).

        Args:
            X: Features completos
            y: Labels completos
            n_splits: Número de folds

        Returns:
            dict con métricas promedio: rmse, mae, r2
        """
        tscv = TimeSeriesSplit(n_splits=n_splits)
        rmse_scores, mae_scores, r2_scores = [], [], []

        for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
            X_tr, X_val = X[train_idx], X[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]

            # Crear un modelo fresco para cada fold
            fold_model = self._build_model(self.model_type)
            if self.model_type == 'xgboost':
                fold_model.fit(X_tr, y_tr,
                                eval_set=[(X_val, y_val)],
                                verbose=False)
            else:
                fold_model.fit(X_tr, y_tr)

            y_pred = fold_model.predict(X_val)
            rmse_scores.append(np.sqrt(mean_squared_error(y_val, y_pred)))
            mae_scores.append(mean_absolute_error(y_val, y_pred))
            r2_scores.append(r2_score(y_val, y_pred))

        self.cv_metrics_ = {
            'cv_rmse_mean': float(np.mean(rmse_scores)),
            'cv_rmse_std': float(np.std(rmse_scores)),
            'cv_mae_mean': float(np.mean(mae_scores)),
            'cv_r2_mean': float(np.mean(r2_scores)),
        }
        return self.cv_metrics_

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Genera predicciones de RUL."""
        return self.model.predict(X)

    def save(self, path: str):
        """Guarda el modelo entrenado."""
        joblib.dump(self.model, path)

    def load(self, path: str):
        """Carga un modelo previamente entrenado."""
        self.model = joblib.load(path)
        return self


class EnsembleRULPredictor:
    """
    Ensemble con Bagging para predicción de RUL con estimación de incertidumbre.

    Entrena N modelos base con bootstrap de los datos.
    La media de las predicciones es más robusta que un solo modelo.
    La desviación estándar estima la incertidumbre (intervalo de confianza).
    """

    def __init__(self, base_model_type: str = 'xgboost', n_estimators: int = 10,
                 max_samples: float = 0.8, random_state: int = 42):
        """
        Args:
            base_model_type: Tipo de modelo base ('xgboost', 'random_forest')
            n_estimators: Número de modelos en el ensemble
            max_samples: Fracción de muestras para cada modelo (bootstrap)
            random_state: Semilla aleatoria
        """
        self.base_model_type = base_model_type
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        self.models_ = []
        self.is_fitted_ = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Entrena todos los modelos del ensemble con bootstrap."""
        rng = np.random.RandomState(self.random_state)
        self.models_ = []
        n_samples = len(X)
        n_bootstrap = int(n_samples * self.max_samples)

        for i in range(self.n_estimators):
            # Bootstrap: muestreo con reemplazo
            idx = rng.choice(n_samples, size=n_bootstrap, replace=True)
            X_boot, y_boot = X[idx], y[idx]

            model = BaselineRULModel(
                model_type=self.base_model_type,
                random_state=self.random_state + i
            )
            model.train(X_boot, y_boot)
            self.models_.append(model)

        self.is_fitted_ = True
        return self

    def predict_with_uncertainty(self, X: np.ndarray) -> dict:
        """
        Genera predicciones con intervalos de confianza.

        Returns:
            dict con:
                - 'mean': predicción media del ensemble
                - 'std': desviación estándar (incertidumbre)
                - 'lower_95': límite inferior al 95%
                - 'upper_95': límite superior al 95%
                - 'confidence': nivel de confianza [0, 1]
        """
        if not self.is_fitted_:
            raise RuntimeError("El ensemble no está entrenado. Llama .fit() primero.")

        predictions = np.array([m.predict(X) for m in self.models_])
        mean_pred = predictions.mean(axis=0)
        std_pred = predictions.std(axis=0)

        # Intervalo de confianza al 95% (±1.96 std)
        lower_95 = mean_pred - 1.96 * std_pred
        upper_95 = mean_pred + 1.96 * std_pred

        # Confianza normalizada: alta cuando std es baja relativa a la predicción
        relative_uncertainty = std_pred / (np.abs(mean_pred) + 1e-6)
        confidence = np.clip(1.0 - relative_uncertainty, 0.5, 0.99)

        return {
            'mean': mean_pred,
            'std': std_pred,
            'lower_95': lower_95,
            'upper_95': upper_95,
            'confidence': confidence,
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predicción simple (media del ensemble)."""
        return self.predict_with_uncertainty(X)['mean']

    def save(self, path: str):
        """Guarda todos los modelos del ensemble."""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        for i, model in enumerate(self.models_):
            model.save(str(path / f'ensemble_model_{i}.pkl'))
        # Guardar metadata
        meta = {
            'base_model_type': self.base_model_type,
            'n_estimators': self.n_estimators,
            'max_samples': self.max_samples,
            'random_state': self.random_state,
        }
        with open(path / 'ensemble_meta.json', 'w') as f:
            json.dump(meta, f)

    def load(self, path: str):
        """Carga el ensemble desde disco."""
        path = Path(path)
        with open(path / 'ensemble_meta.json', 'r') as f:
            meta = json.load(f)

        self.base_model_type = meta['base_model_type']
        self.n_estimators = meta['n_estimators']
        self.max_samples = meta['max_samples']
        self.random_state = meta['random_state']

        self.models_ = []
        for i in range(self.n_estimators):
            model = BaselineRULModel(model_type=self.base_model_type)
            model.load(str(path / f'ensemble_model_{i}.pkl'))
            self.models_.append(model)

        self.is_fitted_ = True
        return self
