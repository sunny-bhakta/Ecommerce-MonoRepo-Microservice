# Ecommerce Microservices (NestJS + FastAPI)

Monorepo of NestJS services orchestrated via a gateway, plus a Python notification service.

## Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (for notification service)
- RabbitMQ (optional; notification service will still run without it)

## Install
```bash
npm install
```

## Run (common dev targets)
- Gateway (REST proxy): `npm run start:dev:gateway`
- Core backend services (parallel): `npm run start:dev:core`
- Individual services (examples):  
  - Auth `npm run start:dev:auth`  
  - User `npm run start:dev:user`  
  - Catalog `npm run start:dev:catalog`  
  - Order `npm run start:dev:order`  
  - Payment `npm run start:dev:payment`  
  - Inventory `npm run start:dev:inventory`  
  - Shipping `npm run start:dev:shipping`  
  - Review `npm run start:dev:review`  
  - Vendor `npm run start:dev:vendor`  
  - Analytics `npm run start:dev:analytics`  
  - Admin `npm run start:dev:admin`

### Notification service (Python / FastAPI)
```bash
cd services/notification-python
python -m venv .venv && . .venv/Scripts/activate  # on Windows; use bin/activate on *nix
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3130
```
Env vars (optional): `RABBITMQ_URL`, `EMAIL_PROVIDER_URL`, `SMS_PROVIDER_URL`.

## Folder structure (top-level)
- `apps/` — NestJS services  
  - `gateway` (API gateway)  
  - `auth`, `user`, `vendor`, `catalog`, `inventory`, `order`, `payment`, `shipping`, `review`, `search`, `analytics`, `admin`  
- `libs/` — shared code (`common`, `events`)
- `services/notification-python/` — FastAPI notification service
- `docs/` — API and orchestration notes
- `data/` — sample data (e.g., SQLite for auth)
- `tools/` — scripts (e.g., service scaffolding)

## Docs
- Gateway orchestration and endpoints: `docs/gateway-orchestration.md`
- Requirements overview: `docs/Requiremnt.md`


## Test Result In File
```
cmd.exe /d /c "cd /d c:\Users\sunnykumar.bhakta\sunny-dev\conepts\project\Ecommerce-Microservice && npm run test:catalog:helpers > test-output.txt 2>&1"
```
