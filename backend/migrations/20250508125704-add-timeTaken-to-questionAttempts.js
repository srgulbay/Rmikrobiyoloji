// migrations/XXXXXXXXXXXXXX-add-timeTaken-to-questionAttempts.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'QuestionAttempts', // Tablo adınız (genellikle model adının çoğulu)
      'timeTaken',        // Eklenecek sütun adı
      {
        type: Sequelize.INTEGER, // Saniye cinsinden süre için INTEGER
        allowNull: true,         // Boş olabilir (frontend göndermezse veya eski kayıtlar için)
        validate: {
          min: 0               // Negatif olamaz
        }
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi: Sütunu kaldır
    await queryInterface.removeColumn('QuestionAttempts', 'timeTaken');
  }
};