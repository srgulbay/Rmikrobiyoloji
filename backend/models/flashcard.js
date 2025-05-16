'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FlashCard extends Model {
    static associate(models) {
      // Bir flash kart bir konuya ait olabilir (opsiyonel)
      FlashCard.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        as: 'topic',
        allowNull: true,
        onDelete: 'SET NULL' 
      });
      // Bir flash kart bir sınav sınıflandırmasına ait olabilir (opsiyonel)
      FlashCard.belongsTo(models.ExamClassification, {
        foreignKey: 'examClassificationId',
        as: 'examClassification',
        allowNull: true,
        onDelete: 'SET NULL'
      });
      // Bir flash kart, birçok kullanıcının Leitner kutusunda yer alabilir (UserFlashBox üzerinden)
      FlashCard.hasMany(models.UserFlashBox, {
        foreignKey: 'flashCardId',
        as: 'userFlashBoxEntries'
      });
      // Oluşturan kullanıcı (admin veya ileride kullanıcılar da ekleyebilirse)
      FlashCard.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator',
        allowNull: true, // Sistem tarafından veya anonim de eklenebilir
        onDelete: 'SET NULL'
      });
    }
  }
  FlashCard.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    frontText: { // Kartın ön yüzü
      type: DataTypes.TEXT,
      allowNull: false
    },
    backText: { // Kartın arka yüzü
      type: DataTypes.TEXT,
      allowNull: false
    },
    topicId: { // Bağlı olduğu konu (opsiyonel)
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Topics', // Topics tablosuna referans
        key: 'id'
      }
    },
    examClassificationId: { // Bağlı olduğu sınav tipi (opsiyonel)
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ExamClassifications', 
        key: 'id'
      }
    },
    difficulty: { // Zorluk seviyesi (opsiyonel: 'easy', 'medium', 'hard')
      type: DataTypes.STRING,
      allowNull: true
    },
    source: { // Kaynağı (örn: 'admin_created', 'system_generated', 'user_suggested')
      type: DataTypes.STRING,
      allowNull: true
    },
    creatorId: { // Oluşturan kullanıcı ID'si (opsiyonel)
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
    },
    isActive: { // Flash kart aktif mi, değil mi?
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    // İleride eklenebilir: tags (etiketler), imageURL vb.
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'FlashCard',
    tableName: 'FlashCards'
  });
  return FlashCard;
};
