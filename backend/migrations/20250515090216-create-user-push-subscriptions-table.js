// Örnek <timestamp>-create-user-push-subscriptions-table.js içeriği (up metodu)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserPushSubscriptions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      endpoint: { type: Sequelize.TEXT, allowNull: false, unique: true },
      p256dh: { type: Sequelize.STRING, allowNull: false },
      auth: { type: Sequelize.STRING, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { /* ... tabloyu düşürme kodu ... */ }
};