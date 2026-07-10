const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'role', 'createdAt'] });
        successResponse(res, users);
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        
        if (!user) {
            return errorResponse(res, 'Usuario no encontrado', 404);
        }
        
        // Prevent deleting yourself
        if (req.user.id === parseInt(id)) {
            return errorResponse(res, 'No puedes eliminar tu propio usuario', 400);
        }

        await user.destroy();
        successResponse(res, { message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['admin', 'operator'].includes(role)) {
            return errorResponse(res, 'Rol invalido', 400);
        }

        const user = await User.findByPk(id);
        if (!user) {
            return errorResponse(res, 'Usuario no encontrado', 404);
        }

        // Prevent changing your own role
        if (req.user.id === parseInt(id)) {
            return errorResponse(res, 'No puedes cambiar tu propio rol', 400);
        }

        user.role = role;
        await user.save();
        
        successResponse(res, { id: user.id, username: user.username, role: user.role });
    } catch (err) {
        errorResponse(res, err.message);
    }
};

module.exports = { getAllUsers, deleteUser, updateUserRole };
