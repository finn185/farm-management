import { prisma } from '../../utils/prisma';
import { BatchesService } from '../batches/batches.service';

const batchesService = new BatchesService();

export class DashboardService {
  async getDashboardStats() {
    // 1. Lô canh tác đang hoạt động
    const activeBatches = await prisma.cropBatch.findMany({
      where: { status: 'active' },
      include: {
        cultivar: true,
        reservoir: true,
        zone: true,
        observations: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    const totalActivePlants = activeBatches.reduce((acc, b) => acc + (b.currentQuantity || b.plantQuantity), 0);
    const totalInitialPlants = activeBatches.reduce((acc, b) => acc + b.plantQuantity, 0);
    const survivalRate = totalInitialPlants > 0 
      ? Number(((totalActivePlants / totalInitialPlants) * 100).toFixed(1))
      : 98.5;

    // 2. Thu hoạch và doanh thu thực tế
    const harvestRecords = await prisma.harvestRecord.findMany({
      orderBy: { harvestDate: 'desc' }
    });

    const totalHarvestKg = Number(harvestRecords.reduce((acc, h) => acc + h.totalWeightKg, 0).toFixed(1));
    const totalRevenueVnd = harvestRecords.reduce((acc, h) => {
      const price = h.unitPriceVnd || 45000;
      return acc + (h.totalRevenueVnd || (h.totalWeightKg * price));
    }, 0);

    // 3. Bể dinh dưỡng NFT
    const reservoirs = await prisma.reservoir.findMany({
      include: {
        batches: {
          where: { status: 'active' },
          select: { id: true, batchCode: true, cultivar: { select: { name: true } } }
        },
        sensors: true
      },
      orderBy: { name: 'asc' }
    });

    // 4. Cảnh báo kỹ thuật
    const alerts = await prisma.alert.findMany({
      where: { status: { in: ['open', 'acknowledged'] } },
      include: {
        reservoir: { select: { name: true } },
        batch: { select: { batchCode: true } },
        zone: { select: { code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const severityRank: Record<string, number> = {
      emergency: 4,
      critical: 3,
      warning: 2,
      info: 1
    };

    const sortedAlerts = [...alerts].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));

    const openCount = alerts.filter(a => a.status === 'open').length;
    const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
    const emergencyCount = alerts.filter(a => a.severity === 'emergency').length;
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;

    // 5. Sơ đồ 6 phân khu thực địa
    const zonesData = await batchesService.getZones();

    return {
      activeBatchesCount: activeBatches.length,
      totalActivePlants,
      totalInitialPlants,
      survivalRate,
      totalHarvestKg,
      totalRevenueVnd,
      reservoirs: reservoirs.map(r => ({
        id: r.id,
        name: r.name,
        systemType: r.systemType,
        capacityLiters: r.capacityLiters,
        currentVolumeLiters: r.currentVolumeLiters,
        volumePercent: Math.round((r.currentVolumeLiters / r.capacityLiters) * 100),
        currentPh: r.currentPh,
        currentEc: r.currentEc,
        currentWaterTemp: r.currentWaterTemp,
        currentDo: r.currentDo,
        pumpStatus: r.pumpStatus,
        aerationStatus: r.aerationStatus,
        batches: r.batches.map(b => `${b.cultivar.name} (${b.batchCode})`)
      })),
      alertsSummary: {
        openCount,
        acknowledgedCount,
        emergencyCount,
        criticalCount,
        totalActiveAlerts: alerts.length,
        primaryAlert: sortedAlerts[0] || null
      },
      activeBatches: activeBatches.map(b => ({
        id: b.id,
        batchCode: b.batchCode,
        cultivarName: b.cultivar.name,
        cropName: b.cultivar.cropName,
        zoneCode: b.zone?.code || null,
        zoneName: b.zone?.name || null,
        currentQuantity: b.currentQuantity,
        currentStage: b.currentStage,
        status: b.status,
        expectedHarvestDate: b.expectedHarvestDate
      })),
      zones: zonesData.zones,
      legendCounts: zonesData.legendCounts
    };
  }
}
