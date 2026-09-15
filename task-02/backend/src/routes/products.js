// routes/products.js
// Handles browsing, searching and filtering products, plus a
// details endpoint for a single product.

const express = require("express");
const router = express.Router();
const { products } = require("../data");

// GET /api/products?search=lamp&category=Home&minPrice=10&maxPrice=50&inStock=true
router.get("/", (req, res) => {
  const { search, category, minPrice, maxPrice, inStock } = req.query;

  let results = [...products];

  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }

  if (category && category !== "All") {
    results = results.filter((p) => p.category === category);
  }

  if (minPrice) {
    results = results.filter((p) => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter((p) => p.price <= Number(maxPrice));
  }

  if (inStock === "true") {
    results = results.filter((p) => p.stock > 0);
  }

  res.json(results);
});

// GET /api/products/categories - used to build the filter dropdown
router.get("/categories", (req, res) => {
  const categories = [...new Set(products.map((p) => p.category))];
  res.json(categories);
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }
  res.json(product);
});

module.exports = router;
