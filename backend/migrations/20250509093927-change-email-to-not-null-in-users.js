'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Users tablosundaki email sütununu allowNull: false olarak güncelle
    await queryInterface.changeColumn('Users', 'email', { // Tablo adınızın 'Users' olduğundan emin olun
      type: Sequelize.STRING,
      allowNull: false, // Artık boş bırakılamaz
      unique: true,     // Benzersizlik kısıtlaması devam etmeli
      validate: {       // Modeldeki doğrulama ile tutarlı olmalı
        isEmail: true,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi: email sütununu tekrar allowNull: true yap
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true, // Tekrar boş bırakılabilir yap
      unique: true,
      validate: {
        isEmail: true,
      }
    });
  }
};