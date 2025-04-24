'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Topic extends Model {
    static associate(models) {
      // Topic <-> Question ilişkisi
      Topic.hasMany(models.Question, {
        foreignKey: 'topicId',
        as: 'questions'
      });
      // Topic <-> Lecture ilişkisi
      Topic.hasMany(models.Lecture, {
        foreignKey: 'topicId',
        as: 'lectures'
      });
      // Topic <-> Topic (Self-referencing) ilişkileri - YENİ EKLENDİ
      // Bir konunun ebeveyni (üst konusu)
      Topic.belongsTo(models.Topic, {
        foreignKey: 'parentId', // Hangi sütun ebeveyni gösteriyor
        as: 'parent'            // İlişkiye 'parent' adıyla eriş
      });
      // Bir konunun çocukları (alt konuları)
      Topic.hasMany(models.Topic, {
        foreignKey: 'parentId', // Hangi sütun bu konuyu ebeveyn olarak gösteriyor
        as: 'children'          // İlişkiye 'children' adıyla eriş
      });
    }
  }
  Topic.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    parentId: DataTypes.INTEGER // parentId alanı eklendi
  }, {
    sequelize,
    modelName: 'Topic',
  });
  return Topic;
};
