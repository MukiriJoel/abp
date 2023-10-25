const db = require('../db/models');
const Pdf_formsDBApi = require('../db/api/pdf_forms');
const processFile = require('../middlewares/upload');
const csv = require('csv-parser');
const stream = require('stream');

module.exports = class Pdf_formsService {
  static async create(data, currentUser) {
    const transaction = await db.sequelize.transaction();
    try {
      await Pdf_formsDBApi.create(data, {
        currentUser,
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async bulkImport(req, res, sendInvitationEmails = true, host) {
    const transaction = await db.sequelize.transaction();

    try {
      await processFile(req, res);
      const bufferStream = new stream.PassThrough();
      const results = [];

      await bufferStream.end(Buffer.from(req.file.buffer, 'utf-8')); // convert Buffer to Stream

      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            console.log('CSV results', results);
            resolve();
          })
          .on('error', (error) => reject(error));
      });

      await Pdf_formsDBApi.bulkImport(results, {
        transaction,
        ignoreDuplicates: true,
        validate: true,
        currentUser: req.currentUser,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(data, id, currentUser) {
    const transaction = await db.sequelize.transaction();
    try {
      let pdf_forms = await Pdf_formsDBApi.findBy({ id }, { transaction });

      if (!pdf_forms) {
        throw new ValidationError('pdf_formsNotFound');
      }

      await Pdf_formsDBApi.update(id, data, {
        currentUser,
        transaction,
      });

      await transaction.commit();
      return pdf_forms;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async remove(id, currentUser) {
    const transaction = await db.sequelize.transaction();

    try {
      if (currentUser.role !== 'admin') {
        throw new ValidationError('errors.forbidden.message');
      }

      await Pdf_formsDBApi.remove(id, {
        currentUser,
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
