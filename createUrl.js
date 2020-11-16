const settings = require('./config');
const mysql = require('mysql');

const winston = require('winston');

const loggers = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'urls.log' })],
});

const connection = mysql.createConnection(settings.dbInfo());
connection.connect();
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function getObjectFromLog(data, id) {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e, id, '-----', JSON.stringify(data), '-----');
    return false;
  }
}
console.log('start connection');

(async () => {
  const limit = 1000;
  for (let page = 0; page < 1000; page++) {
    try {
      await sleep(5000);
      console.log('start query');
      connection.query(
        `SELECT team_name FROM owler_company where status = 0  and id > 4000000 and id <=6000000 LIMIT ${
          page * limit
        }, ${limit}`,
        async function (err, results, fields) {
          if (err) throw err;
          console.log(results.length);

          for (let i = 0; i < results.length; i++) {
            loggers.info({
              url: `https://www.owler.com/company/${results[i].team_name}`,
            });
          }
        }
      );
    } catch (error) {
      console.log('E --> ', error);
    }
  }

  // connection.end();
})();
