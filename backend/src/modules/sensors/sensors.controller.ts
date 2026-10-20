import type { Request, Response, NextFunction } from 'express';
import { sensorsService } from './sensors.service';
import { sendSuccess, sendError } from '../../utils/response';
import { config } from '../../config/env';

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

  /**
   * POST /api/v1/sensors/telemetry/batch
   * Endpoint chính dành cho thiết bị IoT (ESP32) - nhận nhiều số đo trong 1 gói tin.
   */
  async ingestBatch(req: Request, res: Response) {
    try {
      // Xác thực thiết bị bằng khoá bí mật (nếu đã cấu hình DEVICE_API_KEY)
      if (config.DEVICE_API_KEY && req.header('x-device-key') !== config.DEVICE_API_KEY) {
        return sendError(res, 'Thiết bị chưa được cấp quyền (sai hoặc thiếu x-device-key)', 401);
      }

      const { deviceId, readings, source, timestamp } = req.body || {};
      if (!deviceId || !Array.isArray(readings) || readings.length === 0) {
        return sendError(res, 'Gói tin cần có deviceId và mảng readings [{ sensorCode, value }]', 400);
      }

      const result = await sensorsService.ingestDeviceReadings({
        deviceId: String(deviceId),
        source: source === 'simulator' ? 'simulator' : 'sensor',
        timestamp,
        readings: readings.map((r: any) => ({
          sensorCode: String(r.sensorCode),
          value: Number(r.value),
          metric: r.metric,
          batteryLevel: r.batteryLevel !== undefined ? Number(r.batteryLevel) : undefined
        }))
      });

      return sendSuccess(res, result, `Đã tiếp nhận ${result.accepted} số đo từ thiết bị ${deviceId}`);
    } catch (error: any) {
      return sendError(res, error.message || 'Lỗi khi tiếp nhận gói tin thiết bị', 400);
    }
  }
}
