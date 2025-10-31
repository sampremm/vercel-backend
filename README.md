# Vercel Backend

## Overview
A small backend suite to build, store and serve static front-end projects using AWS. This repo contains three services working together to clone, build, upload, and serve static sites:

- api-server — Accepts project requests and queues builder tasks (ECS).
- Build-Server — Clones a repo, runs the build inside the builder image, and uploads artifacts to S3.
- S3-reverse-proxy — Simple Express proxy that serves S3-hosted outputs at /:projectSlug.

## Repository layout
- api-server/
  - index.js
  - package.json
  - .env
- Build-Server/
  - script.js
  - Dockerfile
  - main.sh
  - package.json
  - .env
- S3-reverse-proxy/
  - index.js
  - package.json
  - .env

## Key behaviors
- Builder detects common frameworks (Vite, Next, CRA) and runs the appropriate build command.
- Build artifacts are uploaded to S3 under __outputs/<PROJECT_ID>.
- Reverse proxy rewrites incoming /:projectSlug requests to S3 path /__outputs/:projectSlug/... and serves index.html for root requests.
- API server triggers ECS RunTask with overrides to start the builder container.

## Prerequisites
- Node.js (>= 18 recommended)
- npm
- Docker (for building the builder image and running locally / ECS)
- AWS account + credentials (IAM user/role with S3 and ECS permissions)

## Environment variables
Each service reads a local `.env`. Example important variables:

Build-Server/.env
- AWS_REGION (default ap-south-1)
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- PROJECT_ID (for local testing; in ECS this is passed as override)
- BUCKET (optional, default: vercel-project-clone)

api-server/.env
- API_PORT (default 9000)
- BASE_URL (reverse proxy base, default http://localhost:8000)
- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- ECS_CLUSTER_ARN
- ECS_TASK_ARN
- SUBNET_IDS (comma separated)
- SECURITY_GROUP_ID

S3-reverse-proxy/.env
- PROXY_PORT (default 8000)
- S3_BASE (S3 base URL, default points at vercel-project-clone bucket)

Notes:
- Ensure `require('dotenv').config()` is present at the top of service entry files so local `.env` values are loaded.
- This repo uses CommonJS (`require`). If you prefer ES modules, add `"type": "module"` to package.json and convert imports.

## Quick start (local)
1. Install dependencies for each service:
   - cd api-server && npm install
   - cd ../Build-Server && npm install
   - cd ../S3-reverse-proxy && npm install

2. Populate `.env` files with the required variables.

3. Run services:
- Reverse proxy (serves artifacts from S3):
  - cd S3-reverse-proxy
  - node index.js
- API server (queues builder tasks):
  - cd api-server
  - node index.js
- Run builder locally (for testing):
  - cd Build-Server
  - node script.js

## Docker / ECS
- Build the builder image:
  - docker build -t builder-img Build-Server
- Push to ECR and reference the image in your ECS task definition.
- api-server triggers ECS RunTask with environment overrides (PROJECT_ID, GIT_REPOSITORY__URL, S3_BASE). Ensure ECS tasks/containers have either AWS credentials or an appropriate IAM role.

## Troubleshooting
- "Missing required environment variables" — ensure `.env` values are present and loaded before the script runs.
- CommonJS vs ESM — keep imports consistent with package.json ("type": "module" absent means CommonJS).
- If builder fails to upload: verify S3 bucket name, region, and IAM permissions.

## Security
- Never commit real AWS credentials. Use IAM roles in production, or secrets managers.
- Sanitize logs before sharing.

## Contact / Help
Open an issue with logs and sanitized environment details if you need help.




