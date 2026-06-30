#!/usr/bin/env python3
"""
setup_environment.py
====================
Script para configurar el entorno de desarrollo completo.
"""

import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent


def setup():
    """Configura todo el entorno de desarrollo."""
    print(" Configurando entorno de Mantenimiento Predictivo con IA")
    print("=" * 60)
    
    # 1. Python virtual environment
    print("\n 1. Creando entorno virtual Python...")
    subprocess.run([sys.executable, '-m', 'venv', str(ROOT_DIR / 'venv')])
    
    # 2. Instalar dependencias Python
    print("\n 2. Instalando dependencias ML...")
    pip_path = ROOT_DIR / 'venv' / 'Scripts' / 'pip'  # Windows
    subprocess.run([str(pip_path), 'install', '-r', str(ROOT_DIR / 'ml' / 'requirements.txt')])
    
    # 3. Instalar dependencias Node.js (backend)
    print("\n 3. Instalando dependencias del backend...")
    subprocess.run(['npm', 'install'], cwd=str(ROOT_DIR / 'backend'))
    
    # 4. Copiar .env de ejemplo
    print("\n  4. Configurando variables de entorno...")
    env_example = ROOT_DIR / 'backend' / 'config' / '.env.example'
    env_file = ROOT_DIR / 'backend' / 'config' / '.env'
    if not env_file.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("   Archivo .env creado desde .env.example")
    
    print("\n ¡Entorno configurado exitosamente!")
    print("\nPróximos pasos:")
    print("  1. Descargar dataset: python scripts/download_dataset.py")
    print("  2. Configurar .env: backend/config/.env")
    print("  3. Iniciar backend: cd backend && npm run dev")


if __name__ == '__main__':
    setup()
