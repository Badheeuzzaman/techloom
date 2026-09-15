const orderService = require("../services/orderService");
const AppError = require("../services/AppError");
const { catchAsync } = require("./errorHandler");

const createOrder = catchAsync(async (req, res) => {
  const { items, idempotencyKey } = req.body;
  const order = await orderService.createOrder({ items, idempotencyKey });
  res.status(201).json({ order });
});

const listOrders = catchAsync(async (req, res) => {
  const orders = await orderService.listOrders();
  res.status(200).json({ orders });
});

const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  res.status(200).json({ order });
});

const payOrder = catchAsync(async (req, res) => {
  const { outcome } = req.body; // optional: 'success' | 'failure' | 'timeout'
  if (outcome && !["success", "failure", "timeout"].includes(outcome)) {
    throw new AppError("outcome must be one of success, failure, timeout.", 400);
  }
  const order = await orderService.payOrder(req.params.id, outcome);
  res.status(200).json({ order });
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id);
  res.status(200).json({ order });
});

module.exports = { createOrder, listOrders, getOrder, payOrder, cancelOrder };
