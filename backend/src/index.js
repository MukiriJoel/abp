const express = require('express');
const cors = require('cors');
const app = express();
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const db = require('./db/models');
const config = require('./config');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');

const usersRoutes = require('./routes/users');

const appraisal_reportsRoutes = require('./routes/appraisal_reports');

const appraisal_summaryRoutes = require('./routes/appraisal_summary');

const featuresRoutes = require('./routes/features');

const pdf_formsRoutes = require('./routes/pdf_forms');

const rolesRoutes = require('./routes/roles');

const permissionsRoutes = require('./routes/permissions');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'ABIE',
      description:
        'ABIE API',
    },
    servers: [
      {
        url: "https://api.abiescreen.com",
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsDoc(options);

// app.use(cors({ origin: ['https://frontend-admin-du3w79htk-abie.vercel.app', 'http://localhost:4000','https://dashaboard.abiescreen.com/'] }));
const corsOptions = {
  origin: '*', // 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(
  '/api-docs',
  function (req, res, next) {
    swaggerUI.host = req.get('host');
    next();
  },
  swaggerUI.serve,
  swaggerUI.setup(specs),
);

app.use(cors({ origin: true }));
require('./auth/auth');

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/file', fileRoutes);

app.use(
  '/api/users',
  passport.authenticate('jwt', { session: false }),
  usersRoutes,
);

app.use(
  '/api/appraisal_reports',
  passport.authenticate('jwt', { session: false }),
  appraisal_reportsRoutes,
);

app.use(
  '/api/appraisal_summary',
  passport.authenticate('jwt', { session: false }),
  appraisal_summaryRoutes,
);

app.use(
  '/api/features',
  passport.authenticate('jwt', { session: false }),
  featuresRoutes,
);

app.use(
  '/api/pdf_forms',
  passport.authenticate('jwt', { session: false }),
  pdf_formsRoutes,
);

app.use(
  '/api/roles',
  passport.authenticate('jwt', { session: false }),
  rolesRoutes,
);

app.use(
  '/api/permissions',
  passport.authenticate('jwt', { session: false }),
  permissionsRoutes,
);

const publicDir = path.join(__dirname, '../public');

if (fs.existsSync(publicDir)) {
  app.use('/', express.static(publicDir));

  app.get('*', function (request, response) {
    response.sendFile(path.resolve(publicDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 8080;

db.sequelize.sync().then(function () {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});

module.exports = app;
