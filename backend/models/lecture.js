'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lecture extends Model {
    static associate(models) {
      Lecture.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        as: 'topic',
        onDelete: 'CASCADE', // Konu silindiğinde bu ders anlatımını da sil
        allowNull: false
      });
      Lecture.belongsTo(models.User, { // Ders anlatımını oluşturan (opsiyonel)
        foreignKey: 'authorId',
        as: 'author',
        allowNull: true, // Sistem veya genel içerik olabilir
        onDelete: 'SET NULL'
      });
      // Bir ders anlatımı için birden fazla görüntüleme kaydı olabilir
      Lecture.hasMany(models.LectureView, {
        foreignKey: 'lectureId',
        as: 'views',
        onDelete: 'CASCADE' // Ders silindiğinde görüntüleme kayıtlarını da sil
      });
    }
  }
  Lecture.init({
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
      type: DataTypes.TEXT, // Zengin metin editörü için TEXT daha uygun
      allowNull: false
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageUrl: { // Ders için ana görsel (opsiyonel)
      type: DataTypes.STRING,
      allowNull: true
    },
    order: { // Konu içindeki sıralaması
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics', // Topics tablosuna referans
        key: 'id'
      },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'  // Önerilir
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    isActive: { // Ders anlatımı aktif mi?
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    // examClassificationId ve branchId alanları lecture'da genellikle olmaz,
    // bunlar topic üzerinden gelir. Eğer özel bir durumunuz varsa eklenebilir.
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
    modelName: 'Lecture',
    tableName: 'Lectures'
  });
  return Lecture;
};
