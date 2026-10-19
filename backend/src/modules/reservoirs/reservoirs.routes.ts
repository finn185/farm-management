import { Router } from 'express';
import { ReservoirsController } from './reservoirs.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new ReservoirsController();

router.use(optionalAuthToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);

// Châm phân, bù nước, xả bể, ghi log
router.post('/:id/dose', controller.dose);
router.post('/:id/top-up', controller.topUp);
router.post('/:id/drain', controller.drain);
router.post('/:id/logs', controller.addLog);
router.post('/:id/measurements', controller.addLog);

export default router;
