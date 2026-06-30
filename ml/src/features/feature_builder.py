"""
feature_builder.py
==================
Ingeniería de features para el modelo de mantenimiento predictivo.

Features derivadas:
- Rolling statistics (media, std, min, max) por sensor
- Rate of change (diferencias) por sensor
- Polynomial features
- Indicadores de degradación
"""

import pandas as pd
import numpy as np


class FeatureBuilder:
    """Construye features derivadas a partir de datos de sensores."""
    
    def __init__(self, window_sizes: list = None, sensor_columns: list = None):
        """
        Args:
            window_sizes: Tamaños de ventana para rolling features
            sensor_columns: Lista de columnas de sensores a procesar
        """
        self.window_sizes = window_sizes or [5, 10, 20]
        self.sensor_columns = sensor_columns or [f'sensor_{i}' for i in range(1, 22)]
    
    def add_rolling_features(self, df: pd.DataFrame, sensors: list = None) -> pd.DataFrame:
        """
        Agrega estadísticas de ventana deslizante por motor.
        
        Args:
            df: DataFrame con datos de sensores
            sensors: Lista de sensores a procesar (default: todos)
        """
        df = df.copy()
        sensors = sensors or self.sensor_columns
        
        for sensor in sensors:
            for window in self.window_sizes:
                grouped = df.groupby('engine_id')[sensor]
                
                df[f'{sensor}_rolling_mean_{window}'] = grouped.transform(
                    lambda x: x.rolling(window=window, min_periods=1).mean()
                )
                df[f'{sensor}_rolling_std_{window}'] = grouped.transform(
                    lambda x: x.rolling(window=window, min_periods=1).std()
                ).fillna(0)
        
        return df
    
    def add_rate_of_change(self, df: pd.DataFrame, sensors: list = None) -> pd.DataFrame:
        """Agrega tasa de cambio (diferencia) por sensor y motor."""
        df = df.copy()
        sensors = sensors or self.sensor_columns
        
        for sensor in sensors:
            df[f'{sensor}_diff'] = df.groupby('engine_id')[sensor].diff().fillna(0)
        
        return df
    
    def add_degradation_indicator(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Agrega indicador de degradación basado en la distancia 
        del ciclo actual al ciclo inicial del motor.
        """
        df = df.copy()
        df['cycle_norm'] = df.groupby('engine_id')['cycle'].transform(
            lambda x: (x - x.min()) / (x.max() - x.min())
        ).fillna(0)
        return df
    
    def build_features(self, df: pd.DataFrame, selected_sensors: list = None) -> pd.DataFrame:
        """Pipeline completo de feature engineering."""
        df = self.add_rolling_features(df, selected_sensors)
        df = self.add_rate_of_change(df, selected_sensors)
        df = self.add_degradation_indicator(df)
        return df
