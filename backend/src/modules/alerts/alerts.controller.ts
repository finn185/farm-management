import type { Request, Response, NextFunction } from 'express';
import { AlertsService } from './alerts.service';
import { createAlertSchema, acknowledgeAlertSchema, resolveAlertSchema } from './alerts.dto';
import { sendSuccess, sendError } from '../../utils/response';

const alertsService = new AlertsService();

export class AlertsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, severity, metric, reservoirId, batchId } = req.query as Record<string, string>;
      const alerts = await alertsService.getAllAlerts({ status, severity, metric, reservoirId, batchId });
      return sendSuccess(res, alerts, 'Lấy danh sách cảnh báo thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await alertsService.getAlertById(req.params.id);
      return sendSuccess(res, alert, 'Lấy chi tiết cảnh báo thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Cảnh báo không tồn tại', 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createAlertSchema.parse(req.body);
      const alert = await alertsService.createAlert(validatedData);
      return sendSuccess(res, alert, 'Tạo cảnh báo mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = acknowledgeAlertSchema.parse(req.body);
      const updated = await alertsService.acknowledgeAlert(req.params.id, validatedData.acknowledgedBy);
      return sendSuccess(res, updated, 'Đã xác nhận cảnh báo');
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = resolveAlertSchema.parse(req.body);
      const updated = await alertsService.resolveAlert(
        req.params.id,
        validatedData.resolvedBy,
        validatedData.resolutionNote
      );
      return sendSuccess(res, updated, 'Đã xử lý cảnh báo thành công');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await alertsService.deleteAlert(req.params.id);
      return sendSuccess(res, null, 'Đã xóa cảnh báo');
    } catch (error) {
      next(error);
    }
  }
}
