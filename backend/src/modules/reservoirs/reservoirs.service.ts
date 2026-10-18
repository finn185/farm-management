import { prisma } from '../../utils/prisma';
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
        }
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
        }
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

    // Tạo bản ghi log chất lượng nước
    await prisma.waterQualityLog.create({
      data: {
        reservoirId: id,
        ph: updated.currentPh,
        ec: newEc,
        waterTemp: updated.currentWaterTemp,
        doLevel: updated.currentDo,
        source: 'manual',
        recordedBy: data.operator || 'Kỹ thuật viên'
      }
    });

    // Tự động giải quyết các cảnh báo EC thấp đang mở của bể này
    await prisma.alert.updateMany({
      where: {
        reservoirId: id,
        metric: 'EC',
        status: 'open'
      },
      data: {
        status: 'resolved',
        resolvedBy: data.operator || 'Kỹ thuật viên',
        resolvedAt: new Date(),
        resolutionNote: `Tự động giải quyết sau khi châm ${data.amountStockAMl}ml Stock A & ${data.amountStockBMl}ml Stock B. EC mới: ${newEc} mS/cm.`
      }
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

    await prisma.waterQualityLog.create({
      data: {
        reservoirId: id,
        ph: updated.currentPh,
        ec: newEc,
        waterTemp: updated.currentWaterTemp,
        doLevel: updated.currentDo,
        source: 'manual',
        recordedBy: data.operator || 'Bù nước tự động'
      }
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
        status: 'open'
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

  async logWaterQuality(id: string, data: LogWaterQualityInput, userId?: string) {
    const reservoir = await this.getReservoirById(id);

    const log = await prisma.waterQualityLog.create({
      data: {
        reservoirId: id,
        ph: data.ph,
        ec: data.ec,
        waterTemp: data.waterTemp,
        doLevel: data.doLevel,
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

    // Kiểm tra ngưỡng vi phạm với các cây trồng thuộc các lô đang hoạt động kết nối với bể này
    const activeBatches = await prisma.cropBatch.findMany({
      where: { reservoirId: id, status: 'active' },
      include: { cultivar: true, zone: true }
    });

    for (const batch of activeBatches) {
      const c = batch.cultivar;
      // Kiểm tra EC
      if (data.ec < c.recommendedEcMin) {
        await prisma.alert.create({
          data: {
            severity: 'warning',
            status: 'open',
            metric: 'EC',
            title: `EC thấp tại bể ${reservoir.name}`,
            message: `EC đo được ${data.ec} mS/cm thấp hơn ngưỡng khuyến nghị (${c.recommendedEcMin} - ${c.recommendedEcMax}) cho giống ${c.name} (Lô ${batch.batchCode}).`,
            suggestedAction: `Châm thêm Stock A & Stock B để nâng EC lên ${c.recommendedEcMin} mS/cm.`,
            reservoirId: id,
            batchId: batch.id,
            zoneId: batch.zoneId
          }
        });
      }

      // Kiểm tra pH
      if (data.ph > c.recommendedPhMax) {
        await prisma.alert.create({
          data: {
            severity: 'critical',
            status: 'open',
            metric: 'pH',
            title: `pH kiềm hóa tại bể ${reservoir.name}`,
            message: `pH đo được ${data.ph} cao hơn ngưỡng tối ưu (${c.recommendedPhMin} - ${c.recommendedPhMax}) cho giống ${c.name} (Lô ${batch.batchCode}).`,
            suggestedAction: `Châm pH Down (H3PO4 pha loãng) để đưa pH về khoảng ${(c.recommendedPhMin + c.recommendedPhMax) / 2}.`,
            reservoirId: id,
            batchId: batch.id,
            zoneId: batch.zoneId
          }
        });
      } else if (data.ph < c.recommendedPhMin) {
        await prisma.alert.create({
          data: {
            severity: 'critical',
            status: 'open',
            metric: 'pH',
            title: `pH quá chua tại bể ${reservoir.name}`,
            message: `pH đo được ${data.ph} thấp hơn ngưỡng (${c.recommendedPhMin} - ${c.recommendedPhMax}) cho giống ${c.name} (Lô ${batch.batchCode}).`,
            suggestedAction: `Châm pH Up (KOH pha loãng) để tăng pH về ngưỡng thích hợp.`,
            reservoirId: id,
            batchId: batch.id,
            zoneId: batch.zoneId
          }
        });
      }
    }

    return log;
  }
}
