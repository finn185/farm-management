import type { Request, Response, NextFunction } from 'express';
import { ReservoirsService } from './reservoirs.service';
import {
  createReservoirSchema,
  updateReservoirSchema,
  doseNutrientSchema,
  topUpWaterSchema,
  drainReservoirSchema,
  logWaterQualitySchema
} from './reservoirs.dto';
import { sendSuccess, sendError } from '../../utils/response';

const reservoirsService = new ReservoirsService();

export class ReservoirsController {
  async getFormulas(_req: Request, res: Response, next: NextFunction) {
    try {
      const formulas = await reservoirsService.getFormulas();
      return sendSuccess(res, formulas, 'Lấy danh sách công thức dinh dưỡng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getDrainEvents(_req: Request, res: Response, next: NextFunction) {
    try {
      const events = await reservoirsService.getDrainEvents();
      return sendSuccess(res, events, 'Lấy lịch sử xả bể thành công');
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const reservoirs = await reservoirsService.getAllReservoirs();
      return sendSuccess(res, reservoirs, 'Lấy danh sách bể dinh dưỡng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const reservoir = await reservoirsService.getReservoirById(req.params.id);
      return sendSuccess(res, reservoir, 'Lấy chi tiết bể dinh dưỡng thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Bể dinh dưỡng không tồn tại', 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createReservoirSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const created = await reservoirsService.createReservoir(validatedData, userId);
      return sendSuccess(res, created, 'Tạo bể dinh dưỡng mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateReservoirSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await reservoirsService.updateReservoir(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Cập nhật bể dinh dưỡng thành công');
    } catch (error) {
      next(error);
    }
  }

  async dose(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = doseNutrientSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await reservoirsService.doseNutrient(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Châm dung dịch dinh dưỡng Stock A & B thành công');
    } catch (error) {
      next(error);
    }
  }

  async topUp(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = topUpWaterSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await reservoirsService.topUpWater(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Bù nước sạch vào bể thành công');
    } catch (error) {
      next(error);
    }
  }

  async drain(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = drainReservoirSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await reservoirsService.drainAndReplace(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Xả và thay mới nước bể dinh dưỡng thành công');
    } catch (error) {
      next(error);
    }
  }

  async addLog(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = logWaterQualitySchema.parse(req.body);
      const userId = (req as any).user?.id;
      const log = await reservoirsService.logWaterQuality(req.params.id, validatedData, userId);
      return sendSuccess(res, log, 'Ghi nhận chỉ số đo đạc chất lượng nước thành công', 201);
    } catch (error) {
      next(error);
    }
  }
}
