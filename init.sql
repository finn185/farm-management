-- ==============================================================================
-- HydroSmart Farm Management System - PostgreSQL Database Initialization Script
-- Tệp SQL khởi tạo toàn bộ schema & dữ liệu mẫu chuẩn hóa cho hệ thống HydroSmart
-- Dùng được trực tiếp trên: Docker, pgAdmin, DBeaver, Navicat, psql CLI...
-- ==============================================================================

-- 1. Xóa các bảng cũ nếu tồn tại theo thứ tự ràng buộc khóa ngoại
DROP TABLE IF EXISTS "environment_logs" CASCADE;
DROP TABLE IF EXISTS "sensors" CASCADE;
DROP TABLE IF EXISTS "solution_drain_events" CASCADE;
DROP TABLE IF EXISTS "water_quality_logs" CASCADE;
DROP TABLE IF EXISTS "harvest_records" CASCADE;
DROP TABLE IF EXISTS "alerts" CASCADE;
DROP TABLE IF EXISTS "crop_observations" CASCADE;
DROP TABLE IF EXISTS "crop_batches" CASCADE;
DROP TABLE IF EXISTS "farm_zones" CASCADE;
DROP TABLE IF EXISTS "reservoirs" CASCADE;
DROP TABLE IF EXISTS "cultivars" CASCADE;
DROP TABLE IF EXISTS "nutrient_formulas" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "GrowthStage" CASCADE;
DROP TYPE IF EXISTS "BatchStatus" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

-- 2. Định nghĩa Enum Role
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

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- 4. Tạo bảng nhật ký hoạt động (audit_logs)
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

-- 5. Định nghĩa Enum Vòng đời sinh trưởng & Trạng thái lô
CREATE TYPE "GrowthStage" AS ENUM (
    'seed',
    'germination',
    'seedling',
    'transplant',
    'vegetative',
    'pre_harvest',
    'harvest'
);

CREATE TYPE "BatchStatus" AS ENUM (
    'active',
    'harvested',
    'failed'
);

-- 6. Tạo bảng giống cây trồng & thông số sinh trưởng tiêu chuẩn (cultivars)
CREATE TABLE "cultivars" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetCycleDays" INTEGER NOT NULL DEFAULT 35,
    "expectedWeightG" DOUBLE PRECISION NOT NULL DEFAULT 200.0,

    -- Dinh dưỡng & Nước thủy canh
    "recommendedPhMin" DOUBLE PRECISION NOT NULL DEFAULT 5.5,
    "recommendedPhMax" DOUBLE PRECISION NOT NULL DEFAULT 6.5,
    "recommendedEcMin" DOUBLE PRECISION NOT NULL DEFAULT 1.4,
    "recommendedEcMax" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "optimalWaterTempMin" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "optimalWaterTempMax" DOUBLE PRECISION NOT NULL DEFAULT 24.0,
    "minWaterLevelPercent" DOUBLE PRECISION NOT NULL DEFAULT 20.0,

    -- Vi khí hậu & Ánh sáng
    "optimalAirTempMin" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "optimalAirTempMax" DOUBLE PRECISION NOT NULL DEFAULT 26.0,
    "optimalHumidityMin" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "optimalHumidityMax" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "optimalLightPpfdMin" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "optimalLightPpfdMax" DOUBLE PRECISION NOT NULL DEFAULT 250.0,
    "optimalLightDliMin" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "optimalLightDliMax" DOUBLE PRECISION NOT NULL DEFAULT 17.0,

    -- Cấu hình thông số chi tiết theo từng giai đoạn sinh trưởng (JSONB)
    "stageConfigs" JSONB,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cultivars_pkey" PRIMARY KEY ("id")
);

-- 7. Tạo bảng công thức dinh dưỡng tiêu chuẩn khoa học (nutrient_formulas)
CREATE TABLE "nutrient_formulas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicableCrop" TEXT NOT NULL,
    "systemType" TEXT NOT NULL DEFAULT 'NFT',
    "scientificStandard" TEXT NOT NULL,
    "targetEc" DOUBLE PRECISION NOT NULL,
    "targetPh" DOUBLE PRECISION NOT NULL,
    "dosingRatio" TEXT NOT NULL,
    "chemicalIncompatibilityReason" TEXT NOT NULL,
    "stockADetails" TEXT NOT NULL,
    "stockBDetails" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrient_formulas_pkey" PRIMARY KEY ("id")
);

-- 8. Tạo bảng bể dinh dưỡng tuần hoàn NFT (reservoirs)
CREATE TABLE "reservoirs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemType" TEXT NOT NULL DEFAULT 'NFT',
    "capacityLiters" DOUBLE PRECISION NOT NULL DEFAULT 600.0,
    "currentVolumeLiters" DOUBLE PRECISION NOT NULL DEFAULT 540.0,
    "currentPh" DOUBLE PRECISION NOT NULL DEFAULT 5.8,
    "currentEc" DOUBLE PRECISION NOT NULL DEFAULT 1.7,
    "currentWaterTemp" DOUBLE PRECISION NOT NULL DEFAULT 22.0,
    "currentDo" DOUBLE PRECISION,
    "formulaName" TEXT NOT NULL DEFAULT 'Chuẩn Hoagland - Resh',
    "lastTopUpDate" TEXT,
    "lastReplacementDate" TEXT,
    "pumpStatus" TEXT NOT NULL DEFAULT 'running',
    "aerationStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservoirs_pkey" PRIMARY KEY ("id")
);

-- 9. Tạo bảng phân khu / giàn canh tác thực địa NFT (farm_zones)
CREATE TABLE "farm_zones" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "greenhouse" TEXT NOT NULL DEFAULT 'Nhà màng 1',
    "areaM2" DOUBLE PRECISION NOT NULL,
    "slotCapacity" INTEGER NOT NULL DEFAULT 10000,
    "color" TEXT NOT NULL DEFAULT '#16a34a',
    "status" TEXT NOT NULL DEFAULT 'growing',
    "reservoirId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_zones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "farm_zones_reservoirId_fkey" FOREIGN KEY ("reservoirId") REFERENCES "reservoirs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "farm_zones_code_key" ON "farm_zones"("code");

-- 10. Tạo bảng lô canh tác (crop_batches)
CREATE TABLE "crop_batches" (
    "id" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "cultivarId" TEXT NOT NULL,
    "reservoirId" TEXT NOT NULL,
    "zoneId" TEXT,
    "systemType" TEXT NOT NULL DEFAULT 'NFT',
    "plantQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "seedDate" TEXT NOT NULL,
    "transplantDate" TEXT NOT NULL,
    "expectedHarvestDate" TEXT NOT NULL,
    "actualHarvestDate" TEXT,
    "currentStage" "GrowthStage" NOT NULL DEFAULT 'seedling',
    "status" "BatchStatus" NOT NULL DEFAULT 'active',
    "densityPlantsPerM2" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "crop_batches_cultivarId_fkey" FOREIGN KEY ("cultivarId") REFERENCES "cultivars"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "crop_batches_reservoirId_fkey" FOREIGN KEY ("reservoirId") REFERENCES "reservoirs"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "crop_batches_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "crop_batches_batchCode_key" ON "crop_batches"("batchCode");

-- 11. Tạo bảng đo đạc sinh trắc học cây trồng (crop_observations)
CREATE TABLE "crop_observations" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "avgLeafCount" DOUBLE PRECISION NOT NULL,
    "avgHeightCm" DOUBLE PRECISION NOT NULL,
    "sampleWeightG" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_observations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "crop_observations_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "crop_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 12. Tạo bảng cảnh báo vi phạm ngưỡng dinh dưỡng & kỹ thuật (alerts)
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning', -- emergency, critical, warning, info
    "status" TEXT NOT NULL DEFAULT 'open',       -- open, acknowledged, resolved
    "metric" TEXT NOT NULL,                     -- pH, EC, DO, Temp, WaterLevel, AirTemp, Humidity, Light, Nutrient, System
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "suggestedAction" TEXT,
    "thresholdValue" DOUBLE PRECISION,
    "actualValue" DOUBLE PRECISION,
    "unit" TEXT,
    "reservoirId" TEXT,
    "batchId" TEXT,
    "zoneId" TEXT,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "alerts_reservoirId_fkey" FOREIGN KEY ("reservoirId") REFERENCES "reservoirs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "alerts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "crop_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "alerts_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 13. Tạo bảng nhật ký thu hoạch (harvest_records)
CREATE TABLE "harvest_records" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "cultivarName" TEXT NOT NULL,
    "harvestDate" TEXT NOT NULL,
    "harvestedPlants" INTEGER NOT NULL,
    "totalWeightKg" DOUBLE PRECISION NOT NULL,
    "avgWeightG" DOUBLE PRECISION NOT NULL,
    "rejectedWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiPredictedWeightG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "differencePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lossPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'A',
    "unitPriceVnd" DOUBLE PRECISION NOT NULL DEFAULT 45000,
    "totalRevenueVnd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "operatorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvest_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "harvest_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "crop_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 14. Tạo bảng nhật ký chất lượng nước thời gian thực (water_quality_logs)
CREATE TABLE "water_quality_logs" (
    "id" TEXT NOT NULL,
    "reservoirId" TEXT NOT NULL,
    "ph" DOUBLE PRECISION NOT NULL,
    "ec" DOUBLE PRECISION NOT NULL,
    "waterTemp" DOUBLE PRECISION NOT NULL,
    "doLevel" DOUBLE PRECISION,
    "waterLevelPercent" DOUBLE PRECISION,
    "recordedBy" TEXT,
    "source" TEXT NOT NULL DEFAULT 'sensor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_quality_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "water_quality_logs_reservoirId_fkey" FOREIGN KEY ("reservoirId") REFERENCES "reservoirs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 15. Tạo bảng sự kiện xả / thay dung dịch bể dinh dưỡng (solution_drain_events)
CREATE TABLE "solution_drain_events" (
    "id" TEXT NOT NULL,
    "reservoirId" TEXT NOT NULL,
    "batchId" TEXT,
    "drainDate" TEXT NOT NULL,
    "volumeDrainedLiters" DOUBLE PRECISION NOT NULL,
    "finalPh" DOUBLE PRECISION NOT NULL,
    "finalEc" DOUBLE PRECISION NOT NULL,
    "finalDo" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solution_drain_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "solution_drain_events_reservoirId_fkey" FOREIGN KEY ("reservoirId") REFERENCES "reservoirs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 16. Tạo bảng thiết bị cảm biến giám sát IoT (sensors)
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'online', -- online, offline, warning, error, calibrating
    "reservoirId" TEXT,
    "zoneId" TEXT,
    "lastReading" DOUBLE PRECISION,
    "unit" TEXT,
    "lastSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "batteryLevel" DOUBLE PRECISION DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sensors_reservoirId_fkey" FOREIGN KEY ("reservoirId") REFERENCES "reservoirs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sensors_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sensors_code_key" ON "sensors"("code");

-- 17. Tạo bảng nhật ký vi khí hậu môi trường (environment_logs)
CREATE TABLE "environment_logs" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT,
    "airTemp" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "co2" DOUBLE PRECISION,
    "ppfd" DOUBLE PRECISION,
    "dli" DOUBLE PRECISION,
    "vpd" DOUBLE PRECISION,
    "recordedBy" TEXT DEFAULT 'sensor',
    "source" TEXT NOT NULL DEFAULT 'sensor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "environment_logs_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ==============================================================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA ĐỒNG BỘ LOGIC THỰC TẾ)
-- ==============================================================================

-- 1. Tài khoản mẫu ban đầu (Mật khẩu: HydroSmart123@)
INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "phoneNumber", "role", "isActive", "createdAt", "updatedAt")
VALUES
  ('usr-admin-001', 'admin@hydrosmart.farm', '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC', 'Quản Trị Viên Hệ Thống', '0901234567', 'SUPER_ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-mgr-002',   'manager@hydrosmart.farm', '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC', 'Trần Văn Quản Lý', '0902345678', 'FARM_MANAGER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-agro-003',  'engineer@hydrosmart.farm', '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC', 'Lê Thị Kỹ Sư Nông Học', '0903456789', 'AGRONOMIST', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-op-004',    'operator@hydrosmart.farm', '$2a$10$npK4zhHIHrw6.AMT7zvorOqgGX.9HDaUaxVKTO3Te9.iznk6hdXOC', 'Phạm Văn Vận Hành', '0904567890', 'OPERATOR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Dữ liệu Giống xà lách chuẩn kèm dải ngưỡng kỹ thuật dinh dưỡng & vi khí hậu chi tiết từng giai đoạn
INSERT INTO "cultivars" (
  "id", "cropName", "name", "scientificName", "description", 
  "targetCycleDays", "expectedWeightG", 
  "recommendedPhMin", "recommendedPhMax", "recommendedEcMin", "recommendedEcMax", 
  "optimalWaterTempMin", "optimalWaterTempMax", "minWaterLevelPercent",
  "optimalAirTempMin", "optimalAirTempMax", "optimalHumidityMin", "optimalHumidityMax",
  "optimalLightPpfdMin", "optimalLightPpfdMax", "optimalLightDliMin", "optimalLightDliMax",
  "stageConfigs"
)
VALUES
  (
    'cult-01', 'Xà lách (Lettuce)', 'Green Oak Leaf', 'Lactuca sativa var. crispa', 
    'Xà lách lá sồi xanh, tán xòe đẹp, thích hợp hệ thống NFT, chu kỳ ngắn, năng suất cao, vị ngọt nhẹ.', 
    35, 190.0, 
    5.6, 6.2, 1.4, 1.9, 
    18.0, 24.0, 20.0,
    18.0, 25.0, 60.0, 75.0,
    160.0, 240.0, 13.0, 17.0,
    '{
      "stages": [
        {"stage": "seed", "days": 3, "phMin": 5.8, "phMax": 6.2, "ecMin": 0.0, "ecMax": 0.5, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 0, "notes": "Giai đoạn ủ hạt bóng tối độ ẩm 90%"},
        {"stage": "seedling", "days": 10, "phMin": 5.6, "phMax": 6.0, "ecMin": 1.0, "ecMax": 1.4, "waterTempMin": 18, "waterTempMax": 23, "lightDli": 10, "notes": "Cây con ươm giá thể xơ dừa, bắt đầu quang hợp"},
        {"stage": "transplant", "days": 3, "phMin": 5.6, "phMax": 6.0, "ecMin": 1.3, "ecMax": 1.6, "waterTempMin": 19, "waterTempMax": 23, "lightDli": 12, "notes": "Chuyển lên giàn máng tuần hoàn NFT, hồi xanh bén rễ"},
        {"stage": "vegetative", "days": 14, "phMin": 5.6, "phMax": 6.2, "ecMin": 1.5, "ecMax": 1.9, "waterTempMin": 20, "waterTempMax": 24, "lightDli": 15, "notes": "Tăng trưởng sinh khối nhanh, quang hợp mạnh mẽ"},
        {"stage": "pre_harvest", "days": 5, "phMin": 5.8, "phMax": 6.2, "ecMin": 1.4, "ecMax": 1.7, "waterTempMin": 19, "waterTempMax": 23, "lightDli": 14, "notes": "Hạ nhẹ EC để giải phóng tồn dư nitrat, cuộn búp chắc"},
        {"stage": "harvest", "days": 1, "phMin": 5.8, "phMax": 6.2, "ecMin": 1.3, "ecMax": 1.6, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 12, "notes": "Thu hoạch buổi sáng sớm trước 9h để giữ độ giòn tươi"}
      ]
    }'::jsonb
  ),
  (
    'cult-02', 'Xà lách (Lettuce)', 'Batavia Lettuce', 'Lactuca sativa var. capitata', 
    'Xà lách cuộn giòn chịu nhiệt tốt, thích hợp hệ thống máng tuần hoàn NFT vùng nhiệt đới, lá dày giòn ngọt.', 
    36, 205.0, 
    5.8, 6.3, 1.5, 2.0, 
    19.0, 25.0, 20.0,
    19.0, 27.0, 60.0, 80.0,
    170.0, 250.0, 14.0, 18.0,
    '{
      "stages": [
        {"stage": "seed", "days": 3, "phMin": 5.8, "phMax": 6.2, "ecMin": 0.0, "ecMax": 0.5, "waterTempMin": 19, "waterTempMax": 23, "lightDli": 0, "notes": "Ủ nảy mầm"},
        {"stage": "seedling", "days": 11, "phMin": 5.8, "phMax": 6.1, "ecMin": 1.1, "ecMax": 1.5, "waterTempMin": 19, "waterTempMax": 24, "lightDli": 11, "notes": "Phát triển 2-3 lá thật"},
        {"stage": "transplant", "days": 3, "phMin": 5.8, "phMax": 6.2, "ecMin": 1.4, "ecMax": 1.7, "waterTempMin": 20, "waterTempMax": 24, "lightDli": 13, "notes": "Cố định rọ máng NFT"},
        {"stage": "vegetative", "days": 14, "phMin": 5.8, "phMax": 6.3, "ecMin": 1.6, "ecMax": 2.0, "waterTempMin": 20, "waterTempMax": 25, "lightDli": 16, "notes": "Cuộn búp giòn"},
        {"stage": "pre_harvest", "days": 4, "phMin": 5.9, "phMax": 6.3, "ecMin": 1.4, "ecMax": 1.8, "waterTempMin": 20, "waterTempMax": 24, "lightDli": 14, "notes": "Định hình khối lượng"},
        {"stage": "harvest", "days": 1, "phMin": 5.8, "phMax": 6.3, "ecMin": 1.4, "ecMax": 1.7, "waterTempMin": 19, "waterTempMax": 23, "lightDli": 12, "notes": "Sẵn sàng thu hoạch"}
      ]
    }'::jsonb
  ),
  (
    'cult-03', 'Xà lách (Lettuce)', 'Romaine (Cos)', 'Lactuca sativa var. longifolia', 
    'Xà lách La Mã thân đứng, lá dày nhiều vitamin và khoáng chất, chịu được EC cao hơn, búp chắc.', 
    38, 230.0, 
    5.5, 6.0, 1.6, 2.1, 
    18.0, 23.5, 25.0,
    18.0, 25.0, 55.0, 75.0,
    180.0, 260.0, 14.0, 19.0,
    '{
      "stages": [
        {"stage": "seed", "days": 3, "phMin": 5.6, "phMax": 6.0, "ecMin": 0.0, "ecMax": 0.5, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 0, "notes": "Gieo hạt"},
        {"stage": "seedling", "days": 12, "phMin": 5.5, "phMax": 5.9, "ecMin": 1.2, "ecMax": 1.6, "waterTempMin": 18, "waterTempMax": 23, "lightDli": 12, "notes": "Bung lá mầm và 2 lá thật"},
        {"stage": "transplant", "days": 3, "phMin": 5.5, "phMax": 6.0, "ecMin": 1.5, "ecMax": 1.8, "waterTempMin": 19, "waterTempMax": 23, "lightDli": 14, "notes": "Lên giàn máng Romaine"},
        {"stage": "vegetative", "days": 15, "phMin": 5.5, "phMax": 6.0, "ecMin": 1.7, "ecMax": 2.1, "waterTempMin": 19, "waterTempMax": 23.5, "lightDli": 18, "notes": "Lá đứng vươn cao tích lũy dinh dưỡng"},
        {"stage": "pre_harvest", "days": 4, "phMin": 5.6, "phMax": 6.0, "ecMin": 1.5, "ecMax": 1.9, "waterTempMin": 18, "waterTempMax": 22.5, "lightDli": 15, "notes": "Cuộn chặt thân búp"},
        {"stage": "harvest", "days": 1, "phMin": 5.5, "phMax": 6.0, "ecMin": 1.4, "ecMax": 1.8, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 12, "notes": "Thu hoạch"}
      ]
    }'::jsonb
  ),
  (
    'cult-04', 'Xà lách (Lettuce)', 'Lollo Rossa', 'Lactuca sativa var. crispa', 
    'Xà lách lá sồi đỏ tím, giàu anthocyanin chống oxy hóa, viền lá xoăn tít thẩm mỹ cao cho salad nhà hàng.', 
    37, 185.0, 
    5.6, 6.2, 1.4, 1.9, 
    18.0, 23.0, 20.0,
    18.0, 24.0, 60.0, 75.0,
    180.0, 250.0, 14.0, 18.0,
    '{
      "stages": [
        {"stage": "seedling", "days": 10, "phMin": 5.6, "phMax": 6.0, "ecMin": 1.1, "ecMax": 1.4, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 11, "notes": "Cây con viền đỏ nhạt"},
        {"stage": "vegetative", "days": 18, "phMin": 5.6, "phMax": 6.2, "ecMin": 1.5, "ecMax": 1.9, "waterTempMin": 18, "waterTempMax": 23, "lightDli": 16, "notes": "Đòi hỏi ánh sáng mạnh để tạo sắc tố đỏ đậm"},
        {"stage": "harvest", "days": 1, "phMin": 5.8, "phMax": 6.2, "ecMin": 1.3, "ecMax": 1.7, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 12, "notes": "Thu hoạch"}
      ]
    }'::jsonb
  ),
  (
    'cult-05', 'Xà lách (Lettuce)', 'Butterhead (Mỡ)', 'Lactuca sativa var. capitata', 
    'Xà lách mỡ lá mềm mịn như bơ, cuộn lỏng, vị thơm ngọt bùi, được ưa chuộng hàng đầu.', 
    40, 220.0, 
    5.6, 6.2, 1.3, 1.8, 
    18.0, 23.0, 20.0,
    17.0, 24.0, 60.0, 75.0,
    150.0, 220.0, 12.0, 16.0,
    '{
      "stages": [
        {"stage": "seedling", "days": 12, "phMin": 5.6, "phMax": 6.0, "ecMin": 1.0, "ecMax": 1.3, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 10, "notes": "Cây con lá bóng mượt"},
        {"stage": "vegetative", "days": 20, "phMin": 5.6, "phMax": 6.2, "ecMin": 1.4, "ecMax": 1.8, "waterTempMin": 18, "waterTempMax": 23, "lightDli": 15, "notes": "Lá bơ xếp tầng cuộn búp mềm"},
        {"stage": "harvest", "days": 1, "phMin": 5.8, "phMax": 6.2, "ecMin": 1.3, "ecMax": 1.6, "waterTempMin": 18, "waterTempMax": 22, "lightDli": 12, "notes": "Thu hoạch"}
      ]
    }'::jsonb
  );

-- 3. Công thức dinh dưỡng chuyên biệt chuẩn nông nghiệp NFT
INSERT INTO "nutrient_formulas" ("id", "name", "applicableCrop", "systemType", "scientificStandard", "targetEc", "targetPh", "dosingRatio", "chemicalIncompatibilityReason", "stockADetails", "stockBDetails", "notes")
VALUES
  ('form-01', 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)', 'Xà lách (Lettuce)', 'NFT', 'Hoagland & Arnon Modified (Resh 2012)', 1.7, 5.8, '1:100 (10ml Stock A + 10ml Stock B cho 1 Lít nước)', 'Stock A chứa Canxi (Ca2+) và Sắt chelate (Fe-EDDHA). Stock B chứa Photphat (H2PO4-) và Sunfat (SO4 2-). Tuyệt đối không pha chung trực tiếp ở dạng đậm đặc vì sẽ xảy ra phản ứng kết tủa Canxi Sunfat (Thạch cao - CaSO4) và Canxi Photphat (Ca3(PO4)2) làm tắc đường ống máng NFT và cây mất hoàn toàn khả năng hấp thu dinh dưỡng.', 'Canxi Nitrat [Ca(NO3)2.4H2O], Kali Nitrat [KNO3], Sắt Chelate Fe-EDDHA 6% (đỏ đậm bền vững pH 5.0 - 7.5)', 'Monokali Photphat [KH2PO4], Magie Sunfat [MgSO4.7H2O], Kali Sunfat [K2SO4], Vi lượng chelated Solubor (B), Mn, Zn, Cu, Mo', 'Công thức ổn định dinh dưỡng cho máng mỏng NFT vùng nhiệt đới.'),
  ('form-02', 'Cornell CEA Lettuce Standard', 'Xà lách (Lettuce)', 'NFT', 'Cornell Controlled Environment Agriculture', 1.8, 5.9, '1:100 (10ml Stock A + 10ml Stock B cho 1 Lít nước)', 'Ngăn ngừa phản ứng kết tủa ion Canxi và Sunfat/Photphat ở nồng độ cao trước khi hòa vào bể chính.', 'Canxi Nitrat, Amoni Nitrat NH4NO3, Sắt Chelate Fe-DTPA 7%', 'Monokali Photphat, Magie Sunfat, Chelate vi lượng tổng hợp', 'Phù hợp canh tác môi trường kiểm soát nhiệt độ điều hòa & ánh sáng bổ sung.');

-- 4. Bể dinh dưỡng tuần hoàn NFT
INSERT INTO "reservoirs" ("id", "name", "systemType", "capacityLiters", "currentVolumeLiters", "currentPh", "currentEc", "currentWaterTemp", "currentDo", "formulaName", "lastTopUpDate", "lastReplacementDate", "pumpStatus", "aerationStatus")
VALUES
  ('res-01', 'Bể Tuần Hoàn 01 - Giàn NFT Tầng 1 (Khu A & E)', 'NFT', 600.0, 540.0, 5.85, 1.72, 22.4, 6.8, 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)', '2026-09-09', '2026-08-25', 'running', 'active'),
  ('res-02', 'Bể Tuần Hoàn 02 - Giàn NFT Tầng 2 (Khu B, C, D)', 'NFT', 1000.0, 920.0, 6.75, 1.84, 21.8, 7.2, 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)', '2026-09-08', '2026-08-20', 'running', 'active');

-- 5. Phân khu thực địa & Giàn canh tác NFT (farm_zones)
INSERT INTO "farm_zones" ("id", "code", "name", "greenhouse", "areaM2", "slotCapacity", "color", "status", "reservoirId")
VALUES
  ('zone-a1', 'A1', 'Phân khu A1 - Nhà màng 1', 'Nhà màng 1', 500.0, 12500, '#16a34a', 'growing', 'res-01'),
  ('zone-a2', 'A2', 'Phân khu A2 - Nhà màng 1', 'Nhà màng 1', 600.0, 15000, '#84cc16', 'growing', 'res-01'),
  ('zone-b2', 'B2', 'Phân khu B2 - Nhà màng 1', 'Nhà màng 1', 300.0, 7500,  '#f59e0b', 'ready_soon', 'res-02'),
  ('zone-d1', 'D1', 'Phân khu D1 - Nhà màng 2', 'Nhà màng 2', 400.0, 10000, '#0ea5e9', 'completed', 'res-02'),
  ('zone-c1', 'C1', 'Phân khu C1 - Nhà màng 2', 'Nhà màng 2', 800.0, 20000, '#8b5cf6', 'completed', 'res-02'),
  ('zone-e1', 'E1', 'Phân khu E1 - Nhà màng 2', 'Nhà màng 2', 100.0, 2500,  '#ef4444', 'needs_attention', 'res-01');

-- 6. Lô cây trồng chuẩn
INSERT INTO "crop_batches" ("id", "batchCode", "cultivarId", "reservoirId", "zoneId", "systemType", "plantQuantity", "currentQuantity", "seedDate", "transplantDate", "expectedHarvestDate", "currentStage", "status", "densityPlantsPerM2", "notes")
VALUES
  ('batch-01', 'LET-2026-001', 'cult-01', 'res-01', 'zone-a1', 'NFT', 650, 642, '2026-08-15', '2026-08-27', '2026-09-19', 'vegetative', 'active', 26.0, 'Máng NFT giàn A1, tốc độ sinh trưởng đồng đều 55%, rễ trắng khỏe.'),
  ('batch-02', 'LET-2026-002', 'cult-02', 'res-01', 'zone-a2', 'NFT', 500, 495, '2026-08-28', '2026-09-08', '2026-10-02', 'seedling', 'active', 24.0, 'Giàn A2 mới chuyển máng NFT 2 ngày, bén rễ tốt 25%, bung lá thật thứ 3.'),
  ('batch-03', 'LET-2026-003', 'cult-03', 'res-02', 'zone-b2', 'NFT', 800, 785, '2026-08-04', '2026-08-16', '2026-09-12', 'pre_harvest', 'active', 22.0, 'Giàn B2 giai đoạn tích lũy sinh khối 80%. Sẵn sàng thu hoạch.');

-- 7. Lịch sử đo đạc sinh trắc học
INSERT INTO "crop_observations" ("id", "batchId", "date", "avgLeafCount", "avgHeightCm", "sampleWeightG", "notes")
VALUES
  ('obs-01', 'batch-01', '2026-09-08', 16.0, 15.2, 142.5, 'Rễ phân nhánh nhiều, không có dấu hiệu nấm bệnh'),
  ('obs-02', 'batch-02', '2026-09-09', 6.0, 6.8, 34.0, 'Cây con hồi xanh khỏe mạnh sau khi chuyển máng'),
  ('obs-03', 'batch-03', '2026-09-09', 24.0, 22.4, 228.0, 'Búp cuộn đặc, sẵn sàng thu hoạch trong 3 ngày tới');

-- 8. Cảm biến giám sát IoT (sensors)
INSERT INTO "sensors" ("id", "code", "name", "sensorType", "status", "reservoirId", "zoneId", "lastReading", "unit", "batteryLevel", "lastSeenAt")
VALUES
  ('sen-01', 'SEN-PH-01',   'Cảm biến pH Bể Tuần Hoàn 01',             'ph',          'online', 'res-01', NULL,      5.85, 'pH',      98.0, CURRENT_TIMESTAMP),
  ('sen-02', 'SEN-EC-01',   'Cảm biến Độ dẫn điện EC Bể Tuần Hoàn 01', 'ec',          'online', 'res-01', NULL,      1.72, 'mS/cm',   97.0, CURRENT_TIMESTAMP),
  ('sen-03', 'SEN-TEMP-01', 'Cảm biến Nhiệt độ nước Bể 01',            'water_temp',  'online', 'res-01', NULL,      22.4, '°C',      99.0, CURRENT_TIMESTAMP),
  ('sen-04', 'SEN-DO-01',   'Cảm biến Oxy hòa tan DO Bể 01',           'do',          'online', 'res-01', NULL,      6.8,  'mg/L',    95.0, CURRENT_TIMESTAMP),
  ('sen-05', 'SEN-LVL-01',  'Cảm biến Mực nước Bể 01',                 'water_level', 'online', 'res-01', NULL,      90.0, '%',       99.0, CURRENT_TIMESTAMP),
  ('sen-06', 'SEN-PH-02',   'Cảm biến pH Bể Tuần Hoàn 02',             'ph',          'warning', 'res-02', NULL,      6.75, 'pH',      96.0, CURRENT_TIMESTAMP),
  ('sen-07', 'SEN-EC-02',   'Cảm biến EC Bể Tuần Hoàn 02',             'ec',          'online', 'res-02', NULL,      1.84, 'mS/cm',   95.0, CURRENT_TIMESTAMP),
  ('sen-08', 'SEN-TEMP-02', 'Cảm biến Nhiệt độ nước Bể 02',            'water_temp',  'online', 'res-02', NULL,      21.8, '°C',      98.0, CURRENT_TIMESTAMP),
  ('sen-09', 'SEN-DO-02',   'Cảm biến Oxy hòa tan DO Bể 02',           'do',          'online', 'res-02', NULL,      7.2,  'mg/L',    94.0, CURRENT_TIMESTAMP),
  ('sen-10', 'SEN-ENV-A1',  'Trạm vi khí hậu giàn NFT Nhà màng 1',     'multi',       'online', NULL,     'zone-a1', 24.5, '°C',     100.0, CURRENT_TIMESTAMP),
  ('sen-11', 'SEN-ENV-B2',  'Trạm vi khí hậu giàn NFT Nhà màng 2',     'multi',       'online', NULL,     'zone-b2', 25.2, '°C',     100.0, CURRENT_TIMESTAMP);

-- 9. Cảnh báo kỹ thuật tự động đối chiếu ngưỡng (alerts)
INSERT INTO "alerts" (
  "id", "severity", "status", "metric", "title", "message", "suggestedAction", 
  "thresholdValue", "actualValue", "unit", 
  "reservoirId", "batchId", "zoneId", "createdAt", "updatedAt"
)
VALUES
  (
    'alert-01', 'warning', 'open', 'EC', 
    'Độ dẫn điện EC bể 01 giảm nhẹ', 
    'EC đo được 1.42 mS/cm thấp hơn ngưỡng khuyến nghị (1.5 - 2.0 mS/cm) cho giống Green Oak Leaf (Lô LET-2026-001 giàn A1).', 
    'Châm thêm 350ml dung dịch mẹ Stock A & Stock B vào Bể Tuần Hoàn 01.',
    1.50, 1.42, 'mS/cm',
    'res-01', 'batch-01', 'zone-a1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'alert-02', 'critical', 'open', 'pH', 
    'pH bể 02 vượt ngưỡng kiềm', 
    'pH đo được 6.75 cao hơn ngưỡng tối ưu (5.5 - 6.0) cho giống Romaine lô LET-2026-003 giàn B2.', 
    'Châm 150ml axit Phosphoric (pH Down 10%) để hạ pH về mức 5.8.',
    6.00, 6.75, 'pH',
    'res-02', 'batch-03', 'zone-b2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'alert-03', 'info', 'resolved', 'Nutrient', 
    'Bù nước & châm dinh dưỡng định kỳ hoàn tất', 
    'Đã bổ sung 120L nước sạch và châm 600ml Stock A + B.', 
    'Hệ thống đã đạt cân bằng chỉ số.',
    1.70, 1.70, 'mS/cm',
    'res-01', 'batch-01', 'zone-a1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

-- 10. Nhật ký thu hoạch thực tế đối chiếu AI (harvest_records)
INSERT INTO "harvest_records" ("id", "batchId", "batchCode", "cultivarName", "harvestDate", "harvestedPlants", "totalWeightKg", "avgWeightG", "rejectedWeightKg", "aiPredictedWeightG", "differencePercent", "lossPercentage", "grade", "unitPriceVnd", "totalRevenueVnd", "notes", "operatorName")
VALUES
  ('harv-01', 'batch-03', 'LET-2026-000-HIST', 'Romaine (Cos)', '2026-08-01', 750, 168.5, 224.6, 5.2, 220.0, 2.09, 3.0, 'A', 45000, 7582500, 'Thu hoạch đợt 1 mùa thu, chất lượng đồng đều, giòn ngọt, tỷ lệ loại 1 đạt 97%.', 'Phạm Văn Vận Hành');

-- 11. Nhật ký đo đạc chất lượng nước (water_quality_logs)
INSERT INTO "water_quality_logs" ("id", "reservoirId", "ph", "ec", "waterTemp", "doLevel", "waterLevelPercent", "recordedBy", "source", "createdAt")
VALUES
  ('wlog-01', 'res-01', 5.85, 1.72, 22.4, 6.8, 90.0, 'IoT-Sensor-01', 'sensor', CURRENT_TIMESTAMP - INTERVAL '4 hour'),
  ('wlog-02', 'res-01', 5.82, 1.70, 22.6, 6.7, 88.0, 'IoT-Sensor-01', 'sensor', CURRENT_TIMESTAMP - INTERVAL '2 hour'),
  ('wlog-03', 'res-01', 5.84, 1.71, 22.5, 6.8, 90.0, 'IoT-Sensor-01', 'sensor', CURRENT_TIMESTAMP),
  ('wlog-04', 'res-02', 6.02, 1.84, 21.8, 7.2, 92.0, 'IoT-Sensor-02', 'sensor', CURRENT_TIMESTAMP - INTERVAL '4 hour'),
  ('wlog-05', 'res-02', 6.10, 1.80, 22.0, 7.1, 91.0, 'IoT-Sensor-02', 'sensor', CURRENT_TIMESTAMP - INTERVAL '2 hour'),
  ('wlog-06', 'res-02', 6.05, 1.82, 21.9, 7.1, 92.0, 'IoT-Sensor-02', 'sensor', CURRENT_TIMESTAMP);

-- 12. Nhật ký vi khí hậu môi trường thực tế (environment_logs)
INSERT INTO "environment_logs" ("id", "zoneId", "airTemp", "humidity", "co2", "ppfd", "dli", "vpd", "recordedBy", "source", "createdAt")
VALUES
  ('env-01', 'zone-a1', 24.2, 68.5, 450.0, 210.0, 15.2, 0.95, 'SEN-ENV-A1', 'sensor', CURRENT_TIMESTAMP - INTERVAL '3 hour'),
  ('env-02', 'zone-a1', 24.8, 66.0, 460.0, 225.0, 15.8, 1.05, 'SEN-ENV-A1', 'sensor', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  ('env-03', 'zone-b2', 25.1, 70.0, 440.0, 215.0, 14.9, 0.98, 'SEN-ENV-B2', 'sensor', CURRENT_TIMESTAMP - INTERVAL '2 hour'),
  ('env-04', 'zone-b2', 25.4, 69.2, 445.0, 230.0, 15.5, 1.02, 'SEN-ENV-B2', 'sensor', CURRENT_TIMESTAMP);

-- 13. Sự kiện xả & thay nước bể (solution_drain_events)
INSERT INTO "solution_drain_events" ("id", "reservoirId", "batchId", "drainDate", "volumeDrainedLiters", "finalPh", "finalEc", "finalDo", "reason", "operator", "notes")
VALUES
  ('drain-01', 'res-01', 'batch-01', '2026-08-25', 500, 6.4, 2.1, 5.8, 'end_of_batch', 'Lê Thị Kỹ Sư Nông Học', 'Xả toàn bộ dung dịch cuối chu kỳ lô trước, vệ sinh máng khử trùng trước khi gieo lô LET-2026-001.');

-- 14. Nhật ký hệ thống mẫu
INSERT INTO "audit_logs" ("id", "userId", "action", "details", "ipAddress", "createdAt")
VALUES
  ('log-001', 'usr-admin-001', 'SYSTEM_SEED', 'Khởi tạo tài khoản Quản trị viên', '127.0.0.1', CURRENT_TIMESTAMP),
  ('log-002', 'usr-agro-003',  'BATCH_SEED',  'Khởi tạo 3 lô xà lách thủy canh mẫu LET-2026-001/002/003', '127.0.0.1', CURRENT_TIMESTAMP);
