exports.getSourceIds = (range) => {
  const query = `SELECT company_id, team_name from owler_companies LEFT JOIN owler_company_detail ON
  owler_companies.company_id =  owler_company_detail.id 
  WHERE owler_companies.company_id > ${range.start} AND  owler_companies.company_id < ${range.end} AND owler_company_detail.id is NULL 
  LIMIT 200 OFFSET 0`;

  return query;
};

exports.countRecords = (table = "owler_companies") => {
  return `SELECT count(*) as qty from ${table}`;
};

exports.iinsertCompany = (table = "owler_companies") => {
  return `SELECT count(*) as qty from ${table}`;
};
