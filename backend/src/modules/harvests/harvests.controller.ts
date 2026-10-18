import type { Request, Response, NextFunction } from 'express';
import { HarvestsService } from './harvests.service';
import { createHarvestSchema } from './harvests.dto';
import { sendSuccess, sendError } from '../../utils/response';

const harvestsService = new HarvestsService();

export class HarvestsController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const records = await harvestsService.getAllHarvests();
      return sendSuccess(res, records, 'Lấy danh sách nhật ký thu hoạch thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await harvestsService.getHarvestById(req.params.id);
      return sendSuccess(res, record, 'Lấy chi tiết nhật ký thu hoạch thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Nhật ký thu hoạch không tồn tại', 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createHarvestSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const record = await harvestsService.recordHarvest(validatedData, userId);
      return sendSuccess(res, record, 'Ghi nhận thu hoạch thành công', 201);
    } catch (error) {
      next(error);
    }
  }
}
