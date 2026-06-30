"""
helpers.py
==========
Funciones auxiliares para el pipeline ML.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path


def setup_logger(name: str, log_file: str = None, level=logging.INFO):
    """Configura un logger con formato estándar."""
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Console handler
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    
    # File handler (opcional)
    if log_file:
        fh = logging.FileHandler(log_file)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    
    return logger


def save_training_metadata(model_name: str, metrics: dict, 
                           params: dict, output_dir: str):
    """Guarda metadata del entrenamiento como JSON."""
    metadata = {
        'model_name': model_name,
        'timestamp': datetime.now().isoformat(),
        'metrics': metrics,
        'parameters': params,
    }
    
    output_path = Path(output_dir) / f'{model_name}_metadata.json'
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return str(output_path)


def ensure_directory(path: str):
    """Crea un directorio si no existe."""
    Path(path).mkdir(parents=True, exist_ok=True)
