# Predictive Maintenance & Fleet Economics Platform

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange.svg)](https://tensorflow.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

> Una plataforma de nivel industrial disenada para predecir fallos en maquinaria pesada antes de que ocurran. Monitoreamos telemetria en tiempo real, calculamos el RUL (Remaining Useful Life) y, lo mas importante, traducimos esos datos tecnicos a impacto financiero real (ROI) para el negocio.

---

## De que trata este proyecto?

En el mundo real del mantenimiento industrial (Industry 4.0), arreglar un motor despues de que explota es demasiado caro. Por otro lado, hacerle mantenimiento preventivo cada mes "por si acaso" tambien tira mucho dinero a la basura. 

Este proyecto ataca ese problema de raiz usando Machine Learning sobre el famoso dataset Turbofan C-MAPSS de la NASA. Pero ojo, esto no es solo un script de Python escupiendo predicciones en la consola. Construimos una plataforma completa que incluye:
- Un **Gemelo Digital (Digital Twin)** en vivo que reacciona a la telemetria.
- Deteccion de anomalias tipo **Zero-Day** para encontrar fallos que ni el modelo principal ha visto jamas.
- Un dashboard enfocado en **Fleet Economics** que calcula cuanto dinero le estamos ahorrando a la empresa al evitar tiempos de inactividad (Downtime).

Todo corre en contenedores de Docker, tiene un pipeline interno de MLOps para reentrenar modelos "on-the-fly", y el Frontend es una PWA (Progressive Web App) instalable de forma nativa para que los ingenieros lleven el dashboard en su celular directo al piso de produccion.

## Lo que hay bajo el capo (Arquitectura)

```text
[Sensores NASA] ---> [ETL & ML Pipeline (Python/TensorFlow/MLflow)] 
                            |
                     [Backend Node.js] <---> [PostgreSQL]
                            |
            [React Frontend (PWA, Digital Twin, Economics)]
```

## Tech Stack Principal

- **Inteligencia Artificial**: Python, TensorFlow, XGBoost, Scikit-learn, IsolationForest (Anomalias).
- **Backend**: Node.js con Express, integracion por WebSockets para recibir la telemetria en vivo sin delay.
- **Frontend**: React, Recharts (para graficas financieras hermosas), Vite (con plugin PWA).
- **MLOps & DevOps**: MLflow para trackear los experimentos y modelos, y Docker & Docker Compose para levantar toda esta locura con un solo comando.
- **Base de Datos**: PostgreSQL pura y dura.

## Features Clave que marcan la diferencia

- **Fleet Economics Dashboard**: No mas graficas aburridas de "voltaje vs tiempo". Transformamos el RUL en metricas de ROI y dolares salvados en la mesa.
- **Digital Twin**: Visor reactivo que te muestra el estado interno del motor dependiendo de la temperatura y el desgaste real.
- **Zero-Day Anomaly Detection**: Un sistema no supervisado que atrapa patrones raros. Si el motor tose raro, lo detectamos.
- **PWA Ready**: Instala el dashboard como una app nativa en iOS, Android o Windows para una experiencia fluida.
- **Copiloto AI**: Un pequeño chat integrado para hacer consultas rapidas del estatus de los equipos.

## Como levantar todo esto localmente?

Si tienes Docker instalado en tu maquina, es super sencillo. Solo clona este repo, abre tu terminal y lanza:

```bash
docker compose up --build -d
```

Ve por un cafe mientras Docker baja las imagenes e instala las dependencias de Python y Node. Cuando termine, tienes todo mapeado asi:
- **Frontend Dashboard**: `http://localhost:5173`
- **MLflow Tracking**: `http://localhost:5001`
- **Backend API**: `http://localhost:3001`

## Sobre el Dataset Original

Usamos los datos publicos de la NASA (**C-MAPSS Turbofan Engine Degradation Simulation**). Basicamente es el estandar de oro de la industria para probar algoritmos de mantenimiento predictivo. Trae ciclos completos de vida de motores jet corriendo hasta que se rompen bajo un monton de condiciones operativas distintas.

## Licencia

Sientete libre de usar, romper, forbear y mejorar este codigo bajo los terminos de la licencia MIT.
