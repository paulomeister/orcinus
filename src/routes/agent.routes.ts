import { Router } from 'express';
import { list } from '../controllers/agent.controller.js';

const router = Router();

router.get('/agents', list);

export default router;
