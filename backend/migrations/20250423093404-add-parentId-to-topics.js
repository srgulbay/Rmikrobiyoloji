
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    // Topics tablosuna parentId sütununu ekle

    await queryInterface.addColumn('Topics', 'parentId', {

      type: Sequelize.INTEGER,

      allowNull: true, // En üst seviye konuların parentId'si null olacak

      references: {

        model: 'Topics', // Kendi tablosuna referans veriyor

        key: 'id'

      },

      onUpdate: 'CASCADE', // Üst konu ID'si değişirse bu da değişsin

      onDelete: 'SET NULL' // Üst konu silinirse, bu konunun parentId'si NULL olsun (konu silinmesin)

                           // Alternatif: CASCADE (üst konu silinince alt konular da silinsin)

                           // SET NULL genellikle daha güvenlidir.

    });

  },



  async down (queryInterface, Sequelize) {

    // Geri alma işlemi: Sütunu kaldır

    await queryInterface.removeColumn('Topics', 'parentId');

  }

};

