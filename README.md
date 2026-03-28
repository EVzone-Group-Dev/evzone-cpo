# EVzone CPO Central

EVzone CPO Central is a React and TypeScript control-center frontend for operating an EV charging network. It is currently a frontend-first product shell with a development mock API powered by Mock Service Worker (MSW), designed to help us shape workflows for stations, charge points, roaming, finance, reporting, and protocol operations before a live backend is connected.

## Current State

- React 19 + Vite frontend
- TanStack Query for API state
- Zustand for auth/session state
- Tailwind + custom CSS design system
- MSW-backed mock API for development data
- Google Maps integration for station geospatial views

This repository is not yet a production CPO backend. In development mode, the app boots with MSW and serves mock responses from `src/mocks/handlers.ts` and `src/mocks/data.ts`.

## Project Structure

```text
src/
  components/       Shared UI building blocks and layout
  core/
    api/            Fetch helpers
    auth/           Auth store and role helpers
    contexts/       App-wide React contexts
    hooks/          Data hooks for mock/API resources
    types/          Domain and API response types
    utils/          Mapping and utility helpers
  mocks/            MSW handlers and centralized mock datasets
  pages/            Route-level screens
  router/           App routes and guards
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and provide values for local development.

```bash
copy .env.example .env
```

Current environment variables:

- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps browser API key used by the map views

`.env` is ignored by git. Only `.env.example` should be committed.

### 3. Start the development server

```bash
npm run dev
```

In development mode, MSW starts automatically from `src/main.tsx` and intercepts frontend API requests.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Mock API Coverage

The frontend currently reads development data from MSW endpoints such as:

- `/api/auth/demo-users`
- `/api/auth/login`
- `/api/dashboard/overview`
- `/api/dashboard/site-owner`
- `/api/stations`
- `/api/stations/:id`
- `/api/charge-points`
- `/api/charge-points/:id`
- `/api/sessions`
- `/api/incidents`
- `/api/alerts`
- `/api/tariffs`
- `/api/energy/smart-charging`
- `/api/energy/load-policies`
- `/api/roaming/partners`
- `/api/roaming/sessions`
- `/api/roaming/cdrs`
- `/api/roaming/commands`
- `/api/finance/billing`
- `/api/finance/payouts`
- `/api/finance/settlement`
- `/api/team`
- `/api/audit-logs`
- `/api/reports`
- `/api/protocols`

The source of truth for these mock responses lives in `src/mocks/data.ts`.

## Development Notes

- Pages should avoid embedding business data directly in components.
- New frontend workflows should prefer MSW-backed endpoints first, then be switched to live services later.
- Keep domain shapes in `src/core/types` aligned with the eventual backend contracts.
- Client-side auth and route protection here are for development UX only and are not a substitute for backend security.

## Near-Term Priorities

- Replace remaining placeholder modules with richer mock-backed flows
- Introduce test coverage for hooks and route-level screens
- Tighten lint compliance across the codebase
- Define the backend contract for OCPP, OCPI, billing, settlements, and tenant isolation
