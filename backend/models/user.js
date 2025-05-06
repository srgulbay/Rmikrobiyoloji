// src/models/user.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Mevcut ilişki
      User.hasMany(models.QuestionAttempt, { foreignKey: 'userId' });
      // === YENİ EKLENECEK İLİŞKİ ===
      User.hasMany(models.WordleScore, {
          foreignKey: 'userId',
          as: 'wordleScores' // Opsiyonel ama iyi bir pratik
      });
      // =============================
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