# POS Order & Inventory — Frontend (Task 01)

React (Vite) client — a simple staff-facing POS: browse inventory, build a cart, check out, and watch the mock payment/reservation lifecycle play out live.

## Setup

```bash
npm install
cp .env.example .env      # VITE_API_URL should point at the backend's /api
npm run dev                 # http://localhost:5173
```

Start the backend first (`../backend`).

## How to test each feature from the UI

| Feature | Where |
|---|---|
| Product CRUD | **Products** page — "+ New product", pencil/trash icons on each card |
| Live stock accuracy | Product cards show `available_stock` (total − reserved); it updates every 5s and immediately after your own actions |
| Add to cart / checkout | Add items from **Products**, open the cart (top right), click **Checkout** — this is the moment stock gets reserved |
| 5-minute reservation + countdown | Visible live in the cart drawer once you check out, and in the **Orders** table for any `reserved` order |
| Mock payment (success / failure / timeout) | Three buttons appear in the cart drawer right after checkout — click any one to see that exact code path resolve |
| Duplicate payment rejection | Click a payment outcome button twice quickly, or re-submit the same request with dev tools — the second returns a 409 |
| Cancellation | "Cancel reservation" in the cart drawer, or "Cancel" in the Orders table, while an order is still `reserved` |
| Reservation expiry | Check out, then simply wait — either watch the countdown hit zero and refresh, or leave it alone and let the backend's sweeper release it automatically |

## Project structure

```
src/
  api.js               fetch wrapper for the backend REST API
  CartContext.jsx        client-side cart state (not persisted server-side until checkout)
  components/
    Header.jsx, ProductCard.jsx, ProductFormModal.jsx
    CartDrawer.jsx        checkout + live countdown + payment simulation buttons
    OrderRow.jsx, StatusBadge.jsx
  pages/
    ProductsPage.jsx, OrdersPage.jsx
```

Cart contents live only in the browser (React context) until "Checkout" is clicked — that's the single API call that actually reserves stock, matching the spec's "reserve stock the moment a user enters checkout."
