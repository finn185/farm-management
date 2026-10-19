import type { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { sendSuccess, sendError } from '../../utils/response';

const aiService = new AIService();

export class AIController {
  /**
   * GET /api/v1/ai/health
   */
  async getHealth(_req: Request, res: Response, next: NextFunction) {
    try {
      const health = await aiService.getHealth();
      return sendSuccess(res, health, 'Trạng thái AI Microservice');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/batches/:id/predict
   */
  async predictBatchYield(req: Request, res: Response, next: NextFunction) {
    try {
      const batchId = req.params.id;
      const overrides = req.body;
      const result = await aiService.predictBatchYield(batchId, overrides);
      return sendSuccess(res, result, 'Dự báo năng suất lô thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Lỗi xử lý dự báo', 400);
    }
  }

  /**
   * POST /api/v1/ai/reservoirs/:id/detect-anomaly
   */
  async checkReservoirAnomaly(req: Request, res: Response, next: NextFunction) {
    try {
      const reservoirId = req.params.id;
      const autoCreateAlert = req.body.autoCreateAlert !== false;
      const result = await aiService.checkReservoirAnomaly(reservoirId, autoCreateAlert);
      return sendSuccess(res, result, 'Quét bất thường bể dinh dưỡng thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Lỗi quét bất thường', 400);
    }
  }

  /**
   * POST /api/v1/ai/detect-anomaly
   */
  async detectAnomalyDirect(req: Request, res: Response, next: NextFunction) {
    try {
      const { avgPh, avgEc, avgWaterTemp, reservoirName } = req.body;
      if (avgPh === undefined || avgEc === undefined || avgWaterTemp === undefined) {
        return sendError(res, 'Vui lòng cung cấp đầy đủ avgPh, avgEc, avgWaterTemp', 400);
      }
      const result = await aiService.detectAnomalyDirect({ avgPh, avgEc, avgWaterTemp, reservoirName });
      return sendSuccess(res, result, 'Phân tích bất thường thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Lỗi phân tích bất thường', 400);
    }
  }
}
