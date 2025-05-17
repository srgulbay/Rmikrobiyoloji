// <timestamp>-update-flashcards-fks-cascade.js dosyasının içeriği
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // FlashCards tablosundaki topicId FK'i için ON DELETE CASCADE
    try {
      await queryInterface.removeConstraint('FlashCards', 'FlashCards_topicId_fkey');
    } catch (e) {
      console.warn("FlashCards_topicId_fkey constraint'i bulunamadı veya kaldırılamadı, CASCADE ile yeniden oluşturulacak.", e.message);
    }
    await queryInterface.changeColumn('FlashCards', 'topicId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Modeldeki tanıma göre
      references: {
        model: 'Topics', 
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // FlashCards tablosundaki examClassificationId FK'i için ON DELETE CASCADE
    try {
      await queryInterface.removeConstraint('FlashCards', 'FlashCards_examClassificationId_fkey');
    } catch (e) {
      console.warn("FlashCards_examClassificationId_fkey constraint'i bulunamadı...", e.message);
    }
    await queryInterface.changeColumn('FlashCards', 'examClassificationId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Modeldeki tanıma göre
      references: { 
        model: 'ExamClassifications', 
        key: 'id' 
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi
    await queryInterface.changeColumn('FlashCards', 'topicId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Topics',
        key: 'id',
      },
      onDelete: 'SET NULL', // Veya önceki varsayılanınız (NO ACTION, RESTRICT)
      onUpdate: 'CASCADE',
    });
    await queryInterface.changeColumn('FlashCards', 'examClassificationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ExamClassifications',
        key: 'id',
      },
      onDelete: 'SET NULL', // Veya önceki varsayılanınız
      onUpdate: 'CASCADE',
    });
    console.log("CASCADE'li FK constraint'leri FlashCards tablosundan kaldırıldı (veya varsayılana dönüldü).");
  }
};