import Redis from 'ioredis';
import { prisma } from '../prisma/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

// Ensure we have a valid Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const subscriber = new Redis(redisUrl);
let ioInstance;

export const initRedisSubscriber = (io) => {
  ioInstance = io;

  subscriber.psubscribe('status:*', 'logs:*');

  subscriber.on('pmessage', async (pattern, channel, message) => {
    try {
      const data = JSON.parse(message);
      
      // Fanout to WebSocket clients
      ioInstance.emit(channel, data);

      if (channel.startsWith('status:')) {
         const buildId = channel.split(':')[1];
         const status = data.status;
         
         // Update DB
         if (['RUNNING', 'SUCCESS', 'FAILED'].includes(status)) {
            await prisma.build.update({
               where: { id: buildId },
               data: { status }
            });
            
            if (status === 'SUCCESS') {
               const build = await prisma.build.findUnique({ 
                 where: { id: buildId }, 
                 include: { project: true } 
               });
               if (build) {
                  await prisma.deployment.create({
                     data: {
                        buildId: build.id,
                        s3Path: `__outputs/${build.project.slug}/index.html`,
                        url: `http://${build.project.slug}.localhost:8000`,
                        projectId: build.project.id
                     }
                  });
               }
            }
         }
      }
    } catch(e) {
      console.error('Error handling redis message:', e);
    }
  });
};
