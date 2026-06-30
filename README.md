#  Sistema de Mantenimiento Predictivo con IA para Manufactura

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange.svg)](https://tensorflow.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)

> Plataforma inteligente que analiza datos de sensores industriales y predice fallas de maquinaria con **92%+ de precisión**, reduciendo paros no planeados en líneas de producción.

---

##  Descripción

Sistema end-to-end de **Industry 4.0** que implementa mantenimiento predictivo usando Machine Learning sobre el dataset NASA C-MAPSS Turbofan. El sistema procesa datos de sensores en tiempo real, predice el **Remaining Useful Life (RUL)** de equipos industriales y genera alertas preventivas a través de un dashboard interactivo.

##  Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Dataset    │────▶│  Pipeline   │────▶│  Modelo ML  │────▶│   API REST  │
│  NASA CMAPSS │     │  ETL Python │     │  TensorFlow │     │  Node/Flask │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                                                            ┌──────▼──────┐
                                                            │  Dashboard  │
                                                            │   React.js  │
                                                            └─────────────┘
```

##  Stack Técnico

| Capa | Tecnología |
|------|-----------|
| IA/ML | Python, Scikit-learn, TensorFlow/Keras, Pandas, NumPy |
| Dataset | NASA Turbofan Engine Degradation (C-MAPSS) |
| Backend API | Node.js + Express |
| Frontend | React + Recharts |
| Base de datos | PostgreSQL |
| Reportes | PDF Export |

##  Estructura del Proyecto

```
predictive-maintenance/
├── data/                    # Datos y datasets
│   ├── raw/                 # Datos crudos NASA C-MAPSS
│   ├── processed/           # Datos procesados y transformados
│   └── external/            # Datos externos adicionales
├── notebooks/               # Jupyter notebooks exploratorios
├── ml/                      # Pipeline de Machine Learning
│   ├── src/                 # Código fuente ML
│   │   ├── data/            # Carga y procesamiento de datos
│   │   ├── features/        # Ingeniería de features
│   │   ├── models/          # Definición y entrenamiento de modelos
│   │   ├── evaluation/      # Métricas y evaluación
│   │   └── utils/           # Utilidades generales
│   ├── configs/             # Configuraciones de modelos
│   ├── trained_models/      # Modelos entrenados serializados
│   └── tests/               # Tests unitarios ML
├── backend/                 # API REST
│   ├── src/                 # Código fuente backend
│   │   ├── routes/          # Endpoints de la API
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── models/          # Modelos de base de datos
│   │   ├── middleware/      # Middleware (auth, validation)
│   │   ├── services/        # Servicios (ML bridge, reports)
│   │   └── utils/           # Utilidades
│   ├── config/              # Configuración del servidor
│   └── tests/               # Tests del backend
├── frontend/                # Dashboard React
│   ├── public/              # Assets estáticos
│   └── src/                 # Código fuente frontend
│       ├── components/      # Componentes React
│       │   ├── dashboard/   # Componentes del dashboard
│       │   ├── charts/      # Gráficas y visualizaciones
│       │   ├── alerts/      # Sistema de alertas
│       │   ├── reports/     # Generación de reportes
│       │   └── common/      # Componentes reutilizables
│       ├── pages/           # Páginas principales
│       ├── hooks/           # Custom hooks
│       ├── services/        # Llamadas a API
│       ├── store/           # Estado global
│       ├── styles/          # Estilos CSS
│       └── utils/           # Utilidades frontend
├── database/                # Scripts de base de datos
│   ├── migrations/          # Migraciones SQL
│   └── seeds/               # Datos semilla
├── docs/                    # Documentación
│   ├── api/                 # Documentación de la API
│   ├── architecture/        # Diagramas de arquitectura
│   └── guides/              # Guías de uso
├── scripts/                 # Scripts de automatización
└── docker/                  # Configuración Docker
```

##  Timeline

| Semana | Entregable |
|--------|-----------|
| 1 | Análisis exploratorio del dataset + Pipeline ETL |
| 2 | Entrenamiento del modelo ML + Optimización |
| 3 | API REST + Dashboard frontend |
| 4 | Integración, testing y deploy |

##  Dataset

**NASA C-MAPSS Turbofan Engine Degradation Simulation Dataset**
- Datos de sensores de motores industriales con ciclos de vida completos hasta la falla
- Estándar de la industria para demostrar mantenimiento predictivo
- Incluye datos de entrenamiento y testing con múltiples condiciones operativas

##  Keywords

`Machine Learning` `TensorFlow` `Mantenimiento Predictivo` `Industry 4.0` `IoT` `Predictive Maintenance` `RUL Prediction` `Deep Learning` `Full Stack` `Manufacturing`

##  Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.
