'use strict';

let mysql = require('mysql'),
  config = require('./config');

let dbconf = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database
});
const query = async (sql) => {
  return new Promise((resolve, reject) => {
    dbconf.query(sql, function (error, rows) {
      if (error) {
        reject(error);
      }
      resolve(rows);
    });
  })
};
async function CheckAgent(agent) {
  try {

    let result = await query(`SELECT name from PeerToMonitor where agent=${agent}`);
    // console.log(result);


    if (result.length > 0)
      return result;
    else {

      return 0;
    }



  } catch (e) {
    console.log(e);
  }

}

module.exports.CheckAgent = CheckAgent;