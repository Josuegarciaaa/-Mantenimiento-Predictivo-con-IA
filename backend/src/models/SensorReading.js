const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SensorReading = sequelize.define('SensorReading', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    engine_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cycle: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    op_setting_1: { type: DataTypes.FLOAT },
    op_setting_2: { type: DataTypes.FLOAT },
    op_setting_3: { type: DataTypes.FLOAT },
    sensor_1: { type: DataTypes.FLOAT },
    sensor_2: { type: DataTypes.FLOAT },
    sensor_3: { type: DataTypes.FLOAT },
    sensor_4: { type: DataTypes.FLOAT },
    sensor_5: { type: DataTypes.FLOAT },
    sensor_6: { type: DataTypes.FLOAT },
    sensor_7: { type: DataTypes.FLOAT },
    sensor_8: { type: DataTypes.FLOAT },
    sensor_9: { type: DataTypes.FLOAT },
    sensor_10: { type: DataTypes.FLOAT },
    sensor_11: { type: DataTypes.FLOAT },
    sensor_12: { type: DataTypes.FLOAT },
    sensor_13: { type: DataTypes.FLOAT },
    sensor_14: { type: DataTypes.FLOAT },
    sensor_15: { type: DataTypes.FLOAT },
    sensor_16: { type: DataTypes.FLOAT },
    sensor_17: { type: DataTypes.FLOAT },
    sensor_18: { type: DataTypes.FLOAT },
    sensor_19: { type: DataTypes.FLOAT },
    sensor_20: { type: DataTypes.FLOAT },
    sensor_21: { type: DataTypes.FLOAT },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'sensor_readings',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['engine_id', 'cycle']
        }
    ]
});

module.exports = SensorReading;
