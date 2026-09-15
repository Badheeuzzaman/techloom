// api.js
// One place for every call to the backend, so components don't
// need to know about fetch() details or the base URL.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // The backend always sends { error: "message" } on failure.
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

export const api = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/products${query ? `?${query}` : ""}`);
  },
  getCategories: () => request("/products/categories"),
  getProduct: (id) => request(`/products/${id}`),

  checkout: (items, checkoutToken) =>
    request("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({ items, checkoutToken }),
    }),

  payOrder: (orderId, outcome) =>
    request(`/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify({ outcome }),
    }),

  cancelOrder: (orderId) =>
    request(`/orders/${orderId}/cancel`, { method: "POST" }),

  refundOrder: (orderId) =>
    request(`/orders/${orderId}/refund`, { method: "POST" }),

  getOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
};
