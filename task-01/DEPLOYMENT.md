# Deployment guide — Task 01 (POS Order & Inventory)

Deployment path: **MongoDB Atlas** → **GitHub Actions** → **Render** (backend) and **Cloudflare Pages** (frontend).

The frontend is deployed to Cloudflare Pages. The backend remains on Render because it is a long-running Express server using the MongoDB Node.js driver; moving it to Cloudflare Workers requires a separate Workers-compatible API and database adapter migration.

GitHub Actions workflow: `.github/workflows/deploy.yml`

- Pull requests validate the backend syntax and build the frontend.
- Pushes to `main` run the same checks, then deploy the backend to Render and frontend to Cloudflare Pages.
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

## 3. Configure Cloudflare Pages

1. Create a Pages project in the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Choose a project name and save it as the GitHub Actions variable `CLOUDFLARE_PAGES_PROJECT`.
3. Create a Cloudflare API token with Pages deployment permissions and save it as the GitHub Actions secret `CLOUDFLARE_API_TOKEN`.
4. Copy your Cloudflare account ID into the GitHub Actions secret `CLOUDFLARE_ACCOUNT_ID`.
5. Set `VITE_API_URL=https://<your-render-backend-url>/api` for the Pages project.
6. The GitHub Actions workflow builds `task-01/frontend` and deploys its `dist` directory with Wrangler.
7. The repository includes `frontend/public/_redirects` so React routes work after a page refresh.

After the first workflow run, verify the backend with `curl https://<your-render-backend-url>/api/health` and open the Cloudflare Pages URL.

## 4. Configure GitHub Actions

In GitHub, open **Settings → Secrets and variables → Actions** for the repository.

Add these repository secrets:

- `RENDER_DEPLOY_HOOK_URL`: the Render deploy hook URL.
- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with Pages deployment permission.
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID.

Add this repository variable:

- `VITE_API_URL`: `https://<your-render-backend-url>/api`
- `CLOUDFLARE_PAGES_PROJECT`: the Cloudflare Pages project name.

Push to `main`, or manually run the workflow, to deploy both services.

## 5. Close the loop

Update the backend's `CORS_ORIGIN` on Render to the Cloudflare Pages URL and redeploy.

## 6. Verify

- Visit the Cloudflare Pages frontend URL, add an item to cart, check out, and try all three mock payment outcomes.
- Open the same low-stock item in two browser tabs and try to check out both at once — one should succeed, the other should get a clear "not enough stock" error, proving the concurrency protection works in production the same way `npm run test:concurrency` proves it locally.
