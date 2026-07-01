const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Prediction = sequelize.define('Prediction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    engine_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    predicted_rul: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    confidence: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    model_version: {
        type: DataTypes.STRING,
        defaultValue: 'rf_v1.0'
    },
    risk_level: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low'
    },
    prediction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'predictions',
    timestamps: false
});

module.exports = Prediction;
