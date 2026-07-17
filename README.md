# Predictive Maintenance & Fleet Economics Platform

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange.svg)](https://tensorflow.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

[English](#english) | [Espanol](#espanol)

---

<a name="english"></a>
## 🇬🇧 English

### What is this project?
In industrial maintenance, fixing a machine after it breaks is incredibly expensive, but doing preventive maintenance too early also wastes a lot of money. 

This project tackles that specific problem using Machine Learning on the NASA C-MAPSS Turbofan dataset. We didn't just build a Python script to print predictions; we built a full-stack, production-ready platform that predicts the Remaining Useful Life (RUL) of jet engines and translates those cycles into actual dollars saved.

### Key Features
- **Fleet Economics Dashboard**: Translates raw telemetry and RUL predictions into business metrics (ROI, Unplanned Downtime Avoided, Risk Exposure).
- **Digital Twin Simulator**: A reactive 3D/SVG interface that changes based on live sensor data (e.g., HPC temperatures). It includes a "what-if" simulator to inject faults and see how the ML model reacts in real-time.
- **Zero-Day Anomaly Detection**: Unsupervised learning (IsolationForest) running in parallel to catch weird patterns that the main Deep Learning model wasn't explicitly trained for.
- **Continuous Learning (MLOps)**: Built-in MLflow integration and a retraining pipeline. You can literally click a button in the dashboard to retrain the XGBoost ensemble on new data.
- **PWA Ready**: The React frontend works as a Progressive Web App. Engineers can install the dashboard directly on their phones or tablets to use it on the factory floor.

### Tech Stack
- **AI/ML**: Python, TensorFlow/Keras, XGBoost, Scikit-learn.
- **Backend**: Node.js + Express handling WebSockets for live data streaming.
- **Frontend**: React, Recharts for financial plotting, Vite.
- **DevOps**: Docker, Docker Compose, MLflow, PostgreSQL.

### How to run it
Make sure you have Docker installed. Clone the repo and just run:
```bash
docker compose up --build -d
```
Wait a couple of minutes for the dependencies to install. Then access:
- **Dashboard**: `http://localhost:5173`
- **MLflow UI**: `http://localhost:5001`
- **Backend API**: `http://localhost:3001`

---

<a name="espanol"></a>
## 🇪🇸 Espanol

### De que va este proyecto?
En el mantenimiento industrial, arreglar una maquina despues de que revienta cuesta muchisimo dinero. Pero hacer mantenimiento preventivo cada dos meses "por si acaso" tambien es tirar plata a la basura.

Este proyecto ataca exactamente ese problema usando Machine Learning sobre el famoso dataset Turbofan C-MAPSS de la NASA. No armamos nomas un script de Python que imprima predicciones en consola; construimos una plataforma completa tipo Full-Stack que predice la Vida Util Restante (RUL) de los motores y traduce todo eso a dolares ahorrados para el negocio.

### Lo mas destacable del sistema
- **Fleet Economics Dashboard**: Pasa la telemetria cruda y el RUL a metricas de negocio reales (Retorno de Inversion, Costo evitado por downtime, Riesgo financiero actual).
- **Simulador de Gemelo Digital**: Una interfaz SVG que cambia en tiempo real con los datos de los sensores. Trae un simulador para inyectar fallos manualmente y ver como el modelo de Machine Learning reacciona en vivo.
- **Deteccion de Anomalias Zero-Day**: Un modelo no supervisado (IsolationForest) que corre en paralelo para atrapar cosas raras que el modelo principal de Deep Learning no haya visto en el entrenamiento.
- **Pipeline de MLOps**: Todo esta conectado a MLflow. Hay un boton en el panel de admin que levanta un proceso en background para reentrenar el ensamble de XGBoost con datos nuevos.
- **Soporte PWA**: El frontend en React es una Aplicacion Web Progresiva. Los ingenieros pueden instalar el dashboard como si fuera una app nativa en el celular para llevarlo a la planta.

### Stack Tecnologico
- **IA/ML**: Python, TensorFlow/Keras, XGBoost, Scikit-learn.
- **Backend**: Node.js + Express usando WebSockets para streamear los datos en vivo.
- **Frontend**: React, Recharts para las graficas de finanzas, Vite.
- **Infraestructura**: Docker, Docker Compose, MLflow para trackear experimentos, PostgreSQL.

### Como levantarlo localmente
Asumiendo que tienes Docker instalado, clona el repo, abre la terminal en la carpeta y tira este comando:
```bash
docker compose up --build -d
```
Dale un par de minutos en lo que descarga las imagenes y compila Node/Python. Cuando termine, entra a:
- **Dashboard (Frontend)**: `http://localhost:5173`
- **Panel de MLflow**: `http://localhost:5001`
- **Backend API**: `http://localhost:3001`

---

## Dataset Info
Powered by the **NASA C-MAPSS Turbofan Engine Degradation Simulation Dataset**. It's pretty much the industry standard for testing predictive maintenance models.

## License
MIT License. Feel free to fork, use, and modify.
