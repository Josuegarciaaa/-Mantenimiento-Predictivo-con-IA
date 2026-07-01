"""
deep_learning_model.py
======================
Modelos de Deep Learning para predicción de RUL.

Arquitecturas:
1. LSTM (Long Short-Term Memory)
2. CNN-LSTM Hybrid
3. Transformer-based (experimental)
"""

import numpy as np


def build_lstm_model(input_shape: tuple, units: list = None):
    """
    Construye un modelo LSTM para predicción de RUL.
    
    Args:
        input_shape: (timesteps, features)
        units: Lista de unidades por capa LSTM
    
    Returns:
        Modelo Keras compilado
    """
    # importar dentro de la funcion para evitar dependencia estricta
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        LSTM, Dense, Dropout, BatchNormalization
    )
    from tensorflow.keras.optimizers import Adam
    
    units = units or [64, 32]
    
    model = Sequential(name='LSTM_RUL_Predictor')
    
    # Primera capa LSTM
    model.add(LSTM(
        units=units[0],
        input_shape=input_shape,
        return_sequences=len(units) > 1
    ))
    model.add(Dropout(0.3))
    model.add(BatchNormalization())
    
    # Capas LSTM adicionales
    for i, u in enumerate(units[1:]):
        return_seq = i < len(units) - 2
        model.add(LSTM(units=u, return_sequences=return_seq))
        model.add(Dropout(0.3))
        model.add(BatchNormalization())
    
    # Capas densas de salida
    model.add(Dense(32, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(1, activation='linear'))
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )
    
    return model


def build_cnn_lstm_model(input_shape: tuple):
    """
    Construye un modelo CNN-LSTM híbrido para predicción de RUL.
    
    Args:
        input_shape: (timesteps, features)
    
    Returns:
        Modelo Keras compilado
    """
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        Conv1D, MaxPooling1D, LSTM, Dense, Dropout, 
        BatchNormalization, Flatten
    )
    from tensorflow.keras.optimizers import Adam
    
    model = Sequential(name='CNN_LSTM_RUL_Predictor')
    
    # capas cnn para extraer features locales
    model.add(Conv1D(filters=64, kernel_size=3, activation='relu', 
                     input_shape=input_shape, padding='same'))
    model.add(BatchNormalization())
    model.add(Conv1D(filters=32, kernel_size=3, activation='relu', padding='same'))
    model.add(BatchNormalization())
    model.add(MaxPooling1D(pool_size=2))
    model.add(Dropout(0.3))
    
    # Capa LSTM para dependencias temporales
    model.add(LSTM(50, return_sequences=False))
    model.add(Dropout(0.3))
    
    # Capas densas
    model.add(Dense(32, activation='relu'))
    model.add(Dense(1, activation='linear'))
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )
    
    return model


def create_sequences(X: np.ndarray, y: np.ndarray, sequence_length: int = 30):
    """
    Crea secuencias temporales para modelos LSTM.
    
    Args:
        X: Features array
        y: Target array (RUL)
        sequence_length: Longitud de cada secuencia
    
    Returns:
        X_seq, y_seq: Arrays con secuencias
    """
    X_seq, y_seq = [], []
    
    for i in range(len(X) - sequence_length + 1):
        X_seq.append(X[i:i + sequence_length])
        y_seq.append(y[i + sequence_length - 1])
    
    return np.array(X_seq), np.array(y_seq)
