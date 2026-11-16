# NexusFlow

**Visual IoT telemetry, simulation and a structured rule engine in one calm workspace.**

NexusFlow is a production-shaped MERN application for ingesting device telemetry, visualising it in real time, evaluating user-defined rules and routing alerts to the right people. It ships with a deterministic simulator so the whole product can be explored without hardware, and an MQTT adapter path so real devices can feed the same pipeline.

> **Safety boundary:** NexusFlow is a telemetry and alerting platform. Actuator commands are rejected by policy at the adapter layer and are never exposed in the UI.

---

## Highlights

- **Real-time telemetry** over Socket.IO with per-device subscriptions, live charts and graceful reconnect.
- **MongoDB time-series storage** for raw readings, 1-minute and 1-hour rollups, with TTL retention.
- **Structured rule engine** — conditions are data (`gt`, `between`, `outside`, boolean logic), never executable code.
- **Alert lifecycle** with severity, dedupe, occurrence windows, acknowledgement, resolution and audit history.
- **Deterministic simulator** with scenarios, pause/resume, fault injection, backfill and restart recovery.
- **Hardware-ready ingestion** through MQTT using the same normalisation, persistence, rule and alert pipeline.
- **Role-based access control** with four fixed roles and server-side enforcement on every route.
- **Operational surfaces** for health diagnostics, job heartbeats, audit logs, reports and CSV exports.
- **Premium responsive UI** built with React 19, Vite, Tailwind CSS v4, Redux Toolkit, Recharts and Lucide.

---

## Quick start

### Option A — zero-setup demo with an in-memory database

Requires Node.js 20.19+ and npm. MongoDB is not required; an ephemeral `mongodb-memory-server` instance is started, seeded with a month of demo telemetry, and stopped when the process exits.

```bash
npm install
npm run demo
```

Open <http://localhost:5173> and sign in:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@nexusflow.local` | `NexusFlow!Demo2026` |
| Administrator | `administrator@nexusflow.local` | `NexusFlow!Demo2026` |
| Operator | `operator@nexusflow.local` | `NexusFlow!Demo2026` |
| Viewer | `viewer@nexusflow.local` | `NexusFlow!Demo2026` |

The demo seeds users, six devices across four device types, five scenarios, five rules, ~29 days of telemetry, alerts, notifications, audit entries and three running simulations. Credentials are demo-only; change them before sharing.

If port 5173 is occupied, run the API and web app separately:

```bash
# terminal 1
npm run demo:memory              # API on :5000, in-memory MongoDB

# terminal 2
npm run dev -w client -- --port 5180
# set VITE_PROXY_TARGET=http://127.0.0.1:5000 if the API port changed
```

### Option B — local MongoDB

Requires MongoDB 7+ running locally.

```bash
npm install
cp .env.example .env             # adjust secrets
npm run seed                     # optional: demo users, devices, telemetry
npm run dev                      # API :5000 + web app :5173
```

### Option C — Docker Compose

```bash
cp .env.docker.example .env.docker
# edit every placeholder in .env.docker
docker compose --env-file .env.docker up -d --build
```

Open <http://localhost:5000>. The API serves the built client. To add the optional MQTT broker:

```bash
docker compose --env-file .env.docker --profile mqtt up -d
# set MQTT_ENABLED=true in .env.docker before starting the app
```

To load the demo workspace into the Compose database:

```bash
docker compose --env-file .env.docker exec app node server/src/db/seed.js
```

---

## Architecture

```
                 ┌──────────────────────────────┐
   Browser ─────▶│ React 19 · Vite · Tailwind 4 │
                 │ RTK Query · Redux · Recharts │
                 └──────────────┬───────────────┘
                                │ REST + Socket.IO
                 ┌──────────────▼───────────────┐
                 │ Express 5 API                │
                 │ JWT · RBAC · validation      │
                 │ rate limits · audit trail    │
                 └───────┬──────────────┬───────┘
                         │              │
          ┌──────────────▼───┐   ┌──────▼─────────────┐
          │ Simulator adapter│   │ MQTT bridge        │
          │ deterministic    │   │ hardware telemetry │
          └──────────┬───────┘   └──────┬─────────────┘
                     └───────┬──────────┘
                    ┌────────▼─────────┐
                    │ Ingestion pipeline│
                    │ normalise · store │
                    │ rollups · rules   │
                    │ alerts · sockets  │
                    └────────┬─────────┘
                    ┌────────▼─────────┐
                    │ MongoDB 7         │
                    │ time-series + TTL │
                    │ rollups + indexes │
                    └──────────────────┘
```

Both the simulator and MQTT produce the same telemetry envelope. The rule engine only ever sees normalised metric maps, so automations are source-agnostic.

### Repository layout

```
client/                 React SPA (Vite, Tailwind v4)
  src/components/       layout, UI primitives, chart kit, forms
  src/pages/            auth, dashboard, devices, live, alerts, rules,
                        simulator, analytics, logs, reports, users,
                        settings, profile, health
  src/store/            Redux store, auth slice, UI slice, RTK Query API
  src/lib/              Axios client, permissions, socket, utilities
server/                 Express 5 API (ESM)
  src/adapters/         device adapter contract + simulator adapter
  src/config/           environment, permissions, logger
  src/db/               connection, bootstrap, deterministic seed
  src/integrations/     MQTT bridge, email
  src/jobs/             lease-protected scheduler
  src/middleware/       auth, validation, rate limits, errors, sanitisation
  src/models/           Mongoose models
  src/modules/          feature services and routes
  src/sockets/          Socket.IO auth, rooms, publisher
  scripts/              in-memory demo runner
  tests/                Vitest + Supertest suites
docs/                   architecture, API, database, operations, report
docker/                 optional Mosquitto configuration
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the request lifecycle and design decisions.

---

## Roles and permissions

| Capability | Super Admin | Administrator | Operator | Viewer |
| --- | :---: | :---: | :---: | :---: |
| View dashboards, devices, telemetry | ✓ | ✓ | ✓ | ✓ |
| Manage simulator and backfills | ✓ | ✓ | ✓ | — |
| Create and edit rules | ✓ | ✓ | ✓ | — |
| Acknowledge and resolve alerts | ✓ | ✓ | ✓ | — |
| Export CSV reports | ✓ | ✓ | ✓ | ✓ |
| Read audit logs | ✓ | ✓ | — | — |
| Manage users and roles | ✓ | ✓ | — | — |
| Change workspace settings | ✓ | ✓ | — | — |
| Diagnostics and MQTT status | ✓ | ✓ | — | — |

The matrix is fixed in code (`server/src/config/permissions.js`) and enforced by middleware. Hiding a button is never the only guard.

---

## Safety and correctness invariants

1. **No executable rules.** Rules are validated data: metric, operator, threshold(s), boolean logic and role-scoped actions.
2. **Actuators are off.** `ACTUATORS_ENABLED` is forced to `false`; adapter command execution refuses hardware writes.
3. **No tokens in localStorage.** Access tokens live in memory; refresh tokens are HTTP-only, rotated cookies.
4. **Every route is authenticated and authorised.** Public routes are registration, login, refresh, password recovery and invitation acceptance.
5. **Time-series retention is explicit.** Raw telemetry uses a partial TTL index; rollups have independent windows.
6. **Alerts dedupe deterministically.** A partial unique index plus an occurrence window prevents alert storms.
7. **Jobs are lease-protected.** Multiple API instances will not double-run the scheduler.
8. **Audit records are append-only.** Authentication, user, settings, device and export events are recorded.
9. **Failures are structured.** Errors carry a code, message, optional details and request id.

Read [SECURITY.md](docs/SECURITY.md) for the threat model and hardening checklist.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API and web app in watch mode (needs MongoDB) |
| `npm run demo` | In-memory MongoDB demo + web app |
| `npm run demo:memory` | Seeded in-memory API only |
| `npm run seed` | Seed the configured MongoDB with demo data |
| `npm run build` | Production client build |
| `npm start` | Start the API (serves `client/dist` in production) |
| `npm test` | Server and client test suites |
| `npm run lint` | ESLint across both workspaces |
| `npm run format` | Prettier across the repository |

Requirements: Node.js 20.19+, npm 10+, MongoDB 7+ for the non-demo paths.

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — boundaries, request lifecycle, data flow, frontend structure
- [API reference](docs/API.md) — REST endpoints, payloads, permissions, socket events
- [Database](docs/DATABASE.md) — collections, indexes, time-series strategy, retention, rollups
- [Simulation](docs/SIMULATION.md) — scenarios, determinism, controls, backfill, recovery
- [Hardware / MQTT](docs/HARDWARE_MQTT.md) — topic contract, payloads, adapter path, broker setup
- [Security](docs/SECURITY.md) — authentication, RBAC, validation, rate limits, hardening
- [Testing](docs/TESTING.md) — strategy, coverage, how to run suites
- [Deployment](docs/DEPLOYMENT.md) — Docker, environment, scaling, backups, observability
- [Troubleshooting](docs/TROUBLESHOOTING.md) — common failure modes and fixes
- [Demo script](docs/DEMO_SCRIPT.md) — a 10-minute walkthrough for reviews
- [Project report](docs/REPORT.md) — problem, design, implementation, testing, limitations
- [Presentation](docs/PRESENTATION.md) — slide-by-slide outline with speaker notes

---

## Technology

**Client:** React 19, Vite 8, Tailwind CSS 4, React Router 7, Redux Toolkit 2, RTK Query, Axios, Recharts, Socket.IO client, Lucide, date-fns, Sonner-style toasts.

**Server:** Node.js 24 (20.19+ supported), Express 5, Mongoose 9, MongoDB 7, Socket.IO 4, MQTT.js 5, JWT, bcrypt, Zod 4, Pino, Helmet, express-rate-limit, node-cron.

**Quality:** Vitest 5, Supertest, mongodb-memory-server, Testing Library, ESLint 9, Prettier 3.

---

## License and attribution

Built as an academic and portfolio project. The visual language is inspired by a Dribbble LMS/ERP interface reference; the implementation, copy and assets are original. Plus Jakarta Sans is bundled as the display/body typeface because Sofia Pro is licensed.
