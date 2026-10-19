import { z } from 'zod';

export const stageConfigItemSchema = z.object({
  stage: z.enum(['seed', 'germination', 'seedling', 'transplant', 'vegetative', 'pre_harvest', 'harvest']),
  days: z.number().int().positive('Số ngày giai đoạn phải lớn hơn 0'),
  phMin: z.number().min(0).max(14),
  phMax: z.number().min(0).max(14),
  ecMin: z.number().nonnegative(),
  ecMax: z.number().nonnegative(),
  waterTempMin: z.number().optional(),
  waterTempMax: z.number().optional(),
  lightDli: z.number().nonnegative().optional(),
  notes: z.string().optional()
}).refine(data => data.phMin <= data.phMax, {
  message: 'pH Min của giai đoạn không được lớn hơn pH Max',
  path: ['phMin']
}).refine(data => data.ecMin <= data.ecMax, {
  message: 'EC Min của giai đoạn không được lớn hơn EC Max',
  path: ['ecMin']
});

export const createCultivarSchema = z.object({
  cropName: z.string().min(1, 'Tên nhóm cây trồng không được để trống'),
  name: z.string().min(1, 'Tên giống cây trồng không được để trống'),
  scientificName: z.string().min(1, 'Tên khoa học không được để trống'),
  description: z.string().min(1, 'Mô tả đặc tính giống cây trồng'),
  targetCycleDays: z.number().int().positive('Số ngày chu kỳ sinh trưởng phải lớn hơn 0').default(35),
  expectedWeightG: z.number().positive('Khối lượng dự kiến khi thu hoạch phải lớn hơn 0').default(200.0),

  // Dinh dưỡng & Nước thủy canh
  recommendedPhMin: z.number().min(0).max(14).default(5.5),
  recommendedPhMax: z.number().min(0).max(14).default(6.5),
  recommendedEcMin: z.number().nonnegative().default(1.4),
  recommendedEcMax: z.number().nonnegative().default(2.0),
  optimalWaterTempMin: z.number().min(0).max(50).default(18.0),
  optimalWaterTempMax: z.number().min(0).max(50).default(24.0),
  minWaterLevelPercent: z.number().min(0).max(100).default(20.0),

  // Vi khí hậu & Ánh sáng
  optimalAirTempMin: z.number().min(0).max(50).default(18.0),
  optimalAirTempMax: z.number().min(0).max(50).default(26.0),
  optimalHumidityMin: z.number().min(0).max(100).default(60.0),
  optimalHumidityMax: z.number().min(0).max(100).default(80.0),
  optimalLightPpfdMin: z.number().nonnegative().default(150.0),
  optimalLightPpfdMax: z.number().nonnegative().default(250.0),
  optimalLightDliMin: z.number().nonnegative().default(12.0),
  optimalLightDliMax: z.number().nonnegative().default(17.0),

  // Cấu hình thông số chi tiết theo từng giai đoạn sinh trưởng
  stageConfigs: z.any().optional()
})
.refine(data => data.recommendedPhMin <= data.recommendedPhMax, {
  message: 'Ngưỡng pH Min không được lớn hơn pH Max',
  path: ['recommendedPhMin']
})
.refine(data => data.recommendedEcMin <= data.recommendedEcMax, {
  message: 'Ngưỡng EC Min không được lớn hơn EC Max',
  path: ['recommendedEcMin']
})
.refine(data => data.optimalWaterTempMin <= data.optimalWaterTempMax, {
  message: 'Nhiệt độ nước tối ưu Min không được lớn hơn Max',
  path: ['optimalWaterTempMin']
})
.refine(data => data.optimalAirTempMin <= data.optimalAirTempMax, {
  message: 'Nhiệt độ không khí tối ưu Min không được lớn hơn Max',
  path: ['optimalAirTempMin']
})
.refine(data => data.optimalHumidityMin <= data.optimalHumidityMax, {
  message: 'Độ ẩm không khí tối ưu Min không được lớn hơn Max',
  path: ['optimalHumidityMin']
})
.refine(data => data.optimalLightPpfdMin <= data.optimalLightPpfdMax, {
  message: 'Cường độ ánh sáng PPFD Min không được lớn hơn Max',
  path: ['optimalLightPpfdMin']
})
.refine(data => data.optimalLightDliMin <= data.optimalLightDliMax, {
  message: 'Tích lũy ánh sáng DLI Min không được lớn hơn Max',
  path: ['optimalLightDliMin']
});

export const updateCultivarSchema = z.object({
  cropName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  scientificName: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  targetCycleDays: z.number().int().positive().optional(),
  expectedWeightG: z.number().positive().optional(),

  recommendedPhMin: z.number().min(0).max(14).optional(),
  recommendedPhMax: z.number().min(0).max(14).optional(),
  recommendedEcMin: z.number().nonnegative().optional(),
  recommendedEcMax: z.number().nonnegative().optional(),
  optimalWaterTempMin: z.number().min(0).max(50).optional(),
  optimalWaterTempMax: z.number().min(0).max(50).optional(),
  minWaterLevelPercent: z.number().min(0).max(100).optional(),

  optimalAirTempMin: z.number().min(0).max(50).optional(),
  optimalAirTempMax: z.number().min(0).max(50).optional(),
  optimalHumidityMin: z.number().min(0).max(100).optional(),
  optimalHumidityMax: z.number().min(0).max(100).optional(),
  optimalLightPpfdMin: z.number().nonnegative().optional(),
  optimalLightPpfdMax: z.number().nonnegative().optional(),
  optimalLightDliMin: z.number().nonnegative().optional(),
  optimalLightDliMax: z.number().nonnegative().optional(),

  stageConfigs: z.any().optional()
});

export type CreateCultivarInput = z.infer<typeof createCultivarSchema>;
export type UpdateCultivarInput = z.infer<typeof updateCultivarSchema>;
