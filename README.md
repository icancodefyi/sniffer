# Sniffer

Monorepo for image authenticity analysis, domain intelligence lookup, and takedown guidance.

## Overview

Main flow:

1. Create a case.
2. Upload suspicious image (and optional reference image).
3. Run analysis.
4. Query intelligence and takedown services.
5. View report and dashboard data.

## Services

- Web app: Next.js app, auth, UI, API proxy routes
- Analysis service: FastAPI service for case, analysis, discovery, and registry
- Intelligence service: FastAPI domain/provider/network lookup
- Takedown service: FastAPI removal guidance lookup and scrape fallback

## Architecture

```mermaid
flowchart LR
    U[User] --> W[Web App :3000]
    W --> A[Analysis API :8000]
    W --> I[Intelligence API :8002]
    W --> T[Takedown API :8003]
    W --> M[(MongoDB)]
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Python 3.11+, FastAPI, Uvicorn, Pydantic
- Data: MongoDB + CSV datasets
- Tooling: pnpm workspaces

## Repository Layout

```text
apps/web/                 Next.js frontend + API routes + auth + dashboard
services/analysis/        FastAPI analysis service
services/intelligence/    FastAPI intelligence service
services/takedown/        FastAPI takedown service
```

## API Endpoints

### Analysis Service (`:8000`)

- POST `/api/cases/`
- GET `/api/cases/{case_id}`
- POST `/api/analysis/{case_id}/run`
- GET `/api/analysis/{case_id}/result`
- POST `/api/analysis/{case_id}/discover`
- GET `/api/analysis/{case_id}/discover`
- POST `/api/registry/`
- GET `/api/registry/`
- GET `/api/registry/check/{file_hash}`
- POST `/api/registry/takedown-notice`
- GET `/api/dashboard/`
- GET `/health`

### Intelligence Service (`:8002`)

- GET `/api/v1/intelligence/{domain}`
- GET `/api/v1/intelligence/`
- GET `/health`

### Takedown Service (`:8003`)

- GET `/api/v1/takedown/{domain}`
- GET `/api/v1/takedown/`
- GET `/health`

### Web API Routes

- `/api/cases/*`
- `/api/intelligence/[domain]`
- `/api/takedown/[domain]`
- `/api/user/cases`
- `/api/dashboard/overview`

## Local Setup

Prerequisites:

- Node.js 20+
- pnpm 9+
- Python 3.11+

Install and run:

```bash
pnpm install

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r services/analysis/requirements.txt
pip install -r services/intelligence/requirements.txt
pip install -r services/takedown/requirements.txt

pnpm dev
```

Expected local ports:

- Web: `3000`
- Analysis: `8000`
- Intelligence: `8002`
- Takedown: `8003`

## Environment Variables

### Web (`apps/web/.env.local`)

Required:

- `MONGODB_URI`
- `NEXT_PUBLIC_API_URL`
- `INTELLIGENCE_SERVICE_URL`
- `TAKEDOWN_SERVICE_URL`

Optional (email auth):

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### Analysis (`services/analysis/.env`)

- `HF_TOKEN` (optional, model-dependent)

### Intelligence (`services/intelligence/.env`)

- `INTELLIGENCE_PORT` (optional)
- `ALLOWED_ORIGINS` (recommended)
- `INTELLIGENCE_DATA_PATH` (optional)

### Takedown (`services/takedown/.env`)

- `TAKEDOWN_PORT` (optional)
- `ALLOWED_ORIGINS` (recommended)
- `TAKEDOWN_DATA_PATH` (optional)
- `SCRAPE_TIMEOUT` (optional)
