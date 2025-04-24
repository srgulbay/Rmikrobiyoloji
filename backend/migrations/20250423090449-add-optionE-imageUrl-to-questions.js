
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    // Questions tablosuna optionE sütununu ekle

    await queryInterface.addColumn('Questions', 'optionE', {

      type: Sequelize.STRING,

      allowNull: true // 5. seçenek her zaman zorunlu olmayabilir, null olabilir

    });

    // Questions tablosuna imageUrl sütununu ekle

    await queryInterface.addColumn('Questions', 'imageUrl', {

      type: Sequelize.STRING, // Veya daha uzun URL'ler için Sequelize.TEXT

      allowNull: true // Görsel eklemek zorunlu değil

    });

  },



  async down (queryInterface, Sequelize) {

    // Geri alma işlemi: Sütunları kaldır

    await queryInterface.removeColumn('Questions', 'imageUrl');

    await queryInterface.removeColumn('Questions', 'optionE');

  }

};

