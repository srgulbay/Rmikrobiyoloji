'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Questions tablosundaki examClassificationId sütununu allowNull: false olarak güncelle
    await queryInterface.changeColumn('Questions', 'examClassificationId', {
      type: Sequelize.INTEGER,
      allowNull: false, // Artık boş bırakılamaz
      // Referanslar ve diğer kısıtlamalar addColumn'da zaten tanımlanmıştı,
      // changeColumn sadece belirtilen özellikleri değiştirir.
      // Ancak emin olmak için type ve references'ı tekrar belirtmekte fayda var.
      references: {
        model: 'ExamClassifications',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Modeldeki tanımla tutarlı olmalı
    });
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi: examClassificationId sütununu tekrar allowNull: true yap
    await queryInterface.changeColumn('Questions', 'examClassificationId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Tekrar boş bırakılabilir yap
      references: {
        model: 'ExamClassifications',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};