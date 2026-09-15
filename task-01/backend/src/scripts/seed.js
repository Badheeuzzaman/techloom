require("dotenv").config();
const { connectDatabase, client } = require("../config/db");

const PRODUCTS = [
  { name: "Espresso Blend Coffee (250g)", price: 12.5, total_stock: 50 },
  { name: "Ceramic Pour-Over Dripper", price: 24.0, total_stock: 15 },
  { name: "Limited Edition Tasting Set", price: 45.0, total_stock: 1 },
  { name: "Reusable Cold Brew Bottle", price: 18.0, total_stock: 8 },
  { name: "House Blend Tea (100g)", price: 9.0, total_stock: 30 },
];

async function seed() {
  const db = await connectDatabase();
  await db.collection("orders").deleteMany({});
  await db.collection("products").deleteMany({});
  await db.collection("counters").updateOne({ _id: "products" }, { $set: { value: PRODUCTS.length } }, { upsert: true });
  await db.collection("counters").updateOne({ _id: "orders" }, { $set: { value: 0 } }, { upsert: true });
  await db.collection("products").insertMany(PRODUCTS.map((product, index) => ({
    ...product, id: index + 1, reserved_stock: 0, created_at: new Date(), updated_at: new Date(),
  })));
  console.log(`Seeded ${PRODUCTS.length} products in MongoDB.`);
  await client.close();
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
