module.exports = {
  production: {
    dialect: 'postgres',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    logging: console.log,
    seederStorage: 'sequelize',
  },
  development: {
    dialect: 'postgres',
    username: 'postgres',
    password: 'joel12345',     
    database: 'db_erp_test',
    host: "", 
    port: 5432,            
    logging: console.log,
    seederStorage: 'sequelize',
  },
};
