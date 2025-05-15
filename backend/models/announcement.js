'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    static associate(models) {
      // Bir duyuru bir admin/kullanıcı tarafından oluşturulur
      Announcement.belongsTo(models.User, { // User modelinizin adının 'User' olduğunu varsayıyorum
        foreignKey: 'authorId',
        as: 'author'
      });
      // İleride bir duyuru birden fazla bildirimle ilişkili olabilir (opsiyonel)
      // Announcement.hasMany(models.Notification, {
      //   foreignKey: 'announcementId',
      //   as: 'notifications'
      // });
    }
  }
  Announcement.init({
    id: {
    allowNull: false,
     autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
    },
    title: {
    type: DataTypes.STRING,
    allowNull: false
    },
    content: {
    type: DataTypes.TEXT,
    allowNull: false
    },
    targetAudience: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'all_users' // Örn: 'all_users', 'specific_exam_group_XYZ' vb.
    },
    isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
    },
    scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true // İleri tarihli yayınlama için
    },
    authorId: { // Duyuruyu oluşturan admin/kullanıcı
    type: DataTypes.INTEGER,
    allowNull: true, // Sistem duyuruları için null olabilir veya zorunluysa false
    references: {
    model: 'Users', // Users tablosuna referans
    key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL' // Yazar silinirse duyurunun yazarı null olur
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
    modelName: 'Announcement',
    tableName: 'Announcements' // Tablo adını açıkça belirtelim
    });
    return Announcement;
    };