'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LectureView extends Model {
    static associate(models) {
      // Kullanıcı ile ilişki (Bir görüntüleme bir kullanıcıya aittir)
      LectureView.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user' // İlişki için takma ad
      });
      // Ders ile ilişki (Bir görüntüleme bir derse aittir)
      LectureView.belongsTo(models.Lecture, {
        foreignKey: 'lectureId',
        as: 'lecture' // İlişki için takma ad
      });
    }
  }
  LectureView.init({
    // id, createdAt, updatedAt Sequelize tarafından otomatik yönetilir
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references kısmı model tanımında genellikle gerekli değildir, migration yeterlidir
    },
    lectureId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0 // Süre negatif olamaz
      }
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW // Sequelize'nin NOW fonksiyonu
    }
  }, {
    sequelize,
    modelName: 'LectureView',
    // tableName: 'LectureViews' // Tablo adı farklıysa belirtin
  });
  return LectureView;
};
