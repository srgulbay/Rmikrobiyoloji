'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'email', { // Tablo adınızın 'Users' olduğundan emin olun
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
      // E-posta sütununu password'den önce eklemek isterseniz after: 'username' gibi
      // bir seçenek kullanabilirsiniz (veritabanına göre değişir, PostgreSQL'de doğrudan desteklenmez)
      // Genellikle sütun sırası ORM için çok önemli değildir.
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'email');
  }
};