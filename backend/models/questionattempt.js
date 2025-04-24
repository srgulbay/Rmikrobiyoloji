'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuestionAttempt extends Model {
    static associate(models) {
      QuestionAttempt.belongsTo(models.User, { foreignKey: 'userId' });
      QuestionAttempt.belongsTo(models.Question, { foreignKey: 'questionId' });
    }
  }
  QuestionAttempt.init({
    userId: DataTypes.INTEGER,
    questionId: DataTypes.INTEGER,
    selectedAnswer: DataTypes.STRING,
    isCorrect: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'QuestionAttempt',
  });
  return QuestionAttempt;
};
