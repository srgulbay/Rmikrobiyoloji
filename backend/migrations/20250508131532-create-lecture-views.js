// migrations/XXXXXXXXXXXXXX-create-lecture-views.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LectureViews', { // Tablo adı: LectureViews
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
          model: 'Users', // Users tablosuna referans
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Kullanıcı silinince görüntüleme kayıtları da silinsin
      },
      lectureId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Lectures', // Lectures tablosuna referans
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Ders silinince görüntüleme kayıtları da silinsin
      },
      duration: {
        type: Sequelize.INTEGER, // Saniye cinsinden süre
        allowNull: false
      },
      viewedAt: { // Görüntülemenin ne zaman bittiğini veya kaydedildiğini gösterir
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Varsayılan olarak şu anki zaman
      },
      createdAt: { // Sequelize standart alanları
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: { // Sequelize standart alanları
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    // Performans için index ekleyebiliriz
    await queryInterface.addIndex('LectureViews', ['userId']);
    await queryInterface.addIndex('LectureViews', ['lectureId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LectureViews');
  }
};