// migrations/20250517191502-add-examClassificationId-to-branch.js DOSYASININ İÇERİĞİ BU ŞEKİLDE OLMALI:
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'Branches';
    const columnName = 'examClassificationId'; // Modeldeki camelCase veya DB'deki gerçek ad (genellikle case-sensitive değilse lowercase)

    // Sütunun veritabanındaki gerçek adını kontrol etmek için (PostgreSQL için):
    // SELECT column_name FROM information_schema.columns WHERE table_name='Branches' AND column_name='examClassificationId';
    // Veya 'examclassificationid' şeklinde olabilir. Modelinizdeki 'field' opsiyonuna bakın veya DB'den doğrulayın.
    // Hatada "column "examClassificationId" ... already exists" dediği için camelCase kullanıyoruz.
    // Eğer hata "column "examclassificationid" ... already exists" deseydi columnName = 'examclassificationid' olurdu.

    const tableDescription = await queryInterface.describeTable(tableName);

    if (!tableDescription[columnName]) {
      console.log(`Sütun ${columnName} ${tableName} tablosunda bulunamadı, ekleniyor...`);
      await queryInterface.addColumn(tableName, columnName, {
        type: Sequelize.INTEGER,
        allowNull: false, // Modelinize göre ayarlayın (Branch modeli false diyor)
        references: {
          model: 'ExamClassifications', // Referans verilen tablo adı
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // VEYA 'CASCADE' veya 'RESTRICT', modelinize/isteğinize göre
      });
      console.log(`Sütun ${columnName} ${tableName} tablosuna başarıyla eklendi.`);
    } else {
      console.log(`Sütun "${columnName}" zaten "${tableName}" tablosunda mevcut. Ekleme işlemi atlandı.`);
      // Opsiyonel: Sütun var ama foreign key constraint'i veya onDelete/onUpdate farklı olabilir.
      // İsterseniz burada mevcut constraint'i kaldırıp doğru olanı ekleyebilirsiniz.
      // Ancak genellikle sadece addColumn'u atlamak yeterlidir.
      // Örneğin, CASCADE eklemek için:
      // try { await queryInterface.removeConstraint(tableName, `${tableName}_${columnName}_fkey`); } catch(e) {}
      // await queryInterface.addConstraint(tableName, {
      //   fields: [columnName], type: 'foreign key', name: `${tableName}_${columnName}_fkey_cascade`,
      //   references: { table: 'ExamClassifications', field: 'id' },
      //   onDelete: 'CASCADE', onUpdate: 'CASCADE'
      // });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'Branches';
    const columnName = 'examClassificationId';
    // `down` fonksiyonu, `up` fonksiyonunun tam tersini yapmalı.
    // Eğer `up` sütun ekliyorsa, `down` sütunu kaldırmalı.
    // İdempotent `up` fonksiyonu için `down` da idempotent olabilir veya sadece sütunu kaldırmayı dener.
    const tableDescription = await queryInterface.describeTable(tableName);
    if (tableDescription[columnName]) {
        console.log(`Sütun ${columnName} ${tableName} tablosundan kaldırılıyor...`);
        await queryInterface.removeColumn(tableName, columnName);
        console.log(`Sütun ${columnName} ${tableName} tablosundan başarıyla kaldırıldı.`);
    } else {
        console.log(`Sütun "${columnName}" zaten "${tableName}" tablosunda mevcut değil. Kaldırma işlemi atlandı.`);
    }
  }
};