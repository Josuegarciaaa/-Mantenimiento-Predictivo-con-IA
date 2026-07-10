const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireRole } = require('../middleware/authMiddleware');

// Todas las rutas de usuarios requieren rol de administrador
router.use(requireRole('admin'));

router.get('/', userController.getAllUsers);
router.put('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
