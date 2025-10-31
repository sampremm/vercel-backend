// api-server.js
const express = require('express');
const { json } = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
require('dotenv').config();

const app = express();
app.use(json());

const PORT = process.env.API_PORT || 9000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000'; // points to reverse proxy
const S3_BASE = process.env.S3_BASE || 'https://vercel-project-clone.s3.ap-south-1.amazonaws.com/__outputs';

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

app.post('/project', async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug || generateSlug();

  if (!gitURL || !gitURL.startsWith('http')) {
    return res.status(400).json({ status: 'error', message: 'Invalid gitURL' });
  }

  const command = new RunTaskCommand({
    cluster: process.env.ECS_CLUSTER_ARN,
    taskDefinition: process.env.ECS_TASK_ARN,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: 'ENABLED',
        subnets: process.env.SUBNET_IDS.split(','),
        securityGroups: [process.env.SECURITY_GROUP_ID]
      }
    },
    overrides: {
      containerOverrides: [
        {
          name: 'builder-img', // ECS container name
          environment: [
            { name: 'GIT_REPOSITORY__URL', value: gitURL },
            { name: 'PROJECT_ID', value: projectSlug },
            { name: 'S3_BASE', value: S3_BASE }
          ]
        }
      ]
    }
  });

  try {
    await ecsClient.send(command);
    res.json({ status: 'queued', data: { projectSlug, url: `${BASE_URL}/${projectSlug}/index.html` } });
  } catch (error) {
    console.error('Error launching ECS task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to queue the project.' });
  }
});

app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
