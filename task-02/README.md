# Task 02 — E-Commerce Checkout & Payment System

> **Live deployment links** (fill these in after deploying — see [Deploying](#deploying)):
> - Frontend: `<add your Render static site URL here>`
> - Backend API: `<add your Render API URL here>`
> - Repository: `<add your GitHub repo URL here>`

A small, beginner-friendly online store: browse products, search and filter, add to cart, check out with a 5-minute stock reservation, simulate a payment gateway (success / failure / timeout), and manage orders (cancel, refund, order history).

This is a **mock** system — no real payments are processed and no real money moves. It's built to demonstrate the checkout logic itself: stock reservation, payment outcomes, and how orders move through their lifecycle.

## Tech stack

- **Backend:** Node.js + Express, in-memory data store (plain JavaScript arrays — no database setup needed to run this)
- **Frontend:** React + Vite, React Router, plain CSS (no UI framework)
- **Theme:** blue (`#1958D8`) and peacock green (`#0B6E4F`)

Kept intentionally simple: no TypeScript, no state-management library, no ORM. Everything is commented so it's easy to follow.

## Project structure

```
task-02/
├── backend/           Express API (products, checkout, payments, orders)
│   └── src/
│       ├── data.js         in-memory products + orders "database"
│       ├── server.js       app entry point
│       └── routes/
│           ├── products.js
│           └── orders.js
└── frontend/          React app (Vite)
    └── src/
        ├── api.js               all fetch() calls to the backend
        ├── context/CartContext.jsx
        └── components/          pages: product list, details, cart, checkout, orders
```

## Setup — run locally

You'll need Node.js 18+ installed.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # defaults are fine for local use
npm start
```

The API runs at `http://localhost:5000`. Check it's up with:

```bash
curl http://localhost:5000/api/health
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # points the frontend at http://localhost:5000/api by default
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `PORT` | Port the API listens on (default `5000`) |
| `backend/.env` | `RESERVATION_TIMEOUT_MS` | How long a stock reservation lasts before auto-expiring (default `300000` = 5 minutes). Lower this (e.g. `30000`) while testing so you don't have to wait 5 minutes to see expiry happen. |
| `frontend/.env` | `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:5000/api`, or your deployed backend URL + `/api`) |

## How to test each feature

**Product discovery**
- Home page: type in the search box, pick a category, set a max price, or check "in stock only" — the grid updates.
- Click any product for its details page.

**Cart & checkout**
- Add a product to the cart, adjust quantity, then go to Cart → Checkout.
- On the checkout page, stock is reserved immediately and a 5-minute countdown starts.
- Click **Simulate success**, **Simulate failure**, or **Simulate timeout** to see each payment outcome:
  - *Success* → order becomes `PAID`, cart clears.
  - *Failure* → order becomes `FAILED`, stock is released back.
  - *Timeout* → order becomes `EXPIRED`, stock is released back.

**Reservation expiry**
- Start a checkout and simply wait (or set `RESERVATION_TIMEOUT_MS=30000` in `backend/.env` for a 30-second test) without clicking a payment button. The order will auto-expire and stock returns to the pool.

**Duplicate prevention**
- The frontend generates a unique token per checkout attempt, so retrying the same checkout (e.g. a double click) returns the same order instead of reserving stock twice.
- Once an order is `PAID`, `FAILED`, `EXPIRED`, or `CANCELLED`, trying to pay it again is rejected by the API (`409` error) — this is enforced server-side, not just hidden in the UI.

**Order history & post-purchase**
- Go to "My Orders" to see every order and its status.
- Open an order: a `RESERVED` or `PAID` order can be **cancelled** (stock is restored, and a paid order is marked refunded). A `PAID` order can also be **refunded** directly.

**Concurrency (no overselling)**
- Because stock is checked and deducted in a single synchronous step per request, two checkouts racing for the last item in stock cannot both succeed — one will get a "not enough stock" error. This was verified with 5 simultaneous checkout requests against 3 units of stock: exactly 3 succeeded and 2 were rejected, with stock never going negative.

## Notes & simplifications

- **Single "user":** there's no login system, so order history shows all orders rather than per-account history. This keeps the assessment focused on the checkout/payment logic itself.
- **In-memory storage:** data resets whenever the backend restarts. This was a deliberate choice to keep setup to `npm install && npm start` with no database to provision — the reservation/payment/lifecycle logic (the actual point of the assessment) is unaffected by this choice.
- **Mock payments only:** the "payment gateway" is a button the user clicks to choose an outcome — there's no real payment provider involved.

## Deploying with Render and GitHub

This repository includes root-level `render.yaml` and `.github/workflows/deploy.yml`. GitHub is the source repository and Render hosts both services:

1. Push the repository to GitHub and connect it to Render.
2. In Render, choose **New -> Blueprint** and select the repository. Use `render.yaml` as the Blueprint file.
3. Render creates the `task-02-api` Node web service and the `task-02-frontend` static site.
4. Set the frontend service's `VITE_API_URL` to the deployed API URL plus `/api`, for example `https://task-02-api.onrender.com/api`.
5. Add `RESERVATION_TIMEOUT_MS` to the API service if you want a value other than 5 minutes.
6. Add the Render deploy hook URLs as the GitHub repository secrets `RENDER_BACKEND_DEPLOY_HOOK` and `RENDER_FRONTEND_DEPLOY_HOOK`. The workflow builds both services on pull requests and triggers Render after successful pushes to `main`.
7. Update the live links at the top of this README.

The frontend rewrite in `render.yaml` keeps React Router routes working after a page refresh. Verify the API with `https://<your-api-host>/api/health` after deployment.
