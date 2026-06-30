"""
rul_model.py
============
Modelos de predicción de Remaining Useful Life (RUL).

Implementaciones:
1. Random Forest Regressor (baseline)
2. LSTM Neural Network (deep learning)
3. CNN-LSTM Hybrid (avanzado)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
import joblib


class BaselineRULModel:
    """Modelo baseline usando Random Forest para predicción de RUL."""
    
    def __init__(self, model_type: str = 'random_forest', **kwargs):
        """
        Args:
            model_type: 'random_forest', 'gradient_boosting', 'linear'
        """
        self.model_type = model_type
        if model_type == 'random_forest':
            self.model = RandomForestRegressor(
                n_estimators=kwargs.get('n_estimators', 100),
                max_depth=kwargs.get('max_depth', 15),
                random_state=kwargs.get('random_state', 42),
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            self.model = GradientBoostingRegressor(
                n_estimators=kwargs.get('n_estimators', 200),
                max_depth=kwargs.get('max_depth', 5),
                learning_rate=kwargs.get('learning_rate', 0.1),
                random_state=kwargs.get('random_state', 42)
            )
        else:
            self.model = LinearRegression()
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray):
        """Entrena el modelo."""
        self.model.fit(X_train, y_train)
        return self
    
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
