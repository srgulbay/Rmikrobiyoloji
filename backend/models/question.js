'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'topic' });
      Question.hasMany(models.QuestionAttempt, { foreignKey: 'questionId', as: 'attempts' });
      // YENİ İLİŞKİ: Question -> ExamClassification
      Question.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId',
        as: 'examClassification' // İlişki için takma ad
      });
    }
  }
  Question.init({
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    optionA: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionB: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionC: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionD: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    classification: { // Bu alanın adı ExamClassification ile karışabilir. Belki "questionType" gibi bir isim daha iyi olabilirdi. Şimdilik bırakıyorum.
      type: DataTypes.STRING,
      allowNull: true,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Bir konuyla ilişkili olmalı
      references: {
        model: 'Topics',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Konu silinirse bu soruya ait topicId null olur.
    },
    // YENİ ALAN: examClassificationId
    examClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Her soru bir sınav sınıflandırmasına ait olmalı
      references: {
        model: 'ExamClassifications', // ExamClassifications tablosuna referans
        key: 'id',
      },
      onUpdate: 'CASCADE',
      // Sınıflandırma silinirse, o sınıflandırmaya ait sorular da silinsin mi?
      // Genellikle bu tür bir durumda soruların da silinmesi mantıklı olabilir (CASCADE).
      // Veya SET NULL (eğer allowNull: true yapılırsa) veya RESTRICT (silmeyi engeller).
      // Şimdilik CASCADE varsayalım, projenizin mantığına göre değiştirebilirsiniz.
      onDelete: 'CASCADE',
    }
  }, {
    sequelize,
    modelName: 'Question',
    // tableName: 'Questions' // İsterseniz tablo adını açıkça belirtebilirsiniz
  });
  return Question;
};