import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = 'Thành công',
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function sendError(
  res: Response,
  message = 'Đã có lỗi xảy ra',
  statusCode = 400,
  error?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    error
  });
}
