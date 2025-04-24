
'use strict';



/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    await queryInterface.bulkInsert('Lectures', [

      {

        title: 'Mikroorganizmaların Sınıflandırılması',

        content: 'Canlılar alemi genel olarak prokaryotlar ve ökaryotlar olarak ikiye ayrılır...',

        topicId: 1, // Genel Mikrobiyoloji (ID: 1)

        imageUrl: null,

        createdAt: new Date(),

        updatedAt: new Date()

      },

      {

        title: 'Bakteri Hücre Duvarı ve Gram Boyama',

        content: 'Bakterilerin çoğu hücre duvarına sahiptir...',

        topicId: 3, // Bakteriyoloji (ID: 3)

        imageUrl: 'https://example.com/images/gram_positive_negative.jpg',

        createdAt: new Date(),

        updatedAt: new Date()

      },

    ], {});

  },



  async down (queryInterface, Sequelize) {

    await queryInterface.bulkDelete('Lectures', null, {});

  }

};

