import type { Request, Response } from 'express';
import { simulatorService } from './simulator.service';
import { sendSuccess, sendError } from '../../utils/response';

export class SimulatorController {
  async getStatus(_req: Request, res: Response) {
    return sendSuccess(res, await simulatorService.getStatus(), 'Trạng thái Trạm giả lập');
  }

  getHeartbeat(_req: Request, res: Response) {
    return sendSuccess(res, simulatorService.getHeartbeat(), 'Nhịp Trạm giả lập');
  }

  async start(req: Request, res: Response) {
    try {
      const { intervalMs, minutesPerTick } = req.body || {};
      const status = await simulatorService.start({
        intervalMs: intervalMs ? Number(intervalMs) : undefined,
        minutesPerTick: minutesPerTick ? Number(minutesPerTick) : undefined
      });
      return sendSuccess(res, status, 'Đã bật Trạm giả lập');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async stop(_req: Request, res: Response) {
    return sendSuccess(res, await simulatorService.stop(), 'Đã tạm dừng Trạm giả lập');
  }

  async step(_req: Request, res: Response) {
    try {
      return sendSuccess(res, await simulatorService.stepOnce(), 'Đã chạy 1 nhịp mô phỏng');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async speed(req: Request, res: Response) {
    const minutesPerTick = Number(req.body?.minutesPerTick);
    if (!Number.isFinite(minutesPerTick) || minutesPerTick <= 0) {
      return sendError(res, 'minutesPerTick phải là số dương', 400);
    }
    try {
      return sendSuccess(res, await simulatorService.setSpeed(minutesPerTick), 'Đã đổi tốc độ mô phỏng');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async scenario(req: Request, res: Response) {
    try {
      const { reservoirId, scenario } = req.body || {};
      if (!reservoirId || !scenario) {
        return sendError(res, 'Cần reservoirId (hoặc "all") và scenario', 400);
      }
      return sendSuccess(res, await simulatorService.setScenario(String(reservoirId), scenario), 'Đã áp dụng kịch bản');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async reset(_req: Request, res: Response) {
    try {
      return sendSuccess(res, await simulatorService.reset(), 'Đã đặt lại kịch bản demo');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async grow(req: Request, res: Response) {
    try {
      const days = req.body?.days !== undefined ? Number(req.body.days) : 1;
      const batchId = req.body?.batchId ? String(req.body.batchId) : undefined;
      return sendSuccess(res, await simulatorService.growPlants(days, batchId), `Đã tua nhanh sự phát triển cây trồng +${days} ngày`);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
