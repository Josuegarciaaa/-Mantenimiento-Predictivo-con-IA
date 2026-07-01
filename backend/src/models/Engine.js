const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Engine = sequelize.define('Engine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    engine_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'turbofan'
    },
    location: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    status: {
        type: DataTypes.ENUM('healthy', 'warning', 'critical', 'maintenance'),
        defaultValue: 'healthy'
    },
    last_prediction_rul: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    last_prediction_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    installation_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    total_cycles: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'engines',
    timestamps: true,
    underscored: true
});

module.exports = Engine;
