const { Sequelize } = require('sequelize');
const config = require('../../config/config.js'); // config.js dosyasının doğru yolunu belirtin

// Geliştirme ortamı için yapılandırmayı seç
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Yeni bir Sequelize instance'ı oluştur
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'postgres', // ← BU SATIR EKLENMELİ
  }
);

// Bağlantıyı test etmek için asenkron bir fonksiyon
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarıyla kuruldu.');
  } catch (error) {
    console.error('❌ Veritabanına bağlanılamadı:', error);
    process.exit(1); // Bağlantı hatasında uygulamayı durdur (isteğe bağlı)
  }
};

// sequelize instance'ını ve bağlantı fonksiyonunu dışa aktar
module.exports = { sequelize, connectDB };
