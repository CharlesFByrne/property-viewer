import { Pool } from "./postgres.js";

console.log("Pool", Pool);
let MAIN_DATABASE;

let DATABASE_CREDENTIALS = {
  databaseType: "Postgres",
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "postgres",
  port: 5432,
};

export async function init() {
  if (!MAIN_DATABASE) {
    try {
      MAIN_DATABASE = new Pool(DATABASE_CREDENTIALS);
      await MAIN_DATABASE.query("SELECT 1");
      console.log("Database connection okay");
    } catch (err) {
      console.error("Database connection failed:", err);
      throw err;
    }
  }

  return MAIN_DATABASE;
}
