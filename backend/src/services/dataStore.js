const engines = [
    {
        id: 1,
        engine_id: 'ENG-001',
        name: 'Turbofan Motor A1',
        type: 'turbofan',
        location: 'Linea 1 - Planta Saltillo',
        status: 'healthy',
        last_prediction_rul: 112,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2024-03-15',
        total_cycles: 150,
        created_at: '2024-03-15T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    },
    {
        id: 2,
        engine_id: 'ENG-002',
        name: 'Turbofan Motor A2',
        type: 'turbofan',
        location: 'Linea 1 - Planta Saltillo',
        status: 'warning',
        last_prediction_rul: 38,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2023-11-20',
        total_cycles: 280,
        created_at: '2023-11-20T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    },
    {
        id: 3,
        engine_id: 'ENG-003',
        name: 'Turbofan Motor B1',
        type: 'turbofan',
        location: 'Linea 2 - Planta Saltillo',
        status: 'healthy',
        last_prediction_rul: 125,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2025-01-10',
        total_cycles: 95,
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    },
    {
        id: 4,
        engine_id: 'ENG-004',
        name: 'Turbofan Motor B2',
        type: 'turbofan',
        location: 'Linea 2 - Planta Saltillo',
        status: 'critical',
        last_prediction_rul: 11,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2023-06-05',
        total_cycles: 340,
        created_at: '2023-06-05T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    },
    {
        id: 5,
        engine_id: 'ENG-005',
        name: 'Turbofan Motor C1',
        type: 'turbofan',
        location: 'Linea 3 - Planta Ramos',
        status: 'maintenance',
        last_prediction_rul: 0,
        last_prediction_date: '2026-06-28T10:00:00.000Z',
        installation_date: '2024-01-22',
        total_cycles: 200,
        created_at: '2024-01-22T08:00:00.000Z',
        updated_at: '2026-06-28T10:00:00.000Z'
    },
    {
        id: 6,
        engine_id: 'ENG-006',
        name: 'Turbofan Motor C2',
        type: 'turbofan',
        location: 'Linea 3 - Planta Ramos',
        status: 'healthy',
        last_prediction_rul: 125,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2025-09-01',
        total_cycles: 50,
        created_at: '2025-09-01T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    },
    {
        id: 7,
        engine_id: 'ENG-007',
        name: 'Turbofan Motor D1',
        type: 'turbofan',
        location: 'Linea 4 - Planta Ramos',
        status: 'warning',
        last_prediction_rul: 29,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2023-08-14',
        total_cycles: 310,
        created_at: '2023-08-14T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    },
    {
        id: 8,
        engine_id: 'ENG-008',
        name: 'Turbofan Motor D2',
        type: 'turbofan',
        location: 'Linea 4 - Planta Ramos',
        status: 'healthy',
        last_prediction_rul: 98,
        last_prediction_date: '2026-06-30T14:00:00.000Z',
        installation_date: '2025-04-30',
        total_cycles: 120,
        created_at: '2025-04-30T08:00:00.000Z',
        updated_at: '2026-06-30T14:00:00.000Z'
    }
];

function generateSensorReadings(engineId, totalCycles) {
    const readings = [];
    const baseValues = {
        op_setting_1: -0.0007 + Math.random() * 0.005,
        op_setting_2: -0.0004 + Math.random() * 0.003,
        op_setting_3: 100.0,
        sensor_1: 518.67,
        sensor_2: 641.82,
        sensor_3: 1589.70,
        sensor_4: 1400.60,
        sensor_5: 14.62,
        sensor_6: 21.61,
        sensor_7: 554.36,
        sensor_8: 2388.06,
        sensor_9: 9046.19,
        sensor_10: 1.30,
        sensor_11: 47.47,
        sensor_12: 521.66,
        sensor_13: 2388.02,
        sensor_14: 8138.62,
        sensor_15: 8.4195,
        sensor_16: 0.03,
        sensor_17: 392,
        sensor_18: 2388,
        sensor_19: 100.0,
        sensor_20: 39.06,
        sensor_21: 23.4190
    };

    const startCycle = Math.max(1, totalCycles - 49);
    for (let cycle = startCycle; cycle <= totalCycles; cycle++) {
        const degradation = (cycle - startCycle) / (totalCycles - startCycle + 1);
        const reading = {
            id: readings.length + 1 + (engineId - 1) * 50,
            engine_id: engineId,
            cycle: cycle,
            op_setting_1: baseValues.op_setting_1 + (Math.random() - 0.5) * 0.002,
            op_setting_2: baseValues.op_setting_2 + (Math.random() - 0.5) * 0.001,
            op_setting_3: baseValues.op_setting_3,
            sensor_1: baseValues.sensor_1 + (Math.random() - 0.5) * 0.8,
            sensor_2: baseValues.sensor_2 + degradation * 4.5 + (Math.random() - 0.5) * 1.2,
            sensor_3: baseValues.sensor_3 + degradation * 15.0 + (Math.random() - 0.5) * 5.0,
            sensor_4: baseValues.sensor_4 + degradation * 12.0 + (Math.random() - 0.5) * 8.0,
            sensor_5: baseValues.sensor_5 + (Math.random() - 0.5) * 0.1,
            sensor_6: baseValues.sensor_6 + degradation * 0.3 + (Math.random() - 0.5) * 0.15,
            sensor_7: baseValues.sensor_7 + degradation * 8.0 + (Math.random() - 0.5) * 3.0,
            sensor_8: baseValues.sensor_8 + degradation * 18.0 + (Math.random() - 0.5) * 6.0,
            sensor_9: baseValues.sensor_9 + degradation * 25.0 + (Math.random() - 0.5) * 10.0,
            sensor_10: baseValues.sensor_10 + (Math.random() - 0.5) * 0.02,
            sensor_11: baseValues.sensor_11 + degradation * 1.5 + (Math.random() - 0.5) * 0.5,
            sensor_12: baseValues.sensor_12 + degradation * 3.0 + (Math.random() - 0.5) * 1.5,
            sensor_13: baseValues.sensor_13 + degradation * 15.0 + (Math.random() - 0.5) * 5.0,
            sensor_14: baseValues.sensor_14 + degradation * 20.0 + (Math.random() - 0.5) * 8.0,
            sensor_15: baseValues.sensor_15 + degradation * 0.08 + (Math.random() - 0.5) * 0.02,
            sensor_16: baseValues.sensor_16 + (Math.random() - 0.5) * 0.001,
            sensor_17: baseValues.sensor_17 + degradation * 3.0 + (Math.random() - 0.5) * 1.0,
            sensor_18: baseValues.sensor_18 + degradation * 12.0 + (Math.random() - 0.5) * 4.0,
            sensor_19: baseValues.sensor_19 + (Math.random() - 0.5) * 0.3,
            sensor_20: baseValues.sensor_20 + degradation * 1.2 + (Math.random() - 0.5) * 0.4,
            sensor_21: baseValues.sensor_21 + degradation * 0.06 + (Math.random() - 0.5) * 0.015,
            timestamp: new Date(Date.now() - (totalCycles - cycle) * 3600000).toISOString()
        };
        readings.push(reading);
    }
    return readings;
}

const sensorReadings = {};
engines.forEach(engine => {
    sensorReadings[engine.id] = generateSensorReadings(engine.id, engine.total_cycles);
});

const predictions = [
    { id: 1, engine_id: 1, predicted_rul: 112, confidence: 0.91, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' },
    { id: 2, engine_id: 2, predicted_rul: 38, confidence: 0.87, model_version: 'rf_v1.0', risk_level: 'medium', prediction_date: '2026-06-30T14:00:00.000Z' },
    { id: 3, engine_id: 3, predicted_rul: 125, confidence: 0.93, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' },
    { id: 4, engine_id: 4, predicted_rul: 11, confidence: 0.89, model_version: 'rf_v1.0', risk_level: 'critical', prediction_date: '2026-06-30T14:00:00.000Z' },
    { id: 5, engine_id: 5, predicted_rul: 0, confidence: 0.95, model_version: 'rf_v1.0', risk_level: 'critical', prediction_date: '2026-06-28T10:00:00.000Z' },
    { id: 6, engine_id: 6, predicted_rul: 125, confidence: 0.92, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' },
    { id: 7, engine_id: 7, predicted_rul: 29, confidence: 0.86, model_version: 'rf_v1.0', risk_level: 'high', prediction_date: '2026-06-30T14:00:00.000Z' },
    { id: 8, engine_id: 8, predicted_rul: 98, confidence: 0.90, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' }
];

let alertIdCounter = 8;
const alerts = [
    { id: 1, engine_id: 4, type: 'critical', message: 'RUL estimado en 11 ciclos. Programar mantenimiento de inmediato.', predicted_rul: 11, is_acknowledged: false, acknowledged_by: null, acknowledged_at: null, created_at: '2026-06-30T14:00:00.000Z' },
    { id: 2, engine_id: 7, type: 'warning', message: 'RUL estimado en 29 ciclos. Revisar programacion de mantenimiento.', predicted_rul: 29, is_acknowledged: false, acknowledged_by: null, acknowledged_at: null, created_at: '2026-06-30T14:00:00.000Z' },
    { id: 3, engine_id: 2, type: 'warning', message: 'RUL estimado en 38 ciclos. Monitorear de cerca.', predicted_rul: 38, is_acknowledged: false, acknowledged_by: null, acknowledged_at: null, created_at: '2026-06-30T14:00:00.000Z' },
    { id: 4, engine_id: 5, type: 'maintenance_due', message: 'Motor en mantenimiento. RUL agotado.', predicted_rul: 0, is_acknowledged: true, acknowledged_by: 'Operador Turno A', acknowledged_at: '2026-06-28T11:30:00.000Z', created_at: '2026-06-28T10:00:00.000Z' },
    { id: 5, engine_id: 4, type: 'critical', message: 'Temperatura HPC (sensor_3) por encima del umbral operativo.', predicted_rul: 11, is_acknowledged: false, acknowledged_by: null, acknowledged_at: null, created_at: '2026-06-30T12:00:00.000Z' },
    { id: 6, engine_id: 7, type: 'warning', message: 'Incremento sostenido en vibracion del core (sensor_9).', predicted_rul: 29, is_acknowledged: false, acknowledged_by: null, acknowledged_at: null, created_at: '2026-06-29T16:00:00.000Z' },
    { id: 7, engine_id: 2, type: 'info', message: 'Prediccion actualizada. RUL bajo de 45 a 38 ciclos en las ultimas 24h.', predicted_rul: 38, is_acknowledged: true, acknowledged_by: 'Supervisor Martinez', acknowledged_at: '2026-06-30T09:00:00.000Z', created_at: '2026-06-30T08:00:00.000Z' },
    { id: 8, engine_id: 1, type: 'info', message: 'Motor operando dentro de parametros normales.', predicted_rul: 112, is_acknowledged: true, acknowledged_by: 'Sistema', acknowledged_at: '2026-06-30T14:01:00.000Z', created_at: '2026-06-30T14:00:00.000Z' }
];

function getEngines() {
    return engines;
}

function getEngineById(id) {
    return engines.find(e => e.id === parseInt(id));
}

function getEngineByEngineId(engineId) {
    return engines.find(e => e.engine_id === engineId);
}

function createEngine(data) {
    const newEngine = {
        id: engines.length + 1,
        engine_id: data.engine_id,
        name: data.name,
        type: data.type || 'turbofan',
        location: data.location || '',
        status: 'healthy',
        last_prediction_rul: null,
        last_prediction_date: null,
        installation_date: data.installation_date || new Date().toISOString().split('T')[0],
        total_cycles: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    engines.push(newEngine);
    sensorReadings[newEngine.id] = [];
    return newEngine;
}

function updateEngine(id, data) {
    const engine = getEngineById(id);
    if (!engine) return null;
    Object.assign(engine, data, { updated_at: new Date().toISOString() });
    return engine;
}

function getSensorReadings(engineId, limit) {
    const readings = sensorReadings[parseInt(engineId)] || [];
    if (limit) return readings.slice(-limit);
    return readings;
}

function getLatestSensorReading(engineId) {
    const readings = sensorReadings[parseInt(engineId)] || [];
    return readings[readings.length - 1] || null;
}

function addSensorReading(data) {
    const engineId = parseInt(data.engine_id);
    if (!sensorReadings[engineId]) sensorReadings[engineId] = [];
    const reading = {
        id: Date.now(),
        engine_id: engineId,
        ...data,
        timestamp: new Date().toISOString()
    };
    sensorReadings[engineId].push(reading);

    const engine = getEngineById(engineId);
    if (engine) {
        engine.total_cycles = data.cycle || engine.total_cycles + 1;
        engine.updated_at = new Date().toISOString();
    }
    return reading;
}

function getPredictions() {
    return predictions.map(p => {
        const engine = getEngineById(p.engine_id);
        return { ...p, engine_name: engine ? engine.name : null, engine_status: engine ? engine.status : null };
    });
}

function getPredictionsByEngine(engineId) {
    return predictions.filter(p => p.engine_id === parseInt(engineId));
}

function addPrediction(data) {
    const prediction = {
        id: predictions.length + 1,
        engine_id: parseInt(data.engine_id),
        predicted_rul: data.predicted_rul,
        confidence: data.confidence,
        model_version: data.model_version || 'rf_v1.0',
        risk_level: data.risk_level,
        prediction_date: new Date().toISOString()
    };
    predictions.push(prediction);

    const engine = getEngineById(data.engine_id);
    if (engine) {
        engine.last_prediction_rul = data.predicted_rul;
        engine.last_prediction_date = prediction.prediction_date;
        if (data.predicted_rul <= 15) engine.status = 'critical';
        else if (data.predicted_rul <= 40) engine.status = 'warning';
        else engine.status = 'healthy';
        engine.updated_at = prediction.prediction_date;
    }
    return prediction;
}

function getAlerts(filters = {}) {
    let result = [...alerts];
    if (filters.active !== undefined) {
        result = result.filter(a => a.is_acknowledged === !filters.active);
    }
    if (filters.type) {
        result = result.filter(a => a.type === filters.type);
    }
    if (filters.engine_id) {
        result = result.filter(a => a.engine_id === parseInt(filters.engine_id));
    }
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getAlertById(id) {
    return alerts.find(a => a.id === parseInt(id));
}

function acknowledgeAlert(id, user) {
    const alert = getAlertById(id);
    if (!alert) return null;
    alert.is_acknowledged = true;
    alert.acknowledged_by = user || 'Sistema';
    alert.acknowledged_at = new Date().toISOString();
    return alert;
}

function createAlert(data) {
    alertIdCounter++;
    const alert = {
        id: alertIdCounter,
        engine_id: parseInt(data.engine_id),
        type: data.type || 'warning',
        message: data.message,
        predicted_rul: data.predicted_rul,
        is_acknowledged: false,
        acknowledged_by: null,
        acknowledged_at: null,
        created_at: new Date().toISOString()
    };
    alerts.push(alert);
    return alert;
}

function getAlertStats() {
    const total = alerts.length;
    const active = alerts.filter(a => !a.is_acknowledged).length;
    const critical = alerts.filter(a => a.type === 'critical' && !a.is_acknowledged).length;
    const warning = alerts.filter(a => a.type === 'warning' && !a.is_acknowledged).length;

    const byEngine = {};
    alerts.filter(a => !a.is_acknowledged).forEach(a => {
        const engine = getEngineById(a.engine_id);
        const key = engine ? engine.engine_id : `unknown_${a.engine_id}`;
        byEngine[key] = (byEngine[key] || 0) + 1;
    });

    return { total, active, acknowledged: total - active, critical, warning, by_engine: byEngine };
}

function getDashboardSummary() {
    const totalEngines = engines.length;
    const healthy = engines.filter(e => e.status === 'healthy').length;
    const warning = engines.filter(e => e.status === 'warning').length;
    const critical = engines.filter(e => e.status === 'critical').length;
    const maintenance = engines.filter(e => e.status === 'maintenance').length;
    const activeAlerts = alerts.filter(a => !a.is_acknowledged).length;

    const avgRul = engines
        .filter(e => e.last_prediction_rul !== null && e.status !== 'maintenance')
        .reduce((sum, e, _, arr) => sum + e.last_prediction_rul / arr.length, 0);

    return {
        engines: { total: totalEngines, healthy, warning, critical, maintenance },
        alerts: { active: activeAlerts },
        average_rul: Math.round(avgRul),
        last_update: new Date().toISOString()
    };
}

module.exports = {
    getEngines,
    getEngineById,
    getEngineByEngineId,
    createEngine,
    updateEngine,
    getSensorReadings,
    getLatestSensorReading,
    addSensorReading,
    getPredictions,
    getPredictionsByEngine,
    addPrediction,
    getAlerts,
    getAlertById,
    acknowledgeAlert,
    createAlert,
    getAlertStats,
    getDashboardSummary
};
