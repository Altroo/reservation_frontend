# Reservation Frontend

## Purpose

Reservation Frontend is the Next.js dashboard for managing reservations, local units, planning, occupancy, costs, gains, reports, notifications, and user access.

## Stack

- Next.js and React
- TypeScript
- NextAuth
- Redux Toolkit and redux-saga
- MUI, Sass, and chart components
- Formik and Zod
- Jest and Testing Library

## Features

- Reservation creation, list, and detail views
- Calendar and planning screens
- Building and unit management
- Occupancy, cost, gain, and balance dashboards
- User administration and profile settings
- Notifications and maintenance status handling

## Setup

Provide local-only variables for the API, auth, and websocket endpoints. Use localhost values for local development and do not commit local configuration files.

```bash
bun install
bun run dev
```

The frontend runs on `localhost:3002`.

## Tests

```bash
bun x jest --runInBand --coverage=false
bun run lint
bun run build
```

## Screenshots

Sanitized product workspace:

![Reservation product workspace](docs/screenshots/reservation-showcase.png)

Authentication screen:

![Reservation login](docs/screenshots/reservation-login.png)
