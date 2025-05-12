'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Topic extends Model {
    static associate(models) {
      Topic.hasMany(models.Question, {
        foreignKey: 'topicId',
        as: 'questions'
      });
      Topic.hasMany(models.Lecture, {
        foreignKey: 'topicId',
        as: 'lectures'
      });
      Topic.belongsTo(models.Topic, {
        foreignKey: 'parentId',
        as: 'parent'
      });
      Topic.hasMany(models.Topic, {
        foreignKey: 'parentId',
        as: 'children'
      });
      Topic.belongsTo(models.Branch, { // Bu ilişki zaten vardı
        foreignKey: 'branchId',
        as: 'branch'
      });
      // YENİ İLİŞKİ: Topic -> ExamClassification
      Topic.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId',
        as: 'examClassification'
      });
    }
  }
  Topic.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Topics',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    branchId: { // Bu alan zaten vardı
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Branches',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    // YENİ ALAN: examClassificationId
    examClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Bir konu genel olabilir veya sınıflandırması olmayabilir.
                       // Zorunlu olması gerekiyorsa allowNull: false yapın.
      references: {
        model: 'ExamClassifications', // ExamClassifications tablosuna referans
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Sınıflandırma silinirse bu konunun alanı null olur.
    }
  }, {
    sequelize,
    modelName: 'Topic',
  });
  return Topic;
};