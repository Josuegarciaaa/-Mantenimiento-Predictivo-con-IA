const PDFDocument = require('pdfkit');

function generateEnginePDF({ engine, predictions, readings, alerts }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
            const buffers = [];

            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(20).text('Predictive Maintenance Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).fillColor('#666')
                .text(`Generated: ${new Date().toLocaleString('en-US')}`, { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(14).fillColor('#000').text('Equipment Data');
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`ID: ${engine.engine_id}`);
            doc.text(`Name: ${engine.name}`);
            doc.text(`Type: ${engine.type}`);
            doc.text(`Location: ${engine.location}`);
            doc.text(`Status: ${engine.status.toUpperCase()}`);
            doc.text(`Total Cycles: ${engine.total_cycles}`);
            doc.text(`Installation Date: ${engine.installation_date || 'N/A'}`);
            doc.moveDown(1.5);

            doc.fontSize(14).text('RUL Prediction');
            doc.moveDown(0.5);
            doc.fontSize(10);
            if (predictions.length > 0) {
                const latest = predictions[predictions.length - 1];
                doc.text(`Predicted RUL: ${latest.predicted_rul} cycles`);
                doc.text(`Confidence: ${(latest.confidence * 100).toFixed(1)}%`);
                doc.text(`Risk Level: ${latest.risk_level.toUpperCase()}`);
                doc.text(`Model: ${latest.model_version}`);
                doc.text(`Date: ${new Date(latest.prediction_date).toLocaleString('en-US')}`);
            } else {
                doc.text('No predictions recorded.');
            }
            doc.moveDown(1.5);

            doc.fontSize(14).text('Alerts');
            doc.moveDown(0.5);
            doc.fontSize(10);
            const activeAlerts = alerts.filter(a => !a.is_acknowledged);
            if (activeAlerts.length > 0) {
                activeAlerts.forEach(alert => {
                    const prefix = alert.type === 'critical' ? '[CRITICAL]' : '[WARNING]';
                    doc.text(`${prefix} ${alert.message}`);
                    doc.text(`   Date: ${new Date(alert.created_at).toLocaleString('en-US')}`);
                    doc.moveDown(0.3);
                });
            } else {
                doc.text('No active alerts.');
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
