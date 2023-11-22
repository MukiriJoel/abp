const db = require('../models');
const FileDBApi = require('./file');
const crypto = require('crypto');
const Utils = require('../utils');

const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

module.exports = class Appraisal_summaryDBApi {
  static async create(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const appraisal_summary = await db.appraisal_summary.create(
      {
        id: data.id || undefined,

        report_number: data.report_number || null,
        date_created: data.date_created || null,
        importHash: data.importHash || null,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await appraisal_summary.setAppraiser(data.appraiser || null, {
      transaction,
    });

    return appraisal_summary;
  }

  static async bulkImport(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    // Prepare data - wrapping individual data transformations in a map() method
    const appraisal_summaryData = data.map((item) => ({
      id: item.id || undefined,

      report_number: item.report_number || null,
      date_created: item.date_created || null,
      importHash: item.importHash || null,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    }));

    // Bulk create items
    const appraisal_summary = await db.appraisal_summary.bulkCreate(
      appraisal_summaryData,
      { transaction },
    );

    // For each item created, replace relation files

    return appraisal_summary;
  }

  static async update(id, data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const appraisal_summary = await db.appraisal_summary.findByPk(id, {
      transaction,
    });

    await appraisal_summary.update(
      {
        report_number: data.report_number || null,
        date_created: data.date_created || null,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await appraisal_summary.setAppraiser(data.appraiser || null, {
      transaction,
    });

    return appraisal_summary;
  }

  static async remove(id, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const appraisal_summary = await db.appraisal_summary.findByPk(id, options);

    await appraisal_summary.update(
      {
        deletedBy: currentUser.id,
      },
      {
        transaction,
      },
    );

    await appraisal_summary.destroy({
      transaction,
    });

    return appraisal_summary;
  }

  static async findBy(where, options) {
    const transaction = (options && options.transaction) || undefined;

    const appraisal_summary = await db.appraisal_summary.findOne(
      { where },
      { transaction },
    );

    if (!appraisal_summary) {
      return appraisal_summary;
    }

    const output = appraisal_summary.get({ plain: true });

    output.appraiser = await appraisal_summary.getAppraiser({
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

      if (filter.report_number) {
        where = {
          ...where,
          [Op.and]: Utils.ilike(
            'appraisal_summary',
            'report_number',
            filter.report_number,
          ),
        };
      }

      if (filter.date_createdRange) {
        const [start, end] = filter.date_createdRange;

        if (start !== undefined && start !== null && start !== '') {
          where = {
            ...where,
            date_created: {
              ...where.date_created,
              [Op.gte]: start,
            },
          };
        }

        if (end !== undefined && end !== null && end !== '') {
          where = {
            ...where,
            date_created: {
              ...where.date_created,
              [Op.lte]: end,
            },
          };
        }
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
          count: await db.appraisal_summary.count({
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
      : await db.appraisal_summary.findAndCountAll({
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
          Utils.ilike('appraisal_summary', 'report_number', query),
        ],
      };
    }

    const records = await db.appraisal_summary.findAll({
      attributes: ['id', 'report_number'],
      where,
      limit: limit ? Number(limit) : undefined,
      orderBy: [['report_number', 'ASC']],
    });

    return records.map((record) => ({
      id: record.id,
      label: record.report_number,
    }));
  }
};
