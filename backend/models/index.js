'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// config.js dosyasının doğru yolda olduğundan emin olun
// Eğer config.js, backend/config/config.js ise: ../config/config.js
// Eğer config.js, backend/src/config/config.js ise: ../config/config.js (eğer index.js src/models içindeyse)
// Proje yapınıza göre bu yolu DİKKATLİCE ayarlayın!
// Varsayılan olarak Sequelize CLI'nin oluşturduğu yapı: ../config/config.json veya ../config/config.js
const configPath = path.join(__dirname, '/../config/config.js'); // veya config.json

let config;
if (fs.existsSync(configPath)) {
  config = require(configPath)[env];
} else {
  // Alternatif config yolu veya fallback (örneğin .env'den direkt okuma)
  // Bu kısım sizin Sequelize bağlantı yapılandırmanıza göre değişebilir.
  // Eğer DATABASE_URL kullanıyorsanız, config objesi ona göre ayarlanmalı.
  console.warn(`UYARI: ${configPath} bulunamadı. DATABASE_URL kullanılacak (varsa).`);
  if (process.env.DATABASE_URL) {
    config = {
      use_env_variable: 'DATABASE_URL',
      url: process.env.DATABASE_URL,
      dialect: process.env.DB_DIALECT || 'postgres', // DB_DIALECT .env'de olmalı
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false
      },
      logging: false // Veya istediğiniz loglama seviyesi
    };
  } else {
    throw new Error('Veritabanı yapılandırma dosyası bulunamadı ve DATABASE_URL tanımlı değil.');
  }
}

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // Sequelize v6 ve üzeri için: const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    // Eğer eski bir Sequelize sürümü ise: const model = sequelize['import'](path.join(__dirname, file));
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    console.log(`>>> Model yüklendi: ${model.name}`);
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`>>> İlişki kuruluyor: ${modelName}`);
    db[modelName].associate(db);
  }
});

console.log(">>> Tüm model ilişkileri kuruldu (veya denendi).");

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;