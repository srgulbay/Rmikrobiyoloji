// <timestamp>-update-questions-fks-cascade.js dosyasının içeriği
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Questions tablosundaki topicId FK'i için ON DELETE CASCADE
    try {
      await queryInterface.removeConstraint('Questions', 'Questions_topicId_fkey');
    } catch (e) {
      console.warn("Questions_topicId_fkey constraint'i bulunamadı veya kaldırılamadı, CASCADE ile yeniden oluşturulacak.", e.message);
    }
    await queryInterface.changeColumn('Questions', 'topicId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Eğer Question modelinizde examClassificationId ve branchId doğrudan foreign key olarak varsa
    // ve bunlar için de CASCADE istiyorsanız, benzer changeColumn işlemleri buraya eklenebilir.
    // Örneğin examClassificationId için:
    // try {
    //   await queryInterface.removeConstraint('Questions', 'Questions_examClassificationId_fkey');
    // } catch (e) {
    //   console.warn("Questions_examClassificationId_fkey constraint'i bulunamadı...", e.message);
    // }
    // await queryInterface.changeColumn('Questions', 'examClassificationId', {
    //   type: Sequelize.INTEGER,
    //   allowNull: true, // Modeldeki tanıma göre
    //   references: { model: 'ExamClassifications', key: 'id' },
    //   onDelete: 'CASCADE', // VEYA 'SET NULL'
    //   onUpdate: 'CASCADE',
    // });
    // Benzer şekilde branchId için...
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Questions', 'topicId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics',
        key: 'id',
      },
      onDelete: 'NO ACTION', // Veya önceki varsayılanınız
      onUpdate: 'CASCADE',
    });

    // examClassificationId ve branchId için de geri alma işlemleri (eğer yukarıda eklendiyse)
    // await queryInterface.changeColumn('Questions', 'examClassificationId', { /* ... onDelete: 'NO ACTION' or 'SET NULL' ... */ });
    console.log("CASCADE'li FK constraint'leri Questions tablosundan kaldırıldı (veya varsayılana dönüldü).");
  }
};