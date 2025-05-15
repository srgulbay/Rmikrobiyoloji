module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Announcements', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      targetAudience: { type: Sequelize.STRING, allowNull: false, defaultValue: 'all_users' },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      scheduledAt: { type: Sequelize.DATE, allowNull: true },
      authorId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
      });
      },
      async down(queryInterface, Sequelize) {
      await queryInterface.dropTable('Announcements');
      }
      };