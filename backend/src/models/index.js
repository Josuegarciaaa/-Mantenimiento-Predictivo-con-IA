const sequelize = require('../config/db');
const User = require('./User');
const Engine = require('./Engine');
const SensorReading = require('./SensorReading');
const Prediction = require('./Prediction');
const Alert = require('./Alert');

// Definir asociaciones
Engine.hasMany(SensorReading, { foreignKey: 'engine_id', as: 'readings', onDelete: 'CASCADE' });
SensorReading.belongsTo(Engine, { foreignKey: 'engine_id', as: 'engine' });

Engine.hasMany(Prediction, { foreignKey: 'engine_id', as: 'predictions', onDelete: 'CASCADE' });
Prediction.belongsTo(Engine, { foreignKey: 'engine_id', as: 'engine' });

Engine.hasMany(Alert, { foreignKey: 'engine_id', as: 'alerts', onDelete: 'CASCADE' });
Alert.belongsTo(Engine, { foreignKey: 'engine_id', as: 'engine' });

module.exports = {
    sequelize,
    User,
    Engine,
    SensorReading,
    Prediction,
    Alert
};
