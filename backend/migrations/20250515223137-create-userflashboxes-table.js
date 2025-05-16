// <timestamp>-create-userflashboxes-table.js dosyasının içeriği
'use strict';
const { Op } = require('sequelize'); // Op importu indexler için gerekebilir

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserFlashBoxes', { // Modeldeki tableName ile aynı olmalı
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      boxNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      lastReviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextReviewAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isMastered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      flashCardId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FlashCards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Flash kart silinirse bu SRS kaydı da silinsin
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Soru silinirse bu SRS kaydı da silinsin
      },
      topicId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Topics',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Konu silinirse bu SRS kaydı da silinsin
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

    // Index'leri ekleyelim
    await queryInterface.addIndex('UserFlashBoxes', ['userId', 'boxNumber', 'nextReviewAt']);

    // Bir kullanıcının aynı öğeyi birden fazla kez eklemesini önlemek için unique indexler
    // Bu indexler, ilgili ID alanı null olmadığında çalışır (PostgreSQL için geçerli)
    await queryInterface.addIndex('UserFlashBoxes', ['userId', 'flashCardId'], {
      unique: true,
      name: 'user_flashcard_unique_idx',
      where: { flashCardId: { [Op.ne]: null } } // Op importu burada kullanılır
    });
    await queryInterface.addIndex('UserFlashBoxes', ['userId', 'questionId'], {
      unique: true,
      name: 'user_question_unique_idx',
      where: { questionId: { [Op.ne]: null } }
    });
    await queryInterface.addIndex('UserFlashBoxes', ['userId', 'topicId'], {
      unique: true,
      name: 'user_topic_unique_idx',
      where: { topicId: { [Op.ne]: null } }
    });
  },
  async down(queryInterface, Sequelize) {
    // Index'leri silerken isimlerini belirtmek iyi bir pratiktir.
    await queryInterface.removeIndex('UserFlashBoxes', 'user_flashcard_unique_idx');
    await queryInterface.removeIndex('UserFlashBoxes', 'user_question_unique_idx');
    await queryInterface.removeIndex('UserFlashBoxes', 'user_topic_unique_idx');
    await queryInterface.removeIndex('UserFlashBoxes', ['userId', 'boxNumber', 'nextReviewAt']); // Bu index'e isim vermediğimiz için alanlarla siliyoruz
    await queryInterface.dropTable('UserFlashBoxes');
  }
};