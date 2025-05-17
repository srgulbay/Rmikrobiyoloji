'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Branches', 'examClassificationId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'ExamClassifications', // tablo adı büyük ihtimalle bu
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Branches', 'examClassificationId');
  }
};