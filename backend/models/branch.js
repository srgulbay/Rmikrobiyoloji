'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      Branch.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId', // Bu, JavaScript kodunda kullanılacak alan adı (camelCase)
        as: 'examClassification'
      });
      Branch.hasMany(models.Topic, {
        foreignKey: 'branchId',
        as: 'topics'
      });
    }
  }
  Branch.init({
    id: { // id sütununu da modelde tanımlamak iyi bir pratiktir
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // Bu unique constraint'in migration'da da olduğundan emin olun
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true // Opsiyonel olduğunu varsayıyorum
    },
    examClassificationId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Veritabanında NOT NULL
      field: 'examclassificationid', // YENİ: Veritabanındaki gerçek küçük harfli sütun adını belirtir
      references: {
        model: 'ExamClassifications', // Bu, ExamClassifications tablosunun adı olmalı
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Eğer bir sınav tipi silinirse, ona bağlı branşlar da silinsin (veya SET NULL)
    }
    // createdAt ve updatedAt Sequelize tarafından otomatik eklenir, 
    // ancak açıkça tanımlamak isterseniz:
    // createdAt: {
    //   allowNull: false,
    //   type: DataTypes.DATE
    // },
    // updatedAt: {
    //   allowNull: false,
    //   type: DataTypes.DATE
    // }
  }, {
    sequelize,
    modelName: 'Branch',
    tableName: 'Branches', // Veritabanındaki tablo adı
    // Eğer createdAt ve updatedAt sütun adlarınız farklıysa (örn: created_at),
    // underscored: true, veya field seçenekleriyle belirtmeniz gerekir.
    // Varsayılan olarak camelCase (createdAt, updatedAt) beklenir.
  });
  return Branch;
};
