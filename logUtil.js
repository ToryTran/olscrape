const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const dataPath = path.join(__dirname, `/company_info/`);
const logDetailPath = path.join(__dirname, `/company_info_run_log/`);
// handle logs
const loggers = {
  scaped: winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
      new winston.transports.DailyRotateFile({
        filename: `${logDetailPath}/company-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        // zippedArchive: true,
        maxSize: "100m",
        maxFiles: "30d",
      }),
    ],
  }),
  company: winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
      new winston.transports.DailyRotateFile({
        filename: `${dataPath}/data-%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        // zippedArchive: true,
        maxSize: "100m",
        maxFiles: "30d",
      }),
    ],
  }),
  companyData: winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
      new winston.transports.DailyRotateFile({
        filename: `${dataPath}/dataCompany-%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        // zippedArchive: true,
        maxSize: "100m",
        maxFiles: "30d",
      }),
    ],
  }),
  run: winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: "info.log" })],
  }),
  log: winston.createLogger({
    level: "error",
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: "error.log" })],
  }),
};

exports.init = () => loggers;
