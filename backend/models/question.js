'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'topic' });
      Question.hasMany(models.QuestionAttempt, { foreignKey: 'questionId' });
    }
  }
  Question.init({
    text: DataTypes.TEXT, optionA: DataTypes.STRING, optionB: DataTypes.STRING, optionC: DataTypes.STRING, optionD: DataTypes.STRING, optionE: DataTypes.STRING, correctAnswer: DataTypes.STRING, difficulty: DataTypes.STRING, imageUrl: DataTypes.STRING, classification: DataTypes.STRING
  }, { sequelize, modelName: 'Question' });
  return Question;
};
