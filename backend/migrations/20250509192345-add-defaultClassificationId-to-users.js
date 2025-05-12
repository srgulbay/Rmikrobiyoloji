'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Users', // Hedef tablo adı
      'defaultClassificationId', // Eklenecek sütun adı
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Kullanıcı başlangıçta bir sınıflandırma seçmeyebilir
        references: {
          model: 'ExamClassifications', // Referans verilen tablo (bir önceki adımda oluşturduğumuz)
          key: 'id',                   // Referans verilen tablodaki sütun
        },
        onUpdate: 'CASCADE', // ExamClassification güncellenirse burası da güncellensin
        onDelete: 'SET NULL', // ExamClassification silinirse bu alan NULL olsun
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'defaultClassificationId');
  }
};