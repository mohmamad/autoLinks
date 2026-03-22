## AutoLinks

AutoLinks is a small demo platform that exposes an automation backend (Express + Drizzle ORM + worker queue) and an Angular dashboard for creating and monitoring pipelines. The repository contains both services so you can iterate locally with a single clone while still deploying backend and frontend independently.

### Architecture

- **Backend** (`src/`)
  - Express API with authentication, pipeline management, and a worker queue that can be triggered via `POST /workers/run` (ideal for Cloud Run Scheduler).
  - Database access through Drizzle ORM; migrations handled with `drizzle-kit`.
  - Background jobs live in `src/worker/`; the worker processes webhook/email/slack subscribers defined per pipeline.
- **Frontend** (`autoLinks-UI/auto-links-ui/`)
  - Angular 17+ application that provides auth, pipeline creation, and dashboard views.
  - Uses Bootstrap/Bootstrap Icons for styling and talks to the backend via the same domain (proxy in dev, Cloud Run in prod).
- **CI/CD**
  - `.github/workflows/cd.yml` builds the backend, runs migrations, and deploys to Cloud Run.
  - `.github/workflows/ci.yml` (not described here) runs tests/lint on pull requests.

### Local Development

#### Backend

1. `npm install`
2. Copy `.env.example` to `.env` (if present) and fill required secrets.
3. `npm run dev` builds and starts `dist/index.js`. Alternatively run `npm run build && npm start`.
4. Trigger workers locally via `curl -X POST http://localhost:8080/workers/run`.

Useful scripts:

- `npm run db:generate` – generate new Drizzle migrations.
- `npm run db:migrate` – apply migrations.
- `npm test` – run Vitest suite (`src/tests`).

#### Frontend (Angular UI)

1. `cd autoLinks-UI/auto-links-ui`
2. `npm install`
3. `npm run start` – serves at `http://localhost:4200` and proxies API calls per `proxy.conf.json`.
4. `npm run build` – emits production assets under `dist/auto-links-ui/browser`.

### Deployment Notes

- **Backend**: GitHub Actions builds `dist/`, pushes a Docker image, runs migrations, and deploys the `autolinks` Cloud Run service. Secrets required: `DATABASE_URL`, `GCP_CREDENTIALS`, `BREVO_SENDER`, and secret manager entries for JWT/DB/Brevo/OpenAI keys.
- **Workers**: Cloud Run Scheduler (or any job runner) should call `POST /workers/run`. The handler drains the queue synchronously and returns `{ "status": "processed" | "idle", processed: <count> }` so you can monitor progress.
- **Frontend**: Not currently deployed by CI. Either:
  1. **Separate Cloud Run service** – containerize the Angular build with a static server (recommended).
  2. **Static hosting** – Firebase Hosting / Cloud Storage + CDN for a simpler setup.
  3. **Bundled with backend** – only for tiny demos; copy `dist/auto-links-ui/browser` into the backend image and have Express serve static files.

> Tip: Keep backend and frontend as independent Cloud Run services for cleaner deployments and scaling. Use the same repo but create dedicated Dockerfiles/workflows.

### Project Structure

```
autoLinks/
├── src/                    # Express API, worker, services, repositories
├── dist/                   # Compiled backend output (build artifact)
├── autoLinks-UI/auto-links-ui/
│   ├── src/                # Angular app
│   └── dist/               # Angular build artifacts
├── drizzle/                # SQL migrations
├── .github/workflows/      # CI/CD pipelines
├── Dockerfile              # Backend container definition
└── README.md               # You're here
```

### Common Commands

| Context   | Command                          | Description                  |
| --------- | -------------------------------- | ---------------------------- |
| Backend   | `npm run dev`                    | Compile + run API locally    |
| Backend   | `npm run build && npm start`     | Production-style build + run |
| Backend   | `curl -X POST :8080/workers/run` | Manually trigger worker loop |
| Frontend  | `npm run start` (from UI folder) | Angular dev server w/ proxy  |
| Frontend  | `npm run build` (from UI folder) | Production build             |
| Repo root | `npm test`                       | Backend unit tests           |

### Support / FAQ

- **Why aren’t my Cloud Run workers pulling jobs?** Ensure you redeploy after code changes and that the Scheduler hits `POST /workers/run` with the correct URL. The response `{"status":"processed","processed":N}` confirms dispatch.
- **Does GitHub Actions deploy the UI?** No—the workflow only targets the backend container. Add a separate workflow if you need automatic frontend deployments.
- **Can I share one container for API + UI?** Possible for tiny demos; otherwise keep services separate so each can scale and deploy independently.
