import type { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getDashboardStats();
      return sendSuccess(res, stats, 'Lấy dữ liệu tổng hợp Dashboard thành công');
    } catch (error) {
      next(error);
    }
  }
}
