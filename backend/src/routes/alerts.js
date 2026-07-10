/**
 * alerts.js
 * =========
 * Rutas para sistema de alertas predictivas.
 * 
 * Endpoints:
 * - GET  /api/alerts            - Lista todas las alertas activas
 * - GET  /api/alerts/:id        - Detalle de una alerta
 * - PUT  /api/alerts/:id/ack    - Marcar alerta como reconocida
 * - GET  /api/alerts/stats      - Estadisticas de alertas
 */

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/', alertController.getAllAlerts);
router.get('/stats', alertController.getAlertStats);
router.get('/:id', alertController.getAlertById);
router.put('/:id/ack', alertController.acknowledgeAlert);

module.exports = router;
