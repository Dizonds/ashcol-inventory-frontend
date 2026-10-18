# ASHCOL Inventory — setup and verification

This is a separate inventory application based on the local ASHCOL portal reference. It does not connect to the production portal, share its passwords, or verify its job numbers. The reference folder is unchanged.

## Start an existing installation

1. Install dependencies in `server` and `ashcolinventory` using `npm install` in each directory.
2. Keep your existing `server/.env`. Use `server/.env.example` as a guide, not as a replacement for existing credentials.
3. Set `MONGO_URI` to **MongoDB Atlas or a MongoDB replica set**. A standalone MongoDB process cannot provide the multi-document transactions used here. Startup deliberately stops on an unsupported database rather than accepting unreliable writes.
4. If your database contains the old inventory, follow the migration section below before starting the server.
5. For the first administrator only, set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10–200 characters), `ADMIN_NAME`, and `ADMIN_BRANCH_ID` in `server/.env`. For a new database, use `LOCAL-WAREHOUSE` for the branch ID. For a migrated database, use the branch ID you chose for migration. Run `npm run bootstrap` from `server`, then remove `ADMIN_PASSWORD` from `.env`. Bootstrap never overwrites existing users. There are no built-in demo credentials.
6. From `server`, run `npm start`.
7. In another terminal, from `ashcolinventory`, run `npm start`. Open `http://localhost:3000` and sign in using your administrator credentials.

Use **Branches & Accounts** to add your verified branches and create branch managers or employees. `LOCAL-WAREHOUSE` is explicitly a local placeholder, not a production branch identifier. Taguig Sales and Services can be configured as separate scopes using verified IDs; the app does not guess the portal's branch mapping.

## Fresh local replica set (optional alternative to Atlas)

Requires `mongod` and `mongosh` installed. This creates a **new**, separate development database on port 27018; it does not convert or import an existing MongoDB installation.

```powershell
New-Item -ItemType Directory -Force D:\IntegprogFinal\.local-mongo
mongod --dbpath D:\IntegprogFinal\.local-mongo --replSet rs0 --bind_ip 127.0.0.1 --port 27018
```

In a second terminal:

```powershell
mongosh "mongodb://127.0.0.1:27018" --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
```

Then set:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27018/ashcol_inventory?replicaSet=rs0
```

Keep the `mongod` terminal running while developing. For an existing standalone database, back up and configure its replica-set deployment separately; do not copy its live data files into this new folder.

## Preserve and migrate old inventory

Back up the inventory database with your usual MongoDB backup tool first. Stop the old inventory server so it cannot write during migration. Set `MONGO_URI` to the intended **inventory database**, never the live portal database.

From `server`, run:

```powershell
npm run migrate -- LOCAL-WAREHOUSE
```

Replace `LOCAL-WAREHOUSE` with the branch that actually owns the old single-warehouse stock. Optionally set `LEGACY_BRANCH_NAME` in `.env` before migration.

The migration:

- Assigns the explicitly chosen branch to records without one.
- Normalizes SKUs to uppercase and rejects duplicates within a branch before writing anything.
- Validates the old item types, categories, quantities, and units. Resolve invalid legacy values manually based on actual stock records; it does not invent conversions.
- Links historical movements to their product when an unambiguous matching SKU exists.
- Preserves movements for previously deleted items even if no product remains.
- Leaves missing historical users and before/after quantities unrecorded. The new UI labels these gaps instead of manufacturing audit history.
- Saves the migration in a transaction and rolls it back if it fails.

It does **not** repair discrepancies already created by the old clamping logic. After migration, compare physical stock against the recorded quantities and post an explained stock correction where needed.

## Rename legacy job references

The current schema stores the job relationship as `jobId` (an ObjectId reference) and keeps the readable `jobNumber` separately. Generic receipts and adjustment IDs use `referenceNumber`. Material requests keep their own `requestNumber` and can optionally link to a job with `jobId`.

For a database restored from an older version, stop the backend and back up MongoDB first. From `ashcolinventory_backend_final`, run the dry run, review the record counts, then apply:

```powershell
npm run migrate:job-links
npm run migrate:job-links -- --apply
```

The migration preserves old job-number text, connects it to a `JobOrder` when a matching job exists, removes duplicate legacy field names, and verifies that no old names remain. It refuses to apply when an old and new field contain conflicting values.

Products also keep optional `brandId` and `supplierId` references to their lookup collections, while retaining brand and supplier names for display. Back up the database, then run a dry run and apply the additive references from the backend folder:

```powershell
npm run migrate:catalog-links
npm run migrate:catalog-links -- --apply
```

## Permissions and normal workflow

| Role | Access |
| --- | --- |
| ADMIN | All configured branches, accounts, branches, stock, transfers, and request decisions |
| MANAGER | Assigned-branch stock, catalog edits, movements, and request decisions |
| EMPLOYEE | Assigned-branch catalog and ledger; submit material requests; no direct stock or specification writes |

Register an item with its opening balance. SKUs are unique per branch, including archived items. Unit of measure and SKU remain fixed after registration to keep historical quantities meaningful.

Employees submit a material request with its own request number; the API can optionally link it to the employee's current job. A manager approves it, then fulfills it when the materials are actually issued. Approval does not reserve or deduct stock. Fulfillment deducts stock and records the request link exactly once. Pending or approved requests can be denied with a reason.

For deliveries, unused-material returns, direct dispatches, sales, and corrections, use **Post Movement** and provide a receipt/reference/explanation. Record requests through **Fulfill**, not a second direct dispatch. ADMIN transfers update both branches and produce two entries sharing the same reference. This simple workflow records a completed transfer, not an in-transit shipment or separate receipt approval.

Archive only zero-stock items with no open requests. Archived items and their movements remain available, and items can be restored.

The dashboard uses current stored `unitCost × quantity` for its cost estimate and `listPrice × quantity` for potential sales value. This is not FIFO, weighted-average cost, or a historical accounting valuation. Quantities are grouped by unit; meters are never added to AC units.

## API addresses and deployment

The frontend defaults to relative `/api`. During development, Create React App proxies that to `http://localhost:3001`. For separate frontend/backend hosting, configure `REACT_APP_API_URL` before building and set `CLIENT_ORIGINS` on the backend to the permitted frontend origin(s), comma-separated. Use HTTPS for a hosted installation. For same-origin hosting, configure a reverse proxy for `/api`.

Do not set `REACT_APP_API_URL` to the existing portal API: its contracts differ. A future integration needs verified user/branch/job mappings, authentication agreement, and an API adapter. No such production changes were made here.

## Run checks

```powershell
# From server
npm test

# From ashcolinventory
npm test -- --watchAll=false --runInBand
npm run build

# From server, after building the frontend
npm run test:browser
```

Backend and browser tests use a disposable MongoDB replica set and do not load your `.env`. The first run downloads a MongoDB test binary (about 592 MB on this Windows environment). The browser check uses Microsoft Edge at its standard Windows path; set `BROWSER_PATH` to another Chromium executable if needed. It starts headless and closes its browser, server, and temporary database afterward. Screenshots are written to the ignored `artifacts` folder.

The browser script has fixed credentials **only inside its disposable test database**. They are not usable on your normal inventory server.
