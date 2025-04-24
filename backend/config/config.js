// .env dosyasındaki değişkenleri yüklemek için dotenv'i başta çağırın
require('dotenv').config(); // Bu satır önemli!

module.exports = {
  development: {
    username: process.env.DB_USER, // .env dosyasından oku
    password: process.env.DB_PASS, // .env dosyasından oku
    database: process.env.DB_NAME, // .env dosyasından oku
    host: process.env.DB_HOST,     // .env dosyasından oku
    dialect: process.env.DB_DIALECT // .env dosyasından oku
  },
  test: { // Şimdilik test ve production aynı kalabilir, ileride özelleştirilir
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT
  },
  production: { // Şimdilik test ve production aynı kalabilir, ileride özelleştirilir
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT
  }
};