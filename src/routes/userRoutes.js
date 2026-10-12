import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.post('/signup', asyncHandler(userController.signUp));
router.post('/signin', asyncHandler(userController.signIn));

export default router;