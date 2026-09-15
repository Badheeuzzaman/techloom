# Techloom.ai Software Engineer Intern — Practical Assessment

| | |
|---|---|
| **Repository** | `https://github.com/Badheeuzzaman/techloom` |

## Repository structure

```
/task-01     POS Order & Inventory System — see task-01/backend/README.md and task-01/frontend/README.md
/task-02     E-Commerce Checkout & Payment System — see task-02/README.md
```

## Task 01 — POS Order & Inventory System

A concurrency-safe point-of-sale backend (Express + PostgreSQL) with a React frontend: product/inventory management, cart → checkout with atomic stock reservation, a 5-minute reservation window with automatic expiry, a mock payment gateway (success/failure/timeout), duplicate-submission protection, and a full order lifecycle (reserved → paid / failed / expired / cancelled).

**Start here:**
- [`task-01/backend/README.md`](./task-01/backend/README.md) — setup, API reference, and a detailed explanation (with output) of exactly how overselling is prevented under concurrent load
- [`task-01/frontend/README.md`](./task-01/frontend/README.md) — setup and a feature-by-feature guide to testing everything from the UI

**Proof of concurrency safety:** `task-01/backend` includes `npm run test:concurrency`, which fires 25+ simultaneous checkout requests at a single-unit product and confirms exactly one succeeds. This is the most important thing to check first — it's the whole point of the assignment.

## Quick start (Task 01)

```bash
# Database: run PostgreSQL locally, or use a managed PostgreSQL service

cd task-01/backend
npm install
cp .env.example .env        # set DATABASE_URL
npm run db:init
npm run db:seed
npm run dev                  # http://localhost:5000

# separate terminal
cd task-01/frontend
npm install
cp .env.example .env
npm run dev                  # http://localhost:5173
```

