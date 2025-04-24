
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    // Lectures tablosuna imageUrl sütununu ekle

    await queryInterface.addColumn('Lectures', 'imageUrl', {

      type: Sequelize.STRING, // Veya TEXT

      allowNull: true // Görsel zorunlu değil

    });

  },



  async down (queryInterface, Sequelize) {

    // Geri alma işlemi: Sütunu kaldır

    await queryInterface.removeColumn('Lectures', 'imageUrl');

  }

};

