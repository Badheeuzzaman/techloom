const { getDatabase, nextId } = require("../config/db");
const AppError = require("../services/AppError");
const { catchAsync } = require("./errorHandler");

function presentProduct(product) {
  if (!product) return product;
  return { ...product, available_stock: product.total_stock - product.reserved_stock };
}

const listProducts = catchAsync(async (req, res) => {
  const db = await getDatabase();
  const { rows } = await db.query("SELECT * FROM products ORDER BY id ASC");
  res.status(200).json({ products: rows.map(presentProduct) });
});

const getProduct = catchAsync(async (req, res) => {
  const db = await getDatabase();
  const { rows } = await db.query("SELECT * FROM products WHERE id = $1", [Number(req.params.id)]);
  const product = rows[0];
  if (!product) throw new AppError("Product not found.", 404);
  res.status(200).json({ product: presentProduct(product) });
});

const createProduct = catchAsync(async (req, res) => {
  const { name, price, totalStock } = req.body;
  if (!name || price === undefined || totalStock === undefined) {
    throw new AppError("name, price and totalStock are required.", 400);
  }
  if (Number(price) < 0 || !Number.isInteger(totalStock) || totalStock < 0) {
    throw new AppError("price must be >= 0 and totalStock must be a non-negative integer.", 400);
  }

  const db = await getDatabase();
  const id = await nextId("products");
  const { rows } = await db.query(
    `INSERT INTO products (id, name, price, total_stock, reserved_stock, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 0, NOW(), NOW()) RETURNING *`,
    [id, name, Number(price), totalStock]
  );
  res.status(201).json({ product: presentProduct(rows[0]) });
});

const updateProduct = catchAsync(async (req, res) => {
  const { name, price, totalStock } = req.body;
  const db = await getDatabase();
  const existing = await db.query("SELECT * FROM products WHERE id = $1", [Number(req.params.id)]);
  if (existing.rows.length === 0) throw new AppError("Product not found.", 404);

  if (totalStock !== undefined && (!Number.isInteger(totalStock) || totalStock < existing.rows[0].reserved_stock)) {
    throw new AppError(
      `totalStock cannot be less than currently reserved stock (${existing.rows[0].reserved_stock}).`,
      400
    );
  }

  const values = [Number(req.params.id)];
  const assignments = ["updated_at = NOW()"];
  if (name !== undefined) {
    assignments.push("name = $" + (values.length + 1));
    values.push(name);
  }
  if (price !== undefined) {
    assignments.push("price = $" + (values.length + 1));
    values.push(Number(price));
  }
  if (totalStock !== undefined) {
    assignments.push("total_stock = $" + (values.length + 1));
    values.push(totalStock);
  }

  const { rows } = await db.query(
    `UPDATE products SET ${assignments.join(", ")} WHERE id = $1 RETURNING *`,
    values
  );
  res.status(200).json({ product: presentProduct(rows[0]) });
});

const deleteProduct = catchAsync(async (req, res) => {
  const db = await getDatabase();
  const { rows } = await db.query("DELETE FROM products WHERE id = $1 RETURNING *", [Number(req.params.id)]);
  if (rows.length === 0) throw new AppError("Product not found.", 404);
  res.status(200).json({ message: "Product deleted." });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
