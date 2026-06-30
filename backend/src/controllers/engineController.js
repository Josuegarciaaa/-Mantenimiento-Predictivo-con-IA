/**
 * engineController.js
 * ====================
 * Controlador para gestión de motores/equipos.
 */

const getAllEngines = async (req, res) => {
    res.json({ message: 'Get all engines' });
};

const getEngineById = async (req, res) => {
    res.json({ message: `Get engine ${req.params.id}` });
};

const createEngine = async (req, res) => {
    res.json({ message: 'Create engine' });
};

const updateEngine = async (req, res) => {
    res.json({ message: `Update engine ${req.params.id}` });
};

const getEngineHistory = async (req, res) => {
    res.json({ message: `Get history for engine ${req.params.id}` });
};

module.exports = {
    getAllEngines,
    getEngineById,
    createEngine,
    updateEngine,
    getEngineHistory
};
