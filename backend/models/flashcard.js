'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FlashCard extends Model {
    static associate(models) {
      FlashCard.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        as: 'topic',
        onDelete: 'CASCADE', // Konu silindiğinde bu flash kartı da sil
        allowNull: true 
      });
      FlashCard.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId',
        as: 'examClassification',
        onDelete: 'CASCADE', // Sınav tipi silindiğinde bu flash kartı da sil
        allowNull: true
      });
      FlashCard.hasMany(models.UserFlashBox, {
        foreignKey: 'flashCardId',
        as: 'userFlashBoxEntries',
        onDelete: 'CASCADE' // Flash kart silindiğinde SRS girişlerini de sil
      });
      FlashCard.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator',
        allowNull: true,
        onDelete: 'SET NULL'
      });
    }
  }
  FlashCard.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    frontText: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    backText: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Topics', 
        key: 'id'
      },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'  // Önerilir
    },
    examClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ExamClassifications', 
        key: 'id'
      },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'
    },
    difficulty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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
    modelName: 'FlashCard',
    tableName: 'FlashCards'
  });
  return FlashCard;
};
