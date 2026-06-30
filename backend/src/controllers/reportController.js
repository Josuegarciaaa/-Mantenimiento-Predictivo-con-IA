/**
 * reportController.js
 * ====================
 * Controlador para generación de reportes PDF.
 */

const generatePDF = async (req, res) => {
    res.json({ message: `Generate PDF for engine ${req.params.engineId}` });
};

const getSummary = async (req, res) => {
    res.json({ message: 'Get summary report' });
};

module.exports = {
    generatePDF,
    getSummary
};
