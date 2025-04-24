'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.QuestionAttempt, { foreignKey: 'userId' });
    }
  }
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    specialization: DataTypes.STRING
  }, { sequelize, modelName: 'User' });
  return User;
};
