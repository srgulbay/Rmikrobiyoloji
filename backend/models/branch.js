'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      // Bir Branşın birden fazla Konusu (Topic) olabilir
      Branch.hasMany(models.Topic, {
        foreignKey: 'branchId',
        as: 'topics'
      });
      // İleride bir branşın birden fazla Kursu, Denemesi, Kitabı vs. olabilir
      // Branch.hasMany(models.Course, { foreignKey: 'branchId', as: 'courses' });
      // Branch.hasMany(models.MockExam, { foreignKey: 'branchId', as: 'mockExams' });
      // Branch.hasMany(models.Book, { foreignKey: 'branchId', as: 'books' });
    }
  }
  Branch.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Branch',
    // tableName: 'Branches' // İsterseniz tablo adını açıkça belirtebilirsiniz
  });
  return Branch;
};