import type { Request, Response, NextFunction } from 'express';
import { ZonesService } from './zones.service';
import { createZoneSchema, updateZoneSchema } from './zones.dto';
import { sendSuccess, sendError } from '../../utils/response';

const zonesService = new ZonesService();

export class ZonesController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await zonesService.getAllZones();
      return sendSuccess(res, zones, 'Lấy danh sách phân khu canh tác thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await zonesService.getZoneById(req.params.id);
      return sendSuccess(res, zone, 'Lấy chi tiết phân khu canh tác thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Phân khu không tồn tại', 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createZoneSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const created = await zonesService.createZone(validatedData, userId);
      return sendSuccess(res, created, 'Tạo phân khu mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateZoneSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await zonesService.updateZone(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Cập nhật phân khu thành công');
    } catch (error) {
      next(error);
    }
  }
}
