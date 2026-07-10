"""
metrics.py
==========
Métricas de evaluación para modelos de predicción de RUL.

Métricas implementadas:
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- MAPE (Mean Absolute Percentage Error)
- R² Score
- NASA Scoring Function (asimétrica — estándar del challenge C-MAPSS)
- Accuracy dentro de tolerancia (±10, ±15, ±20 ciclos)
- Error percentiles (P50, P90, P95)
"""

import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error."""
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error."""
    return float(mean_absolute_error(y_true, y_pred))


def mape(y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1.0) -> float:
    """
    Mean Absolute Percentage Error.
    epsilon evita división por cero cuando y_true es muy pequeño.
    """
    y_true_safe = np.maximum(np.abs(y_true), epsilon)
    return float(np.mean(np.abs(y_true - y_pred) / y_true_safe) * 100)


def r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """R² Score."""
    return float(r2_score(y_true, y_pred))


def nasa_scoring_function(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    NASA Asymmetric Scoring Function (estándar del challenge C-MAPSS).
    Penaliza más las predicciones tardías (no predecir falla a tiempo)
    que las predicciones tempranas (conservative).

    S = Σ(exp(-d/13) - 1)  si d < 0 (predicción temprana / conservadora)
    S = Σ(exp(d/10) - 1)   si d >= 0 (predicción tardía / optimista)

    donde d = y_pred - y_true (error de predicción)
    """
    d = y_pred - y_true
    score = np.where(
        d < 0,
        np.exp(-d / 13) - 1,
        np.exp(d / 10) - 1
    )
    return float(np.sum(score))


def accuracy_within_tolerance(y_true: np.ndarray, y_pred: np.ndarray,
                               tolerance: int = 15) -> float:
    """
    Porcentaje de predicciones dentro de ±tolerance ciclos del RUL real.
    """
    within = np.abs(y_true - y_pred) <= tolerance
    return float(np.mean(within) * 100)


def error_percentiles(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Calcula percentiles del error absoluto para entender la distribución de errores.
    """
    abs_errors = np.abs(y_true - y_pred)
    return {
        'p50_error': float(np.percentile(abs_errors, 50)),
        'p90_error': float(np.percentile(abs_errors, 90)),
        'p95_error': float(np.percentile(abs_errors, 95)),
        'max_error': float(np.max(abs_errors)),
    }


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Evaluación completa del modelo con todas las métricas estándar y extendidas.

    Returns:
        dict con todas las métricas calculadas
    """
    base = {
        'rmse': rmse(y_true, y_pred),
        'mae': mae(y_true, y_pred),
        'mape': mape(y_true, y_pred),
        'r2_score': r2(y_true, y_pred),
        'nasa_score': nasa_scoring_function(y_true, y_pred),
        'accuracy_10': accuracy_within_tolerance(y_true, y_pred, 10),
        'accuracy_15': accuracy_within_tolerance(y_true, y_pred, 15),
        'accuracy_20': accuracy_within_tolerance(y_true, y_pred, 20),
    }
    base.update(error_percentiles(y_true, y_pred))
    return base
