'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Topic extends Model {
    static associate(models) {
      Topic.belongsTo(models.Branch, {
        foreignKey: 'branchId',
        as: 'branch',
        onDelete: 'CASCADE', // Branş silindiğinde bu konuyu da sil
        allowNull: false // Bir konu bir branşa ait olmalı
      });
      Topic.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId',
        as: 'examClassification',
        onDelete: 'CASCADE', // Sınav Tipi silindiğinde bu konuyu da sil
        allowNull: false // Bir konu bir sınav tipine ait olmalı
      });
      Topic.belongsTo(models.Topic, {
        foreignKey: 'parentId',
        as: 'parentTopic',
        allowNull: true, // Ana konuların parentId'si null olabilir
        onDelete: 'CASCADE' // Üst konu silinirse alt konuları da sil (hiyerarşik silme)
      });
      Topic.hasMany(models.Topic, {
        foreignKey: 'parentId',
        as: 'children',
        onDelete: 'CASCADE' // Bu aslında gereksiz, üstteki yeterli olmalı
      });
      Topic.hasMany(models.Lecture, {
        foreignKey: 'topicId',
        as: 'lectures',
        onDelete: 'CASCADE' // Konu silindiğinde ders anlatımlarını da sil
      });
      Topic.hasMany(models.Question, {
        foreignKey: 'topicId',
        as: 'questions',
        onDelete: 'CASCADE' // Konu silindiğinde soruları da sil
      });
      Topic.hasMany(models.FlashCard, { // Bir konunun birden fazla flash kartı olabilir
        foreignKey: 'topicId',
        as: 'flashCards',
        onDelete: 'CASCADE' // Konu silindiğinde flash kartlarını da sil
      });
      Topic.hasMany(models.UserFlashBox, { // Bir konu SRS'te birden fazla kullanıcı için olabilir
        foreignKey: 'topicId',
        as: 'userFlashBoxEntriesTopic', // Farklı bir alias, UserFlashBox'taki topic ilişkisiyle çakışmasın
        onDelete: 'CASCADE' // Konu silindiğinde SRS girişlerini de sil
      });
    }
  }
  Topic.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
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
        model: 'Topics', // Kendi tablosuna referans
        key: 'id'
      }
      // onDelete: 'CASCADE' burada da belirtilebilir, associate içinde de.
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Branches',
        key: 'id'
      }
      // onDelete: 'CASCADE' associate içinde tanımlandı
    },
    examClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ExamClassifications',
        key: 'id'
      }
      // onDelete: 'CASCADE' associate içinde tanımlandı
    },
    // order: { // Konuların sıralaması için (opsiyonel)
    //   type: DataTypes.INTEGER,
    //   defaultValue: 0
    // },
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
    modelName: 'Topic',
    tableName: 'Topics'
  });
  return Topic;
};
