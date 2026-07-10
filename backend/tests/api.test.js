/**
 * api.test.js
 * ===========
 * Tests de integración para la API REST.
 * Usa Jest + Supertest para probar los endpoints principales.
 */

const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/models');

let authToken = '';
let adminToken = '';
let createdEngineId = null;

// ─── Setup y Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
    // Esperar que la BD inicialice (ya se sincroniza en server.js al importar dataStore)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Obtener token de operador
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'operator', password: 'operator123' });
    authToken = loginRes.body?.data?.token || '';

    // Obtener token de admin
    const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
    adminToken = adminRes.body?.data?.token || '';
});

afterAll(async () => {
    // Limpiar motor de prueba si fue creado
    if (createdEngineId && adminToken) {
        // No hay DELETE en la API actual, solo limpiamos referencia
        createdEngineId = null;
    }
    await sequelize.close();
});

// ─── Health Check ──────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
    it('debe devolver status healthy', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
    });

    it('debe incluir información del servidor', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('timestamp');
    });
});

// ─── Root Endpoint ─────────────────────────────────────────────────────────────

describe('GET /', () => {
    it('debe devolver la información del API', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('name', 'Predictive Maintenance API');
        expect(res.body).toHaveProperty('version');
        expect(res.body).toHaveProperty('endpoints');
    });
});

// ─── Autenticación ─────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    it('debe autenticar un usuario válido', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'operator', password: 'operator123' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user).toHaveProperty('username', 'operator');
    });

    it('debe rechazar credenciales inválidas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'operador', password: 'wrongpass' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('success', false);
    });

    it('debe rechazar petición sin campos', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
        expect(res.body).toHaveProperty('success', false);
    });

    it('debe autenticar el usuario admin', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user).toHaveProperty('role', 'admin');
    });
});

// ─── Rutas protegidas sin token ────────────────────────────────────────────────

describe('Rutas protegidas — sin autenticación', () => {
    it('GET /api/engines debe devolver 401 sin token', async () => {
        const res = await request(app).get('/api/engines');
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/sensors/1 debe devolver 401 sin token', async () => {
        const res = await request(app).get('/api/sensors/1');
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/alerts debe devolver 401 sin token', async () => {
        const res = await request(app).get('/api/alerts');
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/dashboard debe devolver 401 sin token', async () => {
        const res = await request(app).get('/api/dashboard');
        expect(res.statusCode).toBe(401);
    });
});

// ─── Engines CRUD ──────────────────────────────────────────────────────────────

describe('GET /api/engines', () => {
    it('debe devolver lista de motores', async () => {
        const res = await request(app)
            .get('/api/engines')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('cada motor debe tener los campos requeridos', async () => {
        const res = await request(app)
            .get('/api/engines')
            .set('Authorization', `Bearer ${authToken}`);

        const engine = res.body.data[0];
        expect(engine).toHaveProperty('id');
        expect(engine).toHaveProperty('engine_id');
        expect(engine).toHaveProperty('name');
        expect(engine).toHaveProperty('status');
        expect(engine).toHaveProperty('total_cycles');
        expect(['healthy', 'warning', 'critical', 'maintenance']).toContain(engine.status);
    });
});

describe('GET /api/engines/:id', () => {
    it('debe devolver un motor específico con predicciones', async () => {
        const res = await request(app)
            .get('/api/engines/1')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('predictions');
        expect(Array.isArray(res.body.data.predictions)).toBe(true);
    });

    it('debe devolver 404 para motor inexistente', async () => {
        const res = await request(app)
            .get('/api/engines/9999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('success', false);
    });
});

describe('POST /api/engines', () => {
    it('debe crear un nuevo motor con datos válidos', async () => {
        const res = await request(app)
            .post('/api/engines')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                engine_id: 'TEST-001',
                name: 'Motor de Prueba',
                type: 'turbofan',
                location: 'Planta Test',
                installation_date: '2026-01-01'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('engine_id', 'TEST-001');
        expect(res.body.data).toHaveProperty('status', 'healthy');
        createdEngineId = res.body.data.id;
    });

    it('debe rechazar motor con engine_id duplicado', async () => {
        const res = await request(app)
            .post('/api/engines')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ engine_id: 'ENG-001', name: 'Duplicado' });

        expect(res.statusCode).toBe(409);
    });

    it('debe rechazar motor sin campos requeridos', async () => {
        const res = await request(app)
            .post('/api/engines')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ location: 'Sin nombre ni ID' });

        expect(res.statusCode).toBe(400);
    });
});

describe('PUT /api/engines/:id', () => {
    it('debe actualizar un motor existente', async () => {
        const res = await request(app)
            .put('/api/engines/1')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ location: 'Linea 1 - Actualizada' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('location', 'Linea 1 - Actualizada');
    });

    it('debe devolver 404 para motor inexistente', async () => {
        const res = await request(app)
            .put('/api/engines/9999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ location: 'Fantasma' });

        expect(res.statusCode).toBe(404);
    });
});

// ─── Sensores ──────────────────────────────────────────────────────────────────

describe('GET /api/sensors/:engineId', () => {
    it('debe devolver lecturas de sensores de un motor', async () => {
        const res = await request(app)
            .get('/api/sensors/1')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('readings');
        expect(Array.isArray(res.body.data.readings)).toBe(true);
    });

    it('debe respetar el parámetro de límite', async () => {
        const res = await request(app)
            .get('/api/sensors/1?limit=10')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.readings.length).toBeLessThanOrEqual(10);
    });

    it('cada lectura debe tener los 21 sensores', async () => {
        const res = await request(app)
            .get('/api/sensors/1?limit=1')
            .set('Authorization', `Bearer ${authToken}`);

        const reading = res.body.data.readings[0];
        if (reading) {
            expect(reading).toHaveProperty('sensor_1');
            expect(reading).toHaveProperty('sensor_9');
            expect(reading).toHaveProperty('sensor_21');
            expect(reading).toHaveProperty('cycle');
        }
    });
});

describe('GET /api/sensors/:engineId/latest', () => {
    it('debe devolver la última lectura del motor', async () => {
        const res = await request(app)
            .get('/api/sensors/1/latest')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('cycle');
        expect(res.body.data).toHaveProperty('engine_id');
    });
});

// ─── Predicciones ──────────────────────────────────────────────────────────────

describe('GET /api/predictions', () => {
    it('debe devolver todas las predicciones', async () => {
        const res = await request(app)
            .get('/api/predictions')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('cada predicción debe tener los campos requeridos', async () => {
        const res = await request(app)
            .get('/api/predictions')
            .set('Authorization', `Bearer ${authToken}`);

        if (res.body.data.length > 0) {
            const pred = res.body.data[0];
            expect(pred).toHaveProperty('predicted_rul');
            expect(pred).toHaveProperty('confidence');
            expect(pred).toHaveProperty('risk_level');
            expect(pred).toHaveProperty('model_version');
            expect(['low', 'medium', 'high', 'critical']).toContain(pred.risk_level);
        }
    });
});

describe('POST /api/predictions/predict', () => {
    it('debe generar una predicción para un motor válido', async () => {
        const res = await request(app)
            .post('/api/predictions/predict')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ engine_id: 1 });

        expect(res.statusCode).toBe(201);
        expect(res.body.data).toHaveProperty('predicted_rul');
        expect(res.body.data.predicted_rul).toBeGreaterThanOrEqual(0);
        expect(res.body.data.predicted_rul).toBeLessThanOrEqual(125);
    });

    it('debe rechazar engine_id inválido', async () => {
        const res = await request(app)
            .post('/api/predictions/predict')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ engine_id: 9999 });

        expect(res.statusCode).toBe(404);
    });

    it('debe rechazar petición sin engine_id', async () => {
        const res = await request(app)
            .post('/api/predictions/predict')
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.statusCode).toBe(400);
    });
});

// ─── Alertas ───────────────────────────────────────────────────────────────────

describe('GET /api/alerts', () => {
    it('debe devolver todas las alertas', async () => {
        const res = await request(app)
            .get('/api/alerts')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('debe filtrar alertas activas', async () => {
        const res = await request(app)
            .get('/api/alerts?active=true')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        res.body.data.forEach(alert => {
            expect(alert.is_acknowledged).toBe(false);
        });
    });

    it('debe filtrar alertas por tipo', async () => {
        const res = await request(app)
            .get('/api/alerts?type=critical')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        res.body.data.forEach(alert => {
            expect(alert.type).toBe('critical');
        });
    });
});

describe('PUT /api/alerts/:id/ack', () => {
    it('debe reconocer una alerta existente', async () => {
        // Primero obtener una alerta no reconocida
        const alertsRes = await request(app)
            .get('/api/alerts?active=true')
            .set('Authorization', `Bearer ${authToken}`);

        const activeAlerts = alertsRes.body.data;
        if (activeAlerts.length > 0) {
            const alertId = activeAlerts[0].id;
            const res = await request(app)
                .put(`/api/alerts/${alertId}/ack`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ user: 'Test User' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('is_acknowledged', true);
            expect(res.body.data).toHaveProperty('acknowledged_by', 'Test User');
        }
    });

    it('debe devolver 404 para alerta inexistente', async () => {
        const res = await request(app)
            .put('/api/alerts/9999/ack')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ user: 'Test' });

        expect(res.statusCode).toBe(404);
    });
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────

describe('GET /api/dashboard', () => {
    it('debe devolver el resumen del dashboard', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('engines');
        expect(res.body.data).toHaveProperty('alerts');
        expect(res.body.data).toHaveProperty('average_rul');
    });

    it('el resumen de engines debe tener contadores correctos', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${authToken}`);

        const { engines } = res.body.data;
        expect(engines).toHaveProperty('total');
        expect(engines).toHaveProperty('healthy');
        expect(engines).toHaveProperty('warning');
        expect(engines).toHaveProperty('critical');
        expect(engines.total).toBeGreaterThan(0);
        expect(engines.total).toBeGreaterThanOrEqual(
            engines.healthy + engines.warning + engines.critical + (engines.maintenance || 0)
        );
    });
});

// ─── Reportes ──────────────────────────────────────────────────────────────────

describe('GET /api/reports/pdf/:engineId', () => {
    it('debe generar un PDF para motor válido', async () => {
        const res = await request(app)
            .get('/api/reports/pdf/1')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('debe devolver 404 para motor inexistente', async () => {
        const res = await request(app)
            .get('/api/reports/pdf/9999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(404);
    });
});

// ─── Settings ──────────────────────────────────────────────────────────────────

describe('GET /api/settings/model', () => {
    it('debe devolver el tipo de modelo activo', async () => {
        const res = await request(app)
            .get('/api/settings/model')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('modelType');
        expect(['auto', 'rf', 'lstm']).toContain(res.body.data.modelType);
    });
});

describe('POST /api/settings/model', () => {
    it('debe cambiar el modelo a rf', async () => {
        const res = await request(app)
            .post('/api/settings/model')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ modelType: 'rf' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('modelType', 'rf');
    });

    it('debe rechazar tipo de modelo inválido', async () => {
        const res = await request(app)
            .post('/api/settings/model')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ modelType: 'xgboost' });

        expect(res.statusCode).toBe(400);
    });

    it('debe restaurar el modelo a auto', async () => {
        const res = await request(app)
            .post('/api/settings/model')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ modelType: 'auto' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('modelType', 'auto');
    });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────

describe('Ruta no encontrada', () => {
    it('debe devolver 404 para rutas inexistentes', async () => {
        const res = await request(app).get('/api/ruta-que-no-existe');
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('success', false);
    });
});
