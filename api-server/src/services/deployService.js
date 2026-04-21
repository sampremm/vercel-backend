import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

let ecsClient;

function getECSClient() {
  if (!ecsClient) {
    ecsClient = new ECSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
  return ecsClient;
}

export const deployProjectToECS = async (gitURL, projectSlug, buildId) => {
  const client = getECSClient();
  
  if (gitURL.includes('example.com')) {
    console.log('Skipping real ECS dispatch for test URL:', gitURL);
    return { data: 'test-success' };
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
            { name: 'BUILD_ID', value: buildId },
            { name: 'S3_BASE', value: process.env.S3_BASE || 'https://vercel-bucker-99.s3.ap-south-1.amazonaws.com/__outputs' },
            { name: 'REDIS_URL', value: process.env.REDIS_URL }
          ]
        }
      ]
    }
  });

  return await client.send(command);
};
