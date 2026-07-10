const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretmaintenancekey';

const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return errorResponse(res, 'Usuario y contrasena requeridos', 400);
        }

        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return errorResponse(res, 'El usuario ya existe', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            role: role || 'operator'
        });

        successResponse(res, { id: user.id, username: user.username, role: user.role }, 201);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return errorResponse(res, 'Usuario y contrasena requeridos', 400);
        }

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return errorResponse(res, 'Credenciales invalidas', 401);
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return errorResponse(res, 'Credenciales invalidas', 401);
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        successResponse(res, {
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { register, login };
