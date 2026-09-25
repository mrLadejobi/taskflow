# Security Policy

## Supported Versions

We release security updates and patches for active versions of TaskFlow:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The TaskFlow team takes the security of our application and user data seriously. If you believe you have found a security vulnerability in TaskFlow, please let us know immediately.

### Responsible Disclosure Process

1. **Do not create public GitHub issues** for suspected security vulnerabilities.
2. Email your findings directly to the maintainer at `security@taskflow.dev` or `ladejobioluwasaanumi@gmail.com`.
3. Include in your report:
   - Type of vulnerability (e.g. CSRF, XSS, SQL injection, Authentication bypass).
   - Step-by-step reproduction steps or proof-of-concept payload.
   - Affected endpoints, parameters, or components.
   - Any proposed mitigations or code patches.

### Our Commitment

- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide a status update on triage and severity assessment within **5 business days**.
- Once confirmed, a security patch will be prepared, verified, and released promptly.

---

## Security Practices Implemented in TaskFlow

- **Authentication**: Stateless HMAC-SHA256 JSON Web Tokens (JWT) with strict expiry and algorithm pinning.
- **Password Storage**: Passwords hashed using standard `bcrypt` with automatic salting. Plaintext passwords are never logged or stored.
- **Authorization & RBAC**: Every project and task endpoint enforces role-based permissions (`admin`, `member`, `viewer`).
- **Input Validation**: Strict schema enforcement via Pydantic v2 on backend and Zod on client.
- **SQL Injection Prevention**: 100% parameterized queries via SQLAlchemy 2.0 ORM expressions.
- **CORS Protection**: Restricted origins configured via environment variables.
