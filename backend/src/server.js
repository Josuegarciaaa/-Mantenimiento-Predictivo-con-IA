/**
 * server.js
 * =========
 * Entry point del servidor API REST.
 * Configura Express, middleware y rutas.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config/.env' });

// Import routes
const predictionRoutes = require('./routes/predictions');
const engineRoutes = require('./routes/engines');
const sensorRoutes = require('./routes/sensors');
const alertRoutes = require('./routes/alerts');
const reportRoutes = require('./routes/reports');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== Middleware ====================

// Seguridad
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 100                    // máx 100 requests por ventana
});
app.use('/api/', limiter);

// ==================== Routes ====================

app.use('/api/predictions', predictionRoutes);
app.use('/api/engines', engineRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Predictive Maintenance API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            predictions: '/api/predictions',
            engines: '/api/engines',
            sensors: '/api/sensors',
            alerts: '/api/alerts',
            reports: '/api/reports',
            health: '/api/health'
        }
    });
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
    console.log(` Predictive Maintenance API running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
