import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// Public auth endpoints
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Protected profile & security endpoints
router.get('/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));
router.put('/profile', authenticateToken, (req, res, next) => authController.updateProfile(req, res, next));
router.post('/change-password', authenticateToken, (req, res, next) => authController.changePassword(req, res, next));

export default router;
