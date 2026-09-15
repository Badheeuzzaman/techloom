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
  await connectDatabase();
  await client.query("TRUNCATE TABLE order_items, orders, products RESTART IDENTITY CASCADE");
  const values = PRODUCTS.map((product) => `('${product.name}', ${Number(product.price)}, ${product.total_stock}, 0, NOW(), NOW())`).join(", ");
  await client.query(
    `INSERT INTO products (name, price, total_stock, reserved_stock, created_at, updated_at) VALUES ${values}`
  );
  console.log(`Seeded ${PRODUCTS.length} products in PostgreSQL.`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
