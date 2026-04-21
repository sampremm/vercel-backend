# Vercel-Clone Platform: Enterprise Architecture

## Executive Summary
This project is an enterprise-ready, scalable Cloud Platform-as-a-Service (PaaS) heavily inspired by Vercel. It automates the CI/CD pipeline of static web frameworks (React, Vite, Next.js). It features automated Git cloning, isolated Docker compilation, real-time WebSocket log streaming, stateful PostgreSQL database tracking, Subdomain-based routing proxy network, and a premium React Frontend Dashboard.

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

### 1. The Frontend Dashboard (`frontend`)
An elite User Interface engineered using **React + Vite + TailwindCSS v4**.
- **Real-Time Terminal**: Features a deeply integrated Socket.io component (`TerminalLogs.jsx`) structurally mapped to replicate native macOS consoles tracking live build streams asynchronously.
- **Glassmorphic Security**: Leverages Axios Interceptors traversing a global `AuthContext` to persist JWT tokens logically out of standard browser constraints over a heavily dark-moded layout architecture.

### 2. Core API Server (`api-server`)
The brain of the operation built natively on **Node.js, Express, and ES Modules**. 
- **State Management**: Heavily leverages `Prisma` to bind deployment tickets logically against a Neon PostgreSQL layer using robust `upsert` queries. 
- **Security**: Features deeply nested JWT interceptors (`AuthMiddleware`). Protects high-cost AWS billing bounds securely by authenticating users via `bcrypt` hashing algorithms.
- **ECS Handlers**: Asynchronously queues containerized serverless Fargate tasks using the `@aws-sdk/client-ecs` architectures.
- **WebSocket Gateway**: Initiates an `ioredis` subscriber network. Instantly transcribes incoming terminal streams dynamically over to UI connections safely.

### 3. The Build Engine (`Build-Server`)
A headless, standalone Node script enclosed physically inside an isolated Docker Image triggered dynamically.
- **Adaptive Execution**: Evaluates target `package.json` logic asynchronously recognizing React, Next.js, and static vanilla infrastructures efficiently.
- **Pub/Sub Telemetry**: Employs `exec` Child Processes mapped gracefully to an `ioredis` Publisher. Every individual process payload (`stdout`/`stderr`) is cleanly broadcasted up the overarching pipeline naturally.
- **S3 Aggregator**: Actively syncs using robust `mime-types` implementations passing strictly compiled `/dist` folder binaries into isolated target S3 environments flawlessly.

### 4. Edge Reverse Proxy (`S3-reverse-proxy`)
A dynamic traffic evaluation module engineered to mimic true Vercel-Edge global proxy distributions natively.
- **Subdomain Verification**: Evaluates dynamic `Host` mappings cleanly slicing project structures out gracefully (`e.g., test-proj.localhost:8000`).
- **Path Routing Intelligence**: Systematically prevents routing duplicates natively and passes network logic cleanly through root absolute paths natively directly to internal Cloud AWS environments effectively.

---

## 🗄️ Database Schema & Object Models

Powered by Prisma bound mapped directly against **PostgreSQL**.
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

### 1. Environmental Specifications
Ensure you natively bind your correct AWS, Redis, and Neon SQL database constraints.

**`api-server/.env`**:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
ECS_CLUSTER_ARN=arn:aws:ecs...
ECS_TASK_ARN=arn:aws:ecs...
DATABASE_URL=postgresql://user:pass@pool.region.aws.neon.tech/db
REDIS_URL=redis://default:pass@redis-host:11890
PORT=9000
JWT_SECRET=super-secret
```
*(Duplicate core variables exactly internal to `Build-Server` and `S3-reverse-proxy` respectively!)*

### 2. Complete Bootstrapping
1. Generate Prisma Bindings inside `api-server`: `npx prisma generate`
2. Start proxy network natively on port 8000 inside `S3-reverse-proxy`: `node index.js`
3. Start backend services natively on port 9000 inside `api-server`: `node index.js`
4. Start React Frontend natively inside `frontend`: `npm run dev`
5. Map onto `http://localhost:5173` systematically and evaluate CI/CD executions!

## 🔐 Next.js Notice
If passing Next.js architectures, ensure explicitly `output: "export"` is configured tightly strictly into `next.config.js`. Basic AWS S3 buckets inherently only supply flat static object hosting architectures safely effectively meaning live node physical runtime limits aren't naturally natively supported currently!
