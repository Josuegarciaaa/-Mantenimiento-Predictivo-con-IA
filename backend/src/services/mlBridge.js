const store = require('./dataStore');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

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

async function predictRUL(sensorReading, totalCycles) {
    try {
        // Obtener historial de lecturas para construir features
        const history = await store.getSensorReadings(sensorReading.engine_id, 40);

        // Si por alguna razon no hay historial, usamos la lectura actual
        const historyData = history.length > 0 ? history : [sensorReading];

        // Decidir si usar RF o LSTM
        let modelType = currentModelType;
        if (modelType === 'auto') {
            modelType = historyData.length >= 30 ? 'lstm' : 'rf';
        } else if (modelType === 'lstm' && historyData.length < 30) {
            // Caida forzada a RF si no hay suficiente historial para la ventana LSTM
            modelType = 'rf';
        }

        const response = await fetch(`${PYTHON_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: historyData,
                model_type: modelType
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
            model_version: data.model_version
        };
    } catch (err) {
        console.warn('Fallo llamada a servicio Python ML, usando simulacion local. Error:', err.message);
        
        // Caida segura (Fall-back) a simulacion local si el servicio de Python esta apagado
        const s3 = sensorReading.sensor_3 || 1580;
        const s9 = sensorReading.sensor_9 || 9040;
        const s11 = sensorReading.sensor_11 || 47;

        const tempScore = Math.max(0, (1620 - s3) / 50);
        const coreScore = Math.max(0, (9100 - s9) / 80);
        const pressureScore = Math.max(0, (49 - s11) / 4);

        const rawRUL = (tempScore * 40 + coreScore * 35 + pressureScore * 25);
        const cycleAdjust = Math.max(0, 1 - totalCycles / 400);
        let predictedRUL = Math.round(rawRUL * cycleAdjust);
        predictedRUL = Math.max(0, Math.min(125, predictedRUL));

        let riskLevel;
        if (predictedRUL <= 15) riskLevel = 'critical';
        else if (predictedRUL <= 30) riskLevel = 'high';
        else if (predictedRUL <= 50) riskLevel = 'medium';
        else riskLevel = 'low';

        return {
            predicted_rul: predictedRUL,
            confidence: 0.85,
            risk_level: riskLevel,
            model_version: 'rf_v1.0_fallback_sim'
        };
    }
}

function classifyRiskLevel(rul) {
    if (rul <= 15) return 'critical';
    if (rul <= 30) return 'high';
    if (rul <= 50) return 'medium';
    return 'low';
}

module.exports = { predictRUL, classifyRiskLevel, setModelType, getModelType };
