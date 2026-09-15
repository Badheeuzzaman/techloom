const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URI ||
    "postgresql://postgres:postgres@127.0.0.1:5432/pos_inventory",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function connectDatabase() {
  await pool.query("SELECT 1");
  return pool;
}

async function getDatabase() {
  return pool;
}

async function nextId(sequence) {
  const sequenceName =
    sequence === "products" ? "products_id_seq" :
    sequence === "orders" ? "orders_id_seq" :
    `${sequence}_id_seq`;

  const result = await pool.query(`SELECT nextval($1) AS value`, [sequenceName]);
  return Number(result.rows[0].value);
}

module.exports = { client: pool, pool, connectDatabase, getDatabase, nextId };
