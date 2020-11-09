const settings = require("./config");
const mysql = require("mysql");

const connection = mysql.createConnection(settings.dbInfo());
connection.connect();
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const extraxData = async (results) => {
  return new Promise((resolve, reject) => {
    resolve(
      results.forEach((r) => {
        const e = JSON.parse(r.raw);
        // console.log(e.id);
        const tn = e.seoFriendlyCompanyProfileUrl.split("/");
        return [
          Number(e.id),
          e.name,
          e.shortName,
          e.city,
          e.state,
          e.country,
          Number(e.zipcode) || 0,
          e.website,
          e.ownership,
          e.totalFunding,
          e.teamName || tn[tn.length - 1],
          e.totalRevenue,
          e.totalEmployees,
          e.ceoName || "",
          JSON.stringify(e.address || "{}"),
          e.logo,
          e.description || e.descriptionForEmail,
          e.founded,
          200,
        ];
      })
    );
  });
};
function getObjectFromLog(data, id) {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e, id, "-----", JSON.stringify(data), "-----");
    return false;
  }
}

connection.query(
  `INSERT ignore INTO owler_company_detail (id, name, raw) values (?, ?, ?)`,
  [11, "name", JSON.stringify({ a: 1, b: 2 })],
  function (error, results, fields) {
    if (error) throw error;
    console.log(results.insertId);
  }
);

//
return;

(async () => {
  const limit = 500;
  for (let page = 0; page < 2; page++) {
    try {
      await sleep(5000);
      connection.query(
        `SELECT * FROM owler_company_detail LIMIT ${page * limit}, ${limit}`,
        async function (err, results, fields) {
          if (err) throw err;
          // const d = await extraxData(results);
          const d = [];
          for (let i = 0; i < results.length; i++) {
            const e = getObjectFromLog(results[i].raw, results[i].id);
            if (!e) {
              console.log(results[i].id);
              continue;
            }
            // console.log(e.id);
            const tn = e.seoFriendlyCompanyProfileUrl.split("/");
            d.push([
              Number(e.id),
              e.name,
              e.shortName,
              e.city,
              e.state,
              e.country,
              Number(e.zipcode) || 0,
              e.website,
              e.ownership,
              e.totalFunding,
              e.teamName || tn[tn.length - 1],
              e.totalRevenue,
              e.totalEmployees,
              e.ceoName || "",
              JSON.stringify(e.address || "{}"),
              e.logo,
              e.description || e.descriptionForEmail,
              e.founded,
              200,
            ]);
          }
          await sleep(2000);
          // console.log(d);
          connection.query(
            `INSERT IGNORE INTO owler_company VALUES ?`,
            [d],
            function (error, results, fields) {
              if (error) throw error;
              console.log(results.insertId);
            }
          );
        }
      );
    } catch (error) {
      console.log("E --> ", error);
    }
  }

  // connection.end();
})();
