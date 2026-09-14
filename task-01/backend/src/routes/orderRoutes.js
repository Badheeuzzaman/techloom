const express = require("express");
const { createOrder, listOrders, getOrder, payOrder, cancelOrder } = require("../controllers/orderController");

const router = express.Router();

router.get("/", listOrders);
router.post("/", createOrder); // checkout: creates the order AND reserves stock atomically
router.get("/:id", getOrder);
router.post("/:id/pay", payOrder);
router.post("/:id/cancel", cancelOrder);

module.exports = router;
