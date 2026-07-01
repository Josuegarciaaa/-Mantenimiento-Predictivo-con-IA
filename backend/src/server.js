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

const authRoutes = require('./routes/auth');
const { verifyToken } = require('./middleware/authMiddleware');

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

app.use('/api/predictions', verifyToken, predictionRoutes);
app.use('/api/engines', verifyToken, engineRoutes);
app.use('/api/sensors', verifyToken, sensorRoutes);
app.use('/api/alerts', verifyToken, alertRoutes);
app.use('/api/reports', verifyToken, reportRoutes);

const store = require('./services/dataStore');
app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        const summary = await store.getDashboardSummary();
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
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

const http = require('http');
const { Server } = require('socket.io');
const simulator = require('./services/simulator');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

io.on('connection', (socket) => {
    console.log('Cliente conectado via WebSocket:', socket.id);
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

store.initializeDatabase().then(() => {
    if (process.env.NODE_ENV !== 'test') {
        server.listen(PORT, () => {
            console.log(`API corriendo en puerto ${PORT}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            simulator.startSimulator(io);
        });
    }
}).catch(err => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
});

module.exports = app;
