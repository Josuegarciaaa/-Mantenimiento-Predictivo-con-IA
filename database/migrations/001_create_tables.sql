-- ============================================================
-- 001_create_tables.sql
-- ============================================================
-- Migración inicial: Creación de tablas para el sistema de
-- mantenimiento predictivo.
-- ============================================================

-- Tabla de motores/equipos
CREATE TABLE IF NOT EXISTS engines (
    id SERIAL PRIMARY KEY,
    engine_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'turbofan',
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'maintenance')),
    last_prediction_rul FLOAT,
    last_prediction_date TIMESTAMP,
    installation_date DATE,
    total_cycles INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de lecturas de sensores
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    engine_id INTEGER REFERENCES engines(id) ON DELETE CASCADE,
    cycle INTEGER NOT NULL,
    op_setting_1 FLOAT,
    op_setting_2 FLOAT,
    op_setting_3 FLOAT,
    sensor_1 FLOAT, sensor_2 FLOAT, sensor_3 FLOAT,
    sensor_4 FLOAT, sensor_5 FLOAT, sensor_6 FLOAT,
    sensor_7 FLOAT, sensor_8 FLOAT, sensor_9 FLOAT,
    sensor_10 FLOAT, sensor_11 FLOAT, sensor_12 FLOAT,
    sensor_13 FLOAT, sensor_14 FLOAT, sensor_15 FLOAT,
    sensor_16 FLOAT, sensor_17 FLOAT, sensor_18 FLOAT,
    sensor_19 FLOAT, sensor_20 FLOAT, sensor_21 FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de predicciones
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    engine_id INTEGER REFERENCES engines(id) ON DELETE CASCADE,
    predicted_rul FLOAT NOT NULL,
    confidence FLOAT,
    model_version VARCHAR(50),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alertas
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    engine_id INTEGER REFERENCES engines(id) ON DELETE CASCADE,
    type VARCHAR(30) DEFAULT 'warning' CHECK (type IN ('warning', 'critical', 'maintenance_due', 'info')),
    message TEXT NOT NULL,
    predicted_rul FLOAT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_sensor_readings_engine ON sensor_readings(engine_id);
CREATE INDEX idx_sensor_readings_cycle ON sensor_readings(cycle);
CREATE INDEX idx_predictions_engine ON predictions(engine_id);
CREATE INDEX idx_predictions_date ON predictions(prediction_date);
CREATE INDEX idx_alerts_engine ON alerts(engine_id);
CREATE INDEX idx_alerts_active ON alerts(is_acknowledged) WHERE is_acknowledged = FALSE;
