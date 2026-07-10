/**
 * engines.js
 * ==========
 * Rutas para gestion de motores/equipos.
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

const { requireRole } = require('../middleware/authMiddleware');

router.get('/', engineController.getAllEngines);
router.get('/:id', engineController.getEngineById);
router.post('/', requireRole('admin'), engineController.createEngine);
router.put('/:id', requireRole('admin'), engineController.updateEngine);
router.post('/:id/schedule', requireRole('admin'), engineController.scheduleMaintenance);
router.get('/:id/history', engineController.getEngineHistory);

module.exports = router;
