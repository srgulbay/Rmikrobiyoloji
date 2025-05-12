'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lectures tablosundaki examClassificationId sütununu allowNull: false olarak güncelle
    await queryInterface.changeColumn('Lectures', 'examClassificationId', {
      type: Sequelize.INTEGER,
      allowNull: false, // Artık boş bırakılamaz
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
    await queryInterface.changeColumn('Lectures', 'examClassificationId', {
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