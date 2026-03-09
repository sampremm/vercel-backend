# Vercel Clone — Automated Deployment Pipeline

A self-hosted deployment platform that replicates core Vercel CI/CD behavior. Submit a GitHub repository URL via API, and the system clones it, auto-detects the frontend framework, builds it inside an isolated AWS ECS container, uploads artifacts to S3, and serves the output through a reverse proxy — without any manual intervention.

---

## Architecture

```
                    ┌──────────────────────────────────────────┐
                    │           API SERVER  :9000               │
                    │   POST /project { gitUrl }                │
                    └──────────────────┬───────────────────────┘
                                       │
                             ECS RunTask (env overrides)
                             PROJECT_ID, GIT_REPOSITORY__URL
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │       BUILD SERVER (ECS Container)        │
                    │                                          │
                    │  main.sh:                                │
                    │    1. Validate GIT_REPOSITORY__URL        │
                    │    2. rm -rf /home/app/output            │
                    │    3. git clone → /home/app/output       │
                    │    4. exec node script.js                │
                    │                                          │
                    │  script.js:                              │
                    │    5. Detect framework by config file:   │
                    │       vite.config.js → vite build        │
                    │         --base=/<PROJECT_ID>/            │
                    │       next.config.js → npm run build     │
                    │       react-scripts  → npm run build     │
                    │    6. npm install && <build command>     │
                    │    7. Detect output dir:                 │
                    │       dist → build → .next (in order)   │
                    │    8. Upload all files to S3             │
                    │       __outputs/<PROJECT_ID>/            │
                    │       (with correct MIME types)          │
                    │    9. Container exits → ECS tears down   │
                    └──────────────────┬───────────────────────┘
                                       │
                               Upload artifacts
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │                AWS S3                     │
                    │  __outputs/<PROJECT_ID>/index.html       │
                    │  __outputs/<PROJECT_ID>/assets/main.js   │
                    │  __outputs/<PROJECT_ID>/assets/...       │
                    └──────────────────┬───────────────────────┘
                                       │
                              Path-based routing
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │       S3 REVERSE PROXY  :8000             │
                    │                                          │
                    │  /:projectSlug/*                         │
                    │    → __outputs/:projectSlug/...          │
                    │  / (root) → serves index.html            │
                    │  S3 bucket stays private                 │
                    └──────────────────────────────────────────┘
```

---

## Services

### 1. `api-server` — Port 9000
- Accepts `POST /project` with a GitHub repo URL
- Generates a unique `PROJECT_ID`
- Triggers **AWS ECS RunTask** with container environment overrides:
  - `PROJECT_ID` — unique deployment identifier
  - `GIT_REPOSITORY__URL` — repo to clone and build
  - `S3_BASE` — target S3 bucket
- Returns the project URL pointing at the reverse proxy

### 2. `Build-Server` — Runs inside ECS

**`main.sh`** (entry point, called by Docker):
- Validates `GIT_REPOSITORY__URL` is set — exits with error if missing
- Wipes `/home/app/output` for a clean build environment
- `git clone`s the target repo into `/home/app/output`
- Hands off to `script.js` via `exec node script.js`

**`script.js`** (build + upload):
- **Framework detection** by inspecting config files:
  - `vite.config.js` present → `npx vite build --base=/<PROJECT_ID>/`
  - `next.config.js` present → `npm run build`
  - `react-scripts` present → `npm run build`
  - Fallback → `npm run build`
- Runs `npm install && <detected build command>`
- **Output directory detection** — checks in order: `dist` → `build` → `.next`
- Recursively walks the output directory and uploads every file to S3 under `__outputs/<PROJECT_ID>/` with correct MIME types via `mime-types`
- Container exits on completion — ECS tears it down automatically

> **Why `--base=/<PROJECT_ID>/` for Vite?**
> Vite SPAs use absolute asset paths by default (`/assets/main.js`). When served under a subpath like `/<PROJECT_ID>/`, those paths break. Setting `--base` rewrites all asset URLs to `/<PROJECT_ID>/assets/main.js` — making the deployed app work correctly through the reverse proxy.

### 3. `s3-reverse-proxy` — Port 8000
- Intercepts `/:projectSlug` requests
- Rewrites internally to `__outputs/:projectSlug/...` on S3
- Serves `index.html` for root requests — SPA client-side routing works out of the box
- S3 bucket stays **fully private** — no public access policy needed

---

## Repository Layout

```
vercel-backend/
├── api-server/
│   ├── index.js          # Express API — accepts deploy requests, triggers ECS RunTask
│   ├── package.json
│   └── .env
├── Build-Server/
│   ├── main.sh           # Validates env, clones repo, calls script.js
│   ├── script.js         # Framework detection, build execution, S3 upload
│   ├── Dockerfile        # Builder image — pushed to ECR, run by ECS
│   ├── package.json
│   └── .env
└── S3-reverse-proxy/
    ├── index.js          # Rewrites /:slug → S3 __outputs/:slug
    ├── package.json
    └── .env
```

---

## Key Design Decisions

### Why ECS RunTask with env overrides instead of a persistent worker?
Each deployment gets its own **fresh ECS container** spun up on demand and torn down on completion:
- Complete build isolation — no shared filesystem between deploys
- A broken build cannot affect other running containers
- No idle container consuming resources between deployments
- `PROJECT_ID` and `GIT_REPOSITORY__URL` injected as ECS env overrides at runtime — the same Docker image handles every project

### Why detect framework by config file, not `package.json` scripts?
Checking for `vite.config.js`, `next.config.js`, etc. is more reliable than inspecting script names — different projects name their scripts differently, config files are canonical identifiers.

### Why `--base=/<PROJECT_ID>/` for Vite specifically?
Vite builds use absolute asset paths. When proxied under a subpath, assets 404 without the base override. Next.js and CRA handle this differently at runtime so they don't need it.

### Why check `dist` → `build` → `.next` in that order?
Each framework outputs to a different directory:
- Vite → `dist`
- CRA → `build`
- Next.js → `.next`

Checking in order of most common first makes the detection fast and deterministic.

### Why a reverse proxy instead of public S3 URLs?
- S3 bucket stays private — no public bucket policy needed
- Clean URLs: `/:projectSlug` instead of long S3 object URLs
- Root requests automatically serve `index.html` — SPA routing works

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Server | Node.js, Express.js |
| Build Execution | AWS ECS (Fargate), Docker |
| Image Registry | AWS ECR |
| Build Orchestration | Bash (`main.sh`) + Node.js (`script.js`) |
| S3 Upload | AWS SDK v3 (`@aws-sdk/client-s3`) |
| MIME Detection | `mime-types` |
| Artifact Storage | AWS S3 |
| Reverse Proxy | Node.js, Express.js |

---

## Prerequisites

- Node.js >= 18
- npm
- Docker
- AWS account with IAM permissions for S3 and ECS

---

## Environment Variables

**`api-server/.env`**
```env
API_PORT=9000
BASE_URL=http://localhost:8000
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
ECS_CLUSTER_ARN=arn:aws:ecs:ap-south-1:xxxx:cluster/your-cluster
ECS_TASK_ARN=arn:aws:ecs:ap-south-1:xxxx:task-definition/your-task
SUBNET_IDS=subnet-xxx,subnet-yyy
SECURITY_GROUP_ID=sg-xxxxxx
```

**`Build-Server/.env`**
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
PROJECT_ID=test-project-123
BUCKET=vercel-project-clone
```

**`S3-reverse-proxy/.env`**
```env
PROXY_PORT=8000
S3_BASE=https://vercel-project-clone.s3.ap-south-1.amazonaws.com
```

> ⚠️ Never commit real AWS credentials. Use IAM roles for ECS tasks in production.

---

## Quick Start (Local)

```bash
# Install dependencies
cd api-server && npm install
cd ../Build-Server && npm install
cd ../S3-reverse-proxy && npm install

# Terminal 1 — Reverse Proxy
cd S3-reverse-proxy && node index.js

# Terminal 2 — API Server
cd api-server && node index.js

# Terminal 3 — Test builder locally
cd Build-Server && node script.js
```

**Trigger a deployment:**
```bash
curl -X POST http://localhost:9000/project \
  -H "Content-Type: application/json" \
  -d '{ "gitUrl": "https://github.com/your-username/your-react-app" }'
```

**View deployed output:**
```
http://localhost:8000/<projectSlug>/
```

---

## Docker / ECS Deployment

```bash
# Build the builder image
docker build -t builder-img Build-Server

# Tag for ECR
docker tag builder-img <account_id>.dkr.ecr.ap-south-1.amazonaws.com/builder-img:latest

# Authenticate to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  <account_id>.dkr.ecr.ap-south-1.amazonaws.com

# Push
docker push <account_id>.dkr.ecr.ap-south-1.amazonaws.com/builder-img:latest
```

Reference this image in your ECS task definition. `api-server` calls `RunTask` with `PROJECT_ID` and `GIT_REPOSITORY__URL` as environment overrides per deployment.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `Missing required environment variables` | Check `.env` is populated and `require('dotenv').config()` is at top of entry file |
| `No build output found` | Ensure the repo outputs to `dist`, `build`, or `.next`. Custom output dirs are not yet supported |
| Builder fails to upload to S3 | Verify bucket name, region, and IAM permissions on ECS task role |
| Vite assets 404 after deploy | Confirm `detectBuildCommand` is returning `vite build --base=/<PROJECT_ID>/` |
| ECS task won't start | Verify `ECS_CLUSTER_ARN`, `ECS_TASK_ARN`, subnet IDs, and security group in `api-server/.env` |
| CommonJS vs ESM errors | Repo uses CommonJS (`require`). Do not add `"type": "module"` without converting all imports |

---

## What I'd Add Next

- **Build status endpoint** — `GET /project/:id/status` to poll QUEUED → BUILDING → DONE
- **WebSocket log streaming** — pipe `execSync` stdout from ECS container to client in real time
- **GitHub webhook** — auto-deploy on `git push` to main branch
- **Terraform IaC** — provision ECS cluster, ECR repo, S3 bucket, IAM roles in one command
- **Custom domain support** — map `projectSlug` to user subdomain via Route53

---

## Author

**Thalla Sam Prem Kumar**
[github.com/sampremm](https://github.com/sampremm) · [linkedin.com/in/samprem1](https://linkedin.com/in/samprem1) · [Portfolio](https://sam-portfolio-ashy.vercel.app/)
