const store = require('./dataStore');
const mlBridge = require('./mlBridge');
const { sendCriticalAlertEmail } = require('./emailService');

let ioInstance = null;
let intervalId = null;

// Valores base para simulacion por motor
const baseValues = {};

function getBaseValues(engineId) {
    if (!baseValues[engineId]) {
        baseValues[engineId] = {
            op_setting_1: -0.0007 + Math.random() * 0.005,
            op_setting_2: -0.0004 + Math.random() * 0.003,
            op_setting_3: 100.0,
            sensor_1: 15.00,
            sensor_2: 83.41,
            sensor_3: 610.01,
            sensor_4: 504.96,
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
    }
    return baseValues[engineId];
}

function startSimulator(io) {
    ioInstance = io;
    
    if (intervalId) clearInterval(intervalId);

    console.log('Simulador en tiempo real iniciado.');

    intervalId = setInterval(async () => {
        try {
            const engines = await store.getEngines();
            
            // Elegimos un motor aleatorio que no este en mantenimiento para avanzar su ciclo
            const activeEngines = engines.filter(e => e.status !== 'maintenance');
            if (activeEngines.length === 0) return;

            const targetEngine = activeEngines[Math.floor(Math.random() * activeEngines.length)];
            const latestReading = await store.getLatestSensorReading(targetEngine.id);
            const nextCycle = latestReading ? latestReading.cycle + 1 : 1;

            // Generar lectura degradada
            const base = getBaseValues(targetEngine.id);
            
            // Simular degradacion exponencial si pasa de los 150 ciclos
            const degradationRatio = Math.min(1, nextCycle / 350); 

            const newReading = {
                engine_id: targetEngine.id,
                cycle: nextCycle,
                op_setting_1: base.op_setting_1 + (Math.random() - 0.5) * 0.001,
                op_setting_2: base.op_setting_2 + (Math.random() - 0.5) * 0.0005,
                op_setting_3: base.op_setting_3,
                sensor_1: base.sensor_1 + (Math.random() - 0.5) * 0.4,
                sensor_2: base.sensor_2 + degradationRatio * 6.0 + (Math.random() - 0.5) * 0.8,
                sensor_3: base.sensor_3 + degradationRatio * 20.0 + (Math.random() - 0.5) * 3.5,
                sensor_4: base.sensor_4 + degradationRatio * 16.0 + (Math.random() - 0.5) * 6.0,
                sensor_5: base.sensor_5 + (Math.random() - 0.5) * 0.05,
                sensor_6: base.sensor_6 + degradationRatio * 0.4 + (Math.random() - 0.5) * 0.1,
                sensor_7: base.sensor_7 + degradationRatio * 11.0 + (Math.random() - 0.5) * 2.0,
                sensor_8: base.sensor_8 + degradationRatio * 22.0 + (Math.random() - 0.5) * 4.0,
                sensor_9: base.sensor_9 + degradationRatio * 32.0 + (Math.random() - 0.5) * 7.0,
                sensor_10: base.sensor_10 + (Math.random() - 0.5) * 0.01,
                sensor_11: base.sensor_11 + degradationRatio * 2.0 + (Math.random() - 0.5) * 0.4,
                sensor_12: base.sensor_12 + degradationRatio * 4.0 + (Math.random() - 0.5) * 1.0,
                sensor_13: base.sensor_13 + degradationRatio * 20.0 + (Math.random() - 0.5) * 4.5,
                sensor_14: base.sensor_14 + degradationRatio * 26.0 + (Math.random() - 0.5) * 6.0,
                sensor_15: base.sensor_15 + degradationRatio * 0.10 + (Math.random() - 0.5) * 0.015,
                sensor_16: base.sensor_16 + (Math.random() - 0.5) * 0.0005,
                sensor_17: base.sensor_17 + degradationRatio * 4.0 + (Math.random() - 0.5) * 0.8,
                sensor_18: base.sensor_18 + degradationRatio * 16.0 + (Math.random() - 0.5) * 3.0,
                sensor_19: base.sensor_19 + (Math.random() - 0.5) * 0.2,
                sensor_20: base.sensor_20 + degradationRatio * 1.6 + (Math.random() - 0.5) * 0.3,
                sensor_21: base.sensor_21 + degradationRatio * 0.08 + (Math.random() - 0.5) * 0.01
            };

            // 1. Guardar lectura de sensor
            const readingDb = await store.addSensorReading(newReading);

            // 2. Generar prediccion de RUL
            const mlResult = await mlBridge.predictRUL(readingDb, nextCycle);
            const predictionDb = await store.addPrediction({
                engine_id: targetEngine.id,
                predicted_rul: mlResult.predicted_rul,
                confidence: mlResult.confidence,
                risk_level: mlResult.risk_level,
                model_version: mlResult.model_version,
                lower_95: mlResult.lower_95 ?? null,
                upper_95: mlResult.upper_95 ?? null,
                rul_trend: mlResult.rul_trend ?? null,
            });

            // 3. Crear alerta si aplica
            let newAlertDb = null;
            if (mlResult.risk_level === 'critical' || mlResult.risk_level === 'high') {
                // Checar si ya hay una alerta activa no reconocida para este motor para no saturar
                const activeAlerts = await store.getAlerts({ engine_id: targetEngine.id, active: true });
                const alreadyAlerted = activeAlerts.some(a => a.type === (mlResult.risk_level === 'critical' ? 'critical' : 'warning'));
                
                if (!alreadyAlerted) {
                    newAlertDb = await store.createAlert({
                        engine_id: targetEngine.id,
                        type: mlResult.risk_level === 'critical' ? 'critical' : 'warning',
                        message: `LIVE ALERT: RUL of ${targetEngine.name} dropped to ${mlResult.predicted_rul} cycles.`,
                        predicted_rul: mlResult.predicted_rul
                    });
                }
            }

            // 4. Emitir eventos a los sockets
            const dashboardSummary = await store.getDashboardSummary();
            const alertStats = await store.getAlertStats();
            
            ioInstance.emit('sensor_update', {
                engine_id: targetEngine.id,
                reading: readingDb
            });

            ioInstance.emit('prediction_update', {
                engine_id: targetEngine.id,
                prediction: predictionDb,
                engine_status: mlResult.risk_level === 'critical' ? 'critical' : mlResult.risk_level === 'high' ? 'warning' : 'healthy',
                total_cycles: nextCycle
            });

            if (newAlertDb) {
                ioInstance.emit('alert_new', newAlertDb);
                
                // Enviar correo si la alerta es critica
                if (newAlertDb.risk_level === 'critical') {
                    sendCriticalAlertEmail(targetEngine, newAlertDb);
                }
            }

            ioInstance.emit('dashboard_update', {
                summary: dashboardSummary,
                alert_stats: alertStats
            });

        } catch (err) {
            console.error('Error en el bucle del simulador:', err);
        }
    }, 4000); // Avanzar un ciclo de un motor aleatorio cada 4 segundos
}

function stopSimulator() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('Simulador en tiempo real detenido.');
    }
}

module.exports = { startSimulator, stopSimulator };
