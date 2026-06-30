/**
 * reports.js
 * ==========
 * Rutas para generación de reportes.
 * 
 * Endpoints:
 * - GET  /api/reports/pdf/:engineId   - Generar reporte PDF
 * - GET  /api/reports/summary         - Resumen general
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/pdf/:engineId', reportController.generatePDF);
router.get('/summary', reportController.getSummary);

module.exports = router;
