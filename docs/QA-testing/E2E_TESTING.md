# Playwright E2E — Workforce 360 ERP

Smoke tests for API health, login page, and optional authenticated flows.

## Prerequisites

- Node.js 20+
- API and web dev servers running **or** let Playwright start them automatically

## Run

```bash
# Install browser binaries (first time only)
npx playwright install chromium

# Run smoke tests (starts dev:api + dev:web if not already running)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLAYWRIGHT_WEB_URL` | `http://localhost:3000` | Frontend base URL |
| `PLAYWRIGHT_API_URL` | `http://localhost:4000` | API base URL |
| `PLAYWRIGHT_SKIP_WEBSERVER` | unset | Set to `1` when servers are already running |
| `PLAYWRIGHT_LOGIN_EMAIL` | unset | Enables authenticated login smoke test |
| `PLAYWRIGHT_LOGIN_PASSWORD` | `Admin@123` | Password for auth smoke test |

## CI

In CI, set `PLAYWRIGHT_SKIP_WEBSERVER=1` and start API/web in prior workflow steps, or rely on the default `webServer` config with a seeded database.

