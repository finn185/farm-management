import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message
    }));
    sendError(res, 'Dữ liệu đầu vào không hợp lệ', 400, issues);
    return;
  }

  // Handle standard HTTP / custom errors
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)';

  console.error('[Error Handler]:', err);
  sendError(res, message, status, process.env.NODE_ENV === 'development' ? err.stack : undefined);
}
