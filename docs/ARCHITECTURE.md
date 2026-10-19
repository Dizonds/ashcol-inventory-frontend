# Frontend architecture

## Application flow

`src/index.js` mounts React. `App.js` restores the session, controls navigation, loads shared inventory data, and composes the selected page. Role checks determine which navigation options and actions are available. The backend remains responsible for enforcing authorization.

`src/api.js` provides the Axios request helper and attaches the session token. `src/liveUpdates.js` handles the authenticated update stream, while `hooks/useLiveUpdates.js` connects that stream to React refresh and session handling.

Pages load through React lazy imports. Shared application state stays in `App.js`; page-specific forms and view state remain in their feature components.

## Source organization

| Directory | Responsibility |
| --- | --- |
| `pages/auth` | Login screen |
| `pages/dashboard` | Dashboard and stock charts |
| `pages/inventory` | Inventory catalog |
| `pages/movements` | Movement history and stock posting |
| `pages/requests` | Material requests |
| `pages/job-orders` | Job orders |
| `pages/service-vehicles` | Vehicle inventory |
| `pages/model-matching` | Equipment compatibility lookup |
| `pages/suppliers` | Suppliers and brands |
| `pages/users` | User management |
| `components/layout` | Header and sidebar |
| `components/common` | Shared account editor, inputs, logos, notices, and remarks |
| `hooks` | Reusable React hooks |
| `utils` | Shared pure calculations, formatting, and navigation |
| `assets` | Images imported by application code |

Feature styles and tests stay with their components. Application-wide tests and global CSS remain at the source root. Existing component names are retained to keep the reorganization focused on file placement.

## Tooling

- React renders the interface; Ant Design provides UI controls.
- Vite serves development modules, handles fast refresh, and proxies API requests.
- Create React App supplies the existing production build and Jest configuration.
- ESLint uses the existing React App rules; run it separately during Vite development.
- The two HTML entry files serve separate tools: `client/index.html` is used by Vite; `client/public/index.html` is used by the CRA production build and fallback development command.

## Backend boundary

The browser talks to the API through `/api` by default. Database access, password verification, session validation, stock transactions, and persistence belong to the backend repository. The frontend does not require database exports or a MongoDB connection string.
