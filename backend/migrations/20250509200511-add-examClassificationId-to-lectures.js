'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Lectures', // Hedef tablo adı
      'examClassificationId', // Eklenecek sütun adı
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Her ders bir sınav sınıflandırmasına ait olmalı
        references: {
          model: 'ExamClassifications', // Referans verilen tablo
          key: 'id',                    // Referans verilen tablodaki anahtar sütun
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // ExamClassification silinirse dersler de silinsin
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Lectures', 'examClassificationId');
  }
};