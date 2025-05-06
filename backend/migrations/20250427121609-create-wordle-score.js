// migrations/XXXXXXXXXXXXXX-create-wordle-score.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WordleScores', { // Tablo adı
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { // Users tablosuna referans
          model: 'Users', // Users tablonuzun adı
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Kullanıcı silinince skorları da sil (veya SET NULL)
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.dropTable('WordleScores');
  }
};