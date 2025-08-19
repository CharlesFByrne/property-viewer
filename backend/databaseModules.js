const { Pool } = require('pg');

console.log('Pool', Pool);
let THIS_DATABASE;

let DATABASE_CREDENTIALS = {
    databaseType: 'Postgres',
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres', 
    port: 5432,
}

async function init() {
  if (!THIS_DATABASE) {
    try {
      THIS_DATABASE = new Pool(DATABASE_CREDENTIALS);        
      await THIS_DATABASE.query('SELECT 1');
      console.log('Database connection okay');      
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }

  return THIS_DATABASE;
}

function colorPrint(_color, ...txt) {

  let colorKeys = {
      yellow: '\x1b[93m',
      YELLOW: '\x1b[30;43m',
      SKYBLUE: '\x1b[30;104m',
      GREEN: '\x1b[37;42m',
      cyan: '\x1b[96m',
      blue: '\x1b[94m',
      green: '\x1b[92m',
      red: '\x1b[91m',
      other: '\x1b[93m',
      END_COLOR: '\x1b[0m'
  }
  
  let color = colorKeys?.[_color] ?? colorKeys.other;
  console.log(`${color}${txt.join(' ')}${colorKeys.END_COLOR}`);
}

function returnData(data, callback = null, isText = false) {
  const result = isText ? data : JSON.stringify(data);
  return callback?.(result) ?? result;
}

const hardCopy = obj => JSON.parse(JSON.stringify(obj));

async function createDatabaseConnection(databaseDetails) {
  if (databaseDetails.database_type == 'Snowflake') {
    const conn = await SNOWFLAKE.connectAsync(databaseDetails);
    console.log('connection est.');
    return conn;
  } else {
    if (databaseDetails.database_type == 'Redshift') {
      Object.assign(databaseDetails, {
        ssl: {
            rejectUnauthorized: false
          }
      });
    }
    return new Pool(databaseDetails);
  }
}

async function closeDatabaseConnection(database, database_type) {
  if (database_type == 'Snowflake') {
    console.log('closing SF connection');
    await SNOWFLAKE.closeConnectionAsync(database);
  } else {
    console.log('closing PG connection');
    await database.end();
  }
}

async function queryDatabase({ database, database_type, sql_query, sql_params = null }) {
  if (database_type == 'Snowflake') {
    var sf_params = {};
    //console.log('querying SF', sql_query);
    sf_params.sqlText = sql_query;
    if (sql_params !== null) {
      var binds = sql_params;
    } else {
      var binds = null;
    }
    // var result = await SNOWFLAKE.executeQueryAsync(database, sql_query, binds);
    // (async () => {
    //   try {
    var result = await SNOWFLAKE.executeQueryAsync({
      connection: database,
      query: sql_query,
      binds,
    });
    //console.log('Query Result:', result);
    //   } catch (error) {
    //     console.error('Error executing query:', error);
    //   }
    // })();
  } else {
    console.log('querying PG');
    let params = [sql_query];
    if (sql_params !== null) {
      params.push(sql_params);
    }
    console.log('database, params', database, params)
    var result = await database.query(...params);
  }
  return result;
}


async function databaseDirectory(params, callback = null) {
  var {
    //  account_id, accounts_user_id, connection = null,
     database = null, schema = null } = params;
  var result, thisDatabase;

//   colorPrint('red', `# databaseDirectory params: ${JSON.stringify(params)}`);

//   if (connection === null) {
//     let SQL_A = `SELECT id, name, connection_details, accounts_user_id FROM xpanse.connections WHERE account_id = $1 AND accounts_user_id = $2;`;
//     var selectConnection = await THIS_DATABASE.query(SQL_A, [account_id, accounts_user_id]);
//   } else {
//     let SQL_A = `SELECT id, name, connection_details, accounts_user_id FROM xpanse.connections WHERE account_id=$1 AND id = $2;`;
//     var selectConnection = await THIS_DATABASE.query(SQL_A, [account_id, connection]);
//   }

//   var cons = selectConnection.rows;
   var databaseDirectories = {};
 let this_connection_name = 'Local_Postgres';
//   colorPrint('yellow', `# connections: ${cons.length}`);
//   for (var db_i = 0; db_i < cons.length; db_i++) {
//     let this_connection_name = cons[db_i].id; //`${cons[db_i].id}.${cons[db_i].name}`;
     databaseDirectories[this_connection_name] = {};
//     let _databaseDetails = cons[db_i].connection_details;
//     let { host = '' } = _databaseDetails;
let _databaseDetails = hardCopy(DATABASE_CREDENTIALS);
    try {
      if (database === null) {
        colorPrint('green', `# load ALL databases`);

        thisDatabase = await createDatabaseConnection(_databaseDetails);
        let {database_type} = _databaseDetails;

          let sql_query =
            database_type == 'Snowflake'
              ? `SHOW DATABASES;`
              : `SELECT datname FROM pg_database order by oid;`;
          
          result = await queryDatabase({
            database: thisDatabase,
            database_type,
            sql_query,
          });
          if (!(database_type == 'Snowflake')) {
            result = result.rows;
            var prop = 'datname';
          } else {
            var prop = 'name';
          }
          await closeDatabaseConnection(thisDatabase, database_type);

          var databaseList = result.map(r => r[prop]); //.sort();
          colorPrint('yellow', `# databases: ${databaseList}`);
        
      } else {
        var databaseList = [database];
        colorPrint('red', `# load databases: "${database}"`);
      }
      for (var ii = 0; ii < databaseList.length; ii++) {
        let this_database_name = databaseList[ii];
        databaseDirectories[this_connection_name][this_database_name] = {};

        _databaseDetails.database = this_database_name;
        colorPrint('blue', `Database: ${ii} of ${databaseList.length} ${databaseList[ii]}`);
        try {
          thisDatabase = await createDatabaseConnection(_databaseDetails);
          let { database_type = '' } = _databaseDetails;
          let this_database_SQL = database_type == 'Snowflake' ? `${this_database_name}.` : '';
          console.log('database_type', database_type);
          if (schema === null) {
            var SCHEMA_ISOLATE = '';
            colorPrint('green', `# load ALL schemas`);
          } else {
            colorPrint('red', `# schema: "${schema}"`);
            let _schema = database_type == 'Snowflake' ? schema.toUpperCase() : schema;
            colorPrint('red', `# load schema: "${_schema}"`);
            var SCHEMA_ISOLATE = `table_schema='${_schema}' AND `;
          }

          result = await queryDatabase({
            database: thisDatabase,
            database_type,
            sql_query: `SELECT table_schema, table_name
              FROM ${this_database_SQL}information_schema.tables
              WHERE ${SCHEMA_ISOLATE}table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')
              ORDER BY table_schema, table_name;`,
          });
          var _schemas_and_tables = result;
          if (!(database_type == 'Snowflake')) {
            _schemas_and_tables = _schemas_and_tables.rows;
            var _TABLE_SCHEMA = 'table_schema';
            var _TABLE_NAME = 'table_name';
          } else {
            var _TABLE_SCHEMA = 'TABLE_SCHEMA';
            var _TABLE_NAME = 'TABLE_NAME';
          }
          // var this_branch = databaseDirectories[this_connection_name][this_database_name];
          _schemas_and_tables.forEach(this_table => {
            let this_schema = this_table[_TABLE_SCHEMA];
            let table_name = this_table[_TABLE_NAME];
            databaseDirectories[this_connection_name][this_database_name][this_schema] ??= [];
            databaseDirectories[this_connection_name][this_database_name][this_schema].push(
              table_name
            );
          });
          colorPrint('yellow', `# _schemas_and_tables: ${_schemas_and_tables.length}`);

          await closeDatabaseConnection(thisDatabase, database_type);
        } catch (error) {
          console.log('error', error);
          databaseDirectories[this_connection_name][this_database_name]['error' + ii] = [];
        }
      }
    } catch (error) {
      console.log('error', error);
      databaseDirectories[this_connection_name] = error;
    }
//   }
    return {databaseDirectories};
//   return returnData(databaseDirectories, callback);
} // END: databaseDirectory()

module.exports = {
    init,
    databaseDirectory
}