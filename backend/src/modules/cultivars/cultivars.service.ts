import { prisma } from '../../utils/prisma';
import type { CreateCultivarInput, UpdateCultivarInput } from './cultivars.dto';

export class CultivarsService {
  async getAllCultivars() {
    return prisma.cultivar.findMany({
      include: {
        _count: {
          select: {
            batches: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getCultivarById(id: string) {
    const cultivar = await prisma.cultivar.findUnique({
      where: { id },
      include: {
        batches: {
          include: {
            zone: true,
            reservoir: true
          }
        }
      }
    });

    if (!cultivar) {
      throw new Error(`Không tìm thấy giống cây trồng với ID: ${id}`);
    }

    return cultivar;
  }

  async createCultivar(data: CreateCultivarInput, userId?: string) {
    const created = await prisma.cultivar.create({
      data
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_CULTIVAR',
          details: `Thêm mới giống rau: ${created.name} (${created.scientificName})`
        }
      }).catch(() => {});
    }

    return created;
  }

  async updateCultivar(id: string, data: UpdateCultivarInput, userId?: string) {
    await this.getCultivarById(id);

    const updated = await prisma.cultivar.update({
      where: { id },
      data
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_CULTIVAR',
          details: `Cập nhật tiêu chuẩn dinh dưỡng giống: ${updated.name}`
        }
      }).catch(() => {});
    }

    return updated;
  }

  async deleteCultivar(id: string, userId?: string) {
    const cultivar = await this.getCultivarById(id);

    // Kiểm tra xem có lô nào đang trồng giống này không
    const activeBatchesCount = await prisma.cropBatch.count({
      where: {
        cultivarId: id,
        status: 'active'
      }
    });

    if (activeBatchesCount > 0) {
      throw new Error(`Không thể xóa giống '${cultivar.name}' vì đang có ${activeBatchesCount} lô canh tác đang hoạt động sử dụng giống này`);
    }

    await prisma.cultivar.delete({
      where: { id }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_CULTIVAR',
          details: `Xóa danh mục giống cây trồng: ${cultivar.name}`
        }
      }).catch(() => {});
    }

    return { message: `Đã xóa thành công giống cây trồng '${cultivar.name}'` };
  }
}
