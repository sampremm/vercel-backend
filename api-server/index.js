import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import projectRoutes from './src/routes/projectRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import { initRedisSubscriber } from './src/services/redisSubscriber.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

initRedisSubscriber(io);

io.on('connection', (socket) => {
  console.log('Socket client mapped:', socket.id);
});

app.use('/auth', authRoutes);
app.use('/project', projectRoutes);

const PORT = process.env.PORT || 9000;

httpServer.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
