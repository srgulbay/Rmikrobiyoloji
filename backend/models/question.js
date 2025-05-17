'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        as: 'topic',
        onDelete: 'CASCADE', // Konu silindiğinde bu soruyu da sil
        allowNull: false
      });
      Question.belongsTo(models.User, { // Soruyu oluşturan (opsiyonel)
        foreignKey: 'authorId',
        as: 'author',
        allowNull: true,
        onDelete: 'SET NULL'
      });
      Question.belongsTo(models.ExamClassification, { // Sorunun ait olduğu sınav tipi (opsiyonel, genellikle Topic üzerinden gelir)
        foreignKey: 'examClassificationId',
        as: 'examClassification',
        onDelete: 'SET NULL', // Veya CASCADE, eğer sınav tipi silinince sorular da silinsin isteniyorsa
        allowNull: true 
      });
      Question.belongsTo(models.Branch, { // Sorunun ait olduğu branş (opsiyonel, genellikle Topic üzerinden gelir)
        foreignKey: 'branchId',
        as: 'branch',
        onDelete: 'SET NULL', // Veya CASCADE
        allowNull: true
      });
      // Bir sorunun birden fazla deneme kaydı olabilir
      Question.hasMany(models.QuestionAttempt, {
        foreignKey: 'questionId',
        as: 'attempts',
        onDelete: 'CASCADE' // Soru silindiğinde tüm denemelerini de sil
      });
      // Bir soru, birçok kullanıcının Leitner kutusunda yer alabilir
      Question.hasMany(models.UserFlashBox, {
        foreignKey: 'questionId',
        as: 'userFlashBoxEntries',
        onDelete: 'CASCADE' // Soru silindiğinde SRS girişlerini de sil
      });
    }
  }
  Question.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    text: { // Soru metni
      type: DataTypes.TEXT,
      allowNull: false
    },
    optionA: { type: DataTypes.TEXT, allowNull: true },
    optionB: { type: DataTypes.TEXT, allowNull: true },
    optionC: { type: DataTypes.TEXT, allowNull: true },
    optionD: { type: DataTypes.TEXT, allowNull: true },
    optionE: { type: DataTypes.TEXT, allowNull: true }, // Eğer 5. seçenek yoksa bu alan allowNull: true olmalı
    correctAnswer: { // 'A', 'B', 'C', 'D', 'E'
      type: DataTypes.STRING,
      allowNull: false
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: { // Soru için görsel (opsiyonel)
      type: DataTypes.STRING,
      allowNull: true
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics', 
        key: 'id'
      },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'
    },
    examClassificationId: { // Doğrudan soruya sınav tipi bağlamak için (opsiyonel)
      type: DataTypes.INTEGER,
      allowNull: true, // Genellikle topic üzerinden gelir, bu yüzden null olabilir
      references: {
        model: 'ExamClassifications',
        key: 'id'
      },
      onDelete: 'SET NULL', // Veya CASCADE
      onUpdate: 'CASCADE'
    },
    branchId: { // Doğrudan soruya branş bağlamak için (opsiyonel)
      type: DataTypes.INTEGER,
      allowNull: true, // Genellikle topic üzerinden gelir
      references: {
        model: 'Branches',
        key: 'id'
      },
      onDelete: 'SET NULL', // Veya CASCADE
      onUpdate: 'CASCADE'
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
    difficulty: { // 'easy', 'medium', 'hard'
      type: DataTypes.STRING,
      allowNull: true
    },
    classification: { // 'case_study', 'fact_based', 'image_based', 'tus_like' etc.
        type: DataTypes.STRING,
        allowNull: true,
    },
    tags: { // JSONB veya TEXT olarak etiketler
        type: DataTypes.JSONB, // PostgreSQL için JSONB daha iyidir
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
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
    modelName: 'Question',
    tableName: 'Questions'
  });
  return Question;
};
