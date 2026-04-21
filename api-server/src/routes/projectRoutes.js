import { Router } from 'express';
import { handleProjectDeploy } from '../controller/projectController.js';
import { requireAuth } from './authMiddleware.js';

const router = Router();

router.post('/', requireAuth, handleProjectDeploy);

export default router;
