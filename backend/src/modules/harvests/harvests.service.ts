import { prisma } from '../../utils/prisma';
import type { CreateHarvestInput } from './harvests.dto';

export class HarvestsService {
  async getAllHarvests() {
    return prisma.harvestRecord.findMany({
      include: {
        batch: {
          include: {
            cultivar: true,
            zone: true,
            reservoir: true
          }
        }
      },
      orderBy: { harvestDate: 'desc' }
    });
  }

  async getHarvestById(id: string) {
    const record = await prisma.harvestRecord.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            cultivar: true,
            zone: true,
            reservoir: true,
            observations: true
          }
        }
      }
    });

    if (!record) {
      throw new Error(`Không tìm thấy nhật ký thu hoạch với ID: ${id}`);
    }

    return record;
  }

  async recordHarvest(data: CreateHarvestInput, userId?: string) {
    const batch = await prisma.cropBatch.findUnique({
      where: { id: data.batchId },
      include: { cultivar: true, zone: true }
    });

    if (!batch) {
      throw new Error(`Không tìm thấy lô cây trồng với ID: ${data.batchId}`);
    }

    // Tính toán độ lệch AI nếu có
    const differencePercent = data.aiPredictedWeightG > 0
      ? Number((((data.avgWeightG - data.aiPredictedWeightG) / data.aiPredictedWeightG) * 100).toFixed(2))
      : 0;

    // Tính toán tỷ lệ hao hụt / thất thoát cây
    const lossPercentage = Number((((batch.plantQuantity - data.harvestedPlants) / batch.plantQuantity) * 100).toFixed(2));

    // Tính tổng doanh thu
    const totalRevenueVnd = Math.round(data.totalWeightKg * data.unitPriceVnd);

    // 1. Tạo bản ghi thu hoạch
    const record = await prisma.harvestRecord.create({
      data: {
        batchId: batch.id,
        batchCode: batch.batchCode,
        cultivarName: batch.cultivar.name,
        harvestDate: data.harvestDate,
        harvestedPlants: data.harvestedPlants,
        totalWeightKg: data.totalWeightKg,
        avgWeightG: data.avgWeightG,
        rejectedWeightKg: data.rejectedWeightKg,
        aiPredictedWeightG: data.aiPredictedWeightG,
        differencePercent,
        lossPercentage: Math.max(0, lossPercentage),
        grade: data.grade,
        unitPriceVnd: data.unitPriceVnd,
        totalRevenueVnd,
        notes: data.notes,
        operatorName: data.operatorName || 'Quản lý thu hoạch'
      }
    });

    // 2. Cập nhật trạng thái Lô thành đã thu hoạch
    await prisma.cropBatch.update({
      where: { id: batch.id },
      data: {
        status: 'harvested',
        currentStage: 'harvest',
        actualHarvestDate: data.harvestDate
      }
    });

    // 3. Giải phóng phân khu canh tác (zone)
    if (batch.zoneId) {
      await prisma.farmZone.update({
        where: { id: batch.zoneId },
        data: { status: 'completed' }
      });
    }

    // 4. Đóng toàn bộ alert liên quan tới lô này (cả open và acknowledged)
    await prisma.alert.updateMany({
      where: {
        batchId: batch.id,
        status: { in: ['open', 'acknowledged'] }
      },
      data: {
        status: 'resolved',
        resolvedBy: data.operatorName || 'Hệ thống tự động',
        resolvedAt: new Date(),
        resolutionNote: `Lô cây trồng ${batch.batchCode} đã hoàn tất thu hoạch đạt ${data.totalWeightKg}kg.`
      }
    });

    // 5. Ghi nhật ký hệ thống
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'RECORD_HARVEST',
          details: `Thu hoạch lô ${batch.batchCode} (${batch.cultivar.name}): ${data.harvestedPlants} cây, ${data.totalWeightKg}kg, TB ${data.avgWeightG}g/cây, Doanh thu: ${totalRevenueVnd.toLocaleString('vi-VN')} đ`
        }
      }).catch(() => {});
    }

    return record;
  }
}
