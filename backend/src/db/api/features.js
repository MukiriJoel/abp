const db = require('../models');
const FileDBApi = require('./file');
const crypto = require('crypto');
const Utils = require('../utils');

const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

module.exports = class FeaturesDBApi {
  static async create(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const features = await db.features.create(
      {
        id: data.id || undefined,

        feature_name: data.feature_name || null,
        importHash: data.importHash || null,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await features.setPdf_form(data.pdf_form || null, {
      transaction,
    });

    await features.setComparable_properties(data.comparable_properties || [], {
      transaction,
    });

    return features;
  }

  static async bulkImport(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    // Prepare data - wrapping individual data transformations in a map() method
    const featuresData = data.map((item) => ({
      id: item.id || undefined,

      feature_name: item.feature_name || null,
      importHash: item.importHash || null,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    }));

    // Bulk create items
    const features = await db.features.bulkCreate(featuresData, {
      transaction,
    });

    // For each item created, replace relation files

    return features;
  }

  static async update(id, data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const features = await db.features.findByPk(id, {
      transaction,
    });

    await features.update(
      {
        feature_name: data.feature_name || null,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await features.setPdf_form(data.pdf_form || null, {
      transaction,
    });

    await features.setComparable_properties(data.comparable_properties || [], {
      transaction,
    });

    return features;
  }

  static async remove(id, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const features = await db.features.findByPk(id, options);

    await features.update(
      {
        deletedBy: currentUser.id,
      },
      {
        transaction,
      },
    );

    await features.destroy({
      transaction,
    });

    return features;
  }

  static async findBy(where, options) {
    const transaction = (options && options.transaction) || undefined;

    const features = await db.features.findOne({ where }, { transaction });

    if (!features) {
      return features;
    }

    const output = features.get({ plain: true });

    output.pdf_form = await features.getPdf_form({
      transaction,
    });

    output.comparable_properties = await features.getComparable_properties({
      transaction,
    });

    return output;
  }

  static async findAll(filter, options) {
    var limit = filter.limit || 0;
    var offset = 0;
    const currentPage = +filter.page;

    offset = currentPage * limit;

    var orderBy = null;

    const transaction = (options && options.transaction) || undefined;
    let where = {};
    let include = [
      {
        model: db.pdf_forms,
        as: 'pdf_form',
      },

      {
        model: db.features,
        as: 'comparable_properties',
        through: filter.comparable_properties
          ? {
              where: {
                [Op.or]: filter.comparable_properties.split('|').map((item) => {
                  return { ['Id']: Utils.uuid(item) };
                }),
              },
            }
          : null,
        required: filter.comparable_properties ? true : null,
      },
    ];

    if (filter) {
      if (filter.id) {
        where = {
          ...where,
          ['id']: Utils.uuid(filter.id),
        };
      }

      if (filter.feature_name) {
        where = {
          ...where,
          [Op.and]: Utils.ilike(
            'features',
            'feature_name',
            filter.feature_name,
          ),
        };
      }

      if (
        filter.active === true ||
        filter.active === 'true' ||
        filter.active === false ||
        filter.active === 'false'
      ) {
        where = {
          ...where,
          active: filter.active === true || filter.active === 'true',
        };
      }

      if (filter.pdf_form) {
        var listItems = filter.pdf_form.split('|').map((item) => {
          return Utils.uuid(item);
        });

        where = {
          ...where,
          pdf_formId: { [Op.or]: listItems },
        };
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange;

        if (start !== undefined && start !== null && start !== '') {
          where = {
            ...where,
            ['createdAt']: {
              ...where.createdAt,
              [Op.gte]: start,
            },
          };
        }

        if (end !== undefined && end !== null && end !== '') {
          where = {
            ...where,
            ['createdAt']: {
              ...where.createdAt,
              [Op.lte]: end,
            },
          };
        }
      }
    }

    let { rows, count } = options?.countOnly
      ? {
          rows: [],
          count: await db.features.count({
            where,
            include,
            distinct: true,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            order:
              filter.field && filter.sort
                ? [[filter.field, filter.sort]]
                : [['createdAt', 'desc']],
            transaction,
          }),
        }
      : await db.features.findAndCountAll({
          where,
          include,
          distinct: true,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          order:
            filter.field && filter.sort
              ? [[filter.field, filter.sort]]
              : [['createdAt', 'desc']],
          transaction,
        });

    //    rows = await this._fillWithRelationsAndFilesForRows(
    //      rows,
    //      options,
    //    );

    return { rows, count };
  }

  static async findAllAutocomplete(query, limit) {
    let where = {};

    if (query) {
      where = {
        [Op.or]: [
          { ['id']: Utils.uuid(query) },
          Utils.ilike('features', 'feature_name', query),
        ],
      };
    }

    const records = await db.features.findAll({
      attributes: ['id', 'feature_name'],
      where,
      limit: limit ? Number(limit) : undefined,
      orderBy: [['feature_name', 'ASC']],
    });

    return records.map((record) => ({
      id: record.id,
      label: record.feature_name,
    }));
  }
};
