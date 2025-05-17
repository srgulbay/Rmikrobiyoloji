// <timestamp>-update-lectures-fk-topicid-cascade.js dosyasının içeriği
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Mevcut topicId FK constraint'ini (varsa ve adı biliniyorsa) kaldır
    // Sequelize genellikle 'TableName_columnName_foreign_idx' veya 'TableName_columnName_fkey' gibi adlar kullanır.
    // Eğer özel bir ad verdiyseniz onu kullanın. Hata almamak için try-catch eklenebilir.
    try {
      await queryInterface.removeConstraint('Lectures', 'Lectures_topicId_fkey');
    } catch (e) {
      console.warn("Lectures_topicId_fkey constraint'i bulunamadı veya kaldırılamadı, CASCADE ile yeniden oluşturulacak.", e.message);
    }

    // topicId sütununu ON DELETE CASCADE ile yeniden tanımla veya constraint'i ekle
    // Eğer sütun zaten varsa ve sadece constraint'i değiştirmek istiyorsak,
    // addConstraint daha uygun olabilir, ancak changeColumn da işe yarar.
    await queryInterface.changeColumn('Lectures', 'topicId', {
      type: Sequelize.INTEGER,
      allowNull: false, // Modeldeki allowNull durumunu koru
      references: {
        model: 'Topics', // Referans verilen tablo adı
        key: 'id',
      },
      onDelete: 'CASCADE', // EKLENDİ
      onUpdate: 'CASCADE', // EKLENDİ
    });

    // LectureViews tablosundaki lectureId için de CASCADE ekleyelim
    try {
      await queryInterface.removeConstraint('LectureViews', 'LectureViews_lectureId_fkey');
    } catch (e) {
      console.warn("LectureViews_lectureId_fkey constraint'i bulunamadı veya kaldırılamadı, CASCADE ile yeniden oluşturulacak.", e.message);
    }
    await queryInterface.changeColumn('LectureViews', 'lectureId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Lectures',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi: CASCADE'yi kaldırıp varsayılan (NO ACTION veya RESTRICT) davranışa dön
    await queryInterface.changeColumn('Lectures', 'topicId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics',
        key: 'id',
      },
      onDelete: 'NO ACTION', // Veya önceki durum neyse (örn: SET NULL, RESTRICT)
      onUpdate: 'CASCADE',   // Genellikle CASCADE kalır
    });

    await queryInterface.changeColumn('LectureViews', 'lectureId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Lectures',
            key: 'id',
        },
        onDelete: 'NO ACTION', 
        onUpdate: 'CASCADE',
    });
    console.log("CASCADE'li FK constraint'leri Lectures ve LectureViews tablolarından kaldırıldı (veya varsayılana dönüldü).");
  }
};