/**
 * Fires many simultaneous checkout requests at the same low-stock product
 * and verifies that exactly as many succeed as there is stock for — no
 * more. Run against a live server: `npm run test:concurrency`.
 */
require("dotenv").config();
const http = require("http");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";
const PRODUCT_ID = process.env.TEST_PRODUCT_ID || 3; // seeded with total_stock = 1
const CONCURRENT_REQUESTS = Number(process.env.TEST_CONCURRENCY || 25);

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BASE_URL}${path}`,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: safeParse(raw) }));
      }
    );
    req.on("error", (err) => resolve({ status: 0, body: { message: err.message } }));
    req.write(data);
    req.end();
  });
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function get(path) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: safeParse(raw) }));
    });
  });
}

async function main() {
  const before = await get(`/api/products/${PRODUCT_ID}`);
  const startingAvailable = before.body.product.available_stock;
  console.log(`Product ${PRODUCT_ID} ("${before.body.product.name}") available stock before test: ${startingAvailable}`);
  console.log(`Firing ${CONCURRENT_REQUESTS} simultaneous checkout requests for 1 unit each...\n`);

  const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
    post("/api/orders", { items: [{ productId: Number(PRODUCT_ID), quantity: 1 }], idempotencyKey: `concurrency-test-${Date.now()}-${i}` })
  );

  const results = await Promise.all(requests);

  const succeeded = results.filter((r) => r.status === 201);
  const rejected = results.filter((r) => r.status === 409);
  const other = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log(`Succeeded (201): ${succeeded.length}`);
  console.log(`Rejected as out-of-stock (409): ${rejected.length}`);
  if (other.length) {
    console.log(`Unexpected responses: ${other.length}`);
    other.forEach((r) => console.log("  ->", r.status, JSON.stringify(r.body)));
  }

  const after = await get(`/api/products/${PRODUCT_ID}`);
  console.log(`\nProduct state after test: total_stock=${after.body.product.total_stock}, reserved_stock=${after.body.product.reserved_stock}, available_stock=${after.body.product.available_stock}`);

  const expectedSuccesses = Math.min(startingAvailable, CONCURRENT_REQUESTS);
  const pass = succeeded.length === expectedSuccesses && other.length === 0;

  console.log(`\nExpected exactly ${expectedSuccesses} success(es) out of ${CONCURRENT_REQUESTS} concurrent attempts.`);
  console.log(pass ? "\n✅ PASS — no overselling occurred." : "\n❌ FAIL — result does not match expected outcome.");
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error("Test script error:", err);
  process.exit(1);
});
