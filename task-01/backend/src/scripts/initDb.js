require("dotenv").config();
const { connectDatabase, client } = require("../config/db");

async function initDb() {
  const db = await connectDatabase();
  await db.collection("products").createIndex({ id: 1 }, { unique: true });
  await db.collection("orders").createIndex({ id: 1 }, { unique: true });
  console.log("MongoDB collections and indexes initialized successfully.");
  await client.close();
}

initDb().catch((err) => {
  console.error("Failed to initialize MongoDB:", err.message);
  process.exit(1);
});
