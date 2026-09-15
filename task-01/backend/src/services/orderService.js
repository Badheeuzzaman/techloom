const { getDatabase, nextId } = require("../config/db");
const paymentGateway = require("./mockPaymentGateway");
const AppError = require("./AppError");

const RESERVATION_MINUTES = Number(process.env.RESERVATION_MINUTES || 5);

async function fetchOrderWithItems(orderId) {
  const db = await getDatabase();
  const { rows: orderRows } = await db.query(
    `SELECT o.*
     FROM orders o
     WHERE o.id = $1`,
    [Number(orderId)]
  );

  const order = orderRows[0];
  if (!order) return null;

  const { rows: itemRows } = await db.query(
    `SELECT oi.product_id, oi.quantity, oi.unit_price, p.name AS product_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [Number(orderId)]
  );

  return { ...order, items: itemRows.map((item) => ({ ...item, product_name: item.product_name })) };
}

async function releaseReservedStock(order) {
  const db = await getDatabase();
  for (const item of order.items || []) {
    await db.query(
      `UPDATE products
       SET reserved_stock = reserved_stock - $1,
           updated_at = NOW()
       WHERE id = $2 AND reserved_stock >= $1`,
      [item.quantity, item.product_id]
    );
  }
}

async function createOrder({ items, idempotencyKey }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one item is required.", 400);
  }

  for (const item of items) {
    if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError("Each item needs a valid productId and a positive integer quantity.", 400);
    }
  }

  const db = await getDatabase();
  if (idempotencyKey) {
    const existing = await db.query("SELECT * FROM orders WHERE idempotency_key = $1", [idempotencyKey]);
    if (existing.rows[0]) return fetchOrderWithItems(existing.rows[0].id);
  }

  const reservedLines = [];
  let totalAmount = 0;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    for (const { productId, quantity } of items) {
      const productQuery = await client.query(
        "SELECT * FROM products WHERE id = $1 FOR UPDATE",
        [Number(productId)]
      );
      const product = productQuery.rows[0];
      if (!product) throw new AppError(`Product ${productId} does not exist.`, 404);
      if (product.total_stock - product.reserved_stock < quantity) {
        throw new AppError(`Not enough stock available for product ${productId}.`, 409);
      }

      const unitPrice = Number(product.price);
      totalAmount += unitPrice * quantity;
      reservedLines.push({ product_id: Number(productId), quantity, unit_price: unitPrice });

      await client.query(
        `UPDATE products
         SET reserved_stock = reserved_stock + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [quantity, Number(productId)]
      );
    }

    const orderId = await nextId("orders");
    const orderResult = await client.query(
      `INSERT INTO orders (id, idempotency_key, status, total_amount, reserved_until, payment_outcome, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 minute'), $6, NOW(), NOW()) RETURNING *`,
      [orderId, idempotencyKey || null, "reserved", Number(totalAmount.toFixed(2)), RESERVATION_MINUTES, null]
    );

    for (const item of reservedLines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query("COMMIT");
    return fetchOrderWithItems(orderId);
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505" && idempotencyKey) {
      const existing = await db.query("SELECT * FROM orders WHERE idempotency_key = $1", [idempotencyKey]);
      if (existing.rows[0]) return fetchOrderWithItems(existing.rows[0].id);
    }

    for (const item of reservedLines) {
      await db.query(
        `UPDATE products
         SET reserved_stock = reserved_stock - $1,
             updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    throw err;
  } finally {
    client.release();
  }
}

async function expireIfNeeded(orderId) {
  const db = await getDatabase();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const orderQuery = await client.query(
      `SELECT o.*
       FROM orders o
       WHERE o.id = $1 AND o.status = 'reserved' AND o.reserved_until < NOW()
       FOR UPDATE`,
      [Number(orderId)]
    );

    const currentOrder = orderQuery.rows[0];
    if (!currentOrder) {
      await client.query("COMMIT");
      return;
    }

    const itemQuery = await client.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
      [Number(orderId)]
    );

    await client.query(
      `UPDATE orders
       SET status = 'expired', reserved_until = NULL, updated_at = NOW()
       WHERE id = $1`,
      [Number(orderId)]
    );

    for (const item of itemQuery.rows) {
      await client.query(
        `UPDATE products
         SET reserved_stock = reserved_stock - $1,
             updated_at = NOW()
         WHERE id = $2 AND reserved_stock >= $1`,
        [item.quantity, item.product_id]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getOrder(orderId) {
  await expireIfNeeded(orderId);
  const order = await fetchOrderWithItems(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  return order;
}

async function listOrders() {
  const db = await getDatabase();
  const orders = await db.query("SELECT * FROM orders ORDER BY created_at DESC");
  for (const order of orders.rows) {
    if (order.status === "reserved" && order.reserved_until && order.reserved_until < new Date()) {
      await expireIfNeeded(order.id);
    }
  }

  const fresh = await db.query("SELECT * FROM orders ORDER BY created_at DESC");
  return Promise.all(fresh.rows.map((order) => fetchOrderWithItems(order.id)));
}

async function resolveOrder(orderId, newStatus, paymentOutcome) {
  const db = await getDatabase();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const orderQuery = await client.query(
      `SELECT o.*
       FROM orders o
       WHERE o.id = $1
       FOR UPDATE`,
      [Number(orderId)]
    );
    const current = orderQuery.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      throw new AppError("Order not found.", 404);
    }

    if (current.status !== "reserved") {
      await client.query("ROLLBACK");
      throw new AppError(`Order cannot be updated — current status is "${current.status}".`, 409);
    }

    const itemQuery = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [Number(orderId)]
    );

    await client.query(
      `UPDATE orders
       SET status = $2,
           payment_outcome = $3,
           reserved_until = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [Number(orderId), newStatus, paymentOutcome || null]
    );

    if (newStatus === "paid") {
      for (const item of itemQuery.rows) {
        await client.query(
          `UPDATE products
           SET total_stock = total_stock - $1,
               reserved_stock = reserved_stock - $1,
               updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    } else {
      for (const item of itemQuery.rows) {
        await client.query(
          `UPDATE products
           SET reserved_stock = reserved_stock - $1,
               updated_at = NOW()
           WHERE id = $2 AND reserved_stock >= $1`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query("COMMIT");
    return fetchOrderWithItems(orderId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
  const candidates = await db.query(
    `SELECT id
     FROM orders
     WHERE status = 'reserved' AND reserved_until < NOW()`
  );

  let count = 0;
  for (const order of candidates.rows) {
    try {
      await resolveOrder(order.id, "expired");
      count += 1;
    } catch (err) {
      if (err.statusCode !== 409) throw err;
    }
  }
  return count;
}

module.exports = { createOrder, getOrder, listOrders, payOrder, cancelOrder, sweepExpiredReservations };
