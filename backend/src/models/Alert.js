const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Alert = sequelize.define('Alert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    engine_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('info', 'warning', 'critical', 'maintenance_due'),
        defaultValue: 'warning'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    predicted_rul: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_acknowledged: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    acknowledged_by: {
        type: DataTypes.STRING,
        allowNull: true
    },
    acknowledged_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'alerts',
    timestamps: false
});

module.exports = Alert;
