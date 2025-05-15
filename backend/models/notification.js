'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
class Notification extends Model {
static associate(models) {
Notification.belongsTo(models.User, {
foreignKey: 'userId',
as: 'user',
onDelete: 'CASCADE'
});
// Opsiyonel: Announcement modeliniz varsa ve ilişki kurmak isterseniz
// Notification.belongsTo(models.Announcement, {
//   foreignKey: 'announcementId',
//   as: 'announcement',
//   allowNull: true,
//   onDelete: 'SET NULL' // Duyuru silinirse bildirimdeki duyuru ID'si null olur
// });
}
}
Notification.init({
id: {
allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER
},
userId: {
type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }
},
type: {
type: DataTypes.STRING, allowNull: false, defaultValue: 'info'
},
title: {
type: DataTypes.STRING, allowNull: true
},
message: {
type: DataTypes.TEXT, allowNull: false
},
link: {
type: DataTypes.STRING, allowNull: true
},
isRead: {
type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
},
// announcementId: { // Eğer Announcement ile ilişki kuracaksanız
//   type: DataTypes.INTEGER,
//   allowNull: true,
//   references: {
//     model: 'Announcements',
//     key: 'id'
//   }
// },
 createdAt: {
allowNull: false, type: DataTypes.DATE
},
updatedAt: {
allowNull: false, type: DataTypes.DATE
}
}, {
sequelize,
modelName: 'Notification',
tableName: 'Notifications'
});
return Notification;
};
