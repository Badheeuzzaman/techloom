// data.js
// This file holds all of our "database" in memory (simple arrays).
// In a real app this would live in MongoDB/PostgreSQL, but for a
// beginner-friendly demo, plain JavaScript arrays are easy to read.

let products = [
  {
    id: 1,
    name: "Peacock Blue Ceramic Mug",
    description: "A hand-glazed mug in a deep peacock-blue finish. Holds 350ml.",
    category: "Home",
    price: 12.99,
    stock: 8,
    image: "https://picsum.photos/seed/mug/400/300",
  },
  {
    id: 2,
    name: "Wireless Earbuds",
    description: "Bluetooth 5.3 earbuds with 24-hour battery life via the case.",
    category: "Electronics",
    price: 39.5,
    stock: 3,
    image: "https://picsum.photos/seed/earbuds/400/300",
  },
  {
    id: 3,
    name: "Canvas Tote Bag",
    description: "Sturdy cotton canvas tote, perfect for groceries or books.",
    category: "Accessories",
    price: 15.0,
    stock: 20,
    image: "https://picsum.photos/seed/tote/400/300",
  },
  {
    id: 4,
    name: "Desk Lamp",
    description: "Adjustable LED desk lamp with 3 brightness levels.",
    category: "Home",
    price: 24.75,
    stock: 5,
    image: "https://picsum.photos/seed/lamp/400/300",
  },
  {
    id: 5,
    name: "Mechanical Keyboard",
    description: "Compact 65% mechanical keyboard with blue switches.",
    category: "Electronics",
    price: 58.0,
    stock: 4,
    image: "https://picsum.photos/seed/keyboard/400/300",
  },
  {
    id: 6,
    name: "Notebook Set (3-Pack)",
    description: "Dot-grid notebooks, 120 pages each, recycled paper.",
    category: "Stationery",
    price: 9.99,
    stock: 15,
    image: "https://picsum.photos/seed/notebook/400/300",
  },
  {
    id: 7,
    name: "Water Bottle",
    description: "Insulated stainless steel bottle, keeps drinks cold 24h.",
    category: "Accessories",
    price: 18.25,
    stock: 0,
    image: "https://picsum.photos/seed/bottle/400/300",
  },
  {
    id: 8,
    name: "Bluetooth Speaker",
    description: "Portable speaker with rich bass and 10-hour playtime.",
    category: "Electronics",
    price: 29.99,
    stock: 6,
    image: "https://picsum.photos/seed/speaker/400/300",
  },
];

// Orders are created when a user checks out.
// Each order has a status that moves through a simple lifecycle:
// RESERVED -> PAID -> (CANCELLED / REFUNDED)
// RESERVED -> FAILED
// RESERVED -> EXPIRED
let orders = [];

// Simple counters used to generate unique ids.
let nextProductId = products.length + 1;
let nextOrderId = 1;

module.exports = {
  products,
  orders,
  getNextProductId: () => nextProductId++,
  getNextOrderId: () => nextOrderId++,
};
