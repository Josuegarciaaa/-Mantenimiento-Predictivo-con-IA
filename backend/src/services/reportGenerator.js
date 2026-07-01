const PDFDocument = require('pdfkit');

function generateEnginePDF({ engine, predictions, readings, alerts }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
            const buffers = [];

            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(20).text('Reporte de Mantenimiento Predictivo', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).fillColor('#666')
                .text(`Generado: ${new Date().toLocaleString('es-MX')}`, { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(14).fillColor('#000').text('Datos del Equipo');
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`ID: ${engine.engine_id}`);
            doc.text(`Nombre: ${engine.name}`);
            doc.text(`Tipo: ${engine.type}`);
            doc.text(`Ubicacion: ${engine.location}`);
            doc.text(`Estado: ${engine.status.toUpperCase()}`);
            doc.text(`Ciclos totales: ${engine.total_cycles}`);
            doc.text(`Fecha de instalacion: ${engine.installation_date || 'N/A'}`);
            doc.moveDown(1.5);

            doc.fontSize(14).text('Prediccion de RUL');
            doc.moveDown(0.5);
            doc.fontSize(10);
            if (predictions.length > 0) {
                const latest = predictions[predictions.length - 1];
                doc.text(`RUL predicho: ${latest.predicted_rul} ciclos`);
                doc.text(`Confianza: ${(latest.confidence * 100).toFixed(1)}%`);
                doc.text(`Nivel de riesgo: ${latest.risk_level.toUpperCase()}`);
                doc.text(`Modelo: ${latest.model_version}`);
                doc.text(`Fecha: ${new Date(latest.prediction_date).toLocaleString('es-MX')}`);
            } else {
                doc.text('Sin predicciones registradas.');
            }
            doc.moveDown(1.5);

            doc.fontSize(14).text('Alertas');
            doc.moveDown(0.5);
            doc.fontSize(10);
            const activeAlerts = alerts.filter(a => !a.is_acknowledged);
            if (activeAlerts.length > 0) {
                activeAlerts.forEach(alert => {
                    const prefix = alert.type === 'critical' ? '[CRITICA]' : '[ADVERTENCIA]';
                    doc.text(`${prefix} ${alert.message}`);
                    doc.text(`   Fecha: ${new Date(alert.created_at).toLocaleString('es-MX')}`);
                    doc.moveDown(0.3);
                });
            } else {
                doc.text('Sin alertas activas.');
            }
            doc.moveDown(1.5);

            doc.fontSize(14).text('Ultimas Lecturas de Sensores');
            doc.moveDown(0.5);
            doc.fontSize(9);
            const lastReadings = readings.slice(-5);
            if (lastReadings.length > 0) {
                lastReadings.forEach(r => {
                    doc.text(
                        `Ciclo ${r.cycle}: ` +
                        `T_HPC=${r.sensor_3?.toFixed(1)} | ` +
                        `P_HPC=${r.sensor_7?.toFixed(1)} | ` +
                        `RPM_core=${r.sensor_9?.toFixed(1)} | ` +
                        `Ps30=${r.sensor_11?.toFixed(2)}`
                    );
                });
            } else {
                doc.text('Sin lecturas disponibles.');
            }
            doc.moveDown(2);

            doc.fontSize(8).fillColor('#999')
                .text('Sistema de Mantenimiento Predictivo con IA - Reporte generado automaticamente', { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateEnginePDF };
