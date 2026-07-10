/**
 * sensors.js
 * ==========
 * Rutas para datos de sensores.
 * 
 * Endpoints:
 * - GET  /api/sensors/:engineId          - Datos de sensores por motor
 * - GET  /api/sensors/:engineId/latest   - Ultima lectura de sensores
 * - POST /api/sensors                    - Ingresar datos de sensores
 */

const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/:engineId', sensorController.getSensorData);
router.get('/:engineId/latest', sensorController.getLatestReading);
router.post('/', sensorController.addSensorReading);

module.exports = router;
