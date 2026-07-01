const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config({ path: './config/.env' });

const predictionRoutes = require('./routes/predictions');
const engineRoutes = require('./routes/engines');
const sensorRoutes = require('./routes/sensors');
const alertRoutes = require('./routes/alerts');
const reportRoutes = require('./routes/reports');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
});
app.use('/api/', limiter);

app.use('/api/predictions', predictionRoutes);
app.use('/api/engines', engineRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/health', healthRoutes);

const store = require('./services/dataStore');
app.get('/api/dashboard', (req, res) => {
    const summary = store.getDashboardSummary();
    res.json({ success: true, data: summary });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Predictive Maintenance API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            dashboard: '/api/dashboard',
            predictions: '/api/predictions',
            engines: '/api/engines',
            sensors: '/api/sensors',
            alerts: '/api/alerts',
            reports: '/api/reports',
            health: '/api/health'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: { message: `Ruta ${req.originalUrl} no encontrada` }
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API corriendo en puerto ${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
