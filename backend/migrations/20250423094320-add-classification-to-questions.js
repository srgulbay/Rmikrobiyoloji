
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    // Questions tablosuna classification sütununu ekle

    await queryInterface.addColumn('Questions', 'classification', {

      type: Sequelize.STRING,

      allowNull: true // Sınıflandırma zorunlu olmayabilir, null olabilir

                       // Veya: allowNull: false, defaultValue: 'Çalışma Sorusu'

    });

  },



  async down (queryInterface, Sequelize) {

    // Geri alma işlemi: Sütunu kaldır

    await queryInterface.removeColumn('Questions', 'classification');

  }

};

