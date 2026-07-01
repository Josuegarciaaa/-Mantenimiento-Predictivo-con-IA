const store = require('../services/dataStore');
const { successResponse, errorResponse } = require('../utils/response');

const getAllAlerts = async (req, res) => {
    try {
        const filters = {};
        if (req.query.active !== undefined) filters.active = req.query.active === 'true';
        if (req.query.type) filters.type = req.query.type;
        if (req.query.engine_id) filters.engine_id = req.query.engine_id;

        const alerts = store.getAlerts(filters);
        successResponse(res, alerts);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getAlertById = async (req, res) => {
    try {
        const alert = store.getAlertById(req.params.id);
        if (!alert) {
            return errorResponse(res, 'Alerta no encontrada', 404);
        }
        const engine = store.getEngineById(alert.engine_id);
        successResponse(res, { ...alert, engine_name: engine ? engine.name : null });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const acknowledgeAlert = async (req, res) => {
    try {
        const user = req.body.user || 'Sistema';
        const alert = store.acknowledgeAlert(req.params.id, user);
        if (!alert) {
            return errorResponse(res, 'Alerta no encontrada', 404);
        }
        successResponse(res, alert);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getAlertStats = async (req, res) => {
    try {
        const stats = store.getAlertStats();
        successResponse(res, stats);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getAllAlerts, getAlertById, acknowledgeAlert, getAlertStats };
