import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seeding)...');

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('HydroSmart123@', salt);

  const initialUsers = [
    {
      email: 'admin@hydrosmart.farm',
      fullName: 'Quản Trị Viên Hệ Thống',
      role: Role.SUPER_ADMIN,
      phoneNumber: '0901234567',
      passwordHash: defaultPasswordHash
    },
    {
      email: 'manager@hydrosmart.farm',
      fullName: 'Trần Văn Quản Lý',
      role: Role.FARM_MANAGER,
      phoneNumber: '0902345678',
      passwordHash: defaultPasswordHash
    },
    {
      email: 'engineer@hydrosmart.farm',
      fullName: 'Lê Thị Kỹ Sư',
      role: Role.AGRONOMIST,
      phoneNumber: '0903456789',
      passwordHash: defaultPasswordHash
    },
    {
      email: 'operator@hydrosmart.farm',
      fullName: 'Phạm Văn Vận Hành',
      role: Role.OPERATOR,
      phoneNumber: '0904567890',
      passwordHash: defaultPasswordHash
    }
  ];

  for (const u of initialUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        phoneNumber: u.phoneNumber,
        passwordHash: u.passwordHash,
        isActive: true,
        auditLogs: {
          create: {
            action: 'SYSTEM_SEED',
            details: `Khởi tạo tài khoản mẫu ban đầu: ${u.role}`
          }
        }
      }
    });
    console.log(`✅ Đã tạo tài khoản: ${user.email} (${user.role}) - Mật khẩu: HydroSmart123@`);
  }

  console.log('🎉 Hoàn thành seeding tài khoản mẫu!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
