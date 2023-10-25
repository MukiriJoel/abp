const config = require('../../config');
const providers = config.providers;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  const appraisal_reports = sequelize.define(
    'appraisal_reports',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      report_number: {
        type: DataTypes.TEXT,
      },

      date_created: {
        type: DataTypes.DATE,
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

  appraisal_reports.associate = (db) => {
    /// loop through entities and it's fields, and if ref === current e[name] and create relation has many on parent entity

    //end loop

    db.appraisal_reports.belongsTo(db.users, {
      as: 'appraiser',
      foreignKey: {
        name: 'appraiserId',
      },
      constraints: false,
    });

    db.appraisal_reports.belongsTo(db.users, {
      as: 'createdBy',
    });

    db.appraisal_reports.belongsTo(db.users, {
      as: 'updatedBy',
    });
  };

  return appraisal_reports;
};
