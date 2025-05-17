// <timestamp>-update-userflashboxes-fks-cascade.js dosyasının içeriği
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'UserFlashBoxes';

    // flashCardId için
    try {
      await queryInterface.removeConstraint(tableName, 'UserFlashBoxes_flashCardId_fkey');
    } catch (e) { console.warn("UserFlashBoxes_flashCardId_fkey constraint'i bulunamadı veya kaldırılamadı.", e.message); }
    await queryInterface.changeColumn(tableName, 'flashCardId', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'FlashCards', key: 'id' },
      onDelete: 'CASCADE', onUpdate: 'CASCADE',
    });

    // questionId için
    try {
      await queryInterface.removeConstraint(tableName, 'UserFlashBoxes_questionId_fkey');
    } catch (e) { console.warn("UserFlashBoxes_questionId_fkey constraint'i bulunamadı veya kaldırılamadı.", e.message); }
    await queryInterface.changeColumn(tableName, 'questionId', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'Questions', key: 'id' },
      onDelete: 'CASCADE', onUpdate: 'CASCADE',
    });

    // topicId için
    try {
      await queryInterface.removeConstraint(tableName, 'UserFlashBoxes_topicId_fkey');
    } catch (e) { console.warn("UserFlashBoxes_topicId_fkey constraint'i bulunamadı veya kaldırılamadı.", e.message); }
    await queryInterface.changeColumn(tableName, 'topicId', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'Topics', key: 'id' },
      onDelete: 'CASCADE', onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'UserFlashBoxes';
    // CASCADE'yi kaldırıp varsayılan (örn: NO ACTION veya SET NULL) davranışa dön
    await queryInterface.changeColumn(tableName, 'flashCardId', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'FlashCards', key: 'id' },
      onDelete: 'NO ACTION', onUpdate: 'CASCADE', // Veya önceki durum neyse
    });
    await queryInterface.changeColumn(tableName, 'questionId', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'Questions', key: 'id' },
      onDelete: 'NO ACTION', onUpdate: 'CASCADE',
    });
    await queryInterface.changeColumn(tableName, 'topicId', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'Topics', key: 'id' },
      onDelete: 'NO ACTION', onUpdate: 'CASCADE',
    });
    console.log("CASCADE'li FK constraint'leri UserFlashBoxes tablosundan kaldırıldı.");
  }
};