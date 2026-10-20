import { Router } from 'express';
import { SensorsController } from './sensors.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SensorsController();

router.use(optionalAuthToken);

router.get('/', controller.getAll);
router.post('/telemetry', controller.ingestTelemetry);
// Endpoint chuẩn cho thiết bị IoT (ESP32 / Trạm giả lập) - nhiều số đo / gói tin
router.post('/telemetry/batch', controller.ingestBatch);
router.get('/:id', controller.getById);

export default router;
