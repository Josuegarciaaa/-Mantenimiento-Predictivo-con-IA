const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretmaintenancekey';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return errorResponse(res, 'Token de autenticacion no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return errorResponse(res, 'Token de autenticacion mal formado', 401);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return errorResponse(res, 'Token invalido o expirado', 403);
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'No autenticado', 401);
        }
        if (req.user.role !== role) {
            return errorResponse(res, 'Acceso denegado: permisos insuficientes', 403);
        }
        next();
    };
};

module.exports = { verifyToken, requireRole };
