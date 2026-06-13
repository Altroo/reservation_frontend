# Reservation Frontend

Next.js interface for a reservation and property operations platform for buildings, local units, reservations, planning, occupancy, costs, gains, balances, Hilton reports, users, notifications, and maintenance controls.

This frontend is built around real staff workflows: authenticated navigation, dense dashboards, tables, filters, create/edit/detail pages, forms, actions, settings, notifications, and production data constraints.

## What It Shows

- Product UI work for an internal business system.
- Data-heavy React/Next.js screens with real workflow depth.
- State management with Redux Toolkit and redux-saga.
- Authenticated app structure with NextAuth and API-backed routes.
- Form, table, dashboard, notification, and settings flows built for daily operations.

## Key Capabilities

- Reservation dashboard with planning, calendar, occupancy, balance, costs, gains, building, local, user, profile, and report screens.
- Operational list/detail/create/edit flows for reservations, buildings, locals, costs, users, and settings.
- MUI tables, filters, date pickers, charts, and forms for booking and property workflows.
- Redux Toolkit and redux-saga state handling for API requests, auth, notifications, and dashboard data.
- Jest and Testing Library coverage for app behavior, helpers, routes, and UI state.

## Stack

- Next.js 16, React 19, TypeScript
- NextAuth, Axios, React Redux
- Redux Toolkit, redux-saga
- MUI, MUI X Data Grid, Sass, chart components
- Formik, Zod, date-fns
- Jest, Testing Library, ts-jest, Bun

## Related Repository

- Backend API: [Altroo/reservation_backend](https://github.com/Altroo/reservation_backend)

## Screenshots

Redacted production screenshots. Sensitive names, amounts, dates, and records are blurred.

![Reservation dashboard](docs/screenshots/reservation-dashboard.png)

![Planning board](docs/screenshots/reservation-planning.png)

## Local Setup

Create local-only environment variables for the API base URL, auth settings, websocket endpoints, and public runtime config. Do not commit `.env` files or production credentials.

```bash
bun install
bun run dev
```

Default local port: `3002`.

## Quality Checks

```bash
bun x jest --runInBand --coverage=false
bun run lint
bun run build
```

## Portfolio Note

The repository is public for portfolio review. Screenshots are redacted, and sensitive production values are intentionally hidden.
