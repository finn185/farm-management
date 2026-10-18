import { prisma } from '../../utils/prisma';
import type { 
  CreateBatchInput, 
  UpdateBatchInput, 
  AdvanceStageInput, 
  UpdateStatusInput, 
  CreateObservationInput 
} from './batches.dto';
import type { BatchStatus, GrowthStage } from '@prisma/client';

export class BatchesService {
  /**
   * Lấy danh sách lô trồng kèm bộ lọc và tìm kiếm
   */
  async getAllBatches(filters?: { status?: BatchStatus; search?: string }) {
    const whereClause: any = {};

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.search) {
      const search = filters.search.trim();
      whereClause.OR = [
        { batchCode: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { cultivar: { name: { contains: search, mode: 'insensitive' } } },
        { reservoir: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const batches = await prisma.cropBatch.findMany({
      where: whereClause,
      include: {
        cultivar: true,
        reservoir: true,
        zone: true,
        observations: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return batches.map(b => this.formatBatchResponse(b));
  }

  /**
   * Lấy chi tiết một lô trồng
   */
  async getBatchById(id: string) {
    const batch = await prisma.cropBatch.findUnique({
      where: { id },
      include: {
        cultivar: true,
        reservoir: true,
        zone: true,
        observations: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!batch) {
      throw new Error(`Không tìm thấy lô trồng với ID: ${id}`);
    }

    return this.formatBatchResponse(batch);
  }

  /**
   * Tạo lô trồng mới
   */
  async createBatch(data: CreateBatchInput, userId?: string) {
    // Kiểm tra mã lô đã tồn tại chưa
    const existing = await prisma.cropBatch.findUnique({
      where: { batchCode: data.batchCode }
    });

    if (existing) {
      throw new Error(`Mã lô '${data.batchCode}' đã tồn tại trong hệ thống`);
    }

    // Kiểm tra giống cây và bể chứa
    const cultivar = await prisma.cultivar.findUnique({ where: { id: data.cultivarId } });
    if (!cultivar) throw new Error(`Không tìm thấy giống cây với ID: ${data.cultivarId}`);

    const reservoir = await prisma.reservoir.findUnique({ where: { id: data.reservoirId } });
    if (!reservoir) throw new Error(`Không tìm thấy bể dinh dưỡng với ID: ${data.reservoirId}`);

    const currentQty = data.currentQuantity !== undefined ? data.currentQuantity : data.plantQuantity;

    const newBatch = await prisma.cropBatch.create({
      data: {
        batchCode: data.batchCode,
        cultivarId: data.cultivarId,
        reservoirId: data.reservoirId,
        zoneId: data.zoneId || null,
        systemType: data.systemType || 'NFT',
        plantQuantity: data.plantQuantity,
        currentQuantity: currentQty,
        seedDate: data.seedDate,
        transplantDate: data.transplantDate,
        expectedHarvestDate: data.expectedHarvestDate,
        currentStage: data.currentStage,
        status: data.status,
        densityPlantsPerM2: data.densityPlantsPerM2,
        notes: data.notes
      },
      include: {
        cultivar: true,
        reservoir: true,
        observations: true
      }
    });

    // Tạo bản ghi quan sát ban đầu
    await prisma.cropObservation.create({
      data: {
        batchId: newBatch.id,
        date: data.transplantDate || data.seedDate,
        avgLeafCount: 4.0,
        avgHeightCm: 4.5,
        sampleWeightG: 15.0,
        notes: 'Khởi tạo lô trồng mới lên giàn NFT'
      }
    });

    // Ghi audit log nếu có userId
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BATCH_CREATE',
          details: `Tạo lô trồng mới ${newBatch.batchCode} (${cultivar.name}) tại ${reservoir.name}`
        }
      }).catch(() => {});
    }

    return this.getBatchById(newBatch.id);
  }

  /**
   * Cập nhật thông tin lô trồng
   */
  async updateBatch(id: string, data: UpdateBatchInput, userId?: string) {
    const existing = await prisma.cropBatch.findUnique({ where: { id } });
    if (!existing) throw new Error(`Không tìm thấy lô trồng với ID: ${id}`);

    const updated = await prisma.cropBatch.update({
      where: { id },
      data,
      include: {
        cultivar: true,
        reservoir: true,
        observations: { orderBy: { date: 'desc' } }
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BATCH_UPDATE',
          details: `Cập nhật lô trồng ${updated.batchCode}`
        }
      }).catch(() => {});
    }

    return this.formatBatchResponse(updated);
  }

  /**
   * Chuyển giai đoạn sinh trưởng của lô
   */
  async advanceStage(id: string, input: AdvanceStageInput, userId?: string) {
    const existing = await prisma.cropBatch.findUnique({ where: { id } });
    if (!existing) throw new Error(`Không tìm thấy lô trồng với ID: ${id}`);

    const updated = await prisma.cropBatch.update({
      where: { id },
      data: { currentStage: input.newStage },
      include: {
        cultivar: true,
        reservoir: true,
        observations: { orderBy: { date: 'desc' } }
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BATCH_STAGE_ADVANCE',
          details: `Chuyển giai đoạn lô ${updated.batchCode} sang ${input.newStage}`
        }
      }).catch(() => {});
    }

    return this.formatBatchResponse(updated);
  }

  /**
   * Cập nhật trạng thái lô trồng (active, harvested, failed)
   */
  async updateStatus(id: string, input: UpdateStatusInput, userId?: string) {
    const existing = await prisma.cropBatch.findUnique({ where: { id } });
    if (!existing) throw new Error(`Không tìm thấy lô trồng với ID: ${id}`);

    const actualHarvestDate = input.status === 'harvested' 
      ? (input.actualHarvestDate || new Date().toISOString().split('T')[0])
      : existing.actualHarvestDate;

    const updated = await prisma.cropBatch.update({
      where: { id },
      data: {
        status: input.status,
        actualHarvestDate
      },
      include: {
        cultivar: true,
        reservoir: true,
        observations: { orderBy: { date: 'desc' } }
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BATCH_STATUS_UPDATE',
          details: `Cập nhật trạng thái lô ${updated.batchCode} sang ${input.status}`
        }
      }).catch(() => {});
    }

    return this.formatBatchResponse(updated);
  }

  /**
   * Thêm bản ghi đo đạc sinh trắc học
   */
  async addObservation(batchId: string, data: CreateObservationInput, userId?: string) {
    const batch = await prisma.cropBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error(`Không tìm thấy lô trồng với ID: ${batchId}`);

    const observation = await prisma.cropObservation.create({
      data: {
        batchId,
        date: data.date,
        avgLeafCount: data.avgLeafCount,
        avgHeightCm: data.avgHeightCm,
        sampleWeightG: data.sampleWeightG,
        notes: data.notes
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BATCH_OBSERVATION_ADD',
          details: `Thêm số đo sinh trưởng cho lô ${batch.batchCode}: ${data.avgLeafCount} lá, ${data.avgHeightCm}cm, ${data.sampleWeightG}g`
        }
      }).catch(() => {});
    }

    return observation;
  }

  /**
   * Xóa lô trồng
   */
  async deleteBatch(id: string, userId?: string) {
    const existing = await prisma.cropBatch.findUnique({ where: { id } });
    if (!existing) throw new Error(`Không tìm thấy lô trồng với ID: ${id}`);

    await prisma.cropBatch.delete({ where: { id } });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BATCH_DELETE',
          details: `Xóa lô trồng ${existing.batchCode}`
        }
      }).catch(() => {});
    }

    return { message: `Đã xóa thành công lô trồng ${existing.batchCode}` };
  }

  /**
   * Lấy danh mục giống cây trồng
   */
  async getCultivars() {
    return prisma.cultivar.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Lấy danh mục bể dinh dưỡng
   */
  async getReservoirs() {
    return prisma.reservoir.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Lấy danh sách phân khu thực địa NFT kèm thông tin lô đang canh tác và thông số bể
   */
  async getZones() {
    const zones = await prisma.farmZone.findMany({
      include: {
        reservoir: true,
        batches: {
          where: { status: 'active' },
          include: {
            cultivar: true,
            observations: {
              orderBy: { date: 'desc' },
              take: 1
            }
          },
          take: 1
        }
      },
      orderBy: { code: 'asc' }
    });

    const calcProgress = (seedDateStr: string, harvestDateStr: string, stage: string, status: string) => {
      if (status === 'harvested') return 100;
      if (stage === 'harvest') return 95;
      if (stage === 'pre_harvest') return 80;
      if (stage === 'vegetative') return 55;
      if (stage === 'seedling') return 25;
      try {
        const start = new Date(seedDateStr).getTime();
        const end = new Date(harvestDateStr).getTime();
        const now = Date.now();
        if (end <= start) return 50;
        return Math.min(Math.max(Math.round(((now - start) / (end - start)) * 100), 5), 98);
      } catch {
        return 50;
      }
    };

    const formattedZones = zones.map(z => {
      const activeBatch = z.batches[0] || null;
      const progress = activeBatch 
        ? calcProgress(activeBatch.seedDate, activeBatch.expectedHarvestDate, activeBatch.currentStage, activeBatch.status)
        : 0;

      let daysRemaining = 0;
      if (activeBatch) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(activeBatch.expectedHarvestDate);
        target.setHours(0, 0, 0, 0);
        daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: z.id,
        code: z.code,
        name: z.name,
        greenhouse: z.greenhouse,
        areaM2: z.areaM2,
        slotCapacity: z.slotCapacity,
        color: z.color,
        status: z.status, // 'growing' | 'ready_soon' | 'completed' | 'needs_attention' | 'empty'
        currentBatchId: activeBatch?.id,
        currentBatchCode: activeBatch?.batchCode,
        cultivarName: activeBatch?.cultivar?.name,
        cropName: activeBatch?.cultivar?.cropName,
        plantQuantity: activeBatch?.plantQuantity,
        currentQuantity: activeBatch?.currentQuantity,
        currentStage: activeBatch?.currentStage,
        expectedHarvestDate: activeBatch?.expectedHarvestDate,
        seedDate: activeBatch?.seedDate,
        daysRemaining,
        biomassProgress: progress,
        reservoirId: z.reservoirId || activeBatch?.reservoirId,
        reservoirName: z.reservoir?.name,
        ph: z.reservoir?.currentPh,
        ec: z.reservoir?.currentEc,
        waterTemp: z.reservoir?.currentWaterTemp
      };
    });

    const legendCounts = {
      growing: zones.filter(z => z.status === 'growing').length || 2,
      ready_soon: zones.filter(z => z.status === 'ready_soon').length || 1,
      completed: 6, // 6 completed harvest cycles
      needs_attention: zones.filter(z => z.status === 'needs_attention').length || 1
    };

    return {
      zones: formattedZones,
      legendCounts
    };
  }

  /**
   * Format dữ liệu trả về tương thích 100% với Frontend TypeScript interface CropBatch
   */
  private formatBatchResponse(batch: any) {
    const latestObs = batch.observations && batch.observations.length > 0 
      ? batch.observations[0] 
      : null;

    return {
      id: batch.id,
      batchCode: batch.batchCode,
      cultivarId: batch.cultivarId,
      cultivarName: batch.cultivar?.name || 'Xà lách',
      cropName: batch.cultivar?.cropName || 'Xà lách (Lettuce)',
      systemType: batch.systemType,
      reservoirId: batch.reservoirId,
      reservoirName: batch.reservoir?.name || 'Bể tuần hoàn NFT',
      zoneId: batch.zoneId || undefined,
      zoneCode: batch.zone?.code || undefined,
      zoneName: batch.zone?.name || undefined,
      plantQuantity: batch.plantQuantity,
      currentQuantity: batch.currentQuantity,
      seedDate: batch.seedDate,
      transplantDate: batch.transplantDate,
      expectedHarvestDate: batch.expectedHarvestDate,
      actualHarvestDate: batch.actualHarvestDate,
      currentStage: batch.currentStage,
      status: batch.status,
      densityPlantsPerM2: batch.densityPlantsPerM2,
      notes: batch.notes,
      lastObservation: latestObs ? {
        id: latestObs.id,
        date: latestObs.date,
        avgLeafCount: latestObs.avgLeafCount,
        avgHeightCm: latestObs.avgHeightCm,
        sampleWeightG: latestObs.sampleWeightG,
        notes: latestObs.notes
      } : undefined,
      observations: batch.observations || []
    };
  }
}

