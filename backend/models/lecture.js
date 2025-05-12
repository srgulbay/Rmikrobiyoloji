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
      // YENİ İLİŞKİ: Lecture -> ExamClassification
      Lecture.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId',
        as: 'examClassification'
      });
    }
  }
  Lecture.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false // Başlık zorunlu olmalı
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false // İçerik zorunlu olmalı
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    topicId: { // Topic ile ilişki için foreign key
      type: DataTypes.INTEGER,
      allowNull: false, // Her ders bir konuya ait olmalı
      references: {
        model: 'Topics', // Topics tablosuna referans
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Konu silinirse dersler de silinsin (veya SET NULL)
    },
    // YENİ ALAN: examClassificationId
    examClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Her ders bir sınav sınıflandırmasına ait olmalı
      references: {
        model: 'ExamClassifications', // ExamClassifications tablosuna referans
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Sınıflandırma silinirse dersler de silinsin
    }
  }, {
    sequelize,
    modelName: 'Lecture',
    // tableName: 'Lectures' // İsterseniz tablo adını açıkça belirtebilirsiniz
  });
  return Lecture;
};