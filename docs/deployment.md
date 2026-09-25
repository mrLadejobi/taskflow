# TaskFlow Production Deployment Guide

This document provides deployment guidelines, system configuration templates, and operational runbooks for running TaskFlow in production environments.

---

## 1. System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **CPU** | 1 vCPU | 2+ vCPUs |
| **RAM** | 1 GB | 2–4 GB |
| **Disk** | 10 GB SSD | 25+ GB NVMe |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 | Ubuntu 24.04 LTS |
| **Python** | 3.11+ | 3.12+ |
| **Node.js** | 18.x LTS | 20.x LTS |

---

## 2. Architecture Overview

```
                      Internet
                         │
                         ▼
               ┌───────────────────┐
               │   Nginx / Caddy   │ (TLS Termination, Compression, Port 443)
               └─────────┬─────────┘
                         │
         ┌───────────────┴───────────────┐
         │ /                             │ /api/v1
         ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│  Next.js Client  │           │ FastAPI Backend  │
│  (Node Port 3000)│           │ (Uvicorn Port    │
└──────────────────┘           │      8000)       │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ SQLite / Postgres│
                               │  Database Engine │
                               └──────────────────┘
```

---

## 3. Environment Configuration

### Backend (`taskflow/.env`)

```ini
APP_NAME=TaskFlow
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=sqlite:///./taskflow.db
SECRET_KEY=generate-a-strong-random-hex-key-here-minimum-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=["https://app.taskflow.yourdomain.com"]
```

### Frontend (`client/.env.production`)

```ini
NEXT_PUBLIC_API_URL=https://app.taskflow.yourdomain.com/api/v1
```

---

## 4. Docker Compose Deployment

Save the following as `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: unless-stopped
    env_file: .env.production
    volumes:
      - taskflow-data:/app/data
    ports:
      - "127.0.0.1:8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/readyz"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://app.taskflow.yourdomain.com/api/v1
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - backend

volumes:
  taskflow-data:
```

---

## 5. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/taskflow`:

```nginx
server {
    listen 80;
    server_name app.taskflow.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.taskflow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.taskflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.taskflow.yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check Probes
    location ~ ^/(healthz|readyz|health)$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Next.js Frontend Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 6. Systemd Service Setup (Bare Metal / VPS)

### Backend Service (`/etc/systemd/system/taskflow-api.service`)

```ini
[Unit]
Description=TaskFlow FastAPI Application
After=network.target

[Service]
User=taskflow
Group=taskflow
WorkingDirectory=/opt/taskflow
Environment="PATH=/opt/taskflow/.venv/bin"
ExecStart=/opt/taskflow/.venv/bin/uvicorn taskflow.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now taskflow-api
```

---

## 7. Health Checks & Verification

Verify that your deployment is responding properly:

```bash
# 1. Check Liveness Probe
curl -i https://app.taskflow.yourdomain.com/healthz
# Expected: HTTP 200 {"status": "pass", "service": "taskflow-api", ...}

# 2. Check Database Readiness Probe
curl -i https://app.taskflow.yourdomain.com/readyz
# Expected: HTTP 200 {"status": "pass", "database": "connected", ...}
```
