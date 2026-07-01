const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
    // produccion con postgresql
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: process.env.DATABASE_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    });
} else {
    // local con sqlite
    const storagePath = path.join(__dirname, '..', '..', 'database.sqlite');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: storagePath,
        logging: false
    });
}

module.exports = sequelize;
