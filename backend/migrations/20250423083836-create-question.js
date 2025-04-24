
'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Questions', {

      id: {

        allowNull: false,

        autoIncrement: true,

        primaryKey: true,

        type: Sequelize.INTEGER

      },

      text: {

        // Soru metni daha uzun olabileceği için TEXT kullanalım

        type: Sequelize.TEXT

      },

      optionA: {

        type: Sequelize.STRING

      },

      optionB: {

        type: Sequelize.STRING

      },

      optionC: {

        type: Sequelize.STRING

      },

      optionD: {

        type: Sequelize.STRING

      },

      correctAnswer: {

        // Doğru cevap genellikle tek harf (A,B,C,D) olabilir, STRING yeterli

        type: Sequelize.STRING

      },

      difficulty: {

        // Zorluk seviyesi (easy, medium, hard gibi)

        type: Sequelize.STRING

      },

      // --- FOREIGN KEY (topicId) EKLENDİ ---

      topicId: {

        type: Sequelize.INTEGER, // Veri tipi Integer

        allowNull: false,       // Boş olamaz

        references: {           // Foreign key ilişkisi

          model: 'Topics',      // Topics tablosuna bağlanacak

          key: 'id'             // Topics tablosundaki id sütununa

        },

        onUpdate: 'CASCADE',    // Ana tablodaki id güncellenirse, bu da güncellenir

        onDelete: 'CASCADE'     // Ana tablodan konu silinirse, bu sorular da silinir

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

    await queryInterface.dropTable('Questions');

  }

};

