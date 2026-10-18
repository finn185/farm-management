import { z } from 'zod';

export const createCultivarSchema = z.object({
  cropName: z.string().min(1, 'Tên nhóm cây trồng không được để trống'),
  name: z.string().min(1, 'Tên giống cây trồng không được để trống'),
  scientificName: z.string().min(1, 'Tên khoa học không được để trống'),
  description: z.string().min(1, 'Mô tả đặc tính giống'),
  targetCycleDays: z.number().int().positive().default(35),
  expectedWeightG: z.number().positive().default(200.0),
  recommendedPhMin: z.number().min(0).max(14).default(5.5),
  recommendedPhMax: z.number().min(0).max(14).default(6.5),
  recommendedEcMin: z.number().nonnegative().default(1.4),
  recommendedEcMax: z.number().nonnegative().default(2.0),
  optimalWaterTempMin: z.number().default(18.0),
  optimalWaterTempMax: z.number().default(24.0)
});

export const updateCultivarSchema = createCultivarSchema.partial();

export type CreateCultivarInput = z.infer<typeof createCultivarSchema>;
export type UpdateCultivarInput = z.infer<typeof updateCultivarSchema>;
