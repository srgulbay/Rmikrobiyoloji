// <timestamp>-update-topics-fk-ondelete-cascade.js dosyasının içeriği
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ÖNEMLİ: Bu migration, 'Topics' tablosunun ve ilgili foreign key'lerin
    // zaten var olduğunu varsayar. Sadece ON DELETE davranışını CASCADE olarak günceller.
    // Var olan constraint'leri kaldırıp yeniden eklemek genellikle daha güvenlidir.
    // Constraint adları veritabanınıza ve Sequelize'nin otomatik adlandırmasına göre değişebilir.
    // Önce mevcut constraint adlarını bulmanız gerekebilir (örn: pgAdmin ile).
    // Aşağıdaki adlar varsayımsal Sequelize adlandırmalarıdır.

    // --- parentId için ---
    try {
      // Mevcut parentId FK constraint'ini (varsa) kaldır
      await queryInterface.removeConstraint('Topics', 'Topics_parentId_fkey'); 
    } catch (e) {
      console.log("Topics_parentId_fkey constraint'i bulunamadı veya kaldırılamadı, devam ediliyor.", e.message);
    }
    // Yeni parentId FK constraint'ini ON DELETE CASCADE ile ekle
    await queryInterface.addConstraint('Topics', {
      fields: ['parentId'],
      type: 'foreign key',
      name: 'Topics_parentId_fkey_cascade', // Yeni veya aynı isimde constraint (DB destekliyorsa)
      references: {
        table: 'Topics',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE', // Önerilir
    });

    // --- branchId için ---
    try {
      await queryInterface.removeConstraint('Topics', 'Topics_branchId_fkey');
    } catch (e) {
      console.log("Topics_branchId_fkey constraint'i bulunamadı veya kaldırılamadı, devam ediliyor.", e.message);
    }
    await queryInterface.addConstraint('Topics', {
      fields: ['branchId'],
      type: 'foreign key',
      name: 'Topics_branchId_fkey_cascade',
      references: {
        table: 'Branches', // Referans verilen tablo adı
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // --- examClassificationId için ---
    try {
      await queryInterface.removeConstraint('Topics', 'Topics_examClassificationId_fkey');
    } catch (e) {
      console.log("Topics_examClassificationId_fkey constraint'i bulunamadı veya kaldırılamadı, devam ediliyor.", e.message);
    }
    await queryInterface.addConstraint('Topics', {
      fields: ['examClassificationId'],
      type: 'foreign key',
      name: 'Topics_examClassificationId_fkey_cascade',
      references: {
        table: 'ExamClassifications', // Referans verilen tablo adı
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi: CASCADE'yi kaldırıp varsayılan (NO ACTION veya RESTRICT) davranışa dön
    // Bu işlem, eski constraint adlarının ve varsayılan davranışın bilinmesini gerektirir.
    // Basitlik adına, sadece yeni eklenen (veya üzerine yazılan) CASCADE'li constraint'leri kaldırıyoruz.

    await queryInterface.removeConstraint('Topics', 'Topics_parentId_fkey_cascade');
    // Eski constraint'i (CASCADE olmadan) geri ekleyebilirsiniz, örn:
    // await queryInterface.addConstraint('Topics', { fields: ['parentId'], type: 'foreign key', references: { table: 'Topics', field: 'id' }, onDelete: 'SET NULL' /* veya NO ACTION */ });

    await queryInterface.removeConstraint('Topics', 'Topics_branchId_fkey_cascade');
    // await queryInterface.addConstraint('Topics', { fields: ['branchId'], type: 'foreign key', references: { table: 'Branches', field: 'id' }, onDelete: 'NO ACTION' });

    await queryInterface.removeConstraint('Topics', 'Topics_examClassificationId_fkey_cascade');
    // await queryInterface.addConstraint('Topics', { fields: ['examClassificationId'], type: 'foreign key', references: { table: 'ExamClassifications', field: 'id' }, onDelete: 'NO ACTION' });

    // NOT: Eğer `down` fonksiyonunu daha detaylı yapmak isterseniz,
    // `removeConstraint` sonrası eski constraint'leri (CASCADE olmadan) `addConstraint` ile geri eklemeniz gerekir.
    // Bu, veritabanınızın önceki durumuna tam olarak dönmesini sağlar.
    // Şimdilik sadece yeni eklenen CASCADE'li constraint'leri kaldırıyoruz.
    console.log("CASCADE'li FK constraint'leri Topics tablosundan kaldırıldı. Eski hallerine döndürmek için down fonksiyonunu detaylandırın.");
  }
};