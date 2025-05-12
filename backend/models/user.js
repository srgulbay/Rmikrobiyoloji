'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.QuestionAttempt, { foreignKey: 'userId', as: 'QuestionAttempts' });
      User.hasMany(models.WordleScore, {
          foreignKey: 'userId',
          as: 'wordleScores'
      });
      User.hasMany(models.LectureView, {
          foreignKey: 'userId',
          as: 'lectureViews'
      });
      User.belongsTo(models.ExamClassification, {
        foreignKey: 'defaultClassificationId',
        as: 'defaultClassification',
        allowNull: true
      });
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    emailVerificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    passwordResetTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    defaultClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ExamClassifications',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};