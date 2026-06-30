/**
 * engines.js
 * ==========
 * Rutas para gestión de motores/equipos.
 * 
 * Endpoints:
 * - GET    /api/engines         - Lista todos los motores
 * - GET    /api/engines/:id     - Detalle de un motor
 * - POST   /api/engines         - Registrar nuevo motor
 * - PUT    /api/engines/:id     - Actualizar motor
 * - GET    /api/engines/:id/history - Historial del motor
 */

const express = require('express');
const router = express.Router();
const engineController = require('../controllers/engineController');

router.get('/', engineController.getAllEngines);
router.get('/:id', engineController.getEngineById);
router.post('/', engineController.createEngine);
router.put('/:id', engineController.updateEngine);
router.get('/:id/history', engineController.getEngineHistory);

module.exports = router;
