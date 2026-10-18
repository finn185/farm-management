-- ==============================================================================
-- HydroSmart Farm Management System - PostgreSQL Database Initialization Script
-- Tệp SQL khởi tạo toàn bộ schema & dữ liệu mẫu cho hệ thống HydroSmart
-- Dùng được trực tiếp trên: Docker, pgAdmin, DBeaver, Navicat, psql CLI...
-- ==============================================================================

-- 1. Xóa các bảng cũ nếu tồn tại (để có thể chạy lại file nhiều lần an toàn)
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

-- 2. Định nghĩa Enum Role cho các vị trí phân quyền trong trang trại thủy canh
CREATE TYPE "Role" AS ENUM (
    'SUPER_ADMIN',    -- Quản trị viên cao cấp
    'FARM_MANAGER',   -- Quản lý trang trại
    'AGRONOMIST',     -- Kỹ sư nông học / dinh dưỡng
    'OPERATOR'        -- Kỹ thuật viên / công nhân vận hành
);

-- 3. Tạo bảng người dùng (users)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "Role" NOT NULL DEFAULT 'AGRONOMIST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 4. Tạo chỉ mục duy nhất (Unique Index) cho email
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- 5. Tạo bảng nhật ký hoạt động người dùng (audit_logs)
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Tự động chèn 4 tài khoản mẫu ban đầu (Mật khẩu mặc định: HydroSmart123@)
-- Mật khẩu đã được mã hóa bằng bcrypt (salt rounds = 10):
-- Hash: $2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC

INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "phoneNumber", "role", "isActive", "createdAt", "updatedAt")
VALUES
  (
    'usr-admin-001',
    'admin@hydrosmart.farm',
    '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC',
    'Quản Trị Viên Hệ Thống',
    '0901234567',
    'SUPER_ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'usr-mgr-002',
    'manager@hydrosmart.farm',
    '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC',
    'Trần Văn Quản Lý',
    '0902345678',
    'FARM_MANAGER',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'usr-agro-003',
    'engineer@hydrosmart.farm',
    '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC',
    'Lê Thị Kỹ Sư Nông Học',
    '0903456789',
    'AGRONOMIST',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'usr-op-004',
    'operator@hydrosmart.farm',
    '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC',
    'Phạm Văn Vận Hành',
    '0904567890',
    'OPERATOR',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Ghi nhận log khởi tạo mẫu
INSERT INTO "audit_logs" ("id", "userId", "action", "details", "ipAddress", "createdAt")
VALUES
  ('log-001', 'usr-admin-001', 'SYSTEM_SEED', 'Khởi tạo tài khoản Quản trị viên', '127.0.0.1', CURRENT_TIMESTAMP),
  ('log-002', 'usr-mgr-002',   'SYSTEM_SEED', 'Khởi tạo tài khoản Quản lý trang trại', '127.0.0.1', CURRENT_TIMESTAMP),
  ('log-003', 'usr-agro-003',  'SYSTEM_SEED', 'Khởi tạo tài khoản Kỹ sư nông học', '127.0.0.1', CURRENT_TIMESTAMP),
  ('log-004', 'usr-op-004',    'SYSTEM_SEED', 'Khởi tạo tài khoản Kỹ thuật viên', '127.0.0.1', CURRENT_TIMESTAMP);
