'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WordleScore extends Model {
    static associate(models) {
      // User ile ilişkiyi tanımla
      WordleScore.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user' // Sorgularda kullanmak için alias
      });
    }
  }
  WordleScore.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'WordleScore',
    // tableName: 'WordleScores' // Gerekirse tablo adını belirt
  });
  return WordleScore;
};