const store = require('./dataStore');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:5000';

let currentModelType = 'auto'; // 'auto', 'rf', 'lstm'

function setModelType(type) {
    if (['auto', 'rf', 'lstm'].includes(type)) {
        currentModelType = type;
        console.log(`Modelo ML activo configurado a: ${type}`);
    }
}

function getModelType() {
    return currentModelType;
}

/**
 * Llama al servicio Python para predecir RUL.
 * Retorna los campos mejorados: intervalos de confianza, tendencia y versión de modelo.
 */
async function predictRUL(sensorReading, totalCycles) {
    try {
        // Obtener historial de lecturas para construir features (ventana de 40 lecturas)
        const history = await store.getSensorReadings(sensorReading.engine_id, 40);

        // Si no hay historial, usamos solo la lectura actual
        const historyData = history.length > 0 ? history : [sensorReading];

        // Seleccionar modelo: auto usa LSTM si hay >= 30 ciclos de historial
        let modelType = currentModelType;
        if (modelType === 'auto') {
            modelType = historyData.length >= 30 ? 'lstm' : 'rf';
        } else if (modelType === 'lstm' && historyData.length < 30) {
            modelType = 'rf'; // Caida forzada si no hay suficiente historial
        }

        const response = await fetch(`${PYTHON_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: historyData,
                model_type: modelType,
                include_anomaly_check: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return {
            predicted_rul: data.predicted_rul,
            confidence: data.confidence,
            risk_level: data.risk_level,
            model_version: data.model_version,
            // Nuevos campos de la API mejorada
            lower_95: data.lower_95 ?? null,
            upper_95: data.upper_95 ?? null,
            rul_trend: data.rul_trend ?? null,
            prediction_std: data.prediction_std ?? null,
            anomaly_check: data.anomaly_check ?? null,
            shap_values: data.shap_values ?? null,
            shadow_rul: data.shadow_rul ?? null,
        };
    } catch (err) {
        console.warn('Fallo llamada a servicio Python ML, usando simulacion local. Error:', err.message);

        // Fallback a simulacion local si el servicio Python esta apagado
        return fallbackSimulation(sensorReading, totalCycles);
    }
}

/**
 * Simulacion local de fallback cuando el servicio ML no está disponible.
 * Usa heurísticas basadas en sensores críticos.
 */
function fallbackSimulation(sensorReading, totalCycles) {
    const s3  = sensorReading.sensor_3  || 610;    // Temp HPC outlet (sube con desgaste)
    const s9  = sensorReading.sensor_9  || 9046;   // Velocidad core (baja con desgaste)
    const s11 = sensorReading.sensor_11 || 47.5;   // Presion estática HPC (baja con desgaste)

    const tempScore     = Math.max(0, (650 - s3) / 50);
    const coreScore     = Math.max(0, (9100 - s9) / 80);
    const pressureScore = Math.max(0, (49 - s11) / 4);

    const rawRUL = (tempScore * 40 + coreScore * 35 + pressureScore * 25);
    const cycleAdjust = Math.max(0.2, 1 - totalCycles / 400);
    let predictedRUL = Math.round(rawRUL * cycleAdjust);
    predictedRUL = Math.max(0, Math.min(125, predictedRUL));

    return {
        predicted_rul: predictedRUL,
        confidence: 0.65,
        risk_level: classifyRiskLevel(predictedRUL),
        model_version: 'fallback_heuristic_v1.0',
        lower_95: Math.max(0, predictedRUL - 20),
        upper_95: Math.min(125, predictedRUL + 20),
        rul_trend: null,
        prediction_std: null,
        anomaly_check: null,
    };
}

/**
 * Consulta el endpoint /anomaly del servicio Python para una lectura específica.
 */
async function checkAnomaly(sensorReading) {
    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/anomaly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readings: [sensorReading] })
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.results?.[0] ?? null;
    } catch (err) {
        console.warn('Error al verificar anomalias:', err.message);
        return null;
    }
}

/**
 * Consulta el endpoint /model_info del servicio Python.
 */
async function getModelInfo() {
    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/model_info`);
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.warn('Error al obtener model_info:', err.message);
        return null;
    }
}

function classifyRiskLevel(rul) {
    if (rul <= 15) return 'critical';
    if (rul <= 30) return 'high';
    if (rul <= 60) return 'medium';
    return 'low';
}

/**
 * Llama al endpoint /simulate de Python para el Digital Twin
 */
async function simulateDigitalTwin(sensorOverrides) {
    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reading: sensorOverrides })
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Error en simulador Digital Twin:', err);
        return null;
    }
}

module.exports = {
    predictRUL,
    checkAnomaly,
    getModelInfo,
    classifyRiskLevel,
    setModelType,
    getModelType,
    simulateDigitalTwin
};
