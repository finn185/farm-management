import { prisma } from '../../utils/prisma';
import type { CreateAlertInput } from './alerts.dto';

export class AlertsService {
  async getAllAlerts(filters?: {
    status?: string;
    severity?: string;
    metric?: string;
    reservoirId?: string;
    batchId?: string;
  }) {
    const where: any = {};
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters?.severity && filters.severity !== 'all') {
      where.severity = filters.severity;
    }
    if (filters?.metric) {
      where.metric = filters.metric;
    }
    if (filters?.reservoirId) {
      where.reservoirId = filters.reservoirId;
    }
    if (filters?.batchId) {
      where.batchId = filters.batchId;
    }

    return prisma.alert.findMany({
      where,
      include: {
        reservoir: {
          select: {
            id: true,
            name: true,
            currentEc: true,
            currentPh: true,
            currentWaterTemp: true
          }
        },
        batch: {
          select: {
            id: true,
            batchCode: true,
            cultivar: {
              select: {
                name: true,
                cropName: true
              }
            }
          }
        },
        zone: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // 'open' first
        { createdAt: 'desc' }
      ]
    });
  }

  async getAlertById(id: string) {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        reservoir: true,
        batch: {
          include: { cultivar: true }
        },
        zone: true
      }
    });

    if (!alert) {
      throw new Error(`Không tìm thấy cảnh báo với ID: ${id}`);
    }

    return alert;
  }

  async createAlert(data: CreateAlertInput) {
    return prisma.alert.create({
      data: {
        severity: data.severity,
        status: data.status,
        metric: data.metric,
        title: data.title,
        message: data.message,
        suggestedAction: data.suggestedAction,
        reservoirId: data.reservoirId,
        batchId: data.batchId,
        zoneId: data.zoneId
      }
    });
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string) {
    await this.getAlertById(id);

    return prisma.alert.update({
      where: { id },
      data: {
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date()
      }
    });
  }

  async resolveAlert(id: string, resolvedBy: string, resolutionNote?: string) {
    await this.getAlertById(id);

    return prisma.alert.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || 'Đã kiểm tra và xử lý thành công'
      }
    });
  }

  async deleteAlert(id: string) {
    await this.getAlertById(id);
    return prisma.alert.delete({
      where: { id }
    });
  }
}
