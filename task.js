const axios = require('axios').default;
const axiosCloudflare = require('axios-cloudflare');

axiosCloudflare(axios);

axios
  .get('https://www.owler.com/company/emc', {
    headers: {
      'postman-token': 'bd404a4d-f569-83b8-170f-cfc5c7a1314a',
      'cache-control': 'no-cache',
      authorization:
        'Bearer 7eLqrb23YVpSt2F0FeBToM-YkTUohFxbSbhkhXvCOjKiQneid3NUxnEbbPLhn_ZT_2CCm50KUsMoqsH8rM_WiUOqiUvIwtlOAC-DB7fkZ_Y',
    },
  })
  .then((res) => {
    console.log(res.data);
  })
  .catch((error) => {
    console.error(error);
  });
