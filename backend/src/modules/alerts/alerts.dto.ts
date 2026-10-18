import { z } from 'zod';

export const createAlertSchema = z.object({
  severity: z.enum(['critical', 'warning', 'info']).default('warning'),
  status: z.enum(['open', 'acknowledged', 'resolved']).default('open'),
  metric: z.string().min(1, 'Chỉ số đo đạc là bắt buộc (pH, EC, DO, Temp...)'),
  title: z.string().min(2, 'Tiêu đề cảnh báo phải có ít nhất 2 ký tự'),
  message: z.string().min(3, 'Nội dung chi tiết cảnh báo'),
  suggestedAction: z.string().optional(),
  reservoirId: z.string().optional(),
  batchId: z.string().optional(),
  zoneId: z.string().optional()
});

export const acknowledgeAlertSchema = z.object({
  acknowledgedBy: z.string().min(1, 'Vui lòng cung cấp tên người xác nhận')
});

export const resolveAlertSchema = z.object({
  resolvedBy: z.string().min(1, 'Vui lòng cung cấp tên người xử lý'),
  resolutionNote: z.string().optional()
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
