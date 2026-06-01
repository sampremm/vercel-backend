# ⚡ Custom Vercel PaaS Platform: Enterprise CI/CD Pipeline

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.x-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![AWS ECS](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900.svg?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/ecs/)
[![AWS S3](https://img.shields.io/badge/AWS-S3%20Bucket-569A31.svg?style=flat-square&logo=amazon-s3)](https://aws.amazon.com/s3/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Pub%2FSub-DC382D.svg?style=flat-square&logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

## 📝 Executive Overview

This repository hosts a decoupled, event-driven, and enterprise-ready **Cloud Platform-as-a-Service (PaaS)** heavily inspired by the Vercel ecosystem. It automates the complete CI/CD lifecycle of modern static frontends (Vite, React, Next.js static exports).

With a simple git repository submission, the system provisions an isolated Docker container on AWS ECS Fargate, executes live package compilation, streams compiler console outputs dynamically over Redis Pub/Sub back to the API Gateway, and distributes the final binaries onto AWS S3. Projects are instantly accessible via custom project subdomains (e.g., `http://{slug}.localhost:8000`) routed dynamically through an S3 Edge Reverse Proxy.

---

## 🏗️ System Architecture

The ecosystem leverages an asynchronous microservice architecture, connecting AWS resources, Redis Pub/Sub, PostgreSQL state tracking, and a real-time React terminal.

### Component Relationship Flow
```mermaid
graph TD
    Client((React Dashboard))

    subgraph Platform Edge
        Proxy[S3 Reverse Proxy]
        API[Core API Server]
    end

    subgraph AWS Cloud Infrastructure
        ECS[AWS ECS / Fargate]
        S3[(AWS S3 Bucket)]
    end
    
    subgraph Persistent Storage
        Redis[(Redis Pub/Sub)]
        DB[(PostgreSQL)]
    end

    Client -- "1. POST /project (JWT)" --> API
    API -- "2. Initialize Models" --> DB
    API -- "3. Deploy Task" --> ECS
    
    ECS -- "4. Publishes Logs & Status" --> Redis
    Redis -- "5. Subscribes to channels" --> API
    API -- "6. Socket.IO Data" --> Client
    
    ECS -- "7. Uploads dist/" --> S3
    
    Client -- "GET project.localhost" --> Proxy
    Proxy -- "Fetches Artifacts" --> S3
```

### Decoupled Runtime Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Dashboard (Port 5173)
    participant API as Core API Server (Port 9000)
    participant DB as PostgreSQL (Neon/Prisma)
    participant ECS as AWS ECS Fargate (Docker)
    participant Redis as Redis Pub/Sub
    participant S3 as AWS S3 Bucket
    participant Proxy as S3 Edge Reverse Proxy (Port 8000)

    Client->>API: 1. POST /project/ (Git URL, Slug, JWT)
    API->>DB: 2. Upsert Project & Create PENDING Build
    API->>ECS: 3. Trigger Fargate Task (gitURL, slug, buildId)
    activate ECS
    ECS->>Redis: 4. Publish "status: RUNNING"
    Redis->>API: 5. Catch RUNNING status & update DB
    API->>Client: 6. Broadcast state change via Socket.IO
    
    Note over ECS: Clone Git Repo & Run Compilations
    loop Telemetry Streaming
        ECS->>Redis: 7. Publish logs to "logs:buildId" channel
        Redis->>API: 8. Catch "logs:buildId" message
        API->>Client: 9. Emit log data in real-time to Dashboard
    end
    
    ECS->>S3: 10. Upload built artifacts (/dist or /build)
    ECS->>Redis: 11. Publish "status: SUCCESS"
    deactivate ECS
    
    Redis->>API: 12. Catch SUCCESS status & update DB
    API->>DB: 13. Create Deployment Record
    API->>Client: 14. Broadcast SUCCESS & Subdomain URL
    
    Client->>Proxy: 15. GET http://{slug}.localhost:8000/
    Proxy->>S3: 16. Fetch file matching S3 target path
    S3-->>Proxy: 17. Return asset with correct Content-Type
    Proxy-->>Client: 18. Stream response directly to Client
```

---

## 🧩 Microservices Breakdown

The codebase is cleanly separated into four isolated, specialized microservices:

### 1. The Frontend Dashboard (`frontend`)
An elite, fully-responsive dashboard engineered using **React + Vite + TailwindCSS v4**.
*   **Real-time macOS Console Terminal**: Features a custom-built Socket.io logger component (`TerminalLogs.jsx`) which hooks into the live build stream of the container and handles smooth auto-scrolling log render cascades.
*   **Glassmorphic Security & UX**: Leverages an elegant dark mode palette with Axios Interceptors persisting security tokens securely via global `AuthContext` contexts.
*   **Interactive Controls**: Employs `lucide-react` icons and a intuitive interface to easily review active deployments and trigger compilation queues.

### 2. Core API Server (`api-server`)
The orchestrator of the ecosystem built on **Node.js, Express, and ES Modules**.
*   **Database Management**: Connects natively to a Neon PostgreSQL instance via **Prisma ORM** for transactional safety, database migrations, and structured relationships.
*   **Security & Encryption**: Features an `authMiddleware` JWT verification guard and uses `bcrypt` hashing algorithms to securely manage accounts.
*   **AWS Fargate Integrations**: Asynchronously queues containerized serverless tasks on AWS ECS Fargate via `@aws-sdk/client-ecs` with environmental variable overrides.
*   **WebSocket Gateway**: Establishes a Socket.IO connection alongside an `ioredis` subscriber network to instantly catch pub/sub logs and fan them out to listening clients.

### 3. The Build Engine (`Build-Server`)
A standalone Node.js compilation script executed inside an isolated **Docker Container** on AWS Fargate.
*   **Shell Bootstrapping**: A robust bash script (`main.sh`) sanitizes working outputs, parses the incoming Git URL, and clones repositories cleanly to working volumes.
*   **Intelligent Build Detection**: Evaluates project `package.json` configurations dynamically to detect frameworks (Vite-based apps, Create React App, Next.js static files) and automatically selects the optimal build script (`npx vite build`, `npm run build`, etc.).
*   **Redis Log Streaming**: Captures `stdout` and `stderr` events using Node `child_process` hooks, encoding them to string lines and publishing them instantly to Redis.
*   **S3 Aggregator**: Synchronizes build output folders with AWS S3 under `__outputs/{project-slug}/`, scanning mime-types using `mime-types` modules to guarantee asset serving safety.

### 4. S3 Edge Reverse Proxy (`S3-reverse-proxy`)
A high-performance routing module engineered to mimic Vercel's global edge routing capabilities.
*   **Subdomain Verification**: Inspects host headers dynamically, slicing out subdomains (e.g. `test-app` from `test-app.localhost:8000`) to resolve S3 key directories.
*   **Fallback Path Routing**: Gracefully falls back to folder path lookups (`localhost:8000/test-app/...`) to guarantee compatibility across environments.
*   **Dynamic MIME Rewriting**: Fetches binary buffers straight from S3 keys (routing back to `/index.html` on default directories) and streams them back with correct HTTP headers.

---

## 🗄️ Database Schema & Object Models

Powered by Prisma mapped directly against **PostgreSQL**.

```mermaid
erDiagram
    User ||--o{ Project : owns
    Project ||--o{ Build : executes
    Project ||--o{ Deployment : deploys

    User {
        String id PK "UUID"
        String name "User's display name"
        String email UK "Unique profile email"
        String password "Hashed with bcrypt"
        DateTime createdAt
        DateTime updatedAt
    }

    Project {
        String id PK "UUID"
        String slug UK "Unique subdomain identifier"
        String repositoryUrl "Target git branch URL"
        String framework "Framework override type"
        String userId FK "Author of the project"
        DateTime createdAt
        DateTime updatedAt
    }

    Build {
        String id PK "UUID"
        BuildStatus status "PENDING | RUNNING | SUCCESS | FAILED"
        String logs "Optional raw text log cache"
        String projectId FK "Build mapping"
        DateTime createdAt
        DateTime updatedAt
    }

    Deployment {
        String id PK "UUID"
        String buildId "Related compile job"
        String s3Path "S3 target prefix folder"
        String url "Proxy route URL"
        String projectId FK "Parent project reference"
        DateTime createdAt
    }
```

---

## ⚙️ How To Run Locally

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   Node.js (v20+)
*   Docker & Docker Desktop
*   A running Redis Server (or a Redis Cloud instance)
*   A PostgreSQL Database (e.g., Neon Tech)
*   An AWS Account with access to S3, ECS, and VPC networking

### 2. Environment Variables Settings

Create a `.env` file in each target microservice directory matching the variables below:

#### 📂 `api-server/.env`
```env
PORT=9000
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
REDIS_URL="redis://default:password@host:port"
JWT_SECRET="your-jwt-signing-secret"

# AWS Fargate Orchestration Configuration
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="nGsm..."
ECS_CLUSTER_ARN="arn:aws:ecs:ap-south-1:XXXXXX:cluster/your-cluster"
ECS_TASK_ARN="arn:aws:ecs:ap-south-1:XXXXXX:task-definition/your-task:1"
SUBNET_IDS="subnet-xxxxxx,subnet-yyyyyy"
SECURITY_GROUP_ID="sg-xxxxxx"
S3_BASE="https://your-bucket-name.s3.ap-south-1.amazonaws.com/__outputs"
```

#### 📂 `Build-Server/.env`
```env
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="nGsm..."
PROJECT_ID="testproject"
BUCKET="your-bucket-name"
```

#### 📂 `S3-reverse-proxy/.env`
```env
PORT=8000
S3_BASE="https://your-bucket-name.s3.ap-south-1.amazonaws.com/__outputs"
```

---

### 3. Bootstrap & Launch

#### Step A: Database Preparation
Initialize your Prisma Client and apply migrations to your PostgreSQL Database:
```bash
cd api-server
npx prisma db push # Push schemas to Neon DB
npx prisma generate
```

#### Step B: Build and Register the Docker Image
You must build the compiler engine Docker image and push it to AWS ECR (or your preferred registry) so that AWS ECS Fargate can pull it:
```bash
cd Build-Server

# 1. Build the local image
docker build -t vercel-builder-image .

# 2. Log in to AWS ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com

# 3. Tag and push to ECR repository
docker tag vercel-builder-image:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/vercel-builder-image:latest
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/vercel-builder-image:latest
```
> [!IMPORTANT]
> Ensure the Task Definition specified by `ECS_TASK_ARN` inside `api-server/.env` is configured to use the uploaded Docker image, and that the container name matches `builder-image-task` to allow the environment variables override to map successfully.

#### Step C: Running Microservices
Open three separate terminal windows to spin up the local mesh network:

##### Terminal 1: Core API Server
```bash
cd api-server
npm install
node index.js
```

##### Terminal 2: Edge Reverse Proxy
```bash
cd S3-reverse-proxy
npm install
node index.js
```

##### Terminal 3: React Dashboard
```bash
cd frontend
npm install
npm run dev
```

Open your browser to `http://localhost:5173` to experience the complete platform dashboard. Register an account, log in, paste any public React Git Repository URL (e.g., `https://github.com/reactjs/react.dev`), trigger a deployment, and watch the real-time terminal compile, upload to S3, and serve it directly from the local proxy subdomain!

---

## 🔐 Next.js Notice

If you deploy Next.js frameworks, ensure that **static exports** are enabled inside your configurations to compile static pages:

```javascript
// next.config.js
module.exports = {
  output: 'export',
}
```

Since the Edge Reverse Proxy fetches assets out of a flat AWS S3 bucket, standard Node.js server-side features (like SSR, Server Actions, or dynamic API routes) are not supported. Only full static exports are hosted.
