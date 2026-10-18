import { z } from 'zod';

export const createHarvestSchema = z.object({
  batchId: z.string().min(1, 'Vui lòng chọn lô thu hoạch'),
  harvestDate: z.string().min(1, 'Vui lòng nhập ngày thu hoạch'),
  harvestedPlants: z.number().int().positive('Số cây thu hoạch phải lớn hơn 0'),
  totalWeightKg: z.number().positive('Tổng sản lượng (kg) phải lớn hơn 0'),
  avgWeightG: z.number().positive('Trọng lượng trung bình mỗi cây (gram) phải lớn hơn 0'),
  rejectedWeightKg: z.number().nonnegative().default(0),
  aiPredictedWeightG: z.number().nonnegative().default(0),
  grade: z.enum(['A', 'B', 'C']).default('A'),
  unitPriceVnd: z.number().positive().default(45000),
  notes: z.string().optional(),
  operatorName: z.string().optional()
});

export type CreateHarvestInput = z.infer<typeof createHarvestSchema>;
