'use strict';
const {
  Model,
  Op
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserFlashBox extends Model {
    static associate(models) {
      UserFlashBox.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        allowNull: false,
        onDelete: 'CASCADE'
      });
      UserFlashBox.belongsTo(models.FlashCard, {
        foreignKey: 'flashCardId',
        as: 'flashCard',
        allowNull: true,
        onDelete: 'CASCADE' // FlashCard silindiğinde bu UserFlashBox kaydını da sil
      });
      UserFlashBox.belongsTo(models.Question, {
        foreignKey: 'questionId',
        as: 'question',
        allowNull: true,
        onDelete: 'CASCADE' // Soru silindiğinde bu UserFlashBox kaydını da sil
      });
      UserFlashBox.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        as: 'topic', // SRS'te konu özeti/tekrarı için
        allowNull: true,
        onDelete: 'CASCADE' // Konu silindiğinde bu UserFlashBox kaydını da sil
      });
    }
  }
  UserFlashBox.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE' // Bu da eklenebilir, associate ile birlikte
    },
    boxNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 5 }
    },
    lastReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true 
    },
    nextReviewAt: {
      type: DataTypes.DATE,
      allowNull: false 
    },
    isMastered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    flashCardId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'FlashCards', key: 'id' },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'  // Önerilir
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Questions', key: 'id' },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'
    },
    topicId: { 
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Topics', key: 'id' },
      onDelete: 'CASCADE', // EKLENDİ/Teyit Edildi
      onUpdate: 'CASCADE'
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
    modelName: 'UserFlashBox',
    tableName: 'UserFlashBoxes',
    validate: {
      onlyOneItemType() {
        const itemTypesCount = [this.flashCardId, this.questionId, this.topicId].filter(id => id !== null && id !== undefined).length;
        if (itemTypesCount === 0) {
          throw new Error('UserFlashBox kaydı en az bir öğrenme öğesine (flashCardId, questionId, veya topicId) bağlı olmalıdır.');
        }
        if (itemTypesCount > 1) {
          throw new Error('UserFlashBox kaydı aynı anda birden fazla öğrenme öğesine (flashCardId, questionId, topicId) bağlı olamaz.');
        }
      }
    },
    indexes: [ 
        { fields: ['userId', 'boxNumber', 'nextReviewAt'] },
        { fields: ['userId', 'flashCardId'], unique: true, name: 'user_flashcard_srs_unique_idx', where: { flashCardId: {[Op.ne]: null} } }, 
        { fields: ['userId', 'questionId'], unique: true, name: 'user_question_srs_unique_idx', where: { questionId: {[Op.ne]: null} } },
        { fields: ['userId', 'topicId'], unique: true, name: 'user_topic_srs_unique_idx', where: { topicId: {[Op.ne]: null} } }
    ]
  });
  return UserFlashBox;
};
