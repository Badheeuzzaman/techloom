// routes/orders.js
// This is the heart of the assessment: checkout, stock reservation,
// mock payments, refunds, cancellation and order history.
//
// To keep things beginner-friendly, everything lives in memory
// (see data.js) and is explained with comments at each step.

const express = require("express");
const router = express.Router();
const { products, orders, getNextOrderId } = require("../data");

// How long a stock reservation lasts before it auto-expires.
// Defaults to 5 minutes as required by the assessment, but can be
// shortened with an environment variable so it's easy to demo.
const RESERVATION_MS = Number(process.env.RESERVATION_TIMEOUT_MS) || 5 * 60 * 1000;

// Keeps track of the setTimeout for each order so we can cancel it
// if the order is paid/cancelled before it naturally expires.
const expiryTimers = new Map();

// Keeps track of checkout tokens we've already seen, so if the
// frontend accidentally submits the same checkout twice (double
// click, network retry, etc.) we don't create two orders.
const usedCheckoutTokens = new Map(); // token -> orderId

function findOrder(id) {
  return orders.find((o) => o.id === Number(id));
}

function findProduct(id) {
  return products.find((p) => p.id === Number(id));
}

// Puts stock back on the shelf for every item in an order.
// Used when an order fails, expires, or is cancelled/refunded.
function restoreStock(order) {
  order.items.forEach((item) => {
    const product = findProduct(item.productId);
    if (product) {
      product.stock += item.qty;
    }
  });
}

// Moves an order from RESERVED to EXPIRED once the timer runs out.
function expireOrder(orderId) {
  const order = findOrder(orderId);
  if (order && order.status === "RESERVED") {
    order.status = "EXPIRED";
    restoreStock(order);
  }
  expiryTimers.delete(orderId);
}

// ---------- CHECKOUT (creates the order + reserves stock) ----------
// POST /api/checkout
// body: { items: [{ productId, qty }], checkoutToken }
router.post("/checkout", (req, res) => {
  const { items, checkoutToken } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }
  if (!checkoutToken) {
    return res.status(400).json({ error: "Missing checkoutToken." });
  }

  // If we've already processed this exact checkout attempt before,
  // just return the order we already created instead of making a
  // second one. This stops duplicate submissions from double-booking.
  if (usedCheckoutTokens.has(checkoutToken)) {
    const existingOrder = findOrder(usedCheckoutTokens.get(checkoutToken));
    return res.status(200).json(existingOrder);
  }

  // Step 1: validate every item has enough stock BEFORE reserving
  // anything, so we never partially reserve an order.
  for (const item of items) {
    const product = findProduct(item.productId);
    if (!product) {
      return res.status(404).json({ error: `Product ${item.productId} not found.` });
    }
    if (product.stock < item.qty) {
      return res.status(409).json({
        error: `Not enough stock for "${product.name}". Only ${product.stock} left.`,
      });
    }
  }

  // Step 2: reserve stock by deducting it now. It comes back if
  // payment fails, times out, or the order is cancelled/refunded.
  const orderItems = items.map((item) => {
    const product = findProduct(item.productId);
    product.stock -= item.qty;
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: item.qty,
    };
  });

  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const order = {
    id: getNextOrderId(),
    items: orderItems,
    total: Number(total.toFixed(2)),
    status: "RESERVED",
    paymentAttempted: false,
    refunded: false,
    checkoutToken,
    createdAt: new Date().toISOString(),
    reservationExpiresAt: new Date(Date.now() + RESERVATION_MS).toISOString(),
  };

  orders.push(order);
  usedCheckoutTokens.set(checkoutToken, order.id);

  // Start the auto-expiry timer for this reservation.
  const timer = setTimeout(() => expireOrder(order.id), RESERVATION_MS);
  expiryTimers.set(order.id, timer);

  res.status(201).json(order);
});

// ---------- MOCK PAYMENT ----------
// POST /api/orders/:id/pay
// body: { outcome: "success" | "fail" | "timeout" }
router.post("/:id/pay", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  // Only a RESERVED order can be paid. This single check blocks:
  //  - paying an order twice
  //  - paying an order that already failed/expired/was cancelled
  if (order.status !== "RESERVED") {
    return res.status(409).json({
      error: `This order can't be paid because its status is "${order.status}".`,
    });
  }

  // Lock the order immediately so a second, near-simultaneous
  // payment request for the same order is rejected as a duplicate.
  if (order.paymentAttempted) {
    return res.status(409).json({ error: "A payment is already being processed for this order." });
  }
  order.paymentAttempted = true;

  // Stop the auto-expiry timer since we're resolving the order now.
  clearTimeout(expiryTimers.get(order.id));
  expiryTimers.delete(order.id);

  const outcome = req.body.outcome || "success";

  if (outcome === "success") {
    order.status = "PAID";
    order.paidAt = new Date().toISOString();
  } else if (outcome === "fail") {
    order.status = "FAILED";
    restoreStock(order);
  } else if (outcome === "timeout") {
    order.status = "EXPIRED";
    restoreStock(order);
  } else {
    order.paymentAttempted = false; // undo the lock, this was a bad request
    return res.status(400).json({ error: "outcome must be success, fail, or timeout." });
  }

  res.json(order);
});

// ---------- CANCEL ----------
// POST /api/orders/:id/cancel
router.post("/:id/cancel", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  if (order.status === "RESERVED") {
    clearTimeout(expiryTimers.get(order.id));
    expiryTimers.delete(order.id);
    order.status = "CANCELLED";
    restoreStock(order);
    return res.json(order);
  }

  if (order.status === "PAID") {
    // Cancelling a paid order simulates an automatic refund.
    order.status = "CANCELLED";
    order.refunded = true;
    order.refundedAt = new Date().toISOString();
    restoreStock(order);
    return res.json(order);
  }

  return res.status(409).json({
    error: `Order with status "${order.status}" cannot be cancelled.`,
  });
});

// ---------- REFUND (paid order only) ----------
// POST /api/orders/:id/refund
router.post("/:id/refund", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }
  if (order.status !== "PAID") {
    return res.status(409).json({ error: "Only paid orders can be refunded." });
  }

  order.status = "REFUNDED";
  order.refunded = true;
  order.refundedAt = new Date().toISOString();
  restoreStock(order);
  res.json(order);
});

// ---------- ORDER HISTORY ----------
// GET /api/orders
router.get("/", (req, res) => {
  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sorted);
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }
  res.json(order);
});

module.exports = router;
