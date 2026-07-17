const store = require('../services/dataStore');
const reportGenerator = require('../services/reportGenerator');
const { successResponse, errorResponse } = require('../utils/response');

const generatePDF = async (req, res) => {
    try {
        const engineId = req.params.engineId;
        const engine = await store.getEngineById(engineId);
        if (!engine) {
            return errorResponse(res, 'Motor no encontrado', 404);
        }

        const predictions = await store.getPredictionsByEngine(engineId);
        const readings = await store.getSensorReadings(engineId, 20);
        const alerts = await store.getAlerts({ engine_id: engineId });

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
        const summary = await store.getDashboardSummary();
        const engines = await store.getEngines();
        const alertStats = await store.getAlertStats();

        successResponse(res, {
            ...summary,
            alert_stats: alertStats,
            engines: engines.map(e => ({
                id: e.id,
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

const getEconomics = async (req, res) => {
    try {
        const engines = await store.getEngines();
        const activeAlerts = await store.getAlerts({ active: true });

        // calculos basados en los costos promedio por motor segun la documentacion de mantenimiento
        const COST_PER_CYCLE = 50; // Costo operativo base por ciclo
        const COST_PREVENTIVE_MAINTENANCE = 15000;
        const COST_UNPLANNED_FAILURE = 120000; // 8x el costo de preventivo
        
        let totalRemainingValue = 0;
        let downtimeAvoidedCost = 0;
        let riskExposure = 0;

        const fleetEconomics = engines.map(engine => {
            const rul = engine.last_prediction_rul || 0;
            const remainingValue = rul * COST_PER_CYCLE;
            totalRemainingValue += remainingValue;

            // checar si el motor anda en estado critico y pillamos el fallo antes de que truene
            let isAtRisk = false;
            if (engine.status === 'critical' || (engine.anomaly_check && engine.anomaly_check.multivariate_anomaly)) {
                isAtRisk = true;
                riskExposure += COST_UNPLANNED_FAILURE;
                
                // si ya hay alerta detectada o la reconocieron, tomamos como que le salvamos la vida al equipo
                const hasAlert = activeAlerts.some(a => a.engine_id === engine.id);
                if (hasAlert) {
                    downtimeAvoidedCost += (COST_UNPLANNED_FAILURE - COST_PREVENTIVE_MAINTENANCE);
                }
            }

            return {
                id: engine.id,
                name: engine.name,
                rul,
                remainingValue,
                isAtRisk,
                potentialLoss: isAtRisk ? COST_UNPLANNED_FAILURE : 0
            };
        });

        // simular tantito historial de ROI para los ultimos 6 meses
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const roiHistory = months.map((month, index) => ({
            month,
            preventiveCost: 15000 * (Math.floor(Math.random() * 3) + 1),
            unplannedCostAvoided: 120000 * (Math.floor(Math.random() * 2))
        }));
        
        // agregamos el mes actual con lo que nos ahorramos de downtime real
        roiHistory.push({
            month: 'Jul',
            preventiveCost: 15000 * activeAlerts.length,
            unplannedCostAvoided: downtimeAvoidedCost
        });

        successResponse(res, {
            summary: {
                totalRemainingValue,
                downtimeAvoidedCost,
                riskExposure,
                roiRatio: downtimeAvoidedCost > 0 ? (downtimeAvoidedCost / (activeAlerts.length * COST_PREVENTIVE_MAINTENANCE || 1)).toFixed(2) : 0
            },
            fleet: fleetEconomics.sort((a, b) => b.potentialLoss - a.potentialLoss || a.rul - b.rul),
            roiHistory
        });

    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { generatePDF, getSummary, getEconomics };
