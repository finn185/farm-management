import { Router } from 'express';
import { SensorsController } from './sensors.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SensorsController();

router.use(optionalAuthToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/telemetry', controller.ingestTelemetry);

export default router;
