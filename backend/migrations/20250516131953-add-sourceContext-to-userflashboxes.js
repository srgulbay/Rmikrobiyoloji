'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserFlashBoxes', 'sourceContext', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'INDIVIDUAL', // Varsayılan: Bireysel eklendi
      comment: 'SRS öğesinin kaynağı: INDIVIDUAL, TOPIC_DERIVED, BRANCH_DERIVED'
    });
    // İsteğe bağlı: Bu yeni sütun üzerinde bir indeks oluşturmak sorguları hızlandırabilir.
    await queryInterface.addIndex('UserFlashBoxes', ['userId', 'sourceContext', 'nextReviewAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('UserFlashBoxes', ['userId', 'sourceContext', 'nextReviewAt']);
    await queryInterface.removeColumn('UserFlashBoxes', 'sourceContext');
  }
};