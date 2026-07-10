"""
deep_learning_model.py
======================
Modelos de Deep Learning para predicción de RUL.

Arquitecturas:
1. BiLSTM con Attention (recomendado — mejor accuracy)
2. LSTM estándar con BatchNorm
3. CNN-LSTM Hybrid
4. Transformer-based (experimental)
"""

import numpy as np


# ---------------------------------------------------------------------------
# Attention Layer
# ---------------------------------------------------------------------------
def build_attention_layer():
    """Retorna un layer de Attention compatible con Keras funcional API."""
    from tensorflow.keras.layers import Layer
    import tensorflow as tf

    class TemporalAttention(Layer):
        """
        Mecanismo de Attention temporal para secuencias.
        Aprende a enfocarse en los timesteps más relevantes para la predicción de RUL.
        Los timesteps cercanos al fallo reciben mayor peso.
        """
        def __init__(self, **kwargs):
            super(TemporalAttention, self).__init__(**kwargs)

        def build(self, input_shape):
            self.W = self.add_weight(
                name='attention_weight',
                shape=(input_shape[-1], 1),
                initializer='glorot_uniform',
                trainable=True
            )
            self.b = self.add_weight(
                name='attention_bias',
                shape=(input_shape[1], 1),
                initializer='zeros',
                trainable=True
            )
            super(TemporalAttention, self).build(input_shape)

        def call(self, x):
            # Calcular scores de atención: (batch, timesteps, 1)
            e = tf.tanh(tf.matmul(x, self.W) + self.b)
            # Softmax sobre timesteps para obtener pesos normalizados
            a = tf.nn.softmax(e, axis=1)
            # Contexto ponderado: suma ponderada de hidden states
            context = x * a
            return tf.reduce_sum(context, axis=1)

        def compute_output_shape(self, input_shape):
            return (input_shape[0], input_shape[-1])

        def get_config(self):
            return super(TemporalAttention, self).get_config()

    return TemporalAttention


# ---------------------------------------------------------------------------
# BiLSTM con Attention (modelo principal mejorado)
# ---------------------------------------------------------------------------
def build_bilstm_attention_model(input_shape: tuple, units: list = None,
                                  dropout_rate: float = 0.3,
                                  l2_reg: float = 0.001):
    """
    Construye un modelo BiLSTM + Temporal Attention para predicción de RUL.

    Ventajas sobre LSTM simple:
    - BiLSTM captura dependencias temporales en ambas direcciones
    - Attention mechanism enfoca el modelo en los timesteps críticos
    - L2 regularization evita overfitting
    - LR scheduling adapta la tasa de aprendizaje durante entrenamiento

    Args:
        input_shape: (timesteps, features)
        units: Lista de unidades por capa BiLSTM [capa1, capa2]
        dropout_rate: Tasa de dropout
        l2_reg: Coeficiente de regularización L2

    Returns:
        Modelo Keras compilado
    """
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import (
        Input, Bidirectional, LSTM, Dense, Dropout,
        BatchNormalization, LayerNormalization
    )
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras.regularizers import l2

    units = units or [64, 32]
    AttentionLayer = build_attention_layer()

    inputs = Input(shape=input_shape, name='sensor_input')

    # ---- Capa BiLSTM 1 (return sequences para Attention) ----
    x = Bidirectional(
        LSTM(
            units=units[0],
            return_sequences=True,
            dropout=dropout_rate * 0.5,
            recurrent_dropout=0.0,
            kernel_regularizer=l2(l2_reg),
        ),
        name='bilstm_1'
    )(inputs)
    x = LayerNormalization()(x)

    # ---- Capa BiLSTM 2 (return sequences para Attention) ----
    if len(units) > 1:
        x = Bidirectional(
            LSTM(
                units=units[1],
                return_sequences=True,
                dropout=dropout_rate * 0.5,
                recurrent_dropout=0.0,
                kernel_regularizer=l2(l2_reg),
            ),
            name='bilstm_2'
        )(x)
        x = LayerNormalization()(x)

    # ---- Temporal Attention ----
    x = AttentionLayer(name='temporal_attention')(x)

    # ---- Capas densas de salida ----
    x = Dense(64, activation='relu', kernel_regularizer=l2(l2_reg), name='dense_1')(x)
    x = Dropout(dropout_rate, name='dropout_dense_1')(x)
    x = BatchNormalization(name='bn_dense_1')(x)

    x = Dense(32, activation='relu', kernel_regularizer=l2(l2_reg), name='dense_2')(x)
    x = Dropout(dropout_rate * 0.5, name='dropout_dense_2')(x)

    output = Dense(1, activation='linear', name='rul_output')(x)

    model = Model(inputs=inputs, outputs=output, name='BiLSTM_Attention_RUL')

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='huber',       # Huber loss: más robusto que MSE ante outliers
        metrics=['mae', 'mse']
    )

    return model


# ---------------------------------------------------------------------------
# LSTM estándar mejorado
# ---------------------------------------------------------------------------
def build_lstm_model(input_shape: tuple, units: list = None,
                      dropout_rate: float = 0.3):
    """
    Construye un modelo LSTM para predicción de RUL.
    Versión mejorada con BatchNormalization y Huber loss.

    Args:
        input_shape: (timesteps, features)
        units: Lista de unidades por capa LSTM
    """
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
    model.add(Dropout(dropout_rate))
    model.add(BatchNormalization())

    # Capas LSTM adicionales
    for i, u in enumerate(units[1:]):
        return_seq = i < len(units) - 2
        model.add(LSTM(units=u, return_sequences=return_seq))
        model.add(Dropout(dropout_rate))
        model.add(BatchNormalization())

    # Capas densas de salida
    model.add(Dense(32, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(1, activation='linear'))

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='huber',
        metrics=['mae', 'mse']
    )

    return model


# ---------------------------------------------------------------------------
# CNN-LSTM Hybrid
# ---------------------------------------------------------------------------
def build_cnn_lstm_model(input_shape: tuple):
    """
    Construye un modelo CNN-LSTM híbrido para predicción de RUL.
    CNN extrae features locales, LSTM captura dependencias temporales largas.
    """
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        Conv1D, MaxPooling1D, LSTM, Dense, Dropout,
        BatchNormalization
    )
    from tensorflow.keras.optimizers import Adam

    model = Sequential(name='CNN_LSTM_RUL_Predictor')

    # Capas CNN para extraer patterns locales
    model.add(Conv1D(filters=64, kernel_size=3, activation='relu',
                     input_shape=input_shape, padding='same'))
    model.add(BatchNormalization())
    model.add(Conv1D(filters=64, kernel_size=3, activation='relu', padding='same'))
    model.add(BatchNormalization())
    model.add(Conv1D(filters=32, kernel_size=3, activation='relu', padding='same'))
    model.add(BatchNormalization())
    model.add(MaxPooling1D(pool_size=2))
    model.add(Dropout(0.3))

    # Capa LSTM para dependencias temporales largas
    model.add(LSTM(64, return_sequences=False))
    model.add(Dropout(0.3))

    # Capas densas
    model.add(Dense(32, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(1, activation='linear'))

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='huber',
        metrics=['mae', 'mse']
    )

    return model


# ---------------------------------------------------------------------------
# Callbacks para entrenamiento
# ---------------------------------------------------------------------------
def get_training_callbacks(model_name: str = 'model', patience: int = 10):
    """
    Retorna callbacks estándar para entrenamiento de modelos RUL.

    Args:
        model_name: Nombre del modelo (para checkpoint)
        patience: Paciencia para EarlyStopping y ReduceLROnPlateau
    """
    from tensorflow.keras.callbacks import (
        EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
    )

    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=patience,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=max(3, patience // 2),
            min_lr=1e-6,
            verbose=1
        ),
    ]
    return callbacks


# ---------------------------------------------------------------------------
# Create sequences
# ---------------------------------------------------------------------------
def create_sequences(X: np.ndarray, y: np.ndarray, sequence_length: int = 30):
    """
    Crea secuencias temporales para modelos LSTM/BiLSTM.

    Args:
        X: Features array (n_samples, n_features)
        y: Target array (n_samples,) — valores de RUL
        sequence_length: Longitud de cada secuencia temporal

    Returns:
        X_seq: (n_sequences, sequence_length, n_features)
        y_seq: (n_sequences,) — RUL en el último timestep de la secuencia
    """
    X_seq, y_seq = [], []

    for i in range(len(X) - sequence_length + 1):
        X_seq.append(X[i:i + sequence_length])
        y_seq.append(y[i + sequence_length - 1])

    return np.array(X_seq), np.array(y_seq)
