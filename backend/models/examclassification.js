'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ExamClassification extends Model {
    static associate(models) {
      ExamClassification.hasMany(models.Question, {
        foreignKey: 'examClassificationId',
        as: 'questions'
      });
      ExamClassification.hasMany(models.Lecture, {
        foreignKey: 'examClassificationId',
        as: 'lectures'
      });
      // YENİ EKLENEN İLİŞKİ: ExamClassification -> Topic
      ExamClassification.hasMany(models.Topic, {
        foreignKey: 'examClassificationId',
        as: 'topics' // Takma ad
      });
      // İleride User modeli ile de defaultClassificationId üzerinden bir ilişki kurulabilir
      // ExamClassification.hasMany(models.User, {
      //   foreignKey: 'defaultClassificationId',
      //   as: 'usersWithThisDefault'
      // });
    }
  }
  ExamClassification.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ExamClassification',
  });
  return ExamClassification;
};