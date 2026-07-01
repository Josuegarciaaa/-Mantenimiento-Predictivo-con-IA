const store = require('../services/dataStore');
const { successResponse, errorResponse } = require('../utils/response');

const getAllEngines = async (req, res) => {
    try {
        const engines = store.getEngines();
        successResponse(res, engines);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getEngineById = async (req, res) => {
    try {
        const engine = store.getEngineById(req.params.id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const predictions = store.getPredictionsByEngine(req.params.id);
        const latestReading = store.getLatestSensorReading(req.params.id);
        successResponse(res, { ...engine, predictions, latest_reading: latestReading });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const createEngine = async (req, res) => {
    try {
        const { engine_id, name, type, location, installation_date } = req.body;
        if (!engine_id || !name) {
            return errorResponse(res, 'engine_id y name son requeridos', 400);
        }
        const existing = store.getEngineByEngineId(engine_id);
        if (existing) {
            return errorResponse(res, 'Ya existe un motor con ese engine_id', 409);
        }
        const engine = store.createEngine({ engine_id, name, type, location, installation_date });
        successResponse(res, engine, 201);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const updateEngine = async (req, res) => {
    try {
        const engine = store.updateEngine(req.params.id, req.body);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        successResponse(res, engine);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getEngineHistory = async (req, res) => {
    try {
        const engine = store.getEngineById(req.params.id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const readings = store.getSensorReadings(req.params.id);
        const predictions = store.getPredictionsByEngine(req.params.id);
        const alerts = store.getAlerts({ engine_id: req.params.id });
        successResponse(res, { engine, readings, predictions, alerts });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getAllEngines, getEngineById, createEngine, updateEngine, getEngineHistory };
