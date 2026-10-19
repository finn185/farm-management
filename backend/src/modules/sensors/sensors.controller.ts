import type { Request, Response, NextFunction } from 'express';
import { SensorsService } from './sensors.service';
import { sendSuccess, sendError } from '../../utils/response';

const sensorsService = new SensorsService();

export class SensorsController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const sensors = await sensorsService.getAllSensors();
      return sendSuccess(res, sensors, 'Lấy danh sách thiết bị cảm biến thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sensor = await sensorsService.getSensorById(req.params.id);
      return sendSuccess(res, sensor, 'Lấy chi tiết cảm biến thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Cảm biến không tồn tại', 404);
    }
  }

  async ingestTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const { sensorCode, reading, batteryLevel, source } = req.body;
      if (!sensorCode || reading === undefined) {
        return sendError(res, 'Vui lòng cung cấp mã cảm biến (sensorCode) và giá trị đo (reading)', 400);
      }
      const updated = await sensorsService.ingestTelemetry({
        sensorCode,
        reading: Number(reading),
        batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : undefined,
        source
      });
      return sendSuccess(res, updated, 'Tiếp nhận dữ liệu đo cảm biến IoT và phân tích vi phạm thành công', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Lỗi khi tiếp nhận dữ liệu cảm biến', 400);
    }
  }
}
