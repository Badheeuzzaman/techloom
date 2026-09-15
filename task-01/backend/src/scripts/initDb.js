require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { connectDatabase, client } = require("../config/db");

async function initDb() {
  await connectDatabase();
  const schemaSql = fs.readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");
  await client.query(schemaSql);
  console.log("PostgreSQL tables and indexes initialized successfully.");
  await client.end();
}

initDb().catch((err) => {
  console.error("Failed to initialize PostgreSQL:", err.message);
  process.exit(1);
});
