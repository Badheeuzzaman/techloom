# Deployment guide — Task 01 (POS Order & Inventory)

Deployment path: **MongoDB Atlas** → **GitHub Actions** → **Netlify** (backend and frontend).

GitHub Actions workflow: `.github/workflows/deploy.yml`

- Pull requests validate the backend syntax and build the frontend.
- Pushes to `main` run the same checks, then deploy both backend and frontend to Netlify.
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
   Run these commands locally against Atlas before deploying the services.

(Any MongoDB deployment that supports the MongoDB Node.js driver works, including a local MongoDB service.)

## 2. Configure Netlify backend

1. Create a separate site at [netlify.com](https://www.netlify.com/) for the backend.
2. Set the base directory to `task-01/backend`.
3. The repository's `task-01/backend/netlify.toml` configures the `api` Function and `/api/*` rewrite.
4. Add backend environment variables: `MONGODB_URI`, `MONGODB_DATABASE`, `RESERVATION_MINUTES=5`, `RESERVATION_SWEEP_INTERVAL_MS=15000`, and `CORS_ORIGIN`.
5. Create a Netlify personal access token and copy the backend site's API ID.
6. Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_BACKEND_SITE_ID` to GitHub Actions secrets.

## 3. Configure Netlify frontend

1. Create a second Netlify site for the frontend.
2. Set the site build command to `npm run build` and the publish directory to `task-01/frontend/dist`.
3. Set the base directory to `task-01/frontend`.
4. Add `VITE_API_URL=https://<your-netlify-backend-url>/api` as a Netlify environment variable.
5. Copy the frontend site's API ID and add it to GitHub Actions as `NETLIFY_FRONTEND_SITE_ID`.
6. The repository includes `frontend/public/_redirects` so React routes work after a page refresh.

After the first workflow run, verify the backend with `curl https://<your-netlify-backend-url>/api/health` and open the Netlify frontend URL.

## 4. Configure GitHub Actions

In GitHub, open **Settings → Secrets and variables → Actions** for the repository.

Add these repository secrets:

- `NETLIFY_AUTH_TOKEN`: a Netlify personal access token.
- `NETLIFY_BACKEND_SITE_ID`: the Netlify backend site API ID.
- `NETLIFY_FRONTEND_SITE_ID`: the Netlify frontend site API ID.

Add this repository variable:

- `VITE_API_URL`: `https://<your-netlify-backend-url>/api`

Push to `main`, or manually run the workflow, to deploy both services.

## 5. Close the loop

Update the backend's `CORS_ORIGIN` on Netlify to the Netlify frontend URL and redeploy.

## 6. Verify

- Visit the Netlify frontend URL, add an item to cart, check out, and try all three mock payment outcomes.
- Open the same low-stock item in two browser tabs and try to check out both at once — one should succeed, the other should get a clear "not enough stock" error, proving the concurrency protection works in production the same way `npm run test:concurrency` proves it locally.
