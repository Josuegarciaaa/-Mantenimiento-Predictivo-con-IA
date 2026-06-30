/**
 * api.js
 * ======
 * Servicio centralizado para llamadas a la API REST.
 * Usa Axios para todas las peticiones HTTP.
 */

// Implementation pending
// Endpoints planificados:
// - predictions.getAll()
// - predictions.getByEngine(id)
// - predictions.generate(data)
// - engines.getAll()
// - engines.getById(id)
// - sensors.getData(engineId)
// - alerts.getAll()
// - reports.generatePDF(engineId)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default API_BASE_URL;
