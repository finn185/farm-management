import { Router } from 'express';
import { BatchesController } from './batches.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new BatchesController();

// Áp dụng optionalAuthToken để ghi nhận thông tin kỹ sư/người vận hành thực hiện
router.use(optionalAuthToken);

// Helper endpoints cho dropdown & sơ đồ phân khu thực địa
router.get('/cultivars', (req, res, next) => controller.getCultivars(req, res, next));
router.get('/reservoirs', (req, res, next) => controller.getReservoirs(req, res, next));
router.get('/zones', (req, res, next) => controller.getZones(req, res, next));

// Lô canh tác (Batches)
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));
router.post('/', (req, res, next) => controller.create(req, res, next));
router.put('/:id', (req, res, next) => controller.update(req, res, next));
router.patch('/:id/stage', (req, res, next) => controller.advanceStage(req, res, next));
router.patch('/:id/status', (req, res, next) => controller.updateStatus(req, res, next));
router.post('/:id/observations', (req, res, next) => controller.addObservation(req, res, next));
router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

export default router;
