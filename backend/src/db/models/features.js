const config = require('../../config');
const providers = config.providers;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  const features = sequelize.define(
    'features',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      feature_name: {
        type: DataTypes.TEXT,
      },

      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      freezeTableName: true,
    },
  );

  features.associate = (db) => {
    db.features.belongsToMany(db.features, {
      as: 'comparable_properties',
      foreignKey: {
        name: 'features_comparable_propertiesId',
      },
      constraints: false,
      through: 'featuresComparable_propertiesFeatures',
    });

    /// loop through entities and it's fields, and if ref === current e[name] and create relation has many on parent entity

    //end loop

    db.features.belongsTo(db.pdf_forms, {
      as: 'pdf_form',
      foreignKey: {
        name: 'pdf_formId',
      },
      constraints: false,
    });

    db.features.belongsTo(db.users, {
      as: 'createdBy',
    });

    db.features.belongsTo(db.users, {
      as: 'updatedBy',
    });
  };

  return features;
};
