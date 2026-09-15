# Deployment guide - Task 01

Deployment path: **MongoDB Atlas -> GitHub -> Render**.

The repository root contains `render.yaml` and `.github/workflows/deploy.yml`. Render hosts the Task 01 API and frontend, while GitHub runs validation and can trigger Render deploy hooks after successful pushes to `main`.

## 1. Configure MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user, allow the deployment IP addresses, and copy the MongoDB connection string.
3. In the Render `task-01-api` service, set `MONGODB_URI` and keep `MONGODB_DATABASE=pos_inventory`.
4. Initialize indexes and seed products locally from `task-01/backend`:

   ```bash
   npm run db:init
   npm run db:seed
   ```

## 2. Create the Render services

1. Push the repository to GitHub and connect it to Render.
2. Choose **New -> Blueprint** and select the repository's root `render.yaml`.
3. Render creates `task-01-api` and `task-01-frontend` along with the Task 02 services.
4. Set `CORS_ORIGIN` on `task-01-api` to the deployed Task 01 frontend URL.
5. Set `VITE_API_URL` on `task-01-frontend` to the deployed API URL plus `/api`, for example `https://task-01-api.onrender.com/api`.
6. Keep `RESERVATION_MINUTES=5` and `RESERVATION_SWEEP_INTERVAL_MS=15000` unless you need different values.

The Blueprint rewrites all frontend routes to `index.html`, so React Router pages continue to work after a refresh.

## 3. GitHub automation

The root workflow validates both tasks on pull requests and pushes. On successful pushes to `main`, it triggers Render deploy hooks when these repository secrets are configured:

- `RENDER_TASK_01_BACKEND_DEPLOY_HOOK`
- `RENDER_TASK_01_FRONTEND_DEPLOY_HOOK`
- `RENDER_BACKEND_DEPLOY_HOOK`
- `RENDER_FRONTEND_DEPLOY_HOOK`

Render can also deploy automatically from GitHub without deploy hooks; use one deployment method consistently.

## 4. Verify

Check the API with `https://<your-task-01-api-host>/api/health`, then open the frontend, create an order, and verify inventory updates. Run `npm run test:concurrency` from `task-01/backend` to verify concurrent stock protection locally.
