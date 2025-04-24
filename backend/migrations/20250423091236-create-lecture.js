
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Lectures', {

      id: {

        allowNull: false,

        autoIncrement: true,

        primaryKey: true,

        type: Sequelize.INTEGER

      },

      title: {

        type: Sequelize.STRING,

        allowNull: false

      },

      content: {

        type: Sequelize.TEXT,

        allowNull: false

      },

      // --- FOREIGN KEY (topicId) EKLENDİ ---

      topicId: {

        type: Sequelize.INTEGER,

        allowNull: false,

        references: {

          model: 'Topics', // Topics tablosuna bağlanacak

          key: 'id'        // Topics tablosundaki id sütununa

        },

        onUpdate: 'CASCADE',

        onDelete: 'CASCADE' // Konu silinirse, konu anlatımları da silinsin

      },

      // --- FOREIGN KEY SONU ---

      createdAt: {

        allowNull: false,

        type: Sequelize.DATE

      },

      updatedAt: {

        allowNull: false,

        type: Sequelize.DATE

      }

    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('Lectures');

  }

};

