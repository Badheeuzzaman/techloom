# Techloom.ai Software Engineer Intern — Practical Assessment

| | |
|---|---|
| **Repository** | `https://github.com/Badheeuzzaman/techloom` |
| **Task 01 — live demo** | `[ add your Render frontend URL here ]` |
| **Task 01 — API** | `[ add your Render API URL here ]` |
| **Task 02 — live demo** | `[ add your Render frontend URL here ]` |
| **Task 02 — API** | `[ add your Render API URL here ]` |

## Repository structure

```
/task-01     POS Order & Inventory System — see task-01/backend/README.md and task-01/frontend/README.md
/task-02     E-Commerce Checkout & Payment System — see task-02/README.md
/render.yaml Render Blueprint for both tasks
/.github     GitHub Actions validation and Render deploy workflow
```

## Task 01 — POS Order & Inventory System

A concurrency-safe point-of-sale backend (Express + MongoDB) with a React frontend: product/inventory management, cart → checkout with atomic stock reservation, a 5-minute reservation window with automatic expiry, a mock payment gateway (success/failure/timeout), duplicate-submission protection, and a full order lifecycle (reserved → paid / failed / expired / cancelled).

**Start here:**
- [`task-01/backend/README.md`](./task-01/backend/README.md) — setup, API reference, and a detailed explanation (with output) of exactly how overselling is prevented under concurrent load
- [`task-01/frontend/README.md`](./task-01/frontend/README.md) — setup and a feature-by-feature guide to testing everything from the UI
- [`task-01/DEPLOYMENT.md`](./task-01/DEPLOYMENT.md) — GitHub and Render deployment guide (MongoDB Atlas + Render)

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

## Deployment

Deployment uses **GitHub + Render** for both tasks. The root [`render.yaml`](./render.yaml) defines four services, and the root [GitHub Actions workflow](./.github/workflows/deploy.yml) validates both applications and can trigger Render deploy hooks after successful pushes to `main`.

Follow [`task-01/DEPLOYMENT.md`](./task-01/DEPLOYMENT.md) for MongoDB and Task 01 setup, and the [Task 02 deployment guide](./task-02/README.md#deploying-with-render-and-github) for its environment variables.