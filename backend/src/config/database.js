const { Sequelize } = require('sequelize');
const config = require('../../config/config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], {
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarıyla kuruldu.');
  } catch (error) {
    console.error('❌ Veritabanına bağlanılamadı:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};