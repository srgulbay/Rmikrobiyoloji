// <timestamp>-create-flashcards-table.js dosyasının içeriği
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FlashCards', { // Modeldeki tableName ile aynı olmalı
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      frontText: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      backText: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      topicId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Topics', // Topics tablosuna referans
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Konu silinirse bu alan null olur
      },
      examClassificationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ExamClassifications', // ExamClassifications tablosuna referans
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Sınıflandırma silinirse bu alan null olur
      },
      difficulty: {
        type: Sequelize.STRING,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true
      },
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users', // Users tablosuna referans
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Yazar silinirse bu alan null olur
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable('FlashCards');
  }
};