import { Router } from 'express';
import { AIController } from './ai.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AIController();

router.use(optionalAuthToken);

// Kiểm tra sức khỏe kết nối AI Microservice
router.get('/health', (req, res, next) => controller.getHealth(req, res, next));

// Dự báo năng suất tự động theo ID Lô canh tác
router.post('/batches/:id/predict', (req, res, next) => controller.predictBatchYield(req, res, next));
router.get('/batches/:id/predict', (req, res, next) => controller.predictBatchYield(req, res, next));

// Quét bất thường bồn chứa theo ID Bồn (tự sinh Alert trong DB nếu có sự cố)
router.post('/reservoirs/:id/detect-anomaly', (req, res, next) => controller.checkReservoirAnomaly(req, res, next));
router.get('/reservoirs/:id/detect-anomaly', (req, res, next) => controller.checkReservoirAnomaly(req, res, next));

// Quét bất thường trực tiếp với bộ 3 thông số pH, EC, Temp
router.post('/detect-anomaly', (req, res, next) => controller.detectAnomalyDirect(req, res, next));

export default router;
