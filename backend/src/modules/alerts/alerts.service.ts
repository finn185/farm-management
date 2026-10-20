import { prisma } from '../../utils/prisma';
import type { CreateAlertInput } from './alerts.dto';

export class AlertsService {
  async getAllAlerts(filters?: {
    status?: string;
    severity?: string;
    metric?: string;
    reservoirId?: string;
    batchId?: string;
    zoneId?: string;
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
    if (filters?.zoneId) {
      where.zoneId = filters.zoneId;
    }

    const alerts = await prisma.alert.findMany({
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
        { status: 'asc' }, // 'open', 'acknowledged', 'resolved'
        { createdAt: 'desc' }
      ]
    });

    // Sắp xếp ưu tiên:
    // 1. Sự cố đang diễn ra (open, acknowledged) xếp trước sự cố đã giải quyết (resolved)
    // 2. Ưu tiên mức độ nghiêm trọng từ cao đến thấp: Khẩn cấp (emergency: 4) > Nghiêm trọng (critical: 3) > Cảnh báo (warning: 2) > Thông tin (info: 1)
    // 3. Tiến độ tiếp nhận: Chưa tiếp nhận (open: 0) trước Đang xử lý (acknowledged: 1)
    // 4. Thời gian phát sinh mới nhất xếp trước
    const severityRank: Record<string, number> = {
      emergency: 4,
      critical: 3,
      warning: 2,
      info: 1
    };

    return alerts.sort((a, b) => {
      // 1. Phân biệt sự cố đang diễn ra vs đã giải quyết
      const aClosed = a.status === 'resolved' ? 1 : 0;
      const bClosed = b.status === 'resolved' ? 1 : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;

      // 2. ƯU TIÊN MỨC ĐỘ NGHIÊM TRỌNG TỪ CAO ĐẾN THẤP
      const aSev = severityRank[a.severity] || 0;
      const bSev = severityRank[b.severity] || 0;
      if (aSev !== bSev) return bSev - aSev;

      // 3. Trong cùng mức độ: Chưa tiếp nhận (open) trước Đang xử lý (acknowledged)
      const aStat = a.status === 'open' ? 0 : 1;
      const bStat = b.status === 'open' ? 0 : 1;
      if (aStat !== bStat) return aStat - bStat;

      // 4. Thời gian phát sinh mới nhất xếp trước
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
        thresholdValue: data.thresholdValue,
        actualValue: data.actualValue,
        unit: data.unit,
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
        resolutionNote: resolutionNote || 'Đã kiểm tra và xử lý thành công tại hiện trường'
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
