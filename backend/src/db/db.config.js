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
    password: 'root',     
    database: 'db_erp_test',
    host: "database-layer", 
    port: 5432,            
    logging: console.log,
    seederStorage: 'sequelize',
  },
};
