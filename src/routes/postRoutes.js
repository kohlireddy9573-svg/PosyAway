import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadPostMedia } from '../middleware/upload.js';
import * as postController from '../controllers/postController.js';

const router = Router();
router.use(requireAuth);

router.get('/search', postController.search);
router.get('/user/:userId', postController.listByUser);
router.get('/', postController.list);
router.get('/:id', postController.get);
router.post('/', uploadPostMedia, postController.create);
router.put('/:id', uploadPostMedia, postController.update);
router.delete('/:id', postController.remove);

export default router;