'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuestionAttempt extends Model {
    static associate(models) {
      QuestionAttempt.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      QuestionAttempt.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
    }
  }
  QuestionAttempt.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Questions', key: 'id' },
      onDelete: 'CASCADE',
    },
    selectedAnswer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    timeTaken: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    }
  }, {
    sequelize,
    modelName: 'QuestionAttempt',
  });
  return QuestionAttempt;
};