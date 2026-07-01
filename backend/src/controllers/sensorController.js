const store = require('../services/dataStore');
const { successResponse, errorResponse } = require('../utils/response');

const getSensorData = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const readings = store.getSensorReadings(engineId, limit);
        successResponse(res, { engine_id: engine.engine_id, total: readings.length, readings });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getLatestReading = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const reading = store.getLatestSensorReading(engineId);
        if (!reading) {
            return errorResponse(res, 'Sin lecturas disponibles para este motor', 404);
        }
        successResponse(res, reading);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const addSensorReading = async (req, res) => {
    try {
        const { engine_id, cycle } = req.body;
        if (!engine_id || cycle === undefined) {
            return errorResponse(res, 'engine_id y cycle son requeridos', 400);
        }
        const engine = store.getEngineById(engine_id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const reading = store.addSensorReading(req.body);
        successResponse(res, reading, 201);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getSensorData, getLatestReading, addSensorReading };
