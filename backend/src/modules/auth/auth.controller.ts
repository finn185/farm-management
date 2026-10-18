import { Request, Response, NextFunction } from 'express';
import { RegisterSchema, LoginSchema } from './auth.dto';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.register(validated, ipAddress);
      sendSuccess(res, result, 'Đăng ký tài khoản thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.login(validated, ipAddress);
      sendSuccess(res, result, 'Đăng nhập thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Chưa được xác thực' });
        return;
      }

      const profile = await authService.getProfile(req.user.id);
      sendSuccess(res, profile, 'Lấy thông tin tài khoản thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Chưa được xác thực' });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const updated = await authService.updateProfile(req.user.id, req.body, ipAddress);
      sendSuccess(res, updated, 'Cập nhật thông tin hồ sơ thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Chưa được xác thực' });
        return;
      }

      const { oldPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.changePassword(req.user.id, oldPassword, newPassword, ipAddress);
      sendSuccess(res, result, 'Thay đổi mật khẩu thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
