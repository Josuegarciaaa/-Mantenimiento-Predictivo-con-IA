/**
 * predictions.js
 * ==============
 * Rutas para predicciones de RUL (Remaining Useful Life).
 * 
 * Endpoints:
 * - GET  /api/predictions          - Lista todas las predicciones
 * - GET  /api/predictions/:id      - Prediccion especifica por engine ID
 * - POST /api/predictions/predict  - Genera nueva prediccion
 * - GET  /api/predictions/batch    - Predicciones en lote
 */

const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

router.get('/', predictionController.getAllPredictions);
router.get('/:engineId', predictionController.getPredictionByEngine);
router.post('/predict', predictionController.generatePrediction);
router.post('/batch', predictionController.batchPrediction);
router.post('/simulate', predictionController.simulateDigitalTwin);

module.exports = router;
