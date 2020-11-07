exports.fetchCompanyListOnSearch = async ({
  PC_OWLER_COOKIE,
  pageIndex,
  userAgents,
}) => {
  try {
    const userAgentIndex = Math.floor((Math.random() * 100) % 12);
    return await fetch(
      'https://www.owler.com/a/v1/pr/adv_search/search/companies',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'user-agent': userAgents[userAgentIndex],
          cookie: `OWLER_PC=${PC_OWLER_COOKIE}`,
        },
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        mode: 'cors',
        body: JSON.stringify({
          and: [],
          num_results: 50,
          page_num: pageIndex,
          range_filters: [],
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        return data;
      });
  } catch (error) {
    console.log('error  ', error);
    throw error;
  }
};

exports.fetchCompanyList = async ({ PC_OWLER_COOKIE, query, userAgents }) => {
  try {
    const userAgentIndex = Math.floor((Math.random() * 100) % 12);
    return await fetch(
      'https://www.owler.com/a/v1/pr/adv_search/search/companies',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'user-agent': userAgents[userAgentIndex],
          cookie: `OWLER_PC=${PC_OWLER_COOKIE}`,
        },
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        mode: 'cors',
        body: JSON.stringify(query),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        return data;
      });
  } catch (error) {
    console.log('error  ', error);
    throw error;
  }
};

xports.fetchCompanyDetail = async ({ cookie, userAgent, teamName }) => {
  try {
    const res = await fetch(`https://www.owler.com/company/${teamName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'accept-encoding': 'gzip, deflate, br',
        'user-agent': userAgent,

        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        cookie: `OWLER_PC=${cookie}`,
      },
      // credentials: 'same-origin',
      // redirect: 'follow',
      // referrerPolicy: 'no-referrer',
      // mode: 'cors',
    });
    if (res.status < 200 || res.status >= 300) return { status: res.status };
    return res.text();
  } catch (error) {
    console.log('error  ', error);
    throw error;
  }
};

exports.fetchFollowedCompany = async ({ cookie, userAgent }) => {
  try {
    return await fetch('https://www.owler.com/iaApp/getMyCompanies.htm', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'accept-encoding': 'gzip, deflate, br',
        'user-agent': userAgent,
        cookie: `OWLER_PC=${cookie}`,
      },
      credentials: 'same-origin',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      mode: 'cors',
    })
      .then((res) => res.json())
      .then((data) => {
        return data;
      });
  } catch (error) {
    console.log('error  ', error);
    throw error;
  }
};

exports.followCompany = async ({ cookie, companyId, userAgent, state }) => {
  try {
    return await fetch(
      `https://www.owler.com/iaApp/followCompany.htm?company_id=${companyId}&following=${
        state ? 'true' : 'false'
      }`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'accept-encoding': 'gzip, deflate, br',
          'user-agent': userAgent,
          cookie: `OWLER_PC=${cookie}`,
        },
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        mode: 'cors',
      }
    ).then((response) => {
      return response.status || 400;
      // console.log('res status: ', response.status);
    });
  } catch (error) {
    console.log('error follow', error);
    throw error;
  }
};
