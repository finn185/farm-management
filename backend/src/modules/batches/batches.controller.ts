import type { Request, Response, NextFunction } from 'express';
import { BatchesService } from './batches.service';
import { 
  createBatchSchema, 
  updateBatchSchema, 
  advanceStageSchema, 
  updateStatusSchema, 
  createObservationSchema 
} from './batches.dto';
import { sendSuccess, sendError } from '../../utils/response';
import type { BatchStatus } from '@prisma/client';

const batchesService = new BatchesService();

export class BatchesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as BatchStatus | undefined;
      const search = req.query.search as string | undefined;

      const batches = await batchesService.getAllBatches({ status, search });
      return sendSuccess(res, batches, 'Lấy danh sách lô trồng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await batchesService.getBatchById(req.params.id);
      return sendSuccess(res, batch, 'Lấy chi tiết lô trồng thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Lô trồng không tồn tại', 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createBatchSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const newBatch = await batchesService.createBatch(validatedData, userId);
      return sendSuccess(res, newBatch, 'Tạo lô trồng mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateBatchSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await batchesService.updateBatch(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, 'Cập nhật thông tin lô trồng thành công');
    } catch (error) {
      next(error);
    }
  }

  async advanceStage(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = advanceStageSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await batchesService.advanceStage(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, `Đã chuyển giai đoạn lô trồng sang ${validatedData.newStage}`);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateStatusSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const updated = await batchesService.updateStatus(req.params.id, validatedData, userId);
      return sendSuccess(res, updated, `Đã cập nhật trạng thái lô sang ${validatedData.status}`);
    } catch (error) {
      next(error);
    }
  }

  async addObservation(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createObservationSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const observation = await batchesService.addObservation(req.params.id, validatedData, userId);
      return sendSuccess(res, observation, 'Ghi nhận số đo sinh trắc học thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const result = await batchesService.deleteBatch(req.params.id, userId);
      return sendSuccess(res, result, 'Xóa lô trồng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getCultivars(req: Request, res: Response, next: NextFunction) {
    try {
      const cultivars = await batchesService.getCultivars();
      return sendSuccess(res, cultivars, 'Lấy danh mục giống cây trồng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getReservoirs(req: Request, res: Response, next: NextFunction) {
    try {
      const reservoirs = await batchesService.getReservoirs();
      return sendSuccess(res, reservoirs, 'Lấy danh mục bể dinh dưỡng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getZones(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await batchesService.getZones();
      return sendSuccess(res, data, 'Lấy danh sách phân khu thực địa NFT thành công');
    } catch (error) {
      next(error);
    }
  }
}
