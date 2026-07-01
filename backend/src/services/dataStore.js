const bcrypt = require('bcryptjs');
const { sequelize, User, Engine, SensorReading, Prediction, Alert } = require('../models');
const { Op } = require('sequelize');

// Datos iniciales
const initialEngines = [
    { id: 1, engine_id: 'ENG-001', name: 'Turbofan Motor A1', type: 'turbofan', location: 'Linea 1 - Planta Saltillo', status: 'healthy', last_prediction_rul: 112, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2024-03-15', total_cycles: 150 },
    { id: 2, engine_id: 'ENG-002', name: 'Turbofan Motor A2', type: 'turbofan', location: 'Linea 1 - Planta Saltillo', status: 'warning', last_prediction_rul: 38, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2023-11-20', total_cycles: 280 },
    { id: 3, engine_id: 'ENG-003', name: 'Turbofan Motor B1', type: 'turbofan', location: 'Linea 2 - Planta Saltillo', status: 'healthy', last_prediction_rul: 125, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2025-01-10', total_cycles: 95 },
    { id: 4, engine_id: 'ENG-004', name: 'Turbofan Motor B2', type: 'turbofan', location: 'Linea 2 - Planta Saltillo', status: 'critical', last_prediction_rul: 11, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2023-06-05', total_cycles: 340 },
    { id: 5, engine_id: 'ENG-005', name: 'Turbofan Motor C1', type: 'turbofan', location: 'Linea 3 - Planta Ramos', status: 'maintenance', last_prediction_rul: 0, last_prediction_date: '2026-06-28T10:00:00.000Z', installation_date: '2024-01-22', total_cycles: 200 },
    { id: 6, engine_id: 'ENG-006', name: 'Turbofan Motor C2', type: 'turbofan', location: 'Linea 3 - Planta Ramos', status: 'healthy', last_prediction_rul: 125, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2025-09-01', total_cycles: 50 },
    { id: 7, engine_id: 'ENG-007', name: 'Turbofan Motor D1', type: 'turbofan', location: 'Linea 4 - Planta Ramos', status: 'warning', last_prediction_rul: 29, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2023-08-14', total_cycles: 310 },
    { id: 8, engine_id: 'ENG-008', name: 'Turbofan Motor D2', type: 'turbofan', location: 'Linea 4 - Planta Ramos', status: 'healthy', last_prediction_rul: 98, last_prediction_date: '2026-06-30T14:00:00.000Z', installation_date: '2025-04-30', total_cycles: 120 }
];

const initialPredictions = [
    { engine_id: 1, predicted_rul: 112, confidence: 0.91, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' },
    { engine_id: 2, predicted_rul: 38, confidence: 0.87, model_version: 'rf_v1.0', risk_level: 'medium', prediction_date: '2026-06-30T14:00:00.000Z' },
    { engine_id: 3, predicted_rul: 125, confidence: 0.93, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' },
    { engine_id: 4, predicted_rul: 11, confidence: 0.89, model_version: 'rf_v1.0', risk_level: 'critical', prediction_date: '2026-06-30T14:00:00.000Z' },
    { engine_id: 5, predicted_rul: 0, confidence: 0.95, model_version: 'rf_v1.0', risk_level: 'critical', prediction_date: '2026-06-28T10:00:00.000Z' },
    { engine_id: 6, predicted_rul: 125, confidence: 0.92, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' },
    { engine_id: 7, predicted_rul: 29, confidence: 0.86, model_version: 'rf_v1.0', risk_level: 'high', prediction_date: '2026-06-30T14:00:00.000Z' },
    { engine_id: 8, predicted_rul: 98, confidence: 0.90, model_version: 'rf_v1.0', risk_level: 'low', prediction_date: '2026-06-30T14:00:00.000Z' }
];

const initialAlerts = [
    { engine_id: 4, type: 'critical', message: 'RUL estimado en 11 ciclos. Programar mantenimiento de inmediato.', predicted_rul: 11, is_acknowledged: false, created_at: '2026-06-30T14:00:00.000Z' },
    { engine_id: 7, type: 'warning', message: 'RUL estimado en 29 ciclos. Revisar programacion de mantenimiento.', predicted_rul: 29, is_acknowledged: false, created_at: '2026-06-30T14:00:00.000Z' },
    { engine_id: 2, type: 'warning', message: 'RUL estimado en 38 ciclos. Monitorear de cerca.', predicted_rul: 38, is_acknowledged: false, created_at: '2026-06-30T14:00:00.000Z' },
    { engine_id: 5, type: 'maintenance_due', message: 'Motor en mantenimiento. RUL agotado.', predicted_rul: 0, is_acknowledged: true, acknowledged_by: 'Operador Turno A', acknowledged_at: '2026-06-28T11:30:00.000Z', created_at: '2026-06-28T10:00:00.000Z' },
    { engine_id: 4, type: 'critical', message: 'Temperatura HPC (sensor_3) por encima del umbral operativo.', predicted_rul: 11, is_acknowledged: false, created_at: '2026-06-30T12:00:00.000Z' },
    { engine_id: 7, type: 'warning', message: 'Incremento sostenido en vibracion del core (sensor_9).', predicted_rul: 29, is_acknowledged: false, created_at: '2026-06-29T16:00:00.000Z' },
    { engine_id: 2, type: 'info', message: 'Prediccion actualizada. RUL bajo de 45 a 38 ciclos en las ultimas 24h.', predicted_rul: 38, is_acknowledged: true, acknowledged_by: 'Supervisor Martinez', acknowledged_at: '2026-06-30T09:00:00.000Z', created_at: '2026-06-30T08:00:00.000Z' },
    { engine_id: 1, type: 'info', message: 'Motor operando dentro de parametros normales.', predicted_rul: 112, is_acknowledged: true, acknowledged_by: 'Sistema', acknowledged_at: '2026-06-30T14:01:00.000Z', created_at: '2026-06-30T14:00:00.000Z' }
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
        readings.push({
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
        });
    }
    return readings;
}

async function initializeDatabase() {
    await sequelize.sync();
    
    // Seed Users
    const userCount = await User.count();
    if (userCount === 0) {
        const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
        const hashedPasswordOperator = await bcrypt.hash('operator123', 10);
        await User.bulkCreate([
            { username: 'admin', password: hashedPasswordAdmin, role: 'admin' },
            { username: 'operator', password: hashedPasswordOperator, role: 'operator' }
        ]);
    }

    // Seed Engines
    const engineCount = await Engine.count();
    if (engineCount === 0) {
        await Engine.bulkCreate(initialEngines);

        // Seed SensorReadings
        const readingsToInsert = [];
        for (const engine of initialEngines) {
            const readings = generateSensorReadings(engine.id, engine.total_cycles);
            readingsToInsert.push(...readings);
        }
        await SensorReading.bulkCreate(readingsToInsert);

        // Seed Predictions
        await Prediction.bulkCreate(initialPredictions);

        // Seed Alerts
        await Alert.bulkCreate(initialAlerts);
    }
}

async function getEngines() {
    const data = await Engine.findAll({ order: [['id', 'ASC']] });
    return data.map(e => e.toJSON());
}

async function getEngineById(id) {
    const engine = await Engine.findByPk(id, {
        include: [
            { model: Prediction, as: 'predictions' }
        ]
    });
    return engine ? engine.toJSON() : null;
}

async function getEngineByEngineId(engineId) {
    const engine = await Engine.findOne({ where: { engine_id: engineId } });
    return engine ? engine.toJSON() : null;
}

async function createEngine(data) {
    const newEngine = await Engine.create({
        engine_id: data.engine_id,
        name: data.name,
        type: data.type || 'turbofan',
        location: data.location || '',
        status: 'healthy',
        last_prediction_rul: null,
        last_prediction_date: null,
        installation_date: data.installation_date || new Date().toISOString().split('T')[0],
        total_cycles: 0
    });
    return newEngine.toJSON();
}

async function updateEngine(id, data) {
    const engine = await Engine.findByPk(id);
    if (!engine) return null;
    await engine.update(data);
    return engine.toJSON();
}

async function getSensorReadings(engineId, limit) {
    const query = {
        where: { engine_id: parseInt(engineId) },
        order: [['cycle', 'ASC']]
    };
    if (limit) {
        // En SQLite/Postgres limit se aplica al final, pero si queremos los ultimos, ordenamos desc, limitamos, y luego reordenamos en memoria.
        query.order = [['cycle', 'DESC']];
        query.limit = parseInt(limit);
        const readings = await SensorReading.findAll(query);
        return readings.map(r => r.toJSON()).reverse();
    }
    const readings = await SensorReading.findAll(query);
    return readings.map(r => r.toJSON());
}

async function getLatestSensorReading(engineId) {
    const reading = await SensorReading.findOne({
        where: { engine_id: parseInt(engineId) },
        order: [['cycle', 'DESC']]
    });
    return reading ? reading.toJSON() : null;
}

async function addSensorReading(data) {
    const engineId = parseInt(data.engine_id);
    const reading = await SensorReading.create({
        engine_id: engineId,
        cycle: data.cycle,
        op_setting_1: data.op_setting_1,
        op_setting_2: data.op_setting_2,
        op_setting_3: data.op_setting_3,
        sensor_1: data.sensor_1,
        sensor_2: data.sensor_2,
        sensor_3: data.sensor_3,
        sensor_4: data.sensor_4,
        sensor_5: data.sensor_5,
        sensor_6: data.sensor_6,
        sensor_7: data.sensor_7,
        sensor_8: data.sensor_8,
        sensor_9: data.sensor_9,
        sensor_10: data.sensor_10,
        sensor_11: data.sensor_11,
        sensor_12: data.sensor_12,
        sensor_13: data.sensor_13,
        sensor_14: data.sensor_14,
        sensor_15: data.sensor_15,
        sensor_16: data.sensor_16,
        sensor_17: data.sensor_17,
        sensor_18: data.sensor_18,
        sensor_19: data.sensor_19,
        sensor_20: data.sensor_20,
        sensor_21: data.sensor_21,
        timestamp: new Date().toISOString()
    });

    const engine = await Engine.findByPk(engineId);
    if (engine) {
        await engine.update({
            total_cycles: data.cycle || engine.total_cycles + 1
        });
    }
    return reading.toJSON();
}

async function getPredictions() {
    const preds = await Prediction.findAll({
        order: [['id', 'DESC']]
    });
    const result = [];
    for (const p of preds) {
        const engine = await Engine.findByPk(p.engine_id);
        result.push({
            ...p.toJSON(),
            engine_name: engine ? engine.name : null,
            engine_status: engine ? engine.status : null
        });
    }
    return result;
}

async function getPredictionsByEngine(engineId) {
    const preds = await Prediction.findAll({
        where: { engine_id: parseInt(engineId) },
        order: [['id', 'ASC']]
    });
    return preds.map(p => p.toJSON());
}

async function addPrediction(data) {
    const prediction = await Prediction.create({
        engine_id: parseInt(data.engine_id),
        predicted_rul: data.predicted_rul,
        confidence: data.confidence,
        model_version: data.model_version || 'rf_v1.0',
        risk_level: data.risk_level,
        prediction_date: new Date().toISOString()
    });

    const engine = await Engine.findByPk(data.engine_id);
    if (engine) {
        let status = 'healthy';
        if (data.predicted_rul <= 15) status = 'critical';
        else if (data.predicted_rul <= 40) status = 'warning';
        
        await engine.update({
            last_prediction_rul: data.predicted_rul,
            last_prediction_date: prediction.prediction_date,
            status: status
        });
    }
    return prediction.toJSON();
}

async function getAlerts(filters = {}) {
    const query = {
        where: {},
        order: [['created_at', 'DESC']]
    };
    
    if (filters.active !== undefined) {
        query.where.is_acknowledged = !filters.active;
    }
    if (filters.type) {
        query.where.type = filters.type;
    }
    if (filters.engine_id) {
        query.where.engine_id = parseInt(filters.engine_id);
    }
    
    const data = await Alert.findAll(query);
    return data.map(a => a.toJSON());
}

async function getAlertById(id) {
    const alert = await Alert.findByPk(id);
    return alert ? alert.toJSON() : null;
}

async function acknowledgeAlert(id, user) {
    const alert = await Alert.findByPk(id);
    if (!alert) return null;
    await alert.update({
        is_acknowledged: true,
        acknowledged_by: user || 'Sistema',
        acknowledged_at: new Date().toISOString()
    });
    return alert.toJSON();
}

async function createAlert(data) {
    const alert = await Alert.create({
        engine_id: parseInt(data.engine_id),
        type: data.type || 'warning',
        message: data.message,
        predicted_rul: data.predicted_rul,
        is_acknowledged: false,
        created_at: new Date().toISOString()
    });
    return alert.toJSON();
}

async function getAlertStats() {
    const total = await Alert.count();
    const active = await Alert.count({ where: { is_acknowledged: false } });
    const critical = await Alert.count({ where: { type: 'critical', is_acknowledged: false } });
    const warning = await Alert.count({ where: { type: 'warning', is_acknowledged: false } });

    const activeAlertsList = await Alert.findAll({ where: { is_acknowledged: false } });
    const byEngine = {};
    for (const a of activeAlertsList) {
        const engine = await Engine.findByPk(a.engine_id);
        const key = engine ? engine.engine_id : `unknown_${a.engine_id}`;
        byEngine[key] = (byEngine[key] || 0) + 1;
    }

    return { total, active, acknowledged: total - active, critical, warning, by_engine: byEngine };
}

async function getDashboardSummary() {
    const totalEngines = await Engine.count();
    const healthy = await Engine.count({ where: { status: 'healthy' } });
    const warning = await Engine.count({ where: { status: 'warning' } });
    const critical = await Engine.count({ where: { status: 'critical' } });
    const maintenance = await Engine.count({ where: { status: 'maintenance' } });
    const activeAlerts = await Alert.count({ where: { is_acknowledged: false } });

    const enginesWithRul = await Engine.findAll({
        where: {
            last_prediction_rul: { [Op.ne]: null },
            status: { [Op.ne]: 'maintenance' }
        }
    });
    const avgRul = enginesWithRul.reduce((sum, e) => sum + e.last_prediction_rul, 0) / (enginesWithRul.length || 1);

    return {
        engines: { total: totalEngines, healthy, warning, critical, maintenance },
        alerts: { active: activeAlerts },
        average_rul: Math.round(avgRul),
        last_update: new Date().toISOString()
    };
}

module.exports = {
    initializeDatabase,
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
