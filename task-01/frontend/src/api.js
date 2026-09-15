const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. a 204) — leave body null
  }

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  listProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  listOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request("/orders", { method: "POST", body: JSON.stringify(data) }),
  payOrder: (id, outcome) => request(`/orders/${id}/pay`, { method: "POST", body: JSON.stringify({ outcome }) }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: "POST" }),
};
