# ASHCOL Inventory client

Application source, static assets, tests, and frontend tooling live here. Start with the [repository README](../README.md) for setup and submission documentation.

Commands can also be run directly in this directory:

```powershell
npm ci
npm start
npm run lint
npm test -- --watchAll=false --runInBand
npm run build
```

Development uses Vite on port 3000 and proxies /api to port 3001. The existing CRA tooling provides production builds and Jest tests. Run `npm run start:cra` for the fallback CRA development server. Build output is generated in `build` and is excluded from source control.

See [Architecture](../docs/ARCHITECTURE.md) for the source layout and [Setup](../docs/SETUP.md) for API configuration.
