'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Topics', // Hedef tablo adı (model adınız Topic olduğu için genellikle Topics'tir)
      'branchId', // Eklenecek sütun adı
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Bir konu opsiyonel olarak bir branşa ait olabilir
                         // Modelde de allowNull: true yapmıştık.
        references: {
          model: 'Branches', // Referans verilen tablo (bir önceki adımda oluşturduğumuz)
          key: 'id',         // Referans verilen tablodaki anahtar sütun
        },
        onUpdate: 'CASCADE', // Branch güncellenirse burası da güncellensin
        onDelete: 'SET NULL', // Branch silinirse bu konunun branchId'si null olsun
                              // (Eğer allowNull: false yapsaydık CASCADE daha uygun olabilirdi)
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Topics', 'branchId');
  }
};