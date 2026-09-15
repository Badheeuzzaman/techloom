const { getDatabase, nextId } = require("../config/db");
const AppError = require("../services/AppError");
const { catchAsync } = require("./errorHandler");

function presentProduct(product) {
  if (!product) return product;
  const { _id, ...rest } = product;
  return { ...rest, available_stock: rest.total_stock - rest.reserved_stock };
}

const listProducts = catchAsync(async (req, res) => {
  const db = await getDatabase();
  const products = await db.collection("products").find().sort({ id: 1 }).toArray();
  res.status(200).json({ products: products.map(presentProduct) });
});

const getProduct = catchAsync(async (req, res) => {
  const db = await getDatabase();
  const product = await db.collection("products").findOne({ id: Number(req.params.id) });
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
  const product = {
    id: await nextId("products"), name, price: Number(price), total_stock: totalStock,
    reserved_stock: 0, created_at: new Date(), updated_at: new Date(),
  };
  await db.collection("products").insertOne(product);
  res.status(201).json({ product: presentProduct(product) });
});

const updateProduct = catchAsync(async (req, res) => {
  const { name, price, totalStock } = req.body;
  const db = await getDatabase();
  const products = db.collection("products");
  const existing = await products.findOne({ id: Number(req.params.id) });
  if (!existing) throw new AppError("Product not found.", 404);

  if (totalStock !== undefined && (!Number.isInteger(totalStock) || totalStock < existing.reserved_stock)) {
    throw new AppError(
      `totalStock cannot be less than currently reserved stock (${existing.reserved_stock}).`,
      400
    );
  }

  const changes = { updated_at: new Date() };
  if (name !== undefined) changes.name = name;
  if (price !== undefined) changes.price = Number(price);
  if (totalStock !== undefined) changes.total_stock = totalStock;
  await products.updateOne({ id: Number(req.params.id) }, { $set: changes });
  const product = await products.findOne({ id: Number(req.params.id) });
  res.status(200).json({ product: presentProduct(product) });
});

const deleteProduct = catchAsync(async (req, res) => {
  const db = await getDatabase();
  const result = await db.collection("products").deleteOne({ id: Number(req.params.id) });
  if (result.deletedCount === 0) throw new AppError("Product not found.", 404);
  res.status(200).json({ message: "Product deleted." });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
