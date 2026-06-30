#!/usr/bin/env python3
"""
download_dataset.py
===================
Script para descargar el dataset NASA C-MAPSS automáticamente.
"""

import os
import urllib.request
import zipfile
from pathlib import Path

# URL del dataset (NASA)
DATASET_URL = "https://data.nasa.gov/download/xaut-bemq/application%2Fx-zip-compressed"
DATA_DIR = Path(__file__).parent.parent / "data" / "raw"


def download_dataset():
    """Descarga y extrae el dataset NASA C-MAPSS."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    zip_path = DATA_DIR / "CMAPSSData.zip"
    
    print(" Descargando dataset NASA C-MAPSS...")
    print(f"   URL: {DATASET_URL}")
    print(f"   Destino: {DATA_DIR}")
    
    try:
        urllib.request.urlretrieve(DATASET_URL, zip_path)
        print(" Descarga completada")
        
        print(" Extrayendo archivos...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(DATA_DIR)
        print(" Extracción completada")
        
        # Limpiar zip
        os.remove(zip_path)
        print("  Archivo zip eliminado")
        
        # Verificar archivos
        expected_files = [
            'train_FD001.txt', 'test_FD001.txt', 'RUL_FD001.txt',
            'train_FD002.txt', 'test_FD002.txt', 'RUL_FD002.txt',
            'train_FD003.txt', 'test_FD003.txt', 'RUL_FD003.txt',
            'train_FD004.txt', 'test_FD004.txt', 'RUL_FD004.txt',
        ]
        
        for f in expected_files:
            if (DATA_DIR / f).exists():
                print(f"    {f}")
            else:
                print(f"    {f} - NO ENCONTRADO")
        
        print("\n Dataset listo para usar!")
        
    except Exception as e:
        print(f" Error: {e}")
        print("   Descarga manual: https://data.nasa.gov/dataset/C-MAPSS-Aircraft-Engine-Simulator-Data/xaut-bemq")


if __name__ == '__main__':
    download_dataset()
