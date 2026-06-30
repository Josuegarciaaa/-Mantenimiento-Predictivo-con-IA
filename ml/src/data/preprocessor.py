"""
preprocessor.py
===============
Módulo de preprocesamiento y limpieza de datos.

Funcionalidades:
- Eliminación de sensores con varianza cero
- Normalización/estandarización de features
- Manejo de valores faltantes
- Clipping de RUL (cap máximo)
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib
from pathlib import Path


class DataPreprocessor:
    """Pipeline de preprocesamiento para datos de sensores industriales."""
    
    def __init__(self, scaler_type: str = 'standard', rul_cap: int = 125):
        """
        Args:
            scaler_type: Tipo de scaler ('standard' o 'minmax')
            rul_cap: Valor máximo de RUL (piece-wise linear degradation)
        """
        self.scaler_type = scaler_type
        self.rul_cap = rul_cap
        self.scaler = StandardScaler() if scaler_type == 'standard' else MinMaxScaler()
        self.sensor_columns = [f'sensor_{i}' for i in range(1, 22)]
        self.op_columns = ['op_setting_1', 'op_setting_2', 'op_setting_3']
        self.columns_to_drop = []  # Columnas con varianza cero
    
    def identify_constant_columns(self, df: pd.DataFrame) -> list:
        """Identifica columnas con varianza cero o casi cero."""
        feature_cols = self.sensor_columns + self.op_columns
        constant_cols = []
        for col in feature_cols:
            if df[col].std() < 0.001:
                constant_cols.append(col)
        self.columns_to_drop = constant_cols
        return constant_cols
    
    def clip_rul(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aplica cap al RUL para piece-wise linear degradation.
        Los valores de RUL > rul_cap se recortan a rul_cap.
        """
        df = df.copy()
        if 'rul' in df.columns:
            df['rul'] = df['rul'].clip(upper=self.rul_cap)
        return df
    
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ajusta el scaler y transforma los datos de entrenamiento."""
        df = df.copy()
        self.identify_constant_columns(df)
        
        feature_cols = [c for c in self.sensor_columns + self.op_columns 
                       if c not in self.columns_to_drop]
        
        df[feature_cols] = self.scaler.fit_transform(df[feature_cols])
        return df
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforma datos nuevos usando el scaler ya ajustado."""
        df = df.copy()
        feature_cols = [c for c in self.sensor_columns + self.op_columns 
                       if c not in self.columns_to_drop]
        
        df[feature_cols] = self.scaler.transform(df[feature_cols])
        return df
    
    def save_scaler(self, path: str):
        """Guarda el scaler entrenado."""
        joblib.dump(self.scaler, path)
    
    def load_scaler(self, path: str):
        """Carga un scaler previamente entrenado."""
        self.scaler = joblib.load(path)
