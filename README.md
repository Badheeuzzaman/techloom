# Techloom.ai Software Engineer Intern — Practical Assessment

| | |
|---|---|
| **Repository** | `[ add your GitHub URL here once pushed ]` |
| **Task 01 — live demo** | `[ add your deployed frontend URL here ]` |
| **Task 01 — API** | `[ add your deployed backend URL here ]` |
| **Task 02** | not started yet |

## Repository structure

```
/task-01     POS Order & Inventory System — see task-01/backend/README.md and task-01/frontend/README.md
/task-02     (pending)
```

## Task 01 — POS Order & Inventory System

A concurrency-safe point-of-sale backend (Express + MongoDB) with a React frontend: product/inventory management, cart → checkout with atomic stock reservation, a 5-minute reservation window with automatic expiry, a mock payment gateway (success/failure/timeout), duplicate-submission protection, and a full order lifecycle (reserved → paid / failed / expired / cancelled).

**Start here:**
- [`task-01/backend/README.md`](./task-01/backend/README.md) — setup, API reference, and a detailed explanation (with output) of exactly how overselling is prevented under concurrent load
- [`task-01/frontend/README.md`](./task-01/frontend/README.md) — setup and a feature-by-feature guide to testing everything from the UI
- [`task-01/DEPLOYMENT.md`](./task-01/DEPLOYMENT.md) — GitHub Actions deployment guide (MongoDB Atlas + Render)

**Proof of concurrency safety:** `task-01/backend` includes `npm run test:concurrency`, which fires 25+ simultaneous checkout requests at a single-unit product and confirms exactly one succeeds. This is the most important thing to check first — it's the whole point of the assignment.

## Quick start (Task 01)

```bash
# Database: run MongoDB locally, or use a free MongoDB Atlas cluster

cd task-01/backend
npm install
cp .env.example .env        # set MONGODB_URI and MONGODB_DATABASE
npm run db:init
npm run db:seed
npm run dev                  # http://localhost:5000

# separate terminal
cd task-01/frontend
npm install
cp .env.example .env
npm run dev                  # http://localhost:5173
```