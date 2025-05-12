'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Topics', // Hedef tablo adı (model adınız Topic olduğu için genellikle Topics'tir)
      'examClassificationId', // Eklenecek sütun adı
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Bir konu opsiyonel olarak bir sınav sınıflandırmasına ait olabilir
                         // Modelde de allowNull: true yapmıştık.
        references: {
          model: 'ExamClassifications', // Referans verilen tablo
          key: 'id',                    // Referans verilen tablodaki anahtar sütun
        },
        onUpdate: 'CASCADE', // ExamClassification güncellenirse burası da güncellensin
        onDelete: 'SET NULL', // ExamClassification silinirse bu konunun alanı null olsun
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Topics', 'examClassificationId');
  }
};