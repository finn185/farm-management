import { Router } from 'express';
import { SimulatorController } from './simulator.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SimulatorController();

// Giống các module khác (reservoirs, batches, alerts...): dùng optionalAuthToken
// để giao diện luôn điều khiển được kể cả khi trình duyệt đang giữ mock token.
// Bảo vệ dữ liệu thật được thực hiện bằng assertSimulatorMode() trong SimulatorService
// (tự khoá toàn bộ khi DATA_SOURCE=device).
router.use(optionalAuthToken);

router.get('/status', controller.getStatus);
router.get('/heartbeat', controller.getHeartbeat);
router.post('/start', controller.start);
router.post('/stop', controller.stop);
router.post('/step', controller.step);
router.post('/speed', controller.speed);
router.post('/scenario', controller.scenario);
router.post('/reset', controller.reset);
router.post('/grow', controller.grow);

export default router;
