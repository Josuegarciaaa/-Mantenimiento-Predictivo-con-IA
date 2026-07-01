"""
data_loader.py
==============
Módulo para cargar los datos crudos del NASA C-MAPSS Dataset.

Funcionalidades:
- Lectura de archivos .txt del dataset
- Asignación de nombres de columnas (sensores + condiciones operativas)
- Carga de datos de entrenamiento, prueba y RUL real
"""

import pandas as pd
import numpy as np
from pathlib import Path


# Nombres de columnas del dataset C-MAPSS
COLUMN_NAMES = [
    'engine_id',          # ID del motor
    'cycle',              # Ciclo operativo
    'op_setting_1',       # configuracion operativa 1
    'op_setting_2',       # configuracion operativa 2
    'op_setting_3',       # configuracion operativa 3
    'sensor_1',           # Total temperature at fan inlet (°R)
    'sensor_2',           # Total temperature at LPC outlet (°R)
    'sensor_3',           # Total temperature at HPC outlet (°R)
    'sensor_4',           # Total temperature at LPT outlet (°R)
    'sensor_5',           # Total pressure at fan inlet (psia)
    'sensor_6',           # Total pressure at bypass-duct (psia)
    'sensor_7',           # Total pressure at HPC outlet (psia)
    'sensor_8',           # Physical fan speed (rpm)
    'sensor_9',           # Physical core speed (rpm)
    'sensor_10',          # Engine pressure ratio
    'sensor_11',          # Static pressure at HPC outlet (psia)
    'sensor_12',          # Ratio of fuel flow to Ps30 (pps/psi)
    'sensor_13',          # Corrected fan speed (rpm)
    'sensor_14',          # Corrected core speed (rpm)
    'sensor_15',          # Bypass Ratio
    'sensor_16',          # Burner fuel-air ratio
    'sensor_17',          # Bleed Enthalpy
    'sensor_18',          # Demanded fan speed (rpm)
    'sensor_19',          # Demanded corrected fan speed (rpm)
    'sensor_20',          # HPT coolant bleed (lbm/s)
    'sensor_21',          # LPT coolant bleed (lbm/s)
]


def load_dataset(data_dir: str, dataset_id: str = 'FD001') -> dict:
    """
    Carga un subdataset completo del C-MAPSS.
    
    Args:
        data_dir: Directorio donde están los archivos .txt
        dataset_id: ID del subdataset (FD001, FD002, FD003, FD004)
    
    Returns:
        dict con keys: 'train', 'test', 'rul'
    """
    data_path = Path(data_dir)
    
    # Cargar datos de entrenamiento
    train_df = pd.read_csv(
        data_path / f'train_{dataset_id}.txt',
        sep=r'\s+',
        header=None,
        names=COLUMN_NAMES
    )
    
    # Cargar datos de prueba
    test_df = pd.read_csv(
        data_path / f'test_{dataset_id}.txt',
        sep=r'\s+',
        header=None,
        names=COLUMN_NAMES
    )
    
    # Cargar RUL real
    rul_df = pd.read_csv(
        data_path / f'RUL_{dataset_id}.txt',
        sep=r'\s+',
        header=None,
        names=['rul']
    )
    
    return {
        'train': train_df,
        'test': test_df,
        'rul': rul_df
    }


def add_rul_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula y agrega la columna RUL (Remaining Useful Life) al dataset de entrenamiento.
    RUL = max_cycle_per_engine - current_cycle
    """
    df = df.copy()
    max_cycles = df.groupby('engine_id')['cycle'].max().reset_index()
    max_cycles.columns = ['engine_id', 'max_cycle']
    df = df.merge(max_cycles, on='engine_id', how='left')
    df['rul'] = df['max_cycle'] - df['cycle']
    df.drop('max_cycle', axis=1, inplace=True)
    return df
