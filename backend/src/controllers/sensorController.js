/**
 * sensorController.js
 * ====================
 * Controlador para datos de sensores.
 */

const getSensorData = async (req, res) => {
    res.json({ message: `Get sensor data for engine ${req.params.engineId}` });
};

const getLatestReading = async (req, res) => {
    res.json({ message: `Get latest reading for engine ${req.params.engineId}` });
};

const addSensorReading = async (req, res) => {
    res.json({ message: 'Add sensor reading' });
};

module.exports = {
    getSensorData,
    getLatestReading,
    addSensorReading
};
