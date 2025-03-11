# Vercel Backend

## Overview
The **Vercel Backend** project serves as the backend for the **Vercel** application. It is designed to handle deployments of front-end applications by providing secure APIs for processing, managing, and serving static assets on the cloud. This backend uses **Node.js** and **Express.js** and integrates with **AWS services** to provide a scalable and secure platform for front-end application deployment.

## Technologies Used
- **Backend**: Node.js, Express.js
- **Containerization**: Docker
- **Cloud Services**: AWS (ECS, ECR, S3)
- **Security**: AWS IAM for role-based access control
- **Deployment**: Docker, AWS ECS, and AWS S3 for static file hosting

## Features
- **Dockerized Backend**: The backend is containerized using **Docker** to ensure isolation and portability.
- **AWS Integration**:
  - Utilizes **AWS ECS** for easy deployment and scaling of backend services.
  - **AWS S3** is used to store and serve static assets (such as `index.html` and CSS/JS files).
  - **AWS ECR** is used to store Docker images securely.
- **Secure Authentication**: AWS IAM roles and policies are set up to provide secure and granular access to the required AWS services.
- **API Endpoints**: Provides API endpoints for managing deployments, file uploads, and other operations related to the front-end applications.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sampremm/vercel-backend.git
   cd vercel-backend
