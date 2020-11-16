const express = require('express');
const app = express();
const fs = require('fs');
const settings = require('./config');
const query = require('./queryDB');
const mysql = require('mysql');
const logs = require('./logUtil').init();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection(settings.dbInfo());
connection.connect();

const dbQuery = async (queryString) => {
  return await new Promise((resolve) => {
    connection.query(queryString, function (error, results, fields) {
      if (error) throw error;
      resolve(results);
    });
  });
};

app.get('/report', async function (req, res) {
  const url = await dbQuery(query.countRecords());
  const scraped = await dbQuery(query.countRecords('owler_company_detail'));
  await res.send(
    `<html>
    <body>
    <h3> URLs: ${
      url[0] ? new Intl.NumberFormat().format(url[0].qty) : 'N/A'
    } </h3>
    <h3> Scraped:  ${
      scraped[0] ? new Intl.NumberFormat().format(scraped[0].qty) : 'N/A'
    } </h3>
      </body>
      </html>
    `
  );
});

app.post('/company', async function (req, res) {
  const company = req.body;
  logs.company.info({ company });
  res.send({ status: true });
});

app.put('/update-company-status', async function (req, res) {
  const data = req.body;
  try {
    var sql = `UPDATE owler_companies SET status = ${data.status} WHERE company_id = ${data.company_id}`;
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log('Number of records updated: ' + result.affectedRows);
    });

    res.send({ status: true });
  } catch (error) {
    res.send({ status: false, error });
  }
});

app.post('/insert-company', async function (req, res) {
  const companyInfo = req.body;
  logs.company.info({ companyInfo });
  try {
    var sql = `INSERT ignore INTO owler_company (id,
        name,
        short_name,
        city,
        state,
        country,
        zipcode,
        website,
        ownership,
        total_funding,
        team_name,
        total_revenue,
        total_employees,
        ceo_name,
        address,
        logo,
        description,
        founded) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    var values = Object.values(companyInfo);
    connection.query(sql, values, function (err, result) {
      if (err) throw err;
      console.log('Number of records inserted: ' + result.affectedRows);
    });

    res.send({ status: true });
  } catch (error) {
    res.send({ status: false, error });
  }
});

app.get('/query', async function (req, res) {
  const { start, end } = req.query;
  if (!start || !end || Number(end) < Number(start))
    return res.status(530).send({ error: 'request failed' });

  const range = {
    start: Number(start),
    end: Number(end),
  };
  const url = await dbQuery(query.getSourceIds(range));
  res.send(url);
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
