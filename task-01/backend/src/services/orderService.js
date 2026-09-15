const { getDatabase, nextId } = require("../config/db");
const paymentGateway = require("./mockPaymentGateway");
const AppError = require("./AppError");

const RESERVATION_MINUTES = Number(process.env.RESERVATION_MINUTES || 5);

async function fetchOrderWithItems(orderId) {
  const db = await getDatabase();
  const order = await db.collection("orders").findOne({ id: Number(orderId) });
  if (!order) return null;
  const items = await Promise.all(order.items.map(async (item) => {
    const product = await db.collection("products").findOne({ id: item.product_id }, { projection: { name: 1 } });
    return { ...item, product_name: product?.name || "" };
  }));
  const { _id, ...result } = order;
  return { ...result, items };
}

async function releaseReservedStock(order) {
  const db = await getDatabase();
  for (const item of order.items) {
    await db.collection("products").updateOne(
      { id: item.product_id, reserved_stock: { $gte: item.quantity } },
      { $inc: { reserved_stock: -item.quantity }, $set: { updated_at: new Date() } }
    );
  }
}

async function createOrder({ items, idempotencyKey }) {
  if (!Array.isArray(items) || items.length === 0) throw new AppError("At least one item is required.", 400);
  for (const item of items) {
    if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError("Each item needs a valid productId and a positive integer quantity.", 400);
    }
  }

  const db = await getDatabase();
  const orders = db.collection("orders");
  if (idempotencyKey) {
    const existing = await orders.findOne({ idempotency_key: idempotencyKey });
    if (existing) return fetchOrderWithItems(existing.id);
  }

  const reservedLines = [];
  let totalAmount = 0;
  try {
    for (const { productId, quantity } of items) {
      const result = await db.collection("products").findOneAndUpdate(
        { id: Number(productId), $expr: { $gte: [{ $subtract: ["$total_stock", "$reserved_stock"] }, quantity] } },
        { $inc: { reserved_stock: quantity }, $set: { updated_at: new Date() } },
        { returnDocument: "after" }
      );
      if (!result) {
        const exists = await db.collection("products").findOne({ id: Number(productId) });
        if (!exists) throw new AppError(`Product ${productId} does not exist.`, 404);
        throw new AppError(`Not enough stock available for product ${productId}.`, 409);
      }
      const product = result;
      const unitPrice = Number(product.price);
      totalAmount += unitPrice * quantity;
      reservedLines.push({ product_id: Number(productId), quantity, unit_price: unitPrice });
    }

    const order = {
      id: await nextId("orders"), idempotency_key: idempotencyKey || null, status: "reserved",
      total_amount: Number(totalAmount.toFixed(2)), reserved_until: new Date(Date.now() + RESERVATION_MINUTES * 60000),
      payment_outcome: null, items: reservedLines, created_at: new Date(), updated_at: new Date(),
    };
    await orders.insertOne(order);
    return fetchOrderWithItems(order.id);
  } catch (err) {
    if (err.code === 11000 && idempotencyKey) {
      const existing = await orders.findOne({ idempotency_key: idempotencyKey });
      if (existing) return fetchOrderWithItems(existing.id);
    }
    for (const item of reservedLines) {
      await db.collection("products").updateOne({ id: item.product_id }, { $inc: { reserved_stock: -item.quantity } });
    }
    throw err;
  }
}

async function expireIfNeeded(orderId) {
  const db = await getDatabase();
  const result = await db.collection("orders").findOneAndUpdate(
    { id: Number(orderId), status: "reserved", reserved_until: { $lt: new Date() } },
    { $set: { status: "expired", reserved_until: null, updated_at: new Date() } },
    { returnDocument: "before" }
  );
  if (result) await releaseReservedStock(result);
}

async function getOrder(orderId) {
  await expireIfNeeded(orderId);
  const order = await fetchOrderWithItems(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  return order;
}

async function listOrders() {
  const db = await getDatabase();
  const orders = await db.collection("orders").find().sort({ created_at: -1 }).toArray();
  await Promise.all(orders.filter((o) => o.status === "reserved" && o.reserved_until < new Date()).map((o) => expireIfNeeded(o.id)));
  const fresh = await db.collection("orders").find().sort({ created_at: -1 }).toArray();
  return Promise.all(fresh.map((order) => fetchOrderWithItems(order.id)));
}

async function resolveOrder(orderId, newStatus, paymentOutcome) {
  const db = await getDatabase();
  const orders = db.collection("orders");
  const result = await orders.findOneAndUpdate(
    { id: Number(orderId), status: "reserved" },
    { $set: { status: newStatus, payment_outcome: paymentOutcome || null, reserved_until: null, updated_at: new Date() } },
    { returnDocument: "before" }
  );
  if (!result) {
    const current = await orders.findOne({ id: Number(orderId) });
    if (!current) throw new AppError("Order not found.", 404);
    throw new AppError(`Order cannot be updated — current status is "${current.status}".`, 409);
  }
  if (newStatus === "paid") {
    for (const item of result.items) {
      await db.collection("products").updateOne({ id: item.product_id }, { $inc: { total_stock: -item.quantity, reserved_stock: -item.quantity }, $set: { updated_at: new Date() } });
    }
  } else {
    await releaseReservedStock(result);
  }
  return fetchOrderWithItems(orderId);
}

async function payOrder(orderId, forcedOutcome) {
  await expireIfNeeded(orderId);
  const existing = await fetchOrderWithItems(orderId);
  if (!existing) throw new AppError("Order not found.", 404);
  if (existing.status !== "reserved") throw new AppError(`Order is not payable — current status is "${existing.status}".`, 409);
  const result = await paymentGateway.charge(existing.total_amount, forcedOutcome);
  const status = result.outcome === "success" ? "paid" : result.outcome === "failure" ? "failed" : "expired";
  return resolveOrder(orderId, status, result.outcome);
}

async function cancelOrder(orderId) {
  await expireIfNeeded(orderId);
  return resolveOrder(orderId, "cancelled");
}

async function sweepExpiredReservations() {
  const db = await getDatabase();
  const candidates = await db.collection("orders").find({ status: "reserved", reserved_until: { $lt: new Date() } }).toArray();
  let count = 0;
  for (const order of candidates) {
    try { await resolveOrder(order.id, "expired"); count += 1; } catch (err) { if (err.statusCode !== 409) throw err; }
  }
  return count;
}

module.exports = { createOrder, getOrder, listOrders, payOrder, cancelOrder, sweepExpiredReservations };
