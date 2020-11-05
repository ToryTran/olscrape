var express = require("express");
var app = express();
var fs = require("fs");
const settings = require("./config");
const query = require("./queryDB");
var mysql = require("mysql");

var connection = mysql.createConnection(settings.dbInfo());
connection.connect();

const dbQuery = async (queryString) => {
  return await new Promise((resolve) => {
    connection.query(queryString, function (error, results, fields) {
      if (error) throw error;
      resolve(results);
    });
  });
};

app.get("/report", async function (req, res) {
  const url = await dbQuery(query.countRecords());
  const scraped = await dbQuery(query.countRecords("owler_company_detail"));
  await res.send(
    `<html>
    <body>
    <h3> URLs: ${
      url[0] ? new Intl.NumberFormat().format(url[0].qty) : "N/A"
    } </h3>
    <h3> Scraped:  ${
      scraped[0] ? new Intl.NumberFormat().format(scraped[0].qty) : "N/A"
    } </h3>
      </body>
      </html>
    `
  );
});

app.get("/query", async function (req, res) {
  const { start, end } = req.query;
  if (!start || !end || Number(end) < Number(start))
    return res.status(530).send({ error: "request failed" });

  const range = {
    start: Number(start),
    end: Number(end),
  };
  const url = await dbQuery(query.getSourceIds(range));
  res.send({ ok: url });
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Listening at http://%s:%s", host, port);
});
