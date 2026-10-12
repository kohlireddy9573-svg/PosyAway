import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as likeController from '../controllers/likeController.js';

const router = Router();
router.use(requireAuth);

router.get('/toggle/:postId', likeController.toggle);
router.get('/:postId', likeController.list);
router.post('/toggle/:postId', likeController.toggle);

export default router;