const store = require('../services/dataStore');
const { successResponse, errorResponse } = require('../utils/response');

const getSensorData = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = await store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        let limit = req.query.limit ? parseInt(req.query.limit) : null;
        let readings = await store.getSensorReadings(engineId, limit);
        
        // Downsampling inteligente si hay demasiados puntos
        const MAX_POINTS = 200;
        if (readings.length > MAX_POINTS) {
            const step = Math.ceil(readings.length / MAX_POINTS);
            const downsampled = [];
            for (let i = 0; i < readings.length; i += step) {
                downsampled.push(readings[i]);
            }
            // hay que asegurarnos de incluir siempre el ultimo registro
            if (downsampled[downsampled.length - 1].cycle !== readings[readings.length - 1].cycle) {
                downsampled.push(readings[readings.length - 1]);
            }
            readings = downsampled;
        }

        successResponse(res, { engine_id: engine.engine_id, total: readings.length, is_downsampled: true, readings });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getLatestReading = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = await store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const reading = await store.getLatestSensorReading(engineId);
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
        const engine = await store.getEngineById(engine_id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const reading = await store.addSensorReading(req.body);
        successResponse(res, reading, 201);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getSensorData, getLatestReading, addSensorReading };
