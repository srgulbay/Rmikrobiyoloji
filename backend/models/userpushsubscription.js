'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPushSubscription extends Model {
    static associate(models) {
      UserPushSubscription.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    }
  }
  UserPushSubscription.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Users tablosuna referans
        key: 'id',
      },
    },
    endpoint: {
      type: DataTypes.TEXT, 
      allowNull: false,
      unique: true, 
    },
    p256dh: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    auth: {  type: DataTypes.STRING,
allowNull: false,
},
createdAt: {
allowNull: false,
type: DataTypes.DATE
},
updatedAt: {
allowNull: false,
type: DataTypes.DATE
}
}, {
sequelize,
modelName: 'UserPushSubscription', // PascalCase model adı
tableName: 'UserPushSubscriptions' // Çoğul ve PascalCase tablo adı
});
return UserPushSubscription;
};
