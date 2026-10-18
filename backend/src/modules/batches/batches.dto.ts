import { z } from 'zod';
import { GrowthStage, BatchStatus } from '@prisma/client';

export const createBatchSchema = z.object({
  batchCode: z.string().min(3, 'Mã lô phải có ít nhất 3 ký tự'),
  cultivarId: z.string().min(1, 'Vui lòng chọn giống cây trồng'),
  reservoirId: z.string().min(1, 'Vui lòng chọn bể cấp dinh dưỡng'),
  zoneId: z.string().optional(),
  systemType: z.string().default('NFT'),
  plantQuantity: z.number().int().positive('Số cây gieo ban đầu phải lớn hơn 0'),
  currentQuantity: z.number().int().nonnegative().optional(),
  seedDate: z.string().min(1, 'Vui lòng chọn ngày gieo hạt'),
  transplantDate: z.string().min(1, 'Vui lòng chọn ngày chuyển máng'),
  expectedHarvestDate: z.string().min(1, 'Vui lòng chọn ngày dự kiến thu hoạch'),
  currentStage: z.nativeEnum(GrowthStage).default(GrowthStage.seedling),
  status: z.nativeEnum(BatchStatus).default(BatchStatus.active),
  densityPlantsPerM2: z.number().positive().default(25),
  notes: z.string().optional()
});

export const updateBatchSchema = createBatchSchema.partial().extend({
  actualHarvestDate: z.string().optional(),
  currentQuantity: z.number().int().nonnegative().optional()
});

export const advanceStageSchema = z.object({
  newStage: z.nativeEnum(GrowthStage, {
    errorMap: () => ({ message: 'Giai đoạn sinh trưởng không hợp lệ' })
  })
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(BatchStatus, {
    errorMap: () => ({ message: 'Trạng thái lô không hợp lệ' })
  }),
  actualHarvestDate: z.string().optional()
});

export const createObservationSchema = z.object({
  date: z.string().min(1, 'Vui lòng nhập ngày đo đạc'),
  avgLeafCount: z.number().positive('Số lá thật trung bình phải lớn hơn 0'),
  avgHeightCm: z.number().positive('Chiều cao trung bình phải lớn hơn 0'),
  sampleWeightG: z.number().positive('Trọng lượng mẫu cây phải lớn hơn 0'),
  notes: z.string().optional()
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateObservationInput = z.infer<typeof createObservationSchema>;
