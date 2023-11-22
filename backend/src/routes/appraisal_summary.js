const express = require('express');

const Appraisal_summaryService = require('../services/appraisal_summary');
const Appraisal_summaryDBApi = require('../db/api/appraisal_summary');
const wrapAsync = require('../helpers').wrapAsync;

const router = express.Router();

const { parse } = require('json2csv');

const { checkCrudPermissions } = require('../middlewares/check-permissions');

router.use(checkCrudPermissions('appraisal_summary'));
const {exec}=require('child_process');
const bodyParser=require('body-parser');
const path=require('path');

/**
 *  @swagger
 *  components:
 *    schemas:
 *      Appraisal_summary:
 *        type: object
 *        properties:

 *          report_number:
 *            type: string
 *            default: report_number

 */

/**
 *  @swagger
 * tags:
 *   name: Appraisal_summary
 *   description: The Appraisal_summary managing API
 */

/**
 *  @swagger
 *  /api/appraisal_summary:
 *    post:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Add new item
 *      description: Add new item
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              properties:
 *                data:
 *                  description: Data of the updated item
 *                  type: object
 *                  $ref: "#/components/schemas/Appraisal_summary"
 *      responses:
 *        200:
 *          description: The item was successfully added
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Appraisal_summary"
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        405:
 *          description: Invalid input data
 *        500:
 *          description: Some server error
 */

router.post(
  '/',
  wrapAsync(async (req, res) => {
    await Appraisal_summaryService.create(
      req.body.data,
      req.currentUser,
      true,
      req.headers.referer,
    );
    const payload = true;
    res.status(200).send(payload);
  }),
);

router.post(
  '/bulk-import',
  wrapAsync(async (req, res) => {
    await Appraisal_summaryService.bulkImport(
      req,
      res,
      true,
      req.headers.referer,
    );
    const payload = true;
    res.status(200).send(payload);
  }),
);

/**
 *  @swagger
 *  /api/appraisal_summary/{id}:
 *    put:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Update the data of the selected item
 *      description: Update the data of the selected item
 *      parameters:
 *        - in: path
 *          name: id
 *          description: Item ID to update
 *          required: true
 *          schema:
 *            type: string
 *      requestBody:
 *        description: Set new item data
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              properties:
 *                id:
 *                  description: ID of the updated item
 *                  type: string
 *                data:
 *                  description: Data of the updated item
 *                  type: object
 *                  $ref: "#/components/schemas/Appraisal_summary"
 *              required:
 *                - id
 *      responses:
 *        200:
 *          description: The item data was successfully updated
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Appraisal_summary"
 *        400:
 *          description: Invalid ID supplied
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        404:
 *          description: Item not found
 *        500:
 *          description: Some server error
 */

router.put(
  '/:id',
  wrapAsync(async (req, res) => {
    await Appraisal_summaryService.update(
      req.body.data,
      req.body.id,
      req.currentUser,
    );
    const payload = true;
    res.status(200).send(payload);
  }),
);

/**
 * @swagger
 *  /api/appraisal_summary/{id}:
 *    delete:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Delete the selected item
 *      description: Delete the selected item
 *      parameters:
 *        - in: path
 *          name: id
 *          description: Item ID to delete
 *          required: true
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: The item was successfully deleted
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Appraisal_summary"
 *        400:
 *          description: Invalid ID supplied
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        404:
 *          description: Item not found
 *        500:
 *          description: Some server error
 */

router.delete(
  '/:id',
  wrapAsync(async (req, res) => {
    await Appraisal_summaryService.remove(req.params.id, req.currentUser);
    const payload = true;
    res.status(200).send(payload);
  }),
);

/**
 *  @swagger
 *  /api/appraisal_summary:
 *    get:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Get all appraisal_summary
 *      description: Get all appraisal_summary
 *      responses:
 *        200:
 *          description: Appraisal_summary list successfully received
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/Appraisal_summary"
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        404:
 *          description: Data not found
 *        500:
 *          description: Some server error
 */

router.get(
  '/',
  wrapAsync(async (req, res) => {
    const filetype = req.query.filetype;
    const payload = await Appraisal_summaryDBApi.findAll(req.query);
    if (filetype && filetype === 'csv') {
      const fields = ['id', 'report_number', 'date_created'];
      const opts = { fields };
      try {
        const csv = parse(payload.rows, opts);
        res.status(200).attachment(csv);
        res.send(csv);
      } catch (err) {
        console.error(err);
      }
    } else {
      res.status(200).send(payload);
    }
  }),
);

/**
 *  @swagger
 *  /api/appraisal_summary/count:
 *    get:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Count all appraisal_summary
 *      description: Count all appraisal_summary
 *      responses:
 *        200:
 *          description: Appraisal_summary count successfully received
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/Appraisal_summary"
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        404:
 *          description: Data not found
 *        500:
 *          description: Some server error
 */
router.get(
  '/count',
  wrapAsync(async (req, res) => {
    const payload = await Appraisal_summaryDBApi.findAll(req.query, {
      countOnly: true,
    });

    res.status(200).send(payload);
  }),
);

/**
 *  @swagger
 *  /api/appraisal_summary/autocomplete:
 *    get:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Find all appraisal_summary that match search criteria
 *      description: Find all appraisal_summary that match search criteria
 *      responses:
 *        200:
 *          description: Appraisal_summary list successfully received
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/Appraisal_summary"
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        404:
 *          description: Data not found
 *        500:
 *          description: Some server error
 */
router.get('/autocomplete', async (req, res) => {
  const payload = await Appraisal_summaryDBApi.findAllAutocomplete(
    req.query.query,
    req.query.limit,
  );

  res.status(200).send(payload);
});

/**
 * @swagger
 *  /api/appraisal_summary/{id}:
 *    get:
 *      security:
 *        - bearerAuth: []
 *      tags: [Appraisal_summary]
 *      summary: Get selected item
 *      description: Get selected item
 *      parameters:
 *        - in: path
 *          name: id
 *          description: ID of item to get
 *          required: true
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: Selected item successfully received
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Appraisal_summary"
 *        400:
 *          description: Invalid ID supplied
 *        401:
 *          $ref: "#/components/responses/UnauthorizedError"
 *        404:
 *          description: Item not found
 *        500:
 *          description: Some server error
 */

router.get(
  '/:id',
  wrapAsync(async (req, res) => {
    const payload = await Appraisal_summaryDBApi.findBy({ id: req.params.id });

    res.status(200).send(payload);
  }),
);

router.use(bodyParser.json());

router.post('',(req,res)=>{
    const { filename } = req.body;
    const pythonScriptPath = path.join(__dirname, '../../../pdf_converter/converter.py');
    const command = `python ${pythonScriptPath} ${filename}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        console.log(`stdout: ${stdout}`);
        res.json({ data: stdout });
      });
});

// router.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

router.use('/', require('../helpers').commonErrorHandler);

module.exports = router;
