const db = require('../models');
const FileDBApi = require('./file');
const crypto = require('crypto');
const Utils = require('../utils');

const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

module.exports = class Appraisal_reportsDBApi {
  static async create(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const appraisal_reports = await db.appraisal_reports.create(
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

    await appraisal_reports.setAppraiser(data.appraiser || null, {
      transaction,
    });

    return appraisal_reports;
  }

  static async bulkImport(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    // Prepare data - wrapping individual data transformations in a map() method
    const appraisal_reportsData = data.map((item) => ({
      id: item.id || undefined,

      report_number: item.report_number || null,
      date_created: item.date_created || null,
      importHash: item.importHash || null,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    }));

    // Bulk create items
    const appraisal_reports = await db.appraisal_reports.bulkCreate(
      appraisal_reportsData,
      { transaction },
    );

    // For each item created, replace relation files

    return appraisal_reports;
  }

  static async update(id, data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const appraisal_reports = await db.appraisal_reports.findByPk(id, {
      transaction,
    });

    await appraisal_reports.update(
      {
        report_number: data.report_number || null,
        date_created: data.date_created || null,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await appraisal_reports.setAppraiser(data.appraiser || null, {
      transaction,
    });

    return appraisal_reports;
  }

  static async remove(id, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const appraisal_reports = await db.appraisal_reports.findByPk(id, options);

    await appraisal_reports.update(
      {
        deletedBy: currentUser.id,
      },
      {
        transaction,
      },
    );

    await appraisal_reports.destroy({
      transaction,
    });

    return appraisal_reports;
  }

  static async findBy(where, options) {
    const transaction = (options && options.transaction) || undefined;

    const appraisal_reports = await db.appraisal_reports.findOne(
      { where },
      { transaction },
    );

    if (!appraisal_reports) {
      return appraisal_reports;
    }

    const output = appraisal_reports.get({ plain: true });

    output.appraiser = await appraisal_reports.getAppraiser({
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
            'appraisal_reports',
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
          count: await db.appraisal_reports.count({
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
      : await db.appraisal_reports.findAndCountAll({
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
          Utils.ilike('appraisal_reports', 'report_number', query),
        ],
      };
    }

    const records = await db.appraisal_reports.findAll({
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
