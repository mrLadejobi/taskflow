# Contributing to TaskFlow

Thank you for your interest in contributing to TaskFlow! This document provides instructions for developing, testing, and submitting improvements to the codebase.

---

## 1. Development Principles

- **Separation of Concerns:** Business logic lives in controllers/routers, database access is mediated by SQLAlchemy 2.0 models and dependencies, and serialized payloads are strictly managed via Pydantic schemas.
- **Strict Typing:** Python code follows PEP 484 type hints. TypeScript code runs under strict mode (`noImplicitAny`, etc.).
- **Security First:** Never hardcode secrets or credentials. All authentication routes must be scoped and guarded.

---

## 2. Setting Up Your Environment

1. Clone repository:
   ```bash
   git clone https://github.com/mrLadejobi/taskflow.git
   cd taskflow
   ```
2. Set up Python backend:
   ```bash
   python -m venv .venv
   source .venv/Scripts/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```
3. Set up Next.js client:
   ```bash
   cd client
   npm install
   cp .env.local.example .env.local
   ```

---

## 3. Testing Requirements

All contributions must include appropriate automated tests:
- Backend: Write pytest functions in `tests/test_*.py`. Run `pytest tests/ -v` to ensure 100% test pass rate.
- Frontend: Ensure TypeScript compiles with `npm run typecheck` and passes ESLint with `npm run lint`.

---

## 4. Git Commit Guidelines

Commit messages follow the Conventional Commits specification:
- `feat(...)`: A new user-facing feature
- `fix(...)`: A bug fix
- `docs(...)`: Documentation changes
- `refactor(...)`: Code changes that neither fix a bug nor add a feature
- `test(...)`: Adding or updating tests
- `chore(...)`: Tooling, configuration, or dependency updates
