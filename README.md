# AutoLinks

[![CD](https://github.com/mohmamad/autoLinks/actions/workflows/cd.yml/badge.svg)](https://github.com/mohmamad/autoLinks/actions/workflows/cd.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-21-red)](https://angular.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**AutoLinks** is an automation platform that lets users create webhook-driven pipelines with configurable subscribers (Slack, email, HTTP). When a webhook fires, AutoLinks uses an AI agent to generate an action plan from the incoming payload, then dispatches notifications to all configured subscribers through a reliable background worker queue with exponential-backoff retries.

> Live demo: [auto-links.vercel.app](https://auto-links.vercel.app)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Worker System](#worker-system)
- [Testing](#testing)
- [Deployment](#deployment)
- [Common Commands](#common-commands)
- [FAQ](#faq)
- [License](#license)

---

## Features

- **Webhook-driven pipelines** — Each pipeline gets a unique webhook URL that accepts incoming data
- **Multi-channel subscribers** — Route notifications to Slack, email (via Brevo/Sendinblue), or any HTTP endpoint
- **AI-powered action plans** — An LLM agent interprets incoming payloads and generates structured action plans
- **Reliable job queue** — Background worker with exponential-backoff retries (configurable max retries per job)
- **JWT authentication** — Secure signup/login with access + refresh token rotation
- **Pipeline diagram generation** — AI-generated visual diagrams of pipeline flows
- **Angular dashboard** — Modern UI for creating, managing, and monitoring pipelines and their jobs
- **CI/CD** — Automated deployment to Google Cloud Run via GitHub Actions

---

## Architecture

```
┌──────────────┐    webhook     ┌──────────────────┐     queue      ┌──────────────┐
│  External    │ ──────────────▶│  Express API     │ ─────────────▶ │   Worker     │
│  Service     │   POST /auto-  │  (src/)          │   jobs table   │  (scheduled) │
└──────────────┘   links/:id    │                  │                │              │
                                │  • Auth (JWT)    │                │  • AI Agent  │
┌──────────────┐   REST API     │  • Pipelines     │                │  • Slack     │
│  Angular UI  │ ◀─────────────▶│  • Users         │                │  • Email     │
│  (dashboard) │                │  • Jobs          │                │  • HTTP      │
└──────────────┘                └────────┬─────────┘                └──────────────┘
                                         │
                                    ┌────▼────┐
                                    │ Postgres│
                                    │ (Drizzle│
                                    │  ORM)   │
                                    └─────────┘
```

- **Backend** (`src/`) — Express 5 API with JWT authentication, pipeline CRUD, webhook ingestion, and a synchronous worker loop triggered via `POST /workers/run`
- **Frontend** (`autoLinks-UI/auto-links-ui/`) — Angular 21 application with Bootstrap styling, Mermaid diagram rendering, auth flow, and pipeline dashboard
- **Database** — PostgreSQL accessed through Drizzle ORM with migration support via `drizzle-kit`
- **CI/CD** — `.github/workflows/cd.yml` builds, migrates, and deploys to Google Cloud Run on every push to `main`

---

## Tech Stack

### Backend

| Technology                                                    | Purpose                                |
| ------------------------------------------------------------- | -------------------------------------- |
| [Express 5](https://expressjs.com/)                           | HTTP server & routing                  |
| [Drizzle ORM](https://orm.drizzle.team/)                      | Type-safe database access & migrations |
| [PostgreSQL](https://www.postgresql.org/)                     | Relational database                    |
| [Argon2](https://github.com/ranisalt/node-argon2)             | Password hashing                       |
| [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken) | Authentication                         |
| [Brevo API](https://www.brevo.com/)                           | Transactional email delivery           |
| [Vitest](https://vitest.dev/)                                 | Unit testing                           |
| [TypeScript](https://www.typescriptlang.org/)                 | Language                               |

### Frontend

| Technology                                         | Purpose                    |
| -------------------------------------------------- | -------------------------- |
| [Angular 21](https://angular.dev/)                 | SPA framework              |
| [Bootstrap 5](https://getbootstrap.com/)           | UI styling                 |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | Iconography                |
| [Mermaid](https://mermaid.js.org/)                 | Pipeline diagram rendering |
| [RxJS](https://rxjs.dev/)                          | Reactive programming       |

---

## Project Structure

```
autoLinks/
├── .github/workflows/
│   └── cd.yml                  # CD pipeline → Cloud Run
├── autoLinks-UI/
│   └── auto-links-ui/
│       ├── src/                # Angular application source
│       ├── proxy.conf.json     # Dev proxy to backend API
│       ├── angular.json        # Angular CLI config
│       └── package.json        # Frontend dependencies
├── drizzle/                    # SQL migration files
├── src/
│   ├── agent/                  # AI agent runner & skills
│   ├── api/
│   │   ├── agent.ts            # Pipeline diagram generation endpoint
│   │   ├── auth.ts             # Login / logout / refresh handlers
│   │   ├── autolinks.ts        # Webhook ingestion handler
│   │   ├── errors.ts           # Custom error classes
│   │   ├── middleware.ts       # Error logging & handling middleware
│   │   ├── pipeline.ts         # Pipeline CRUD handlers
│   │   └── users.ts            # User signup handler
│   ├── auth.ts                 # JWT & password utilities
│   ├── config.ts               # Environment configuration
│   ├── db/
│   │   ├── index.ts            # Database connection
│   │   └── schema.ts           # Drizzle table definitions
│   ├── index.ts                # Express app entry point
│   ├── prompts/                # AI prompt templates
│   ├── repositories/           # Data-access layer
│   ├── services/               # Business logic layer
│   ├── skills/                 # AI agent skill definitions
│   ├── tests/                  # Vitest test suite
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Shared utilities
│   └── worker/
│       ├── subscripers.ts      # Slack / email / HTTP dispatch logic
│       ├── threadEntry.ts      # Worker thread bootstrap
│       └── worker.ts           # Job execution & retry logic
├── Dockerfile                  # Backend container (node:22-slim)
├── drizzle.config.ts           # Drizzle-kit configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest configuration
└── package.json                # Backend dependencies & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 22
- **npm** >= 10
- **PostgreSQL** instance (local or hosted)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/mohmamad/autoLinks.git
cd autoLinks

# Install dependencies
npm install

# Configure environment (see Environment Variables section below)
cp .env.example .env   # if available, otherwise create .env manually

# Run database migrations
npm run db:migrate

# Start the development server (compiles TypeScript + runs)
npm run dev
```

The API server starts at **http://localhost:8080** by default.

### Frontend Setup

```bash
cd autoLinks-UI/auto-links-ui

# Install dependencies
npm install

# Start Angular dev server (proxies API calls to localhost:8080)
npm run start
```

The UI is served at **http://localhost:4200** with API requests proxied to the backend.

---

## Environment Variables

Create a `.env` file in the project root with the following:

| Variable                  | Required | Default      | Description                                     |
| ------------------------- | -------- | ------------ | ----------------------------------------------- |
| `DATABASE_URL`            | Yes      | —            | PostgreSQL connection string                    |
| `JWT_SECRET`              | Yes      | —            | Secret key for signing JWTs                     |
| `JWT_ISSUER`              | No       | `autolinks`  | Token issuer claim                              |
| `JWT_ACCESS_TTL_SECONDS`  | No       | `3600`       | Access token lifetime (seconds)                 |
| `JWT_REFRESH_TTL_MS`      | No       | `2592000000` | Refresh token lifetime (ms, ~30 days)           |
| `BREVO_API_KEY`           | Yes      | —            | Brevo (Sendinblue) API key for emails           |
| `BREVO_SENDER`            | No       | —            | Sender email address for Brevo                  |
| `OPENAI_API_KEY`          | Yes\*    | —            | OpenAI key for AI agent (\*required for worker) |
| `PORT`                    | No       | `8080`       | API server port                                 |
| `WORKER_RETRY_BASE_MS`    | No       | `5000`       | Base delay for exponential retry backoff        |
| `WORKER_CONCURRENCY`      | No       | `5`          | Worker concurrency (Cloud Run env)              |
| `WORKER_POLL_INTERVAL_MS` | No       | `2000`       | Worker poll interval (Cloud Run env)            |

---

## API Reference

### Health

| Method | Endpoint  | Auth | Description                                 |
| ------ | --------- | ---- | ------------------------------------------- |
| `GET`  | `/health` | No   | Health check — returns `{ "status": "ok" }` |

### Authentication & Users

| Method | Endpoint         | Auth | Description                     |
| ------ | ---------------- | ---- | ------------------------------- |
| `POST` | `/users/signup`  | No   | Register a new user             |
| `POST` | `/users/login`   | No   | Authenticate and receive tokens |
| `POST` | `/users/refresh` | No   | Refresh an access token         |
| `POST` | `/users/logout`  | No   | Revoke a refresh token          |

### Pipelines

| Method   | Endpoint                      | Auth | Description                                   |
| -------- | ----------------------------- | ---- | --------------------------------------------- |
| `GET`    | `/pipelines`                  | Yes  | List all pipelines for the authenticated user |
| `POST`   | `/pipelines`                  | Yes  | Create a new pipeline                         |
| `PUT`    | `/pipelines/:pipelineId`      | Yes  | Update an existing pipeline                   |
| `DELETE` | `/pipelines/:pipelineId`      | Yes  | Delete a pipeline                             |
| `GET`    | `/pipelines/:pipelineId/jobs` | Yes  | List jobs for a pipeline                      |
| `POST`   | `/pipelines/diagram`          | Yes  | Generate an AI-powered pipeline diagram       |

### Webhooks & Workers

| Method | Endpoint                | Auth | Description                                    |
| ------ | ----------------------- | ---- | ---------------------------------------------- |
| `POST` | `/autolinks/:webhookId` | No   | Ingest a webhook event (creates a job)         |
| `POST` | `/workers/run`          | No   | Trigger the worker loop to drain the job queue |

---

## Database Schema

The application uses five core tables managed by Drizzle ORM:

- **`users`** — User accounts (`id`, `username`, `email`, `password`)
- **`pipelines`** — Automation pipelines, each with a unique `webhook_id`, owned by a user
- **`subscripers`** — Subscribers attached to pipelines; type is one of `slack`, `email`, or `http request`, with a JSON `config` blob
- **`jobs`** — Work items created when a webhook fires; tracks `status` (`pending` → `running` → `done`/`failed`), `retry_count`, `max_retries`, and `next_run_at`
- **`refresh_tokens`** — JWT refresh tokens with expiry and revocation tracking

Generate new migrations after schema changes:

```bash
npm run db:generate
npm run db:migrate
```

---

## Worker System

The worker processes jobs through a synchronous drain loop:

1. **Webhook received** → a new job is created with status `pending`
2. **`POST /workers/run`** is called (by Cloud Run Scheduler or manually)
3. The worker picks the next eligible job and:
   - Sends the pipeline description + job payload to the **AI agent**
   - The agent returns a structured **action plan**
   - The action plan is dispatched to all **subscribers** (Slack, email, HTTP)
4. On **success** → job marked `done`
5. On **failure** → exponential-backoff retry (`base_ms * 2^attempt`), up to `max_retries`; then marked `failed`

Trigger the worker manually during development:

```bash
curl -X POST http://localhost:8080/workers/run
# Response: { "status": "processed", "processed": 2 }
# or:      { "status": "idle", "processed": 0 }
```

---

## Testing

Backend tests use [Vitest](https://vitest.dev/) and are located in `src/tests/`:

```bash
# Run all tests
npm test
```

---

## Deployment

### Backend (Automated via GitHub Actions)

On every push to `main`, the CD pipeline (`.github/workflows/cd.yml`):

1. Installs dependencies and builds TypeScript
2. Builds a Docker image (`node:22-slim`) and pushes to Google Artifact Registry
3. Runs database migrations against the production database
4. Deploys to **Google Cloud Run** (`us-central1`, max 4 instances)

**Required GitHub Secrets:**

| Secret            | Description                             |
| ----------------- | --------------------------------------- |
| `DATABASE_URL`    | Production PostgreSQL connection string |
| `GCP_CREDENTIALS` | GCP service account credentials JSON    |
| `BREVO_SENDER`    | Sender email for Brevo notifications    |

Additional secrets are managed via **GCP Secret Manager**: `JWT_SECRET`, `OPENAI_API_KEY`, `BREVO_API_KEY`.

### Frontend

The Angular UI is not currently deployed by CI. Recommended options:

1. **Separate Cloud Run service** — Containerize the Angular build with a static server (recommended for independent scaling)
2. **Static hosting** — Firebase Hosting or Cloud Storage + CDN
3. **Bundled with backend** — Copy `dist/auto-links-ui/browser` into the backend image (demo only)

---

## Common Commands

| Context  | Command                                   | Description                             |
| -------- | ----------------------------------------- | --------------------------------------- |
| Backend  | `npm run dev`                             | Compile TypeScript and start API server |
| Backend  | `npm run build && npm start`              | Production-style build and run          |
| Backend  | `npm run dev:agent`                       | Run the AI agent standalone             |
| Backend  | `npm run db:generate`                     | Generate new Drizzle migrations         |
| Backend  | `npm run db:migrate`                      | Apply database migrations               |
| Backend  | `npm test`                                | Run Vitest test suite                   |
| Frontend | `npm run start`                           | Angular dev server with API proxy       |
| Frontend | `npm run build`                           | Production build                        |
| Worker   | `curl -X POST localhost:8080/workers/run` | Manually trigger the worker loop        |

---

## FAQ

**How do pipelines work?**
Create a pipeline via the dashboard or API. Each pipeline gets a unique webhook URL (`/autolinks/:webhookId`). When an external service posts data to that URL, a job is queued. The worker picks it up, uses AI to generate an action plan, and dispatches it to your configured subscribers.

**Why aren't my Cloud Run workers pulling jobs?**
Ensure you've redeployed after code changes and that Cloud Run Scheduler hits `POST /workers/run` with the correct service URL. A successful response looks like `{"status":"processed","processed":N}`.

**Does GitHub Actions deploy the UI?**
No — the CD workflow only targets the backend container. Add a separate workflow for automated frontend deployments.

**Can I share one container for API + UI?**
Possible for small demos, but keeping them as independent services allows each to scale and deploy independently.

**What AI model powers the agent?**
The agent uses OpenAI via the `OPENAI_API_KEY` secret. The prompt templates and skills are defined in `src/prompts/` and `src/skills/`.

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
