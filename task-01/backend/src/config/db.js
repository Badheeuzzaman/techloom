const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017");
let database;

async function connectDatabase() {
  if (!database) {
    await client.connect();
    database = client.db(process.env.MONGODB_DATABASE || "pos_inventory");
    await database.collection("orders").createIndex({ idempotency_key: 1 }, { unique: true, sparse: true });
    await database.collection("orders").createIndex({ status: 1, reserved_until: 1 });
  }
  return database;
}

async function getDatabase() {
  return database || connectDatabase();
}

async function nextId(sequence) {
  const db = await getDatabase();
  const result = await db.collection("counters").findOneAndUpdate(
    { _id: sequence }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after" }
  );
  return result.value;
}

module.exports = { client, connectDatabase, getDatabase, nextId };
