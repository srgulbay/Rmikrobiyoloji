'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'isEmailVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Users', 'emailVerificationToken', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('Users', 'emailVerificationTokenExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'passwordResetToken', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('Users', 'passwordResetTokenExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'isEmailVerified');
    await queryInterface.removeColumn('Users', 'emailVerificationToken');
    await queryInterface.removeColumn('Users', 'emailVerificationTokenExpires');
    await queryInterface.removeColumn('Users', 'passwordResetToken');
    await queryInterface.removeColumn('Users', 'passwordResetTokenExpires');
  }
};