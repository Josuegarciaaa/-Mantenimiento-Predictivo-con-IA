const nodemailer = require('nodemailer');

let transporter;

async function initEmailService() {
    try {
        // Generar cuenta de prueba en Ethereal
        const testAccount = await nodemailer.createTestAccount();
        
        // Crear transporter reutilizable
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        
        console.log('Servicio de Email inicializado (Ethereal).');
        console.log('Credenciales de prueba generadas exitosamente.');
    } catch (err) {
        console.error('Error al inicializar el servicio de Email:', err);
    }
}

async function sendCriticalAlertEmail(engine, alertData) {
    if (!transporter) {
        console.warn('El servicio de Email no está inicializado.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"PredMaint Alerts" <alerts@predmaint.local>',
            to: "engineers@predmaint.local",
            subject: `[CRITICAL] Imminent Risk in Equipment: ${engine.name}`,
            text: `Equipment ${engine.name} (${engine.engine_id}) has entered a critical state.\nEstimated RUL: ${alertData.predicted_rul} cycles.\nPlease schedule immediate maintenance.`,
            html: `
                <h2>Critical Maintenance Alert</h2>
                <p><strong>Equipment:</strong> ${engine.name} (${engine.engine_id})</p>
                <p><strong>Estimated RUL:</strong> ${alertData.predicted_rul} cycles</p>
                <p><strong>Description:</strong> Imminent risk of failure. Requires immediate attention.</p>
                <br>
                <p><i>PredMaint Automated System</i></p>
            `
        });

        console.log('Correo de alerta enviado:', info.messageId);
        // Ethereal proporciona una URL para ver el correo simulado
        console.log('URL del correo (Ver en navegador):', nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error('Error al enviar correo de alerta:', err);
    }
}

module.exports = { initEmailService, sendCriticalAlertEmail };
