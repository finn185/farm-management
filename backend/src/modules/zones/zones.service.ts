import { prisma } from '../../utils/prisma';
import type { CreateZoneInput, UpdateZoneInput } from './zones.dto';

export class ZonesService {
  async getAllZones() {
    return prisma.farmZone.findMany({
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
            observations: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        },
        alerts: {
          where: { status: 'open' }
        }
      },
      orderBy: { code: 'asc' }
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
