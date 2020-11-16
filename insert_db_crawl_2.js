const data = require('./data/crawl_owler_main_29_1').data();
const _ = require('lodash');
const axios = require('axios').default;
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

console.log(data.length);

// exports.data = () =>

const slTime = 8000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let serverUrl = 'http://54.187.11.227:8000';
const loggers = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error_job_single_detail.log' }),
  ],
});
const DB = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: `${path.join(__dirname, `/logs`)}/data-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      // zippedArchive: true,
      maxSize: '100m',
      maxFiles: '30d',
    }),
  ],
});
async function getCompany(company) {
  try {
    const companyInfo = {
      id: Number(company.companyId),
      name: company.companyName,
      shortName: company.shortName,
      city: company.city,
      state: company.state,
      country: company.country,
      zipcode: Number(company.zipcode) || 0,
      website: company.website,
      ownership: company.ownership,
      totalFunding: Number(company.totalFunding || '0'),
      companyFundingInfo: JSON.stringify(company.companyFundingInfo),
      teamName: company.teamName,
      totalRevenue: Number(company.revenue || '0'),
      totalEmployees: Number(company.employeeCount || '0'),
      ceoName: JSON.stringify(company.ceoDetail) || '',
      address: `
        phone: ${company.phoneNumber},
        street1: ${company.street1Address}`,
      logo: company.logo,
      description: company.description || company.summarySection,
      founded: company.founded,
      status: 200,
    };
    console.log('Insert : ', companyInfo.id, ' - ', companyInfo.teamName);

    await axios.post(`${serverUrl}/insert-company`, companyInfo);
    // console.log(companyInfo);
    //
    for (let i = 0; i < company.companies.length; i++) {
      await sleep(slTime);
      const newCompany = {
        id: company.companies[i].companyId,
        short_name: company.companies[i].shortName,
        team_name: company.companies[i].teamName,
        status: 0,
      };
      console.log('Insert new: ', newCompany.id, ' - ', newCompany.team_name);
      await axios.post(`${serverUrl}/insert-company-new`, newCompany);
    }
    for (let i = 0; i < company.recommendedCompanies.length; i++) {
      const tnt = company.recommendedCompanies[i].cpLink.split('/');
      if (tnt && tnt[tnt.length - 1]) {
        await sleep(slTime);
        const newCompany = {
          id: company.recommendedCompanies[i].companyId,
          short_name: company.recommendedCompanies[i].shortName,
          team_name: tnt[tnt.length - 1],
          status: 0,
        };

        console.log('Insert new: ', newCompany.id, ' - ', newCompany.team_name);
        await axios.post(`${serverUrl}/insert-company-new`, newCompany);
      }
    }
  } catch (error) {
    loggers.error({
      fn: 'insertCompanyData',
      error: error.toString(),
    });
    throw error;
  }
}

(async () => {
  for (let i = 0; i < data.length; i++) {
    const com = JSON.parse(data[i].data);
    if (com && com.props && com.props.pageProps) {
      await sleep(slTime);
      getCompany(_.get(com, 'props.pageProps.initialState'));
    }
  }
  console.log('FINISH');
})();
