const store = require('../services/dataStore');
const mlBridge = require('../services/mlBridge');
const { successResponse, errorResponse } = require('../utils/response');

const getAllPredictions = async (req, res) => {
    try {
        const predictions = store.getPredictions();
        successResponse(res, predictions);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getPredictionByEngine = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const predictions = store.getPredictionsByEngine(engineId);
        successResponse(res, { engine_id: engine.engine_id, engine_name: engine.name, predictions });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const generatePrediction = async (req, res) => {
    try {
        const { engine_id } = req.body;
        if (!engine_id) {
            return errorResponse(res, 'engine_id es requerido', 400);
        }
        const engine = store.getEngineById(engine_id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }

        const latestReading = store.getLatestSensorReading(engine_id);
        if (!latestReading) {
            return errorResponse(res, 'Sin datos de sensores para generar prediccion', 400);
        }

        const result = mlBridge.predictRUL(latestReading, engine.total_cycles);
        const prediction = store.addPrediction({
            engine_id: parseInt(engine_id),
            predicted_rul: result.predicted_rul,
            confidence: result.confidence,
            risk_level: result.risk_level,
            model_version: result.model_version
        });

        if (result.risk_level === 'critical' || result.risk_level === 'high') {
            store.createAlert({
                engine_id: parseInt(engine_id),
                type: result.risk_level === 'critical' ? 'critical' : 'warning',
                message: `RUL estimado en ${result.predicted_rul} ciclos para ${engine.name}.`,
                predicted_rul: result.predicted_rul
            });
        }

        successResponse(res, prediction, 201);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const batchPrediction = async (req, res) => {
    try {
        const engines = store.getEngines();
        const results = [];

        for (const engine of engines) {
            if (engine.status === 'maintenance') continue;

            const latestReading = store.getLatestSensorReading(engine.id);
            if (!latestReading) continue;

            const result = mlBridge.predictRUL(latestReading, engine.total_cycles);
            const prediction = store.addPrediction({
                engine_id: engine.id,
                predicted_rul: result.predicted_rul,
                confidence: result.confidence,
                risk_level: result.risk_level,
                model_version: result.model_version
            });

            results.push({ engine_id: engine.engine_id, engine_name: engine.name, ...prediction });
        }

        successResponse(res, { total: results.length, predictions: results });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getAllPredictions, getPredictionByEngine, generatePrediction, batchPrediction };
