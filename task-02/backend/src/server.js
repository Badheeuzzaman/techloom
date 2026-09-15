// server.js
// Entry point for the backend. Sets up Express, CORS, and routes.

const express = require("express");
const cors = require("cors");

const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check, useful once this is deployed.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
