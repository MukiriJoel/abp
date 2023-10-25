const db = require('../models');
const FileDBApi = require('./file');
const crypto = require('crypto');
const Utils = require('../utils');

const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

module.exports = class Pdf_formsDBApi {
  static async create(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const pdf_forms = await db.pdf_forms.create(
      {
        id: data.id || undefined,

        form_name: data.form_name || null,
        importHash: data.importHash || null,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await pdf_forms.setAppraiser(data.appraiser || null, {
      transaction,
    });

    return pdf_forms;
  }

  static async bulkImport(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    // Prepare data - wrapping individual data transformations in a map() method
    const pdf_formsData = data.map((item) => ({
      id: item.id || undefined,

      form_name: item.form_name || null,
      importHash: item.importHash || null,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    }));

    // Bulk create items
    const pdf_forms = await db.pdf_forms.bulkCreate(pdf_formsData, {
      transaction,
    });

    // For each item created, replace relation files

    return pdf_forms;
  }

  static async update(id, data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const pdf_forms = await db.pdf_forms.findByPk(id, {
      transaction,
    });

    await pdf_forms.update(
      {
        form_name: data.form_name || null,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await pdf_forms.setAppraiser(data.appraiser || null, {
      transaction,
    });

    return pdf_forms;
  }

  static async remove(id, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const pdf_forms = await db.pdf_forms.findByPk(id, options);

    await pdf_forms.update(
      {
        deletedBy: currentUser.id,
      },
      {
        transaction,
      },
    );

    await pdf_forms.destroy({
      transaction,
    });

    return pdf_forms;
  }

  static async findBy(where, options) {
    const transaction = (options && options.transaction) || undefined;

    const pdf_forms = await db.pdf_forms.findOne({ where }, { transaction });

    if (!pdf_forms) {
      return pdf_forms;
    }

    const output = pdf_forms.get({ plain: true });

    output.features_pdf_form = await pdf_forms.getFeatures_pdf_form({
      transaction,
    });

    output.appraiser = await pdf_forms.getAppraiser({
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
        model: db.users,
        as: 'appraiser',
      },
    ];

    if (filter) {
      if (filter.id) {
        where = {
          ...where,
          ['id']: Utils.uuid(filter.id),
        };
      }

      if (filter.form_name) {
        where = {
          ...where,
          [Op.and]: Utils.ilike('pdf_forms', 'form_name', filter.form_name),
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

      if (filter.appraiser) {
        var listItems = filter.appraiser.split('|').map((item) => {
          return Utils.uuid(item);
        });

        where = {
          ...where,
          appraiserId: { [Op.or]: listItems },
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
          count: await db.pdf_forms.count({
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
      : await db.pdf_forms.findAndCountAll({
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
          Utils.ilike('pdf_forms', 'form_name', query),
        ],
      };
    }

    const records = await db.pdf_forms.findAll({
      attributes: ['id', 'form_name'],
      where,
      limit: limit ? Number(limit) : undefined,
      orderBy: [['form_name', 'ASC']],
    });

    return records.map((record) => ({
      id: record.id,
      label: record.form_name,
    }));
  }
};
