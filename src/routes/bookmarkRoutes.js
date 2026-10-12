import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as bookmarkController from '../controllers/bookmarkController.js';

const router = Router();
router.use(requireAuth);

router.get('/', bookmarkController.list);
router.post('/:postId', bookmarkController.toggle);

export default router;