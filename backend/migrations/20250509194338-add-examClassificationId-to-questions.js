'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Questions', // Hedef tablo adı (model adınız Question olduğu için genellikle Questions'dır)
      'examClassificationId', // Eklenecek sütun adı
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Her soru bir sınav sınıflandırmasına ait olmalı
        references: {
          model: 'ExamClassifications', // Referans verilen tablo (bir önceki adımda oluşturduğumuz)
          key: 'id',                    // Referans verilen tablodaki anahtar sütun
        },
        onUpdate: 'CASCADE', // ExamClassification güncellenirse burası da güncellensin
        onDelete: 'CASCADE', // ExamClassification silinirse, o sınıflandırmaya ait sorular da silinsin
                              // (Eğer soruların kalmasını ve bu alanın NULL olmasını isterseniz
                              // modelde allowNull:true yapıp burada onDelete: 'SET NULL' kullanın)
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Questions', 'examClassificationId');
  }
};