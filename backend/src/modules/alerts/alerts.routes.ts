import { Router } from 'express';
import { AlertsController } from './alerts.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AlertsController();

router.use(optionalAuthToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id/acknowledge', controller.acknowledge);
router.patch('/:id/resolve', controller.resolve);
router.delete('/:id', controller.delete);

export default router;
