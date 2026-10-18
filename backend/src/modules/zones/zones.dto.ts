import { z } from 'zod';

export const createZoneSchema = z.object({
  code: z.string().min(1, 'Mã phân khu không được để trống (ví dụ: A1, B2)'),
  name: z.string().min(1, 'Tên phân khu không được để trống'),
  greenhouse: z.string().default('Nhà màng 1'),
  areaM2: z.number().positive('Diện tích máng (m2) phải lớn hơn 0'),
  slotCapacity: z.number().int().positive('Số rọ trồng tối đa phải lớn hơn 0').default(10000),
  color: z.string().default('#16a34a'),
  status: z.enum(['growing', 'ready_soon', 'completed', 'empty', 'needs_attention']).default('empty'),
  reservoirId: z.string().optional()
});

export const updateZoneSchema = createZoneSchema.partial();

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
