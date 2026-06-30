"""
metrics.py
==========
Métricas de evaluación para modelos de predicción de RUL.

Métricas implementadas:
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- R² Score
- NASA Scoring Function (asimétrica)
- Accuracy dentro de tolerancia
"""

import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error."""
    return np.sqrt(mean_squared_error(y_true, y_pred))


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error."""
    return mean_absolute_error(y_true, y_pred)


def r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """R² Score."""
    return r2_score(y_true, y_pred)


def nasa_scoring_function(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    NASA Asymmetric Scoring Function.
    Penaliza más las predicciones tardías (no predecir falla a tiempo)
    que las predicciones tempranas.
    
    S = Σ(exp(-d/13) - 1)  si d < 0 (predicción temprana)
    S = Σ(exp(d/10) - 1)   si d >= 0 (predicción tardía)
    
    donde d = y_pred - y_true (error de predicción)
    """
    d = y_pred - y_true
    score = np.where(
        d < 0,
        np.exp(-d / 13) - 1,
        np.exp(d / 10) - 1
    )
    return np.sum(score)


def accuracy_within_tolerance(y_true: np.ndarray, y_pred: np.ndarray, 
                               tolerance: int = 15) -> float:
    """
    Porcentaje de predicciones dentro de ±tolerance ciclos del RUL real.
    """
    within = np.abs(y_true - y_pred) <= tolerance
    return np.mean(within) * 100


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Evaluación completa del modelo con todas las métricas.
    
    Returns:
        dict con todas las métricas calculadas
    """
    return {
        'rmse': rmse(y_true, y_pred),
        'mae': mae(y_true, y_pred),
        'r2_score': r2(y_true, y_pred),
        'nasa_score': nasa_scoring_function(y_true, y_pred),
        'accuracy_15': accuracy_within_tolerance(y_true, y_pred, 15),
        'accuracy_20': accuracy_within_tolerance(y_true, y_pred, 20),
    }
