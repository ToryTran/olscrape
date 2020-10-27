const puppeteer = require('puppeteer');
const initLog = require('./logUtil.js').init;
require('winston-daily-rotate-file');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const getUserAgentsList = require('./config.js').getUserAgentsList;
const getTasks = require('./config.js').getTasks;
const followCompany = require('./fetchUtil.js').followCompany;
const fetchFollowedCompany = require('./fetchUtil.js').fetchFollowedCompany;
const hash = require('object-hash');
const Stream = require('stream');
const readline = require('readline');
const loggers = initLog();

const browserOption = {
  headless: false,
  // executablePath: '/snap/chromium/1350/usr/lib/chromium-browser/chrome',
  // executablePath: '/opt/google/chrome/google-chrome',
  // product: 'firefox',
  // extraPrefsFirefox: {
  // Enable additional Firefox logging from its protocol implementation
  // 'remote.log.level': 'Trace',
  // },
  // Make browser logs visible
  // dumpio: true,
  devtools: false,
  ignoreHTTPSErrors: true,
  slowMo: 0,
  args: [
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ],
};

const auth_url = 'https://www.owler.com/login';
const userAgents = getUserAgentsList();

const PROCESS_BUCK_COMPANY = 300;
let companyUrl = new Set();
let scrapedCompanyId = new Set();
let MAX_COMPANY_ID = -1;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getObjectFromLog(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return false;
  }
}

const getFileDataByLine = (filePath, cbFn) => {
  if (!fs.existsSync(filePath)) {
    // console.log('FILE NOT EXIST');
    return 0;
  }
  let inStream = fs.createReadStream(filePath);
  let outStream = new Stream();
  return new Promise((resolve, reject) => {
    let rl = readline.createInterface(inStream, outStream);
    rl.on('line', function (line) {
      cbFn(line);
    });

    rl.on('error', function (err) {
      console.log(err);
    });

    rl.on('close', function () {
      resolve('');
    });
  });
};

async function readCompanyUrl() {
  // todo: query from DB
  try {
    const file = `link.log`;
    const filePath = path.join(__dirname, `${file}`);
    await getFileDataByLine(filePath, (line) => {
      const companyData = getObjectFromLog(line);
      if (!companyData) return;
      const ids = companyData.message.companyIds;
      for (let e of ids) {
        const comID = Number(e);
        companyUrl.add(comID);
        if (comID > MAX_COMPANY_ID) MAX_COMPANY_ID = comID;
      }
    });
  } catch (error) {
    loggers.log.error({
      error: error.toString(),
    });
  }
}

async function readScrapedCompanies() {
  // todo: query from DB;
  const currentDate = moment().format('x');
  let date = Number(moment('2020-10-15', 'YYYY-MM-DD').format('x'));
  do {
    const logDate = moment(date, 'x').format('YYYY-MM-DD');
    for (let l of ['', '_1', '_2', '_3', '_4']) {
      const file = `/company_info_run_log${l}/company-${logDate}.log`;
      const filePath = path.join(__dirname, `${file}`);
      await getFileDataByLine(filePath, (line = '{}') => {
        const d = getObjectFromLog(line);
        if (d && d.message.companyId) {
          scrapedCompanyId.add(Number(d.message.companyId));
        }
      });
    }

    date += 24 * 60 * 60 * 1000; // next date
  } while (date < currentDate);
}

const tasks = getTasks();

let runProccessMangement = new Set();

async function insertCompanyData(companies) {
  try {
    companies.forEach((company) => {
      if (company && company.companyInfo) {
        const companyId = Number(company.companyInfo.id);
        if (companyId && !scrapedCompanyId.has(companyId)) {
          loggers.company.info(company);
          loggers.scraped.info({ companyId });
          scrapedCompanyId.add(companyId);
        }
      }
    });
  } catch (error) {
    loggers.log.error({
      fn: 'insertCompanyData',
      error: error.toString(),
    });
    throw error;
  }
}

async function doJob(id, query) {
  console.log('RUN: ', id, query.email, query.range);
  let browser = null;
  let page = null;
  let pcCookie = '';
  try {
    browser = await puppeteer.launch(browserOption);
    page = await browser.newPage();
    await page.goto(auth_url);
    await page.waitForSelector('#email');
    await page.type('#email', query.email, {
      delay: 15,
    });
    await page.click('button.modal-button');
    await page.waitForSelector('#password');
    await page.type('#password', query.password, {
      delay: 15,
    });
    await page.click('button.modal-button');

    await page.waitForTimeout(10000);

    const cookies = (await page.cookies()).filter(
      (it) => it.name.toUpperCase() === 'OWLER_PC'
    );
    if (!cookies.length) throw 'CAN NOT GET COOKIE';

    pcCookie = cookies[0].value;
    let companyId = query.range.start;
    const userAgent =
      userAgents[Math.floor((Math.random() * 100) % userAgents.length)];
    const timing = (1 + (runProccessMangement.size % 2)) * 180;
    const start = query.range.start;
    const end = Math.min(query.range.end, MAX_COMPANY_ID);
    console.log('timing: ', timing, start, end, start < end);

    do {
      const data = await page.evaluate(fetchFollowedCompany, {
        cookie: pcCookie,
        userAgent,
      });
      console.log(`process: ${id} :`, data.length, new Date());
      insertCompanyData(data);

      const resultIds = data.map((comp) => Number(comp.companyInfo.id));
      const dataSet = new Set(resultIds);
      for (let id of resultIds) {
        //  await sleep(timing);
        await page.evaluate(followCompany, {
          cookie: pcCookie,
          companyId: id,
          userAgent,
          state: false,
        });
      }
      let selected = 0;
      for (
        companyId = start;
        selected < PROCESS_BUCK_COMPANY && companyId <= end;
        companyId++
      ) {
        if (
          companyUrl.has(companyId) &&
          !scrapedCompanyId.has(companyId) &&
          !dataSet.has(companyId)
        ) {
          selected++;
          // await sleep(timing);
          await page.evaluate(followCompany, {
            cookie: pcCookie,

            companyId,
            userAgent,
            state: true,
          });
        }
      }
      if (selected <= 0) {
        console.log('FINISH: ', id);
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].email === query.email) {
            delete tasks[i];
          }
        }
        break;
      }
    } while (companyId < query.range.end);
  } catch (error) {
    loggers.log.error({
      id,
      query,
      error: error.toString(),
    });
  } finally {
    page && page.close();
    browser && browser.close();
    runProccessMangement.delete(id);
  }
}

async function main() {
  await readCompanyUrl();
  await readScrapedCompanies();
  console.log('TOTAL Company url: ', companyUrl.size);
  console.log('TOTAL Scraped Company url: ', scrapedCompanyId.size);
  do {
    for (let task of tasks) {
      const jobId = hash(task);
      // console.log(task, jobId);
      if (!runProccessMangement.has(jobId)) {
        doJob(jobId, task);
        runProccessMangement.add(jobId);
      }
    }
    console.log('Re-check and run all query');
    await sleep(300000);
  } while (true);
}

main();
