import { Router } from 'express';
import { create, updateStatus, list } from '../controllers/interaction.controller';

const router = Router();

router.post('/interactions', create);
router.patch('/interactions/:id/status', updateStatus);
router.get('/interactions', list);

export default router;