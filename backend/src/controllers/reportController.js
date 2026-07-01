const store = require('../services/dataStore');
const reportGenerator = require('../services/reportGenerator');
const { successResponse, errorResponse } = require('../utils/response');

const generatePDF = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }

        const predictions = store.getPredictionsByEngine(engineId);
        const readings = store.getSensorReadings(engineId, 20);
        const alerts = store.getAlerts({ engine_id: engineId });

        const pdfBuffer = await reportGenerator.generateEnginePDF({
            engine,
            predictions,
            readings,
            alerts
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_${engine.engine_id}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const getSummary = async (req, res) => {
    try {
        const summary = store.getDashboardSummary();
        const engines = store.getEngines();
        const alertStats = store.getAlertStats();

        successResponse(res, {
            ...summary,
            alert_stats: alertStats,
            engines: engines.map(e => ({
                engine_id: e.engine_id,
                name: e.name,
                status: e.status,
                last_prediction_rul: e.last_prediction_rul,
                total_cycles: e.total_cycles,
                location: e.location
            }))
        });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { generatePDF, getSummary };
