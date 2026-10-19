# Setup

## Prerequisites

- Node.js 20.19+ or 22.12+ and npm.
- The separate `ashcol-inventory-backend` project.
- MongoDB configured according to the backend setup guide, including transaction support.
- A user account provisioned through the backend.

## Install the frontend

From the frontend repository root:

```powershell
npm run setup
```

This installs dependencies into `client/node_modules` using `client/package-lock.json`. There is no separate dependency installation at the frontend repository root.

## Start the backend

In a separate terminal, from `ashcol-inventory-backend`:

```powershell
npm ci
npm run dev
```

Configure the backend `.env` using its `.env.example` and its own setup instructions. In the normal local configuration, use `PORT=3001` and allow `http://localhost:3000` in `CLIENT_ORIGINS`. Keep database connection strings and administrator provisioning credentials in the backend configuration.

For a new database, complete the backend bootstrap procedure before signing in. Preserve existing database and account configuration when starting an existing installation.

## Start the frontend

From `ashcol-inventory-frontend`:

```powershell
npm start
```

Vite opens the browser at `http://localhost:3000` and forwards `/api` requests to `http://127.0.0.1:3001`. Keep both terminals open. Press Ctrl+C in each terminal to stop its server.

Vite prepares a dependency cache on the first start and after dependency changes. Later starts reuse it. To use the previous CRA development server, run `npm run start:cra` from `client`.

## Optional API configuration

For a separate API host, copy `client/.env.example` to `client/.env.local` and set:

```dotenv
REACT_APP_API_URL=https://your-inventory-api.example/api
```

Restart the development server or rebuild after changing this value. Frontend environment values are public browser configuration; do not put passwords or database credentials in them. Leave this value unset when using the normal local proxy or a same-origin production proxy.

## Verification

From the frontend repository root:

```powershell
npm run lint
npm run test:ci
npm run build
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Port 3000 is occupied | Stop the previous frontend process. Keep the backend on port 3001. |
| API requests fail | Confirm the backend is running and `http://localhost:3001/api/health` reports a healthy database connection. |
| Login fails | Verify the account was provisioned through the backend and use its actual credentials. |
| Vite reports an unsupported Node version | Install a Node version meeting the prerequisite above. |
| Production routes return 404 on refresh | Configure the hosting server to fall back to `index.html`. |
