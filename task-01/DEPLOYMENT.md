# Deployment guide — Task 01 (POS Order & Inventory)

Deployment path: **MongoDB Atlas** → **GitHub Actions** → **Render** (backend and frontend).

GitHub Actions workflow: `.github/workflows/deploy.yml`

- Pull requests validate the backend syntax and build the frontend.
- Pushes to `main` run the same checks, then deploy the backend and frontend to Render.
- The workflow can also be started manually with **Run workflow** in GitHub Actions.
- The workflow only runs when `task-01/**` or the workflow itself changes.

## 1. Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user, allow your development/deployment IP addresses, and copy the MongoDB connection string.
3. Set the connection string and database name in `task-01/backend/.env`:
   ```bash
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
   MONGODB_DATABASE=pos_inventory
   ```
4. From `task-01/backend`, initialize indexes and seed sample products:
   ```bash
   npm run db:init
   npm run db:seed
   ```
   (Render's free tier does not include a shell, so running these commands locally against Atlas is the simplest path.)

(Any MongoDB deployment that supports the MongoDB Node.js driver works, including a local MongoDB service.)

## 2. Configure Render services

1. Open [render.com](https://render.com) and create a **Web Service** from the repository.
2. Set **Root Directory** to `task-01/backend`.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add backend environment variables: `MONGODB_URI`, `MONGODB_DATABASE`, `RESERVATION_MINUTES=5`, `RESERVATION_SWEEP_INTERVAL_MS=15000`, and `CORS_ORIGIN`.
5. Create a backend Render deploy hook and save its URL as `RENDER_DEPLOY_HOOK_URL` in GitHub Actions secrets.
6. Disable the backend's automatic GitHub deploy if enabled. GitHub Actions will deploy through the hook after validation succeeds.

Create a second Render service as a **Static Site** for the frontend:

1. Set **Root Directory** to `task-01/frontend`.
2. Set the build command to `npm install && npm run build`.
3. Set the publish directory to `dist`.
4. Add `VITE_API_URL=https://<your-render-backend-url>/api` as a frontend environment variable.
5. Create a frontend Render deploy hook and save its URL as `RENDER_FRONTEND_DEPLOY_HOOK_URL` in GitHub Actions secrets.
6. Disable the frontend's automatic GitHub deploy if enabled.

After the first workflow run, verify the backend with `curl https://<your-render-backend-url>/api/health` and open the Render frontend URL.

## 3. Configure GitHub Actions

In GitHub, open **Settings → Secrets and variables → Actions** for the repository.

Add these repository secrets:

- `RENDER_DEPLOY_HOOK_URL`: the Render deploy hook URL.
- `RENDER_FRONTEND_DEPLOY_HOOK_URL`: the frontend Render deploy hook URL.

Add this repository variable:

- `VITE_API_URL`: `https://<your-render-backend-url>/api`

Push to `main`, or manually run the workflow, to deploy both Render services.

## 4. Close the loop

Update the backend's `CORS_ORIGIN` on Render to the frontend Render URL and redeploy.

## 5. Verify

- Visit the Render frontend URL, add an item to cart, check out, and try all three mock payment outcomes.
- Open the same low-stock item in two browser tabs and try to check out both at once — one should succeed, the other should get a clear "not enough stock" error, proving the concurrency protection works in production the same way `npm run test:concurrency` proves it locally.
