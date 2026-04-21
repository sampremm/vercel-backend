# Vercel Cone: Frontend Dashboard Architecture

A premium, React + Vite powered dashboard engineered to interface directly with the Vercel Clone CI/CD API. It provides a state-of-the-art developer experience featuring real-time Docker compilation logs via WebSockets, glassmorphic UI constraints powered by TailwindCSS v4, and persistent JWT authentication routines.

## 🚀 Key Features
- **Tailwind V4 Engine**: Powered natively by `@tailwindcss/vite` enabling hyper-fast compiling of glassmorphism variants (`backdrop-blur-xl`, deep `#000000` gradients).
- **Live Terminal Telemetry**: Uses `Socket.io` to bind dynamically against Redis publish streams—streaming Fargate build executions to the browser identically to a native macOS terminal payload.
- **Persistent Sessions**: React Context (`AuthContext.jsx`) globally intercepts `axios` logic, managing encrypted JSON Web Tokens smoothly across authentication loops.
- **Micro-Animations**: Leverages native CSS keyframes mapping hover-states directly onto `lucide-react` components.

## ⚙️ Setup Instructions
1. Navigate to the frontend directory: `cd frontend`
2. Install standard dependencies natively: `npm install`
3. Start the dev server process natively: `npm run dev`
4. Access the Premium UI securely at `http://localhost:5173`
