import { z } from 'zod';

export const createReservoirSchema = z.object({
  name: z.string().min(2, 'Tên bể phải có ít nhất 2 ký tự'),
  systemType: z.string().default('NFT'),
  capacityLiters: z.number().positive('Dung tích thiết kế phải lớn hơn 0'),
  currentVolumeLiters: z.number().positive('Thể tích hiện tại phải lớn hơn 0'),
  currentPh: z.number().min(0).max(14).default(5.8),
  currentEc: z.number().nonnegative().default(1.7),
  currentWaterTemp: z.number().default(22.0),
  currentDo: z.number().optional(),
  formulaName: z.string().default('Chuẩn Hoagland - Resh'),
  pumpStatus: z.enum(['running', 'stopped', 'warning', 'error']).default('running'),
  aerationStatus: z.enum(['active', 'idle', 'off']).default('active'),
  notes: z.string().optional()
});

export const updateReservoirSchema = createReservoirSchema.partial();

export const doseNutrientSchema = z.object({
  amountStockAMl: z.number().positive('Lượng dung dịch mẹ Stock A phải lớn hơn 0'),
  amountStockBMl: z.number().positive('Lượng dung dịch mẹ Stock B phải lớn hơn 0'),
  targetEc: z.number().positive().optional(),
  notes: z.string().optional(),
  operator: z.string().optional()
});

export const topUpWaterSchema = z.object({
  waterLitersAdded: z.number().positive('Lượng nước cấp bổ sung phải lớn hơn 0'),
  notes: z.string().optional(),
  operator: z.string().optional()
});

export const drainReservoirSchema = z.object({
  reason: z.enum(['end_of_batch', 'salt_accumulation', 'contamination', 'maintenance', 'other']),
  operator: z.string().min(1, 'Vui lòng nhập tên người thực hiện xả bể'),
  notes: z.string().optional(),
  refillWithFormula: z.string().optional()
});

export const logWaterQualitySchema = z.object({
  ph: z.number().min(0).max(14),
  ec: z.number().nonnegative(),
  waterTemp: z.number(),
  doLevel: z.number().optional(),
  waterLevelPercent: z.number().min(0).max(100).optional(),
  source: z.enum(['sensor', 'manual']).default('manual'),
  recordedBy: z.string().optional()
});

export type CreateReservoirInput = z.infer<typeof createReservoirSchema>;
export type UpdateReservoirInput = z.infer<typeof updateReservoirSchema>;
export type DoseNutrientInput = z.infer<typeof doseNutrientSchema>;
export type TopUpWaterInput = z.infer<typeof topUpWaterSchema>;
export type DrainReservoirInput = z.infer<typeof drainReservoirSchema>;
export type LogWaterQualityInput = z.infer<typeof logWaterQualitySchema>;
