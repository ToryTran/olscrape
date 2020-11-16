const axios = require('axios').default;
const puppeteer = require('puppeteer');
const loggers = require('./logUtil.js').init();
const _ = require('lodash');
const getUserAgentsList = require('./config.js').getUserAgentsList;

const fetchCompanyDetail = require('./fetchUtil.js').fetchCompanyDetail;
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

const userAgents = getUserAgentsList();

async function getCompanyLink(start, end) {
  try {
    const res = await axios.get(
      `http://54.187.11.227:3000/query?start=${start}&end=${end}`
    );
    return res && res.data ? res.data : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function updateCompanyStatus(status = 404) {}

async function insertCompanyData(id, company) {
  try {
    // console.log('fetchCompanyDetail', company);
    const companyInfo = {
      id: Number(company.companyId),
      name: company.companyName,
      shortName: company.shortName,
      city: company.city,
      state: company.state,
      country: company.country,
      zipcode: Number(company.zipcode || '0'),
      website: company.website,
      ownership: company.ownership,
      totalFunding: company.totalFunding,
      teamName: company.teamName,
      totalRevenue: company.revenue,
      totalEmployees: company.employeeCount,
      ceoName: company.ceoDetail,
      address: JSON.stringify({
        phone: company.phoneNumber,
        street1: company.street1Address,
        street2: '',
      }),
      logo: company.logo,
      description: company.description || company.summarySection,
      founded: company.founded,
    };
    const res = await axios.post(
      `http://54.187.11.227:3000/query?start=${start}&end=${end}`
    );
    if (id != company.companyId) {
      // 404 case
    }
  } catch (error) {
    loggers.log.error({
      fn: 'insertCompanyData',
      error: error.toString(),
    });
    throw error;
  }
}

async function doJob(auth, data) {
  let browser = null;
  let page = null;
  let pcCookie = '';
  try {
    browser = await puppeteer.launch(browserOption);
    page = await browser.newPage();
    await page.goto('https://www.owler.com/login');
    await page.waitForSelector('#email');
    await page.type('#email', auth.email, {
      delay: 15,
    });
    await page.click('button.modal-button');
    await page.waitForSelector('#password');
    await page.type('#password', auth.password, {
      delay: 15,
    });
    await page.click('button.modal-button');
    await page.waitForTimeout(10000);
    const cookies = (await page.cookies()).filter(
      (it) => it.name.toUpperCase() === 'OWLER_PC'
    );
    if (!cookies.length) throw 'CAN NOT GET COOKIE';

    pcCookie = cookies[0].value;

    const userAgent =
      userAgents[Math.floor((Math.random() * 100) % userAgents.length)];

    for (let i = 0; (i = data.length); i++) {
      const companyInfo = data[i];
      if (!companyInfo.teamName || companyInfo.teamName === '-') continue;

      await sleep(3000);
      const res = await page.evaluate(fetchCompanyDetail, {
        cookie: pcCookie,
        userAgent,
        teamName: companyInfo.teamName || '',
      });

      console.log(`status: ${res.status ? res.status : '200'} `, companyInfo);
      if (res.status === 429) {
        throw '429 Error';
      }
      if (!res.status) {
        // console.log(res);
        const jsonData = JSON.parse(
          res
            .substring(
              res.search('{"props":{"pageProps":'),
              res.search('module={}')
            )
            .trim()
        );
        await insertCompanyData(
          _.get(jsonData, 'props.pageProps.initialState')
        );
      } else {
        loggers.log.log({
          status: res.status,
          companyInfo,
        });
      }
    }
  } catch (error) {
    loggers.log.error({
      error: error.toString(),
    });
  } finally {
    page && page.close();
    browser && browser.close();
  }
}

(async () => {
  const startCId = Number(process.argv[2]);
  const endCId = Number(process.argv[3]);
  const data = await getCompanyLink(startCId, endCId);

  console.log('DATA: ', data);
})();
