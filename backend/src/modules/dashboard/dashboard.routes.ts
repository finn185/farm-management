import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.use(optionalAuthToken);

router.get('/stats', controller.getStats);
router.get('/', controller.getStats);

export default router;
