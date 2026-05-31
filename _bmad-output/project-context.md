# SimpleApp — Project Context

Lean reference for AI agents working on this codebase.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Frontend | JavaScript, Angular |
| API | REST (JSON) |

## Project Structure

```
backend/     # FastAPI app, models, routes, services
frontend/    # Angular app, components, services
_bmad-output/  # BMAD planning & implementation artifacts
docs/        # Project knowledge (when added)
```

## Critical Implementation Rules

### General

- Keep it simple. Prefer the smallest change that solves the problem.
- Backend and frontend are separate apps; communicate only via the REST API.
- Do not add libraries or frameworks unless clearly needed.

### Backend (FastAPI + SQLAlchemy + SQLite)

- Use SQLAlchemy models for persistence; use Pydantic schemas for API request/response bodies — never expose ORM models directly in routes.
- Put business logic in service functions, not in route handlers.
- Use FastAPI dependency injection for DB sessions and shared resources.
- SQLite file lives in the backend project (e.g. `backend/app.db`); use Alembic or explicit `create_all` only for local dev — pick one approach and stay consistent.
- Return proper HTTP status codes and consistent JSON error shapes (`{"detail": "..."}`).

### Frontend (Angular + JavaScript)

- Use Angular services for all HTTP calls to the backend; components stay thin (display + user events only).
- Use typed interfaces or plain objects for API data shapes; keep them aligned with backend Pydantic schemas.
- Prefer Angular built-ins (HttpClient, reactive forms, router) over third-party UI libraries unless requested.
- Handle loading and error states in the UI for every API call.

### API Contract

- REST endpoints under `/api/` (e.g. `/api/items`).
- JSON field names in `snake_case` on the backend; map to `camelCase` in the frontend if that is the Angular convention — but be consistent within each layer.
- Version breaking API changes only when necessary; update both backend schemas and frontend services together.

### Testing & Quality

- Backend: test routes and services with pytest; use an in-memory or temp SQLite DB for tests.
- Frontend: test components and services with Jasmine/Karma (Angular default).
- No committed secrets, `.env` files, or local DB files in git.
