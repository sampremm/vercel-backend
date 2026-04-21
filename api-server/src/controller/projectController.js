import { generateSlug } from 'random-word-slugs';
import { deployProjectToECS } from '../services/deployService.js';
import { prisma } from '../prisma/prisma.js';

export const handleProjectDeploy = async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = (slug || generateSlug()).toLowerCase();

  if (!gitURL || !gitURL.startsWith('http')) {
    return res.status(400).json({ status: 'error', message: 'Invalid gitURL' });
  }

  try {
    // Scaffold Default User if missing (since Auth implementation triggers next)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Admin', email: 'admin@vercel.clone', password: 'hash' }
      });
    }

    const project = await prisma.project.create({
      data: {
        slug: projectSlug,
        repositoryUrl: gitURL,
        framework: 'pending',
        userId: user.id
      }
    });

    const build = await prisma.build.create({
      data: {
        status: 'PENDING',
        projectId: project.id
      }
    });

    await deployProjectToECS(gitURL, projectSlug, build.id);
    
    const BASE_URL = process.env.BASE_URL || `http://${projectSlug}.localhost:8000`;
    res.json({ status: 'queued', data: { projectSlug, buildId: build.id, url: BASE_URL } });
  } catch (error) {
    console.error('Error launching ECS task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to queue the project.' });
  }
};
