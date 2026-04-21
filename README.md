# Vercel-Clone Platform: Enterprise Architecture

## Executive Summary
This project is an enterprise-ready, scalable Cloud Platform-as-a-Service (PaaS) heavily inspired by Vercel. It automates the CI/CD pipeline of static web frameworks (React, Vite, Next.js). It features automated Git cloning, isolated Docker compilation, real-time WebSocket log streaming, stateful PostgreSQL database tracking, and Subdomain-based routing proxy network.

---

## 🏗️ System Architecture

The ecosystem relies on an event-driven, decoupled microservice architecture:

```mermaid
graph TD
    Client((Frontend Dashboard))

    subgraph Platform Edge
        Proxy[S3 Reverse Proxy]
        API[Core API Server]
    end

    subgraph AWS Cloud Infrastructure
        ECS[AWS ECS / Fargate]
        S3[(AWS S3 Bucket)]
    end
    
    subgraph Persistent Storage
        Redis[(Redis Streams)]
        DB[(PostgreSQL)]
    end

    Client -- "1. POST /project (JWT)" --> API
    API -- "2. Initialize Models" --> DB
    API -- "3. Deploy Task" --> ECS
    
    ECS -- "4. Publishes Logs" --> Redis
    Redis -- "5. Consumes Streams" --> API
    API -- "6. Socket.IO Data" --> Client
    
    ECS -- "7. Uploads dist/" --> S3
    
    Client -- "GET project.localhost" --> Proxy
    Proxy -- "Fetches Artifacts" --> S3
```

---

## 🧩 Microservices Dissection

### 1. Core API Server (`api-server`)
The brain of the operation built on **Node.js, Express, and ES Modules**. 
- **State Management**: Heavily leverages `Prisma` to bind deployment tickets directly against a Neon Serverless PostgreSQL instance. 
- **Security**: Features deeply nested JWT interceptors (`AuthMiddleware`). Protects high-cost AWS billing routes by authenticating users via `bcrypt` hashing on the `/auth/signup` routes.
- **ECS Handlers**: Asynchronously queues serverless Fargate tasks using the `@aws-sdk/client-ecs` infrastructure.
- **WebSocket Gateway**: Initiates an `ioredis` subscriber network. Instantly fans out incoming terminal data to `Socket.IO` connected dashboard UI's enabling live build tracking!

### 2. The Build Engine (`Build-Server`)
A headless, standalone Node handler structured inside an isolated Docker Image triggered dynamically.
- **Adaptive Execution**: Evaluates target `package.json` payloads automatically determining if it's compiling a Vite, React-CRA, or Next.js static architecture.
- **Pub/Sub Telemetry**: Doesn't block standard output. Employs `exec` Child Processes mapped seamlessly to an `ioredis` Publisher. Every terminal node (`stdout`/`stderr`) is instantly fired up the network topology.
- **S3 Aggregator**: Once compiled, it seamlessly leverages `mime-types` and the `@aws-sdk/client-s3` suite to synchronize the production-ready `dist/` binary output to specific Cloud object layers.

### 3. Edge Reverse Proxy (`S3-reverse-proxy`)
A dynamic traffic gateway engineered to mimic Vercel's global edge network.
- **Subdomain Routing Verification**: Analyzes incoming `Host` headers cleanly parsing prefixes out (`e.g., test-proj.localhost:8000`).
- **Path Rewriting Intelligence**: Seamlessly strips identical duplicated artifact trailing routes, safely merging requests down into absolute S3 AWS Object keys (`/__outputs/test-proj/assets/index.js`). 

---

## 🗄️ Database Schema & Object Models

Powered by Prisma mapped to **PostgreSQL**.
```mermaid
erDiagram
    USER {
        String id PK
        String email UK
        String password
    }
    PROJECT {
        String id PK
        String slug UK
        String repositoryUrl
        String framework
        String userId FK
    }
    BUILD {
        String id PK
        Enum status
        String projectId FK
    }
    DEPLOYMENT {
        String id PK
        String s3Path
        String url
        String projectId FK
    }
    
    USER ||--o{ PROJECT : Creates
    PROJECT ||--o{ BUILD : Executes
    BUILD ||--o| DEPLOYMENT : Spawns
```

---

## ⚙️ How To Run Locally

### 1. Environmental Blueprint
Ensure you possess keys for AWS, Redis, and a SQL Database. Populate a `.env` in all three microservices identically.

**`api-server/.env`**:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
ECS_CLUSTER_ARN=arn:aws:ecs...
ECS_TASK_ARN=arn:aws:ecs...
DATABASE_URL=postgresql://user:pass@pool.region.aws.neon.tech/db
REDIS_URL=redis://default:pass@redis-host:11890
JWT_SECRET=super-secret
PORT=9000
```
*(Similarly populate the internal variables for the `Build-Server` and `S3-reverse-proxy` namespaces mapped out)*

### 2. Postman Bootstrapping & Deploying
We have engineered a **`Vercel_Clone_Postman_Collection.json`** located natively inside the `api-server` directory.
1. Run `npx prisma generate` in `api-server` and start all node `index.js` files globally.
2. Drag and drop the `json` file directly into your Postman Console.
3. Fire the `[1. Signup]` routine. Copy your issued JWT Bearer token natively.
4. Execute `[3. Deploy Project]`, insert your token in your "Authorization" layer, inject your GitHub repository inside the Request Body, and watch the platform orchestrate the physical deployment across ECS, tracking updates globally!

## 🔐 Next.js Notice
If passing a Next.js framework repository down the CI pipeline natively, ensure `output: "export"` is set in its specific `next.config.js`. S3 behaves strictly as static storage capabilities and does not evaluate physical Node SSR logic naturally!
