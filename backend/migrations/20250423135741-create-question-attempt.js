
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('QuestionAttempts', {

      id: {

        allowNull: false,

        autoIncrement: true,

        primaryKey: true,

        type: Sequelize.INTEGER

      },

      userId: {

        type: Sequelize.INTEGER,

        allowNull: false,

        references: { model: 'Users', key: 'id' },

        onUpdate: 'CASCADE',

        onDelete: 'CASCADE' // Kullanıcı silinirse denemeleri de silinsin

      },

      questionId: {

        type: Sequelize.INTEGER,

        allowNull: false,

        references: { model: 'Questions', key: 'id' },

        onUpdate: 'CASCADE',

        onDelete: 'CASCADE' // Soru silinirse denemeleri de silinsin

      },

      selectedAnswer: {

        type: Sequelize.STRING, // 'A', 'B', 'C', 'D', 'E'

        allowNull: false

      },

      isCorrect: {

        type: Sequelize.BOOLEAN,

        allowNull: false

      },

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

    await queryInterface.dropTable('QuestionAttempts');

  }

};

