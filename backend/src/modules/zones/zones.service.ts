import { prisma } from '../../utils/prisma';
import type { CreateZoneInput, UpdateZoneInput } from './zones.dto';

export class ZonesService {
  async getAllZones() {
    const zones = await prisma.farmZone.findMany({
      include: {
        reservoir: {
          select: {
            id: true,
            name: true,
            currentEc: true,
            currentPh: true,
            currentWaterTemp: true,
            pumpStatus: true,
            aerationStatus: true
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
                recommendedEcMax: true
              }
            },
            alerts: {
              where: { status: { in: ['open', 'acknowledged'] } }
            },
            observations: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        },
        alerts: {
          where: { status: { in: ['open', 'acknowledged'] } }
        }
      },
      orderBy: { code: 'asc' }
    });

    const calcProgress = (seedDateStr: string, harvestDateStr: string, stage: string, status: string) => {
      if (status === 'harvested') return 100;
      try {
        const start = new Date(seedDateStr).getTime();
        const end = new Date(harvestDateStr).getTime();
        const now = Date.now();
        if (end > start && now >= start) {
          const p = Math.round(((now - start) / (end - start)) * 100);
          if (p >= 5 && p <= 99) return p;
        }
      } catch {
        // fallback below
      }
      if (stage === 'harvest') return 95;
      if (stage === 'pre_harvest') return 80;
      if (stage === 'vegetative') return 55;
      if (stage === 'seedling') return 25;
      return 50;
    };

    return zones.map(z => {
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

      const hasCriticalAlert = (z.alerts && z.alerts.some(a => a.severity === 'critical' || a.severity === 'emergency')) ||
        (activeBatch?.alerts && activeBatch.alerts.some(a => a.severity === 'critical' || a.severity === 'emergency'));

      let computedStatus = z.status;
      let computedColor = z.color;

      if (hasCriticalAlert) {
        computedStatus = 'needs_attention';
        computedColor = '#ef4444';
      } else if (activeBatch) {
        if (daysRemaining <= 3 || activeBatch.currentStage === 'pre_harvest' || activeBatch.currentStage === 'harvest') {
          computedStatus = 'ready_soon';
          computedColor = '#f59e0b';
        } else {
          computedStatus = 'growing';
          computedColor = '#16a34a';
        }
      }

      return {
        ...z,
        color: computedColor,
        status: computedStatus,
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
  }

  async getZoneById(id: string) {
    const zone = await prisma.farmZone.findUnique({
      where: { id },
      include: {
        reservoir: true,
        batches: {
          include: {
            cultivar: true,
            observations: true
          }
        },
        alerts: true
      }
    });

    if (!zone) {
      throw new Error(`Không tìm thấy phân khu với ID: ${id}`);
    }

    return zone;
  }

  async createZone(data: CreateZoneInput, userId?: string) {
    const created = await prisma.farmZone.create({
      data
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_ZONE',
          details: `Thêm mới giàn canh tác phân khu: ${created.code} - ${created.name}`
        }
      }).catch(() => {});
    }

    return created;
  }

  async updateZone(id: string, data: UpdateZoneInput, userId?: string) {
    await this.getZoneById(id);

    const updated = await prisma.farmZone.update({
      where: { id },
      data
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_ZONE',
          details: `Cập nhật thông tin phân khu: ${updated.code} - ${updated.name}`
        }
      }).catch(() => {});
    }

    return updated;
  }
}
