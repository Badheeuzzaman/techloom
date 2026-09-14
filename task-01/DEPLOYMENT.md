# Deployment guide — Task 01 (POS Order & Inventory)

Deployment path: **MongoDB Atlas** → **Render** (MongoDB-backed origin) → **Cloudflare Worker API proxy** and **Netlify** (frontend).

The Express + native MongoDB backend remains the origin because Cloudflare Workers do not run the native MongoDB Node.js driver directly. Cloudflare provides the public API edge URL through the Worker proxy in `cloudflare/worker.js`.

GitHub Actions workflow: `.github/workflows/deploy.yml`

- Pull requests validate the backend syntax and build the frontend.
- Pushes to `main` run the same checks, then deploy the backend to Render and frontend to Netlify.
- Pushes to `main` also deploy the Cloudflare API proxy.
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

## 3. Configure Netlify

1. Create a site at [netlify.com](https://www.netlify.com/).
2. Set the site build command to `npm run build` and the publish directory to `task-01/frontend/dist`.
3. Set the base directory to `task-01/frontend`.
4. Add `VITE_API_URL=https://<your-cloudflare-worker-url>/api` as a Netlify environment variable.
5. Create a Netlify personal access token and copy the site's API ID.
6. Add the token and site ID to GitHub Actions as `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.
7. The repository includes `frontend/public/_redirects` so React routes work after a page refresh.

After the first workflow run, verify the backend with `curl https://<your-render-backend-url>/api/health` and open the Netlify URL.

## 4. Configure Cloudflare API proxy

1. Create a Cloudflare API token with Workers Scripts edit permission and copy your Cloudflare account ID.
2. Add these GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`: the Cloudflare API token.
   - `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
   - `BACKEND_URL`: the deployed Render backend URL, such as `https://techloom-api.onrender.com`.
3. The GitHub Actions workflow deploys `cloudflare/worker.js` as `techloom-api`.
4. Copy the Worker URL, such as `https://techloom-api.<subdomain>.workers.dev`.

## 5. Configure GitHub Actions

In GitHub, open **Settings → Secrets and variables → Actions** for the repository.

Add these repository secrets:

- `RENDER_DEPLOY_HOOK_URL`: the Render deploy hook URL.
- `NETLIFY_AUTH_TOKEN`: a Netlify personal access token.
- `NETLIFY_SITE_ID`: the Netlify site API ID.
- `CLOUDFLARE_API_TOKEN`: the Cloudflare API token.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
- `BACKEND_URL`: the Render backend origin URL.

Add this repository variable:

- `VITE_API_URL`: `https://<your-cloudflare-worker-url>/api`

Push to `main`, or manually run the workflow, to deploy the Render origin, Cloudflare API proxy, and Netlify frontend.

## 5. Close the loop

Update the backend's `CORS_ORIGIN` on Render to the Netlify URL and redeploy. Set the Netlify and frontend build `VITE_API_URL` to the Cloudflare Worker URL, not the Render origin.

## 6. Verify

- Visit the Netlify frontend URL, add an item to cart, check out, and try all three mock payment outcomes through the Cloudflare API URL.
- Open the same low-stock item in two browser tabs and try to check out both at once — one should succeed, the other should get a clear "not enough stock" error, proving the concurrency protection works in production the same way `npm run test:concurrency` proves it locally.
