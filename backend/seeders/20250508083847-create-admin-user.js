'use strict';
const bcrypt = require('bcryptjs'); // bcryptjs kütüphanesini dahil ediyoruz

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const saltRounds = 10; // Şifre hash'leme için salt (karmaşıklık) tur sayısı
    const hashedPassword = await bcrypt.hash('123456', saltRounds); // '123456' şifresini hash'liyoruz

    await queryInterface.bulkInsert('Users', [{ // Tablo adınızın 'Users' olduğundan emin olun
      username: 'Admin',
      password: hashedPassword, // Hash'lenmiş şifreyi kullanıyoruz
      role: 'admin',           // Rolün 'admin' olduğundan emin olun
      specialization: null,    // Veya modelinize uygun bir varsayılan değer, null kabul ediliyorsa null
      createdAt: new Date(),   // Kayıt oluşturma tarihi
      updatedAt: new Date()    // Kayıt güncelleme tarihi
    }], {});
  },

  async down (queryInterface, Sequelize) {
    // Bu seeder'ı geri almak için (Admin kullanıcısını siler)
    await queryInterface.bulkDelete('Users', { username: 'Admin' }, {});
  }
};