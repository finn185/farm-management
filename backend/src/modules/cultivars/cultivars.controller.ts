import type { Request, Response, NextFunction } from 'express';
import { CultivarsService } from './cultivars.service';
import { createCultivarSchema, updateCultivarSchema } from './cultivars.dto';
import { sendSuccess, sendError } from '../../utils/response';

const cultivarsService = new CultivarsService();

export class CultivarsController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const cultivars = await cultivarsService.getAllCultivars();
      return sendSuccess(res, cultivars, 'Lấy danh mục giống cây trồng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const cultivar = await cultivarsService.getCultivarById(req.params.id);
      return sendSuccess(res, cultivar, 'Lấy chi tiết giống cây trồng thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Giống cây trồng không tồn tại', 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createCultivarSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const created = await cultivarsService.createCultivar(validatedData, userId);
      return sendSuccess(res, created, 'Tạo giống cây trồng mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateCultivarSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await cultivarsService.updateCultivar(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Cập nhật tiêu chuẩn kỹ thuật giống thành công');
    } catch (error) {
      next(error);
    }
  }
}
