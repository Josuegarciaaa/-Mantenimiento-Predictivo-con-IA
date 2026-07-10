"""
feature_builder.py
==================
Ingeniería de features avanzada para el modelo de mantenimiento predictivo.

Features derivadas:
- Rolling statistics (media, std, min, max) por sensor
- Exponential Weighted Moving Average (EWMA)
- Rate of change (diferencias) por sensor
- Z-score anomaly detection por sensor
- Health Index compuesto (combinación ponderada de sensores críticos)
- FFT features (frecuencias dominantes para detección de vibraciones)
- Cross-correlation entre sensores críticos
- Indicadores de degradación
"""

import pandas as pd
import numpy as np


# Sensores críticos con mayor relevancia para RUL en turbinas (basado en CMAPSS)
CRITICAL_SENSORS = [
    'sensor_2',   # Temp LPC outlet — sube con desgaste
    'sensor_3',   # Temp HPC outlet — indicador clave de degradación
    'sensor_4',   # Temp LPT outlet — sube con desgaste
    'sensor_7',   # Presión HPC outlet — baja con desgaste
    'sensor_8',   # Velocidad fan (rpm)
    'sensor_9',   # Velocidad core (rpm)
    'sensor_11',  # Presión estática HPC — baja con desgaste
    'sensor_12',  # Ratio combustible — cambia con degradación
    'sensor_14',  # Velocidad core corregida
    'sensor_15',  # Bypass Ratio — cambia con desgaste del fan
    'sensor_20',  # Sangrado HPT coolant
    'sensor_21',  # Sangrado LPT coolant
]

# Pesos para el Health Index compuesto (mayor peso = más relevante para RUL)
HEALTH_INDEX_WEIGHTS = {
    'sensor_3':  0.20,
    'sensor_4':  0.15,
    'sensor_9':  0.15,
    'sensor_11': 0.15,
    'sensor_12': 0.12,
    'sensor_14': 0.10,
    'sensor_15': 0.08,
    'sensor_7':  0.05,
}


class FeatureBuilder:
    """Construye features derivadas a partir de datos de sensores industriales."""

    def __init__(self, window_sizes: list = None, sensor_columns: list = None):
        """
        Args:
            window_sizes: Tamaños de ventana para rolling/EWMA features
            sensor_columns: Lista de columnas de sensores a procesar
        """
        self.window_sizes = window_sizes or [5, 10, 20]
        self.sensor_columns = sensor_columns or [f'sensor_{i}' for i in range(1, 22)]
        # Baseline de sensores (calculado durante fit) para z-score y health index
        self._sensor_baselines = {}
        self._sensor_scales = {}

    # ------------------------------------------------------------------
    # Rolling Statistics
    # ------------------------------------------------------------------
    def add_rolling_features(self, df: pd.DataFrame, sensors: list = None) -> pd.DataFrame:
        """
        Agrega estadísticas de ventana deslizante por motor.
        Incluye: mean, std, min, max para cada ventana y sensor.
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
                df[f'{sensor}_rolling_min_{window}'] = grouped.transform(
                    lambda x: x.rolling(window=window, min_periods=1).min()
                )
                df[f'{sensor}_rolling_max_{window}'] = grouped.transform(
                    lambda x: x.rolling(window=window, min_periods=1).max()
                )

        return df

    # ------------------------------------------------------------------
    # Exponential Weighted Moving Average (EWMA)
    # ------------------------------------------------------------------
    def add_ewma_features(self, df: pd.DataFrame, sensors: list = None,
                          spans: list = None) -> pd.DataFrame:
        """
        Agrega EWMA por sensor.
        EWMA da más peso a lecturas recientes, ideal para detectar degradación.
        """
        df = df.copy()
        sensors = sensors or CRITICAL_SENSORS
        spans = spans or [5, 15, 30]

        for sensor in sensors:
            for span in spans:
                df[f'{sensor}_ewma_{span}'] = df.groupby('engine_id')[sensor].transform(
                    lambda x: x.ewm(span=span, adjust=False).mean()
                )
        return df

    # ------------------------------------------------------------------
    # Rate of Change
    # ------------------------------------------------------------------
    def add_rate_of_change(self, df: pd.DataFrame, sensors: list = None) -> pd.DataFrame:
        """
        Agrega tasa de cambio (diferencia de 1 y 5 ciclos) por sensor y motor.
        La aceleración del cambio indica degradación inminente.
        """
        df = df.copy()
        sensors = sensors or self.sensor_columns

        for sensor in sensors:
            # Primera diferencia (ciclo a ciclo)
            df[f'{sensor}_diff1'] = df.groupby('engine_id')[sensor].diff(1).fillna(0)
            # Diferencia de 5 ciclos (tendencia corta)
            df[f'{sensor}_diff5'] = df.groupby('engine_id')[sensor].diff(5).fillna(0)

        return df

    # ------------------------------------------------------------------
    # Z-Score Anomaly
    # ------------------------------------------------------------------
    def add_zscore_features(self, df: pd.DataFrame, sensors: list = None,
                             window: int = 20) -> pd.DataFrame:
        """
        Calcula el z-score rolling de cada sensor respecto a su media/std en ventana.
        Valores |z| > 2 indican lecturas anómalas que preceden fallos.
        """
        df = df.copy()
        sensors = sensors or CRITICAL_SENSORS

        for sensor in sensors:
            roll_mean = df.groupby('engine_id')[sensor].transform(
                lambda x: x.rolling(window=window, min_periods=3).mean()
            )
            roll_std = df.groupby('engine_id')[sensor].transform(
                lambda x: x.rolling(window=window, min_periods=3).std()
            ).replace(0, 1e-6)

            df[f'{sensor}_zscore'] = ((df[sensor] - roll_mean) / roll_std).fillna(0)

        return df

    # ------------------------------------------------------------------
    # Health Index Compuesto
    # ------------------------------------------------------------------
    def add_health_index(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Crea un Health Index compuesto (0=saludable, 1=degradado) combinando
        los sensores más críticos con pesos basados en literatura CMAPSS.

        Normaliza cada sensor respecto a su rango observado en el dataframe,
        luego pondera para obtener un índice global de degradación.
        """
        df = df.copy()
        hi_components = []

        for sensor, weight in HEALTH_INDEX_WEIGHTS.items():
            if sensor not in df.columns:
                continue

            col_min = df[sensor].min()
            col_max = df[sensor].max()
            col_range = col_max - col_min if col_max != col_min else 1.0

            # Normalizar sensor: 0 = valor mínimo (mejor estado), 1 = máximo (peor)
            normalized = (df[sensor] - col_min) / col_range
            hi_components.append(normalized * weight)

        if hi_components:
            df['health_index'] = sum(hi_components)
        else:
            df['health_index'] = 0.0

        # EWMA del health index para suavizar ruido
        df['health_index_ewma'] = df.groupby('engine_id')['health_index'].transform(
            lambda x: x.ewm(span=10, adjust=False).mean()
        )
        return df

    # ------------------------------------------------------------------
    # FFT Features (vibraciones y frecuencias dominantes)
    # ------------------------------------------------------------------
    def add_fft_features(self, df: pd.DataFrame, sensors: list = None,
                          window: int = 30) -> pd.DataFrame:
        """
        Extrae la frecuencia dominante y energía espectral de cada sensor
        usando una ventana FFT rolling.

        Útil para detectar cambios en patrones vibracionales que preceden fallos.
        """
        df = df.copy()
        sensors = sensors or ['sensor_8', 'sensor_9', 'sensor_12']  # Velocidades y flujo

        def fft_energy(x):
            """Calcula la energía total del espectro de frecuencias."""
            if len(x) < 4:
                return 0.0
            fft_vals = np.abs(np.fft.rfft(x))
            return float(np.sum(fft_vals ** 2))

        def fft_dominant_freq(x):
            """Retorna la frecuencia dominante normalizada."""
            if len(x) < 4:
                return 0.0
            fft_vals = np.abs(np.fft.rfft(x))
            freqs = np.fft.rfftfreq(len(x))
            if len(fft_vals) == 0:
                return 0.0
            return float(freqs[np.argmax(fft_vals)])

        for sensor in sensors:
            if sensor not in df.columns:
                continue

            # Calcular por motor con ventana rolling
            energy_vals = []
            freq_vals = []

            for engine_id, group in df.groupby('engine_id'):
                values = group[sensor].values
                eng_energy = []
                eng_freq = []
                for i in range(len(values)):
                    start = max(0, i - window + 1)
                    window_data = values[start:i + 1]
                    eng_energy.append(fft_energy(window_data))
                    eng_freq.append(fft_dominant_freq(window_data))
                energy_vals.extend(eng_energy)
                freq_vals.extend(eng_freq)

            df[f'{sensor}_fft_energy'] = energy_vals
            df[f'{sensor}_fft_dom_freq'] = freq_vals

        return df

    # ------------------------------------------------------------------
    # Cross-Correlation entre sensores críticos
    # ------------------------------------------------------------------
    def add_cross_sensor_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Agrega ratios y diferencias entre pares de sensores relacionados.
        Las correlaciones entre sensores cambian durante la degradación.
        """
        df = df.copy()

        # Ratio temperatura salida HPC / temperatura salida fan (degradación compresión)
        if 'sensor_3' in df.columns and 'sensor_2' in df.columns:
            denom = df['sensor_2'].replace(0, 1e-6)
            df['temp_ratio_hpc_lpc'] = df['sensor_3'] / denom

        # Ratio presión HPC / velocidad core (eficiencia)
        if 'sensor_7' in df.columns and 'sensor_9' in df.columns:
            denom = df['sensor_9'].replace(0, 1e-6)
            df['pressure_core_ratio'] = df['sensor_7'] / denom

        # Diferencia velocidades fan y core (desbalance)
        if 'sensor_8' in df.columns and 'sensor_9' in df.columns:
            df['fan_core_speed_diff'] = df['sensor_8'] - df['sensor_9']

        # Ratio sangrado coolant HPT/LPT
        if 'sensor_20' in df.columns and 'sensor_21' in df.columns:
            denom = df['sensor_21'].replace(0, 1e-6)
            df['coolant_bleed_ratio'] = df['sensor_20'] / denom

        return df

    # ------------------------------------------------------------------
    # Degradation Indicator
    # ------------------------------------------------------------------
    def add_degradation_indicator(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Agrega indicador de degradación basado en el ciclo normalizado y
        la tasa de cambio del health index.
        """
        df = df.copy()

        # Ciclo normalizado por motor [0, 1]
        df['cycle_norm'] = df.groupby('engine_id')['cycle'].transform(
            lambda x: (x - x.min()) / (x.max() - x.min() + 1e-6)
        ).fillna(0)

        # Pendiente del health index (tasa de degradación)
        if 'health_index' in df.columns:
            df['health_index_slope'] = df.groupby('engine_id')['health_index'].transform(
                lambda x: x.diff(5).fillna(0)
            )

        return df

    # ------------------------------------------------------------------
    # Pipeline completo
    # ------------------------------------------------------------------
    def build_features(self, df: pd.DataFrame, selected_sensors: list = None,
                        include_fft: bool = False) -> pd.DataFrame:
        """
        Pipeline completo de feature engineering.

        Args:
            df: DataFrame con datos de sensores
            selected_sensors: Subset de sensores (None = todos)
            include_fft: Si incluir features FFT (más lento pero más informativo)
        """
        # 1. Health index primero (para que se use en otras features)
        df = self.add_health_index(df)

        # 2. Rolling statistics
        df = self.add_rolling_features(df, selected_sensors)

        # 3. EWMA
        df = self.add_ewma_features(df)

        # 4. Rate of change
        df = self.add_rate_of_change(df, selected_sensors)

        # 5. Z-score anomaly
        df = self.add_zscore_features(df)

        # 6. Cross-sensor features
        df = self.add_cross_sensor_features(df)

        # 7. Degradation indicator
        df = self.add_degradation_indicator(df)

        # 8. FFT (opcional, lento en datasets grandes)
        if include_fft:
            df = self.add_fft_features(df)

        return df
