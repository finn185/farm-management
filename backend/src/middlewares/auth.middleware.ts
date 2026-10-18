import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { sendError } from '../utils/response';
import { prisma } from '../utils/prisma';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Yêu cầu mã xác thực Token (Bearer token)', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUserPayload;

    // Optional check: verify user still exists and isActive in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, fullName: true, isActive: true }
    });

    if (!user || !user.isActive) {
      sendError(res, 'Tài khoản không tồn tại hoặc đã bị khóa', 401);
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    next();
  } catch {
    sendError(res, 'Phiên đăng nhập hết hạn hoặc Token không hợp lệ', 401);
  }
}
