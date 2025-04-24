'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lecture extends Model {
    static associate(models) {
      Lecture.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        as: 'topic'
      });
    }
  }
  Lecture.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    imageUrl: DataTypes.STRING // YENİ EKLENDİ (allowNull: true varsayılan)
    // topicId ilişkiden geliyor
  }, {
    sequelize,
    modelName: 'Lecture',
  });
  return Lecture;
};
