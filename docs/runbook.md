# TaskFlow — Operational Runbook & Deployment Guide

This document contains operational procedures for configuring, launching, maintaining, and troubleshooting TaskFlow in local, staging, and production environments.

---

## 1. Environment Configuration

### 1.1 Backend Configuration (`.env`)
The backend expects configuration via environment variables or a `.env` file at the repository root.

| Variable | Type | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | `string` | *(must be provided)* | Cryptographic key for signing JWTs. Must be strong and unique. |
| `DATABASE_URL` | `string` | `sqlite:///./taskflow.db` | Database connection URI. |
| `DEBUG` | `bool` | `true` | Enables SQL echoing and FastAPI docs. Set to `false` in production. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `1440` (24h) | Expiration time for authentication tokens. |
| `API_PREFIX` | `string` | `/api/v1` | Root path prefix for all endpoints. |
| `CORS_ORIGINS` | `list[str]` | `["http://localhost:3000"]` | Allowed origins for web client requests. |

### 1.2 Frontend Configuration (`client/.env.local`)
Create `client/.env.local` based on `client/.env.local.example`:

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for FastAPI backend endpoints | `http://localhost:8000/api/v1` |

---

## 2. Local Development Setup

### 2.1 Starting the Backend
```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/Scripts/activate  # On Windows (Git Bash) or .venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Start development server
uvicorn taskflow.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive documentation (Swagger UI): `http://localhost:8000/docs`

### 2.2 Starting the Frontend
```bash
cd client
npm install
npm run dev
```
Client application will be accessible at: `http://localhost:3000`

---

## 3. Automated Testing & Verification

### 3.1 Running Backend Pytest Suite
```bash
# Run all tests with coverage report
pytest tests/ -v --cov=taskflow
```
*Note:* Tests automatically run against an isolated SQLite test database and wipe session state safely.

### 3.2 Running Frontend Linting & Type Checking
```bash
cd client

# Check TypeScript compiler types
npm run typecheck

# Check ESLint rules
npm run lint

# Build production bundle
npm run build
```

---

## 4. Health Checks & Monitoring

### 4.1 Liveness Probe (`/healthz`)
- **Endpoint:** `GET /healthz`
- **Expected Status:** `200 OK`
- **Response Payload:** `{"status": "pass", "service": "taskflow-api", "timestamp": "..."}`
- Use this probe for Kubernetes liveness checks or container restart monitors.

### 4.2 Database Readiness Probe (`/readyz`)
- **Endpoint:** `GET /readyz`
- **Expected Status:** `200 OK` (or `503 Service Unavailable` if database is down)
- **Response Payload:** `{"status": "pass", "service": "taskflow-api", "database": "connected", "db_latency_ms": 1.25, ...}`
- Validates active database connectivity and records database ping latency.

### 4.3 Distributed Tracing & Request Correlation
- Every incoming HTTP request is assigned a unique `X-Request-ID` UUID (or inherits upstream `X-Request-ID` headers).
- The correlation ID is reflected in the HTTP response headers and stored on `request.state.request_id` for end-to-end tracing.

### 4.4 Application Logs
- The backend features built-in structured request logging:
  `METHOD PATH -> STATUS (LATENCY ms)`
- Example log output:
  `INFO: taskflow: POST /api/v1/auth/login -> 200 (12.4ms)`

---

## 5. Troubleshooting & FAQ

### Issue: Backend refuses to boot with `RuntimeError: Production secret key missing`
- **Cause:** When `DEBUG=false`, the server enforces that `SECRET_KEY` is not the default fallback value.
- **Resolution:** Generate and set a cryptographically secure random string in `.env`:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

### Issue: CORS Errors on API calls from Client
- **Cause:** The frontend URL is not included in `CORS_ORIGINS`.
- **Resolution:** Update `CORS_ORIGINS` in `.env` to include your client domain (e.g. `CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]`).
