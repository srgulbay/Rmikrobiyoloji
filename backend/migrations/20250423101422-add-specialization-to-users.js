
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    // Users tablosuna specialization sütununu ekle

    await queryInterface.addColumn('Users', 'specialization', {

      type: Sequelize.STRING,

      allowNull: true // Uzmanlık alanı belirtmek zorunlu olmayabilir

    });

  },



  async down (queryInterface, Sequelize) {

    // Geri alma işlemi: Sütunu kaldır

    await queryInterface.removeColumn('Users', 'specialization');

  }

};

