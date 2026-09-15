# POS Order & Inventory — Backend (Task 01)

Concurrency-safe REST API for a point-of-sale inventory and order system. Express + MongoDB.

## Why MongoDB

The stock reservation uses MongoDB's atomic conditional `findOneAndUpdate`. The database evaluates the available-stock expression and increments `reserved_stock` as one operation, so concurrent requests cannot reserve the same final unit.

## How concurrency safety actually works

Every stock change is a **single atomic MongoDB update**, never a read-then-write:

```js
findOneAndUpdate(
  { id: productId, $expr: { $gte: [{ $subtract: ["$total_stock", "$reserved_stock"] }, quantity] } },
  { $inc: { reserved_stock: quantity } }
);
```

MongoDB evaluates the filter and applies the update atomically per product document. If two requests race for the last unit, one update matches and the other gets no document back and is rejected. There is no read-then-write gap for a second request to oversell stock.

The same pattern secures every other transition: paying, cancelling, and expiring an order all use an atomic update filtered by `id` and `status: 'reserved'`. Two simultaneous attempts to resolve the *same* order can't both succeed; only one update matches and the loser gets a 409.

**This is proven, not just asserted** — `npm run test:concurrency` fires 25+ simultaneous checkout requests at a product with a single unit of stock and verifies exactly one succeeds:

```
Product 3 ("Limited Edition Tasting Set") available stock before test: 1
Firing 25 simultaneous checkout requests for 1 unit each...

Succeeded (201): 1
Rejected as out-of-stock (409): 24

Product state after test: total_stock=1, reserved_stock=1, available_stock=0
✅ PASS — no overselling occurred.
```

## Order lifecycle

```
                    ┌──────────► paid       (payment succeeds — stock permanently deducted)
                    │
 [checkout] ──► reserved ──────► failed     (payment fails — stock released)
                    │
                    ├──────────► expired    (payment times out, OR 5 minutes pass unattended)
                    │
                    └──────────► cancelled  (user cancels before paying)
```

`paid`, `failed`, `expired`, `cancelled` are terminal. Every arrow out of `reserved` uses the same atomic status-filtered update described above.

Note: I merged the spec's example "Pending" and "Reserved" states into a single `reserved` status, since in this implementation stock is reserved atomically at order-creation time — there's no meaningful moment where an order exists but isn't yet reserved. Documenting this because it's a deliberate simplification, not an oversight.

**Expiry** happens two ways, both releasing stock the same way:
1. **Lazily** — any read or action on a specific order first checks if its 5-minute window has passed and expires it before proceeding, so a client can never see a stale `reserved` status.
2. **Proactively** — a background sweeper (`src/services/reservationSweeper.js`) runs every `RESERVATION_SWEEP_INTERVAL_MS` (default 15s) and expires *any* overdue reservation, even one nobody is actively looking at. Its conditional status update prevents the same reservation from being resolved twice.

## Duplicate submission handling

- **Duplicate order for the same cart**: `POST /api/orders` accepts an optional `idempotencyKey`. A repeat request with the same key returns the original order instead of creating a second one and double-reserving stock.
- **Duplicate payment for the same order**: the pay endpoint's status transition is gated by `status: 'reserved'`, so a second concurrent (or repeated) payment attempt on an order that's already been resolved gets a 409, not a double-charge.

## Setup

Requires Node 18+ and MongoDB 6+.

```bash
npm install
cp .env.example .env          # set MONGODB_URI and MONGODB_DATABASE
npm run db:init                # creates MongoDB indexes
npm run db:seed                # sample products, including a 1-unit item for testing
npm run dev                     # http://localhost:5000
```

### Environment variables

See `.env.example`: `PORT`, `MONGODB_URI`, `MONGODB_DATABASE`, `RESERVATION_SWEEP_INTERVAL_MS`, `RESERVATION_MINUTES`, and `CORS_ORIGIN`.

## API reference

### Products

| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/api/products` | — | Includes computed `available_stock` |
| GET | `/api/products/:id` | — | |
| POST | `/api/products` | `{ name, price, totalStock }` | |
| PUT | `/api/products/:id` | any of the above | |
| DELETE | `/api/products/:id` | — | |

### Orders

| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/api/orders` | — | Opportunistically expires overdue reservations before returning |
| POST | `/api/orders` | `{ items: [{productId, quantity}], idempotencyKey? }` | Checkout — creates the order and reserves stock atomically |
| GET | `/api/orders/:id` | — | Lazily expires this order first if overdue |
| POST | `/api/orders/:id/pay` | `{ outcome? }` | `outcome` is `success"\|"failure"\|"timeout"`. Omit it for a randomized (weighted) outcome, like a real gateway |
| POST | `/api/orders/:id/cancel` | — | Only valid while `status = "reserved"` |

## Testing

```bash
npm run test:concurrency                                   # 25 buyers vs. 1 unit of product 3
TEST_PRODUCT_ID=4 TEST_CONCURRENCY=30 npm run test:concurrency   # 30 buyers vs. 8 units
```

## Project structure

```
src/
  config/db.js              MongoDB client, indexes, and numeric ID counters
  services/
    orderService.js          reservation, payment, cancellation, expiry — the core logic
    mockPaymentGateway.js     simulated gateway (success / failure / timeout)
    reservationSweeper.js     background expiry job
    AppError.js
  controllers/                thin HTTP layer over the services
  routes/
  scripts/
    initDb.js / seed.js
    concurrencyTest.js         the proof described above
  app.js / server.js
```
