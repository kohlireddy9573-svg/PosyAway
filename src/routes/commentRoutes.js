import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as commentController from '../controllers/commentController.js';

const router = Router();
router.use(requireAuth);

router.get('/:postId', commentController.list);
router.post('/:postId', commentController.create);
router.put('/:commentId', commentController.update);
router.delete('/:commentId', commentController.remove);

export default router;