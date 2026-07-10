const store = require('../services/dataStore');
const { successResponse, errorResponse } = require('../utils/response');

const getAllEngines = async (req, res) => {
    try {
        const engines = await store.getEngines();
        successResponse(res, engines);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getEngineById = async (req, res) => {
    try {
        const engine = await store.getEngineById(req.params.id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const predictions = await store.getPredictionsByEngine(req.params.id);
        const latestReading = await store.getLatestSensorReading(req.params.id);
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
        const existing = await store.getEngineByEngineId(engine_id);
        if (existing) {
            return errorResponse(res, 'Ya existe un motor con ese engine_id', 409);
        }
        const engine = await store.createEngine({ engine_id, name, type, location, installation_date });
        successResponse(res, engine, 201);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const updateEngine = async (req, res) => {
    try {
        const engine = await store.updateEngine(req.params.id, req.body);
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
        const engine = await store.getEngineById(req.params.id);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        const readings = await store.getSensorReadings(req.params.id);
        const predictions = await store.getPredictionsByEngine(req.params.id);
        const alerts = await store.getAlerts({ engine_id: req.params.id });
        successResponse(res, { engine, readings, predictions, alerts });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const scheduleMaintenance = async (req, res) => {
    try {
        const { date, description } = req.body;
        const engine = await store.updateEngine(req.params.id, { 
            status: 'maintenance',
            // Ideally we'd store the date/description in a separate maintenance table, 
            // but for now we update the status and we could use a custom field or simply status
        });
        
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }
        
        // Log maintenance event in alerts or generic logs (optional, skipping for simplicity)
        
        successResponse(res, { message: 'Mantenimiento programado', engine });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getAllEngines, getEngineById, createEngine, updateEngine, getEngineHistory, scheduleMaintenance };
