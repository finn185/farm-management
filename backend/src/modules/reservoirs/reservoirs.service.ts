import { prisma } from '../../utils/prisma';
import { alertEngine } from '../alerts/alert-engine.service';
import type {
  CreateReservoirInput,
  UpdateReservoirInput,
  DoseNutrientInput,
  TopUpWaterInput,
  DrainReservoirInput,
  LogWaterQualityInput
} from './reservoirs.dto';

export class ReservoirsService {
  async getAllReservoirs() {
    return prisma.reservoir.findMany({
      include: {
        zones: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            slotCapacity: true,
            color: true
          }
        },
        batches: {
          where: { status: 'active' },
          include: {
            cultivar: {
              select: {
                id: true,
                name: true,
                cropName: true,
                recommendedPhMin: true,
                recommendedPhMax: true,
                recommendedEcMin: true,
                recommendedEcMax: true,
                optimalWaterTempMin: true,
                optimalWaterTempMax: true
              }
            },
            zone: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        alerts: {
          where: { status: 'open' },
          orderBy: { createdAt: 'desc' }
        },
        waterLogs: {
          orderBy: { createdAt: 'desc' },
          take: 15
        },
        sensors: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async getReservoirById(id: string) {
    const reservoir = await prisma.reservoir.findUnique({
      where: { id },
      include: {
        zones: true,
        batches: {
          include: {
            cultivar: true,
            zone: true
          }
        },
        alerts: {
          orderBy: { createdAt: 'desc' }
        },
        waterLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        drainEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        sensors: true
      }
    });

    if (!reservoir) {
      throw new Error(`Không tìm thấy bể dinh dưỡng với ID: ${id}`);
    }

    return reservoir;
  }

  async createReservoir(data: CreateReservoirInput, userId?: string) {
    const created = await prisma.reservoir.create({
      data: {
        name: data.name,
        systemType: data.systemType || 'NFT',
        capacityLiters: data.capacityLiters,
        currentVolumeLiters: data.currentVolumeLiters,
        currentPh: data.currentPh ?? 5.8,
        currentEc: data.currentEc ?? 1.7,
        currentWaterTemp: data.currentWaterTemp ?? 22.0,
        currentDo: data.currentDo,
        formulaName: data.formulaName || 'Chuẩn Hoagland - Resh',
        pumpStatus: data.pumpStatus || 'running',
        aerationStatus: data.aerationStatus || 'active'
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_RESERVOIR',
          details: `Thêm mới bể dinh dưỡng: ${created.name} (${created.capacityLiters}L)`
        }
      }).catch(() => {});
    }

    return created;
  }

  async updateReservoir(id: string, data: UpdateReservoirInput, userId?: string) {
    await this.getReservoirById(id);

    const updated = await prisma.reservoir.update({
      where: { id },
      data
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_RESERVOIR',
          details: `Cập nhật thông số bể dinh dưỡng: ${updated.name}`
        }
      }).catch(() => {});
    }

    return updated;
  }

  async doseNutrient(id: string, data: DoseNutrientInput, userId?: string) {
    const reservoir = await this.getReservoirById(id);

    // Tính toán độ tăng EC dự kiến hoặc áp dụng targetEc
    const volumeLiters = reservoir.currentVolumeLiters > 0 ? reservoir.currentVolumeLiters : 500;
    // Tỷ lệ chuẩn: mỗi 10ml Stock A + 10ml Stock B trong 100L làm tăng ~0.15 mS/cm
    const ecIncrease = ((data.amountStockAMl + data.amountStockBMl) / 2 / volumeLiters) * 1.5;
    const newEc = data.targetEc 
      ? Number(data.targetEc.toFixed(2)) 
      : Number((reservoir.currentEc + ecIncrease).toFixed(2));

    const updated = await prisma.reservoir.update({
      where: { id },
      data: {
        currentEc: newEc,
        currentVolumeLiters: Math.min(reservoir.capacityLiters, reservoir.currentVolumeLiters + (data.amountStockAMl + data.amountStockBMl) / 1000)
      }
    });

    const waterLevelPercent = Math.round((updated.currentVolumeLiters / updated.capacityLiters) * 100);

    // Tạo bản ghi log chất lượng nước
    await prisma.waterQualityLog.create({
      data: {
        reservoirId: id,
        ph: updated.currentPh,
        ec: newEc,
        waterTemp: updated.currentWaterTemp,
        doLevel: updated.currentDo,
        waterLevelPercent,
        source: 'manual',
        recordedBy: data.operator || 'Kỹ thuật viên'
      }
    });

    // Chạy Alert Engine đối chiếu và tự động giải quyết các cảnh báo EC thấp
    await alertEngine.evaluateWaterQuality(id, {
      ph: updated.currentPh,
      ec: newEc,
      waterTemp: updated.currentWaterTemp,
      doLevel: updated.currentDo,
      waterLevelPercent,
      recordedBy: data.operator || 'Châm phân dinh dưỡng'
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DOSE_NUTRIENT',
          details: `Châm phân bể ${reservoir.name}: Stock A ${data.amountStockAMl}ml, Stock B ${data.amountStockBMl}ml. EC: ${reservoir.currentEc} -> ${newEc}`
        }
      }).catch(() => {});
    }

    return updated;
  }

  async topUpWater(id: string, data: TopUpWaterInput, userId?: string) {
    const reservoir = await this.getReservoirById(id);

    const oldVolume = reservoir.currentVolumeLiters;
    const newVolume = Math.min(reservoir.capacityLiters, oldVolume + data.waterLitersAdded);
    
    // Pha loãng EC theo tỷ lệ thể tích
    const dilutionFactor = oldVolume / newVolume;
    const newEc = Number((reservoir.currentEc * dilutionFactor).toFixed(2));

    const todayStr = new Date().toISOString().split('T')[0];

    const updated = await prisma.reservoir.update({
      where: { id },
      data: {
        currentVolumeLiters: newVolume,
        currentEc: newEc,
        lastTopUpDate: todayStr
      }
    });

    const waterLevelPercent = Math.round((newVolume / reservoir.capacityLiters) * 100);

    await prisma.waterQualityLog.create({
      data: {
        reservoirId: id,
        ph: updated.currentPh,
        ec: newEc,
        waterTemp: updated.currentWaterTemp,
        doLevel: updated.currentDo,
        waterLevelPercent,
        source: 'manual',
        recordedBy: data.operator || 'Bù nước tự động'
      }
    });

    // Chạy Alert Engine đối chiếu sau khi bù nước
    await alertEngine.evaluateWaterQuality(id, {
      ph: updated.currentPh,
      ec: newEc,
      waterTemp: updated.currentWaterTemp,
      doLevel: updated.currentDo,
      waterLevelPercent,
      recordedBy: data.operator || 'Bù nước sạch'
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TOP_UP_WATER',
          details: `Bù nước bể ${reservoir.name}: +${data.waterLitersAdded}L. Thể tích: ${newVolume}L, EC pha loãng: ${newEc}`
        }
      }).catch(() => {});
    }

    return updated;
  }

  async drainAndReplace(id: string, data: DrainReservoirInput, userId?: string) {
    const reservoir = await this.getReservoirById(id);
    const todayStr = new Date().toISOString().split('T')[0];

    // Ghi sự kiện xả bể
    await prisma.solutionDrainEvent.create({
      data: {
        reservoirId: id,
        drainDate: todayStr,
        volumeDrainedLiters: reservoir.currentVolumeLiters,
        finalPh: reservoir.currentPh,
        finalEc: reservoir.currentEc,
        finalDo: reservoir.currentDo,
        reason: data.reason,
        operator: data.operator,
        notes: data.notes
      }
    });

    // Reset bể về trạng thái mới pha
    const updated = await prisma.reservoir.update({
      where: { id },
      data: {
        currentVolumeLiters: reservoir.capacityLiters * 0.9,
        currentPh: 5.8,
        currentEc: 1.6,
        currentWaterTemp: 22.0,
        currentDo: 7.0,
        formulaName: data.refillWithFormula || reservoir.formulaName,
        lastReplacementDate: todayStr
      }
    });

    // Giải quyết tất cả các cảnh báo cũ của bể
    await prisma.alert.updateMany({
      where: {
        reservoirId: id,
        status: { in: ['open', 'acknowledged'] }
      },
      data: {
        status: 'resolved',
        resolvedBy: data.operator,
        resolvedAt: new Date(),
        resolutionNote: `Xả sạch và thay mới hoàn toàn dung dịch bể theo lý do: ${data.reason}.`
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DRAIN_RESERVOIR',
          details: `Xả toàn bộ bể ${reservoir.name} (${reservoir.currentVolumeLiters}L). Lý do: ${data.reason}. Người thực hiện: ${data.operator}`
        }
      }).catch(() => {});
    }

    return updated;
  }

  async logWaterQuality(id: string, data: LogWaterQualityInput, _userId?: string) {
    const reservoir = await this.getReservoirById(id);

    const waterLevel = data.waterLevelPercent !== undefined 
      ? data.waterLevelPercent 
      : Math.round((reservoir.currentVolumeLiters / reservoir.capacityLiters) * 100);

    const log = await prisma.waterQualityLog.create({
      data: {
        reservoirId: id,
        ph: data.ph,
        ec: data.ec,
        waterTemp: data.waterTemp,
        doLevel: data.doLevel,
        waterLevelPercent: waterLevel,
        source: data.source,
        recordedBy: data.recordedBy
      }
    });

    // Cập nhật giá trị hiện tại của bể
    await prisma.reservoir.update({
      where: { id },
      data: {
        currentPh: data.ph,
        currentEc: data.ec,
        currentWaterTemp: data.waterTemp,
        currentDo: data.doLevel ?? reservoir.currentDo
      }
    });

    // Chạy Alert Engine đánh giá toàn diện các lô kết nối và chống trùng lặp cảnh báo
    await alertEngine.evaluateWaterQuality(id, {
      ph: data.ph,
      ec: data.ec,
      waterTemp: data.waterTemp,
      doLevel: data.doLevel,
      waterLevelPercent: waterLevel,
      recordedBy: data.recordedBy
    });

    return log;
  }
}
