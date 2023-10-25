const config = require('../../config');
const providers = config.providers;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  const pdf_forms = sequelize.define(
    'pdf_forms',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      form_name: {
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

  pdf_forms.associate = (db) => {
    /// loop through entities and it's fields, and if ref === current e[name] and create relation has many on parent entity

    db.pdf_forms.hasMany(db.features, {
      as: 'features_pdf_form',
      foreignKey: {
        name: 'pdf_formId',
      },
      constraints: false,
    });

    //end loop

    db.pdf_forms.belongsTo(db.users, {
      as: 'appraiser',
      foreignKey: {
        name: 'appraiserId',
      },
      constraints: false,
    });

    db.pdf_forms.belongsTo(db.users, {
      as: 'createdBy',
    });

    db.pdf_forms.belongsTo(db.users, {
      as: 'updatedBy',
    });
  };

  return pdf_forms;
};
