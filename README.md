# ASHCOL Inventory Frontend

React application for ASHCOL warehouse inventory and service operations. It connects to the separate ASHCOL Inventory API and provides role-based access for administrators, managers, and employees.

## Features

- Inventory catalog with product specifications and stock availability.
- Stock receipts, dispatches, transfers, and movement history.
- Material requests and job order workflows.
- Service vehicle inventory, suppliers, brands, and model matching.
- Dashboard charts, account management, and live inventory updates.

## Getting started

Requires Node.js **20.19+ or 22.12+**, npm, and the backend API running on port **3001**. The backend requires its own configured MongoDB database.

Run these commands from `ashcol-inventory-frontend`:

```powershell
npm run setup
npm start
```

Open **http://localhost:3000**. Sign in with an account created through the backend setup process. The frontend contains no default credentials.

See [Setup](docs/SETUP.md) for backend startup, environment configuration, and troubleshooting.

## Commands

Run all commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install the client dependencies from its lockfile |
| `npm start` | Start Vite on port 3000 and open the browser |
| `npm run lint` | Check source code with ESLint |
| `npm test` | Run Jest in interactive mode |
| `npm run test:ci` | Run the complete test suite once |
| `npm run build` | Create the production app in `client/build` |

The root package delegates to `client`; it has no separate application dependencies.

## Repository structure

```text
ashcol-inventory-frontend/
├── docs/                 Setup, architecture, and maintenance notes
├── client/
│   ├── public/           Static browser assets and CRA HTML template
│   ├── src/
│   │   ├── assets/       Application images
│   │   ├── components/   Shared controls and application layout
│   │   ├── hooks/        Shared React hooks
│   │   ├── pages/        Feature pages with their styles and tests
│   │   ├── utils/        Navigation, formatting, and stock calculations
│   │   ├── App.js        Session state and page composition
│   │   └── index.js      React entry point
│   ├── index.html        Vite HTML entry point
│   ├── vite.config.mjs   Development server and API proxy
│   └── package.json      Application dependencies and scripts
└── package.json          Repository-level commands
```

Tests remain beside the code they verify. See [Architecture](docs/ARCHITECTURE.md) for responsibilities and tooling.

## Production

`npm run build` creates a static application. Configure the hosting server to serve `client/build`, return `index.html` for application routes, and proxy `/api` to the backend. Set a separate API URL before building only when required by your hosting arrangement.

Dependencies, generated builds, local environment files, database exports, and development screenshots are excluded from the repository. Historical cleanup notes are in [Maintenance](docs/MAINTENANCE.md).
