import 'dotenv/config';
import { PrismaClient, Role, GrowthStage, BatchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu hoàn chỉnh (Seeding)...');

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('HydroSmart123@', salt);

  // 1. Users
  const initialUsers = [
    {
      id: 'usr-admin-001',
      email: 'admin@hydrosmart.farm',
      fullName: 'Quản Trị Viên Hệ Thống',
      role: Role.SUPER_ADMIN,
      phoneNumber: '0901234567',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-mgr-002',
      email: 'manager@hydrosmart.farm',
      fullName: 'Trần Văn Quản Lý',
      role: Role.FARM_MANAGER,
      phoneNumber: '0902345678',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-agro-003',
      email: 'engineer@hydrosmart.farm',
      fullName: 'Lê Thị Kỹ Sư Nông Học',
      role: Role.AGRONOMIST,
      phoneNumber: '0903456789',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-op-004',
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
      update: {
        fullName: u.fullName,
        role: u.role,
        phoneNumber: u.phoneNumber
      },
      create: {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        phoneNumber: u.phoneNumber,
        passwordHash: u.passwordHash,
        isActive: true,
        auditLogs: {
          create: {
            action: 'SYSTEM_SEED',
            details: `Khởi tạo tài khoản mẫu: ${u.role}`
          }
        }
      }
    });
    console.log(`✅ Đã tạo/cập nhật tài khoản: ${user.email} (${user.role})`);
  }

  // 2. Cultivars - Đầy đủ bộ thông số kỹ thuật và cấu hình giai đoạn sinh trưởng
  const cultivars = [
    {
      id: 'cult-01',
      cropName: 'Xà lách (Lettuce)',
      name: 'Green Oak Leaf',
      scientificName: 'Lactuca sativa var. crispa',
      description: 'Xà lách lá sồi xanh, tán xòe đẹp, thích hợp hệ thống NFT, chu kỳ ngắn, năng suất cao, vị ngọt nhẹ.',
      targetCycleDays: 35,
      expectedWeightG: 190.0,
      recommendedPhMin: 5.6,
      recommendedPhMax: 6.2,
      recommendedEcMin: 1.4,
      recommendedEcMax: 1.9,
      optimalWaterTempMin: 18.0,
      optimalWaterTempMax: 24.0,
      minWaterLevelPercent: 20.0,
      optimalAirTempMin: 18.0,
      optimalAirTempMax: 25.0,
      optimalHumidityMin: 60.0,
      optimalHumidityMax: 75.0,
      optimalLightPpfdMin: 160.0,
      optimalLightPpfdMax: 240.0,
      optimalLightDliMin: 13.0,
      optimalLightDliMax: 17.0,
      stageConfigs: {
        stages: [
          { stage: 'seed', days: 3, phMin: 5.8, phMax: 6.2, ecMin: 0.0, ecMax: 0.5, waterTempMin: 18, waterTempMax: 22, lightDli: 0, notes: 'Giai đoạn ủ hạt bóng tối độ ẩm 90%' },
          { stage: 'seedling', days: 10, phMin: 5.6, phMax: 6.0, ecMin: 1.0, ecMax: 1.4, waterTempMin: 18, waterTempMax: 23, lightDli: 10, notes: 'Cây con ươm giá thể xơ dừa, bắt đầu quang hợp' },
          { stage: 'transplant', days: 3, phMin: 5.6, phMax: 6.0, ecMin: 1.3, ecMax: 1.6, waterTempMin: 19, waterTempMax: 23, lightDli: 12, notes: 'Chuyển lên giàn máng tuần hoàn NFT, hồi xanh bén rễ' },
          { stage: 'vegetative', days: 14, phMin: 5.6, phMax: 6.2, ecMin: 1.5, ecMax: 1.9, waterTempMin: 20, waterTempMax: 24, lightDli: 15, notes: 'Tăng trưởng sinh khối nhanh, quang hợp mạnh mẽ' },
          { stage: 'pre_harvest', days: 5, phMin: 5.8, phMax: 6.2, ecMin: 1.4, ecMax: 1.7, waterTempMin: 19, waterTempMax: 23, lightDli: 14, notes: 'Hạ nhẹ EC để giải phóng tồn dư nitrat, cuộn búp chắc' },
          { stage: 'harvest', days: 1, phMin: 5.8, phMax: 6.2, ecMin: 1.3, ecMax: 1.6, waterTempMin: 18, waterTempMax: 22, lightDli: 12, notes: 'Thu hoạch buổi sáng sớm trước 9h để giữ độ giòn tươi' }
        ]
      }
    },
    {
      id: 'cult-02',
      cropName: 'Xà lách (Lettuce)',
      name: 'Batavia Lettuce',
      scientificName: 'Lactuca sativa var. capitata',
      description: 'Xà lách cuộn giòn chịu nhiệt tốt, thích hợp hệ thống máng tuần hoàn NFT vùng nhiệt đới, lá dày giòn ngọt.',
      targetCycleDays: 36,
      expectedWeightG: 205.0,
      recommendedPhMin: 5.8,
      recommendedPhMax: 6.3,
      recommendedEcMin: 1.5,
      recommendedEcMax: 2.0,
      optimalWaterTempMin: 19.0,
      optimalWaterTempMax: 25.0,
      minWaterLevelPercent: 20.0,
      optimalAirTempMin: 19.0,
      optimalAirTempMax: 27.0,
      optimalHumidityMin: 60.0,
      optimalHumidityMax: 80.0,
      optimalLightPpfdMin: 170.0,
      optimalLightPpfdMax: 250.0,
      optimalLightDliMin: 14.0,
      optimalLightDliMax: 18.0,
      stageConfigs: {
        stages: [
          { stage: 'seed', days: 3, phMin: 5.8, phMax: 6.2, ecMin: 0.0, ecMax: 0.5, waterTempMin: 19, waterTempMax: 23, lightDli: 0, notes: 'Ủ nảy mầm' },
          { stage: 'seedling', days: 11, phMin: 5.8, phMax: 6.1, ecMin: 1.1, ecMax: 1.5, waterTempMin: 19, waterTempMax: 24, lightDli: 11, notes: 'Phát triển 2-3 lá thật' },
          { stage: 'transplant', days: 3, phMin: 5.8, phMax: 6.2, ecMin: 1.4, ecMax: 1.7, waterTempMin: 20, waterTempMax: 24, lightDli: 13, notes: 'Cố định rọ máng NFT' },
          { stage: 'vegetative', days: 14, phMin: 5.8, phMax: 6.3, ecMin: 1.6, ecMax: 2.0, waterTempMin: 20, waterTempMax: 25, lightDli: 16, notes: 'Cuộn búp giòn' },
          { stage: 'pre_harvest', days: 4, phMin: 5.9, phMax: 6.3, ecMin: 1.4, ecMax: 1.8, waterTempMin: 20, waterTempMax: 24, lightDli: 14, notes: 'Định hình khối lượng' },
          { stage: 'harvest', days: 1, phMin: 5.8, phMax: 6.3, ecMin: 1.4, ecMax: 1.7, waterTempMin: 19, waterTempMax: 23, lightDli: 12, notes: 'Sẵn sàng thu hoạch' }
        ]
      }
    },
    {
      id: 'cult-03',
      cropName: 'Xà lách (Lettuce)',
      name: 'Romaine (Cos)',
      scientificName: 'Lactuca sativa var. longifolia',
      description: 'Xà lách La Mã thân đứng, lá dày nhiều vitamin và khoáng chất, chịu được EC cao hơn, búp chắc.',
      targetCycleDays: 38,
      expectedWeightG: 230.0,
      recommendedPhMin: 5.5,
      recommendedPhMax: 6.0,
      recommendedEcMin: 1.6,
      recommendedEcMax: 2.1,
      optimalWaterTempMin: 18.0,
      optimalWaterTempMax: 23.5,
      minWaterLevelPercent: 25.0,
      optimalAirTempMin: 18.0,
      optimalAirTempMax: 25.0,
      optimalHumidityMin: 55.0,
      optimalHumidityMax: 75.0,
      optimalLightPpfdMin: 180.0,
      optimalLightPpfdMax: 260.0,
      optimalLightDliMin: 14.0,
      optimalLightDliMax: 19.0,
      stageConfigs: {
        stages: [
          { stage: 'seed', days: 3, phMin: 5.6, phMax: 6.0, ecMin: 0.0, ecMax: 0.5, waterTempMin: 18, waterTempMax: 22, lightDli: 0, notes: 'Gieo hạt' },
          { stage: 'seedling', days: 12, phMin: 5.5, phMax: 5.9, ecMin: 1.2, ecMax: 1.6, waterTempMin: 18, waterTempMax: 23, lightDli: 12, notes: 'Bung lá mầm và 2 lá thật' },
          { stage: 'transplant', days: 3, phMin: 5.5, phMax: 6.0, ecMin: 1.5, ecMax: 1.8, waterTempMin: 19, waterTempMax: 23, lightDli: 14, notes: 'Lên giàn máng Romaine' },
          { stage: 'vegetative', days: 15, phMin: 5.5, phMax: 6.0, ecMin: 1.7, ecMax: 2.1, waterTempMin: 19, waterTempMax: 23.5, lightDli: 18, notes: 'Lá đứng vươn cao tích lũy dinh dưỡng' },
          { stage: 'pre_harvest', days: 4, phMin: 5.6, phMax: 6.0, ecMin: 1.5, ecMax: 1.9, waterTempMin: 18, waterTempMax: 22.5, lightDli: 15, notes: 'Cuộn chặt thân búp' },
          { stage: 'harvest', days: 1, phMin: 5.5, phMax: 6.0, ecMin: 1.4, ecMax: 1.8, waterTempMin: 18, waterTempMax: 22, lightDli: 12, notes: 'Thu hoạch' }
        ]
      }
    },
    {
      id: 'cult-04',
      cropName: 'Xà lách (Lettuce)',
      name: 'Lollo Rossa',
      scientificName: 'Lactuca sativa var. crispa',
      description: 'Xà lách lá sồi đỏ tím, giàu anthocyanin chống oxy hóa, viền lá xoăn tít thẩm mỹ cao cho salad nhà hàng.',
      targetCycleDays: 37,
      expectedWeightG: 185.0,
      recommendedPhMin: 5.6,
      recommendedPhMax: 6.2,
      recommendedEcMin: 1.4,
      recommendedEcMax: 1.9,
      optimalWaterTempMin: 18.0,
      optimalWaterTempMax: 23.0,
      minWaterLevelPercent: 20.0,
      optimalAirTempMin: 18.0,
      optimalAirTempMax: 24.0,
      optimalHumidityMin: 60.0,
      optimalHumidityMax: 75.0,
      optimalLightPpfdMin: 180.0,
      optimalLightPpfdMax: 250.0,
      optimalLightDliMin: 14.0,
      optimalLightDliMax: 18.0,
      stageConfigs: {
        stages: [
          { stage: 'seedling', days: 10, phMin: 5.6, phMax: 6.0, ecMin: 1.1, ecMax: 1.4, waterTempMin: 18, waterTempMax: 22, lightDli: 11, notes: 'Cây con viền đỏ nhạt' },
          { stage: 'vegetative', days: 18, phMin: 5.6, phMax: 6.2, ecMin: 1.5, ecMax: 1.9, waterTempMin: 18, waterTempMax: 23, lightDli: 16, notes: 'Đòi hỏi ánh sáng mạnh để tạo sắc tố đỏ đậm' },
          { stage: 'harvest', days: 1, phMin: 5.8, phMax: 6.2, ecMin: 1.3, ecMax: 1.7, waterTempMin: 18, waterTempMax: 22, lightDli: 12, notes: 'Thu hoạch' }
        ]
      }
    },
    {
      id: 'cult-05',
      cropName: 'Xà lách (Lettuce)',
      name: 'Butterhead (Mỡ)',
      scientificName: 'Lactuca sativa var. capitata',
      description: 'Xà lách mỡ lá mềm mịn như bơ, cuộn lỏng, vị thơm ngọt bùi, được ưa chuộng hàng đầu.',
      targetCycleDays: 40,
      expectedWeightG: 220.0,
      recommendedPhMin: 5.6,
      recommendedPhMax: 6.2,
      recommendedEcMin: 1.3,
      recommendedEcMax: 1.8,
      optimalWaterTempMin: 18.0,
      optimalWaterTempMax: 23.0,
      minWaterLevelPercent: 20.0,
      optimalAirTempMin: 17.0,
      optimalAirTempMax: 24.0,
      optimalHumidityMin: 60.0,
      optimalHumidityMax: 75.0,
      optimalLightPpfdMin: 150.0,
      optimalLightPpfdMax: 220.0,
      optimalLightDliMin: 12.0,
      optimalLightDliMax: 16.0,
      stageConfigs: {
        stages: [
          { stage: 'seedling', days: 12, phMin: 5.6, phMax: 6.0, ecMin: 1.0, ecMax: 1.3, waterTempMin: 18, waterTempMax: 22, lightDli: 10, notes: 'Cây con lá bóng mượt' },
          { stage: 'vegetative', days: 20, phMin: 5.6, phMax: 6.2, ecMin: 1.4, ecMax: 1.8, waterTempMin: 18, waterTempMax: 23, lightDli: 15, notes: 'Lá bơ xếp tầng cuộn búp mềm' },
          { stage: 'harvest', days: 1, phMin: 5.8, phMax: 6.2, ecMin: 1.3, ecMax: 1.6, waterTempMin: 18, waterTempMax: 22, lightDli: 12, notes: 'Thu hoạch' }
        ]
      }
    }
  ];

  for (const c of cultivars) {
    await prisma.cultivar.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${cultivars.length} giống cây trồng đầy đủ thông số`);

  // 3. Reservoirs
  const reservoirs = [
    {
      id: 'res-01',
      name: 'Bể Tuần Hoàn 01 - Giàn NFT Tầng 1 (Khu A & E)',
      systemType: 'NFT',
      capacityLiters: 600.0,
      currentVolumeLiters: 540.0,
      currentPh: 5.85,
      currentEc: 1.42,
      currentWaterTemp: 22.4,
      currentDo: 6.8,
      formulaName: 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)',
      lastTopUpDate: '2026-09-09',
      lastReplacementDate: '2026-08-25',
      pumpStatus: 'running',
      aerationStatus: 'active'
    },
    {
      id: 'res-02',
      name: 'Bể Tuần Hoàn 02 - Giàn NFT Tầng 2 (Khu B, C, D)',
      systemType: 'NFT',
      capacityLiters: 1000.0,
      currentVolumeLiters: 920.0,
      currentPh: 6.75,
      currentEc: 1.84,
      currentWaterTemp: 21.8,
      currentDo: 7.2,
      formulaName: 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)',
      lastTopUpDate: '2026-09-08',
      lastReplacementDate: '2026-08-20',
      pumpStatus: 'running',
      aerationStatus: 'active'
    }
  ];

  for (const r of reservoirs) {
    await prisma.reservoir.upsert({
      where: { id: r.id },
      update: r,
      create: r
    });
  }
  console.log(`✅ Đã tạo ${reservoirs.length} bể dinh dưỡng tuần hoàn NFT`);

  // 4. Farm Zones (Sơ đồ thực địa NFT A1, A2, B2, D1, C1, E1)
  const farmZones = [
    {
      id: 'zone-a1',
      code: 'A1',
      name: 'Phân khu A1 - Nhà màng 1',
      greenhouse: 'Nhà màng 1',
      areaM2: 500.0,
      slotCapacity: 12500,
      color: '#16a34a',
      status: 'growing',
      reservoirId: 'res-01'
    },
    {
      id: 'zone-a2',
      code: 'A2',
      name: 'Phân khu A2 - Nhà màng 1',
      greenhouse: 'Nhà màng 1',
      areaM2: 600.0,
      slotCapacity: 15000,
      color: '#84cc16',
      status: 'growing',
      reservoirId: 'res-01'
    },
    {
      id: 'zone-b2',
      code: 'B2',
      name: 'Phân khu B2 - Nhà màng 1',
      greenhouse: 'Nhà màng 1',
      areaM2: 300.0,
      slotCapacity: 7500,
      color: '#f59e0b',
      status: 'ready_soon',
      reservoirId: 'res-02'
    },
    {
      id: 'zone-d1',
      code: 'D1',
      name: 'Phân khu D1 - Nhà màng 2',
      greenhouse: 'Nhà màng 2',
      areaM2: 400.0,
      slotCapacity: 10000,
      color: '#0ea5e9',
      status: 'completed',
      reservoirId: 'res-02'
    },
    {
      id: 'zone-c1',
      code: 'C1',
      name: 'Phân khu C1 - Nhà màng 2',
      greenhouse: 'Nhà màng 2',
      areaM2: 800.0,
      slotCapacity: 20000,
      color: '#8b5cf6',
      status: 'completed',
      reservoirId: 'res-02'
    },
    {
      id: 'zone-e1',
      code: 'E1',
      name: 'Phân khu E1 - Nhà màng 2',
      greenhouse: 'Nhà màng 2',
      areaM2: 100.0,
      slotCapacity: 2500,
      color: '#ef4444',
      status: 'needs_attention',
      reservoirId: 'res-01'
    }
  ];

  for (const z of farmZones) {
    await prisma.farmZone.upsert({
      where: { code: z.code },
      update: z,
      create: z
    });
  }
  console.log(`✅ Đã tạo ${farmZones.length} phân khu thực địa NFT`);

  // 5. Batches & Observations
  const batches = [
    {
      id: 'batch-01',
      batchCode: 'LET-2026-001',
      cultivarId: 'cult-01',
      reservoirId: 'res-01',
      zoneId: 'zone-a1',
      systemType: 'NFT',
      plantQuantity: 650,
      currentQuantity: 642,
      seedDate: '2026-08-15',
      transplantDate: '2026-08-27',
      expectedHarvestDate: '2026-09-19',
      currentStage: GrowthStage.vegetative,
      status: BatchStatus.active,
      densityPlantsPerM2: 26.0,
      notes: 'Máng NFT giàn A1, tốc độ sinh trưởng đồng đều 55%, rễ trắng khỏe.',
      observations: [
        {
          id: 'obs-01',
          date: '2026-09-08',
          avgLeafCount: 16.0,
          avgHeightCm: 15.2,
          sampleWeightG: 142.5,
          notes: 'Rễ phân nhánh nhiều, không có dấu hiệu nấm bệnh'
        }
      ]
    },
    {
      id: 'batch-02',
      batchCode: 'LET-2026-002',
      cultivarId: 'cult-02',
      reservoirId: 'res-01',
      zoneId: 'zone-a2',
      systemType: 'NFT',
      plantQuantity: 500,
      currentQuantity: 495,
      seedDate: '2026-08-28',
      transplantDate: '2026-09-08',
      expectedHarvestDate: '2026-10-02',
      currentStage: GrowthStage.seedling,
      status: BatchStatus.active,
      densityPlantsPerM2: 24.0,
      notes: 'Giàn A2 mới chuyển máng NFT 2 ngày, bén rễ tốt 25%, bung lá thật thứ 3.',
      observations: [
        {
          id: 'obs-02',
          date: '2026-09-09',
          avgLeafCount: 6.0,
          avgHeightCm: 6.8,
          sampleWeightG: 34.0,
          notes: 'Cây con hồi xanh khỏe mạnh sau khi chuyển máng'
        }
      ]
    },
    {
      id: 'batch-03',
      batchCode: 'LET-2026-003',
      cultivarId: 'cult-03',
      reservoirId: 'res-02',
      zoneId: 'zone-b2',
      systemType: 'NFT',
      plantQuantity: 800,
      currentQuantity: 785,
      seedDate: '2026-08-04',
      transplantDate: '2026-08-16',
      expectedHarvestDate: '2026-09-12',
      currentStage: GrowthStage.pre_harvest,
      status: BatchStatus.active,
      densityPlantsPerM2: 22.0,
      notes: 'Giàn B2 giai đoạn tích lũy sinh khối 80%. Sẵn sàng thu hoạch.',
      observations: [
        {
          id: 'obs-03',
          date: '2026-09-09',
          avgLeafCount: 24.0,
          avgHeightCm: 22.4,
          sampleWeightG: 228.0,
          notes: 'Búp cuộn đặc, sẵn sàng thu hoạch trong 3 ngày tới'
        }
      ]
    }
  ];

  for (const b of batches) {
    const { observations, ...batchData } = b;
    const createdBatch = await prisma.cropBatch.upsert({
      where: { batchCode: b.batchCode },
      update: batchData,
      create: batchData
    });

    for (const obs of observations) {
      await prisma.cropObservation.upsert({
        where: { id: obs.id },
        update: {
          date: obs.date,
          avgLeafCount: obs.avgLeafCount,
          avgHeightCm: obs.avgHeightCm,
          sampleWeightG: obs.sampleWeightG,
          notes: obs.notes
        },
        create: {
          ...obs,
          batchId: createdBatch.id
        }
      });
    }
  }
  console.log(`✅ Đã tạo ${batches.length} lô canh tác kèm dữ liệu đo sinh trắc học`);

  // 6. Nutrient Formulas
  const formulas = [
    {
      id: 'form-01',
      name: 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)',
      applicableCrop: 'Xà lách (Lettuce)',
      systemType: 'NFT',
      scientificStandard: 'Hoagland & Arnon Modified (Resh 2012)',
      targetEc: 1.7,
      targetPh: 5.8,
      dosingRatio: '1:100 (10ml Stock A + 10ml Stock B cho 1 Lít nước)',
      chemicalIncompatibilityReason: 'Stock A chứa Canxi (Ca2+) và Sắt chelate (Fe-EDDHA). Stock B chứa Photphat (H2PO4-) và Sunfat (SO4 2-). Tuyệt đối không pha chung trực tiếp ở dạng đậm đặc vì sẽ xảy ra phản ứng kết tủa Canxi Sunfat (Thạch cao - CaSO4) và Canxi Photphat (Ca3(PO4)2) làm tắc đường ống máng NFT và cây mất hoàn toàn khả năng hấp thu dinh dưỡng.',
      stockADetails: 'Canxi Nitrat [Ca(NO3)2.4H2O], Kali Nitrat [KNO3], Sắt Chelate Fe-EDDHA 6% (đỏ đậm bền vững pH 5.0 - 7.5)',
      stockBDetails: 'Monokali Photphat [KH2PO4], Magie Sunfat [MgSO4.7H2O], Kali Sunfat [K2SO4], Vi lượng chelated Solubor (B), Mn, Zn, Cu, Mo',
      notes: 'Công thức ổn định dinh dưỡng cho máng mỏng NFT vùng nhiệt đới.'
    },
    {
      id: 'form-02',
      name: 'Cornell CEA Lettuce Standard',
      applicableCrop: 'Xà lách (Lettuce)',
      systemType: 'NFT',
      scientificStandard: 'Cornell Controlled Environment Agriculture',
      targetEc: 1.8,
      targetPh: 5.9,
      dosingRatio: '1:100 (10ml Stock A + 10ml Stock B cho 1 Lít nước)',
      chemicalIncompatibilityReason: 'Ngăn ngừa phản ứng kết tủa ion Canxi và Sunfat/Photphat ở nồng độ cao trước khi hòa vào bể chính.',
      stockADetails: 'Canxi Nitrat, Amoni Nitrat NH4NO3, Sắt Chelate Fe-DTPA 7%',
      stockBDetails: 'Monokali Photphat, Magie Sunfat, Chelate vi lượng tổng hợp',
      notes: 'Phù hợp canh tác môi trường kiểm soát nhiệt độ điều hòa & ánh sáng bổ sung.'
    }
  ];

  for (const f of formulas) {
    await prisma.nutrientFormula.upsert({
      where: { id: f.id },
      update: f,
      create: f
    });
  }
  console.log(`✅ Đã tạo ${formulas.length} công thức dinh dưỡng tiêu chuẩn khoa học`);

  // 7. IoT Sensors (Cảm biến giám sát bể & phân khu)
  const sensors = [
    { id: 'sen-01', code: 'SEN-PH-01', name: 'Cảm biến pH Bể Tuần Hoàn 01', sensorType: 'ph', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 5.85, unit: 'pH', batteryLevel: 98.0 },
    { id: 'sen-02', code: 'SEN-EC-01', name: 'Cảm biến Độ dẫn điện EC Bể 01', sensorType: 'ec', status: 'warning', reservoirId: 'res-01', zoneId: null, lastReading: 1.42, unit: 'mS/cm', batteryLevel: 97.0 },
    { id: 'sen-03', code: 'SEN-TEMP-01', name: 'Cảm biến Nhiệt độ nước Bể 01', sensorType: 'water_temp', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 22.4, unit: '°C', batteryLevel: 99.0 },
    { id: 'sen-04', code: 'SEN-DO-01', name: 'Cảm biến Oxy hòa tan DO Bể 01', sensorType: 'do', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 6.8, unit: 'mg/L', batteryLevel: 95.0 },
    { id: 'sen-05', code: 'SEN-LVL-01', name: 'Cảm biến Mực nước Bể 01', sensorType: 'water_level', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 90.0, unit: '%', batteryLevel: 99.0 },
    { id: 'sen-06', code: 'SEN-PH-02', name: 'Cảm biến pH Bể Tuần Hoàn 02', sensorType: 'ph', status: 'warning', reservoirId: 'res-02', zoneId: null, lastReading: 6.75, unit: 'pH', batteryLevel: 96.0 },
    { id: 'sen-07', code: 'SEN-EC-02', name: 'Cảm biến EC Bể Tuần Hoàn 02', sensorType: 'ec', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 1.84, unit: 'mS/cm', batteryLevel: 95.0 },
    { id: 'sen-08', code: 'SEN-TEMP-02', name: 'Cảm biến Nhiệt độ nước Bể 02', sensorType: 'water_temp', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 21.8, unit: '°C', batteryLevel: 98.0 },
    { id: 'sen-09', code: 'SEN-DO-02', name: 'Cảm biến Oxy hòa tan DO Bể 02', sensorType: 'do', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 7.2, unit: 'mg/L', batteryLevel: 94.0 },
    { id: 'sen-10', code: 'SEN-ENV-A1', name: 'Trạm vi khí hậu giàn NFT Nhà màng 1', sensorType: 'multi', status: 'online', reservoirId: null, zoneId: 'zone-a1', lastReading: 24.5, unit: '°C', batteryLevel: 100.0 },
    { id: 'sen-11', code: 'SEN-ENV-B2', name: 'Trạm vi khí hậu giàn NFT Nhà màng 2', sensorType: 'multi', status: 'online', reservoirId: null, zoneId: 'zone-b2', lastReading: 25.2, unit: '°C', batteryLevel: 100.0 }
  ];

  for (const s of sensors) {
    await prisma.sensor.upsert({
      where: { code: s.code },
      update: s,
      create: s
    });
  }
  console.log(`✅ Đã tạo ${sensors.length} cảm biến IoT thực tế`);

  // 8. Alerts (Liên kết trực tiếp tới lô, bể, phân khu với ngưỡng so sánh)
  const alerts = [
    {
      id: 'alert-01',
      severity: 'warning',
      status: 'open',
      metric: 'EC',
      title: 'Độ dẫn điện EC bể 01 giảm nhẹ',
      message: 'EC đo được 1.42 mS/cm thấp hơn ngưỡng khuyến nghị (1.5 - 2.0 mS/cm) cho giống Green Oak Leaf (Lô LET-2026-001 giàn A1).',
      suggestedAction: 'Châm thêm 350ml dung dịch mẹ Stock A & Stock B vào Bể Tuần Hoàn 01.',
      thresholdValue: 1.50,
      actualValue: 1.42,
      unit: 'mS/cm',
      reservoirId: 'res-01',
      batchId: 'batch-01',
      zoneId: 'zone-a1'
    },
    {
      id: 'alert-02',
      severity: 'critical',
      status: 'open',
      metric: 'pH',
      title: 'pH bể 02 vượt ngưỡng kiềm',
      message: 'pH đo được 6.75 cao hơn ngưỡng tối ưu (5.5 - 6.0) cho giống Romaine lô LET-2026-003 giàn B2.',
      suggestedAction: 'Châm 150ml axit Phosphoric (pH Down 10%) để hạ pH về mức 5.8.',
      thresholdValue: 6.00,
      actualValue: 6.75,
      unit: 'pH',
      reservoirId: 'res-02',
      batchId: 'batch-03',
      zoneId: 'zone-b2'
    },
    {
      id: 'alert-03',
      severity: 'info',
      status: 'resolved',
      metric: 'Nutrient',
      title: 'Bù nước & châm dinh dưỡng định kỳ hoàn tất',
      message: 'Đã bổ sung 120L nước sạch và châm 600ml Stock A + B.',
      suggestedAction: 'Hệ thống đã đạt cân bằng chỉ số.',
      thresholdValue: 1.70,
      actualValue: 1.70,
      unit: 'mS/cm',
      reservoirId: 'res-01',
      batchId: 'batch-01',
      zoneId: 'zone-a1',
      resolvedBy: 'Lê Thị Kỹ Sư Nông Học',
      resolvedAt: new Date(),
      resolutionNote: 'Đã châm dung dịch và kiểm tra EC ổn định 1.7 mS/cm'
    }
  ];

  for (const a of alerts) {
    await prisma.alert.upsert({
      where: { id: a.id },
      update: a,
      create: a
    });
  }
  console.log(`✅ Đã tạo ${alerts.length} cảnh báo kỹ thuật liên kết thực địa`);

  // 9. Harvest Records
  const harvestRecords = [
    {
      id: 'harv-01',
      batchId: 'batch-03',
      batchCode: 'LET-2026-000-HIST',
      cultivarName: 'Romaine (Cos)',
      harvestDate: '2026-08-01',
      harvestedPlants: 750,
      totalWeightKg: 168.5,
      avgWeightG: 224.6,
      rejectedWeightKg: 5.2,
      aiPredictedWeightG: 220.0,
      differencePercent: 2.09,
      lossPercentage: 3.0,
      grade: 'A',
      unitPriceVnd: 45000,
      totalRevenueVnd: 7582500,
      notes: 'Thu hoạch đợt 1 mùa thu, chất lượng đồng đều, giòn ngọt, tỷ lệ loại 1 đạt 97%.',
      operatorName: 'Phạm Văn Vận Hành'
    }
  ];

  for (const h of harvestRecords) {
    await prisma.harvestRecord.upsert({
      where: { id: h.id },
      update: h,
      create: h
    });
  }
  console.log(`✅ Đã tạo ${harvestRecords.length} nhật ký thu hoạch đối chiếu AI`);

  // 10. Water Quality Logs
  const waterLogs = [
    { id: 'wlog-01', reservoirId: 'res-01', ph: 5.85, ec: 1.72, waterTemp: 22.4, doLevel: 6.8, waterLevelPercent: 90.0, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-02', reservoirId: 'res-01', ph: 5.82, ec: 1.65, waterTemp: 22.6, doLevel: 6.7, waterLevelPercent: 88.0, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-03', reservoirId: 'res-01', ph: 5.84, ec: 1.55, waterTemp: 22.5, doLevel: 6.8, waterLevelPercent: 90.0, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-08', reservoirId: 'res-01', ph: 5.85, ec: 1.42, waterTemp: 22.4, doLevel: 6.8, waterLevelPercent: 90.0, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-04', reservoirId: 'res-02', ph: 6.02, ec: 1.84, waterTemp: 21.8, doLevel: 7.2, waterLevelPercent: 92.0, recordedBy: 'IoT-Sensor-02', source: 'sensor' },
    { id: 'wlog-05', reservoirId: 'res-02', ph: 6.10, ec: 1.80, waterTemp: 22.0, doLevel: 7.1, waterLevelPercent: 91.0, recordedBy: 'IoT-Sensor-02', source: 'sensor' },
    { id: 'wlog-06', reservoirId: 'res-02', ph: 6.25, ec: 1.82, waterTemp: 21.9, doLevel: 7.1, waterLevelPercent: 92.0, recordedBy: 'IoT-Sensor-02', source: 'sensor' },
    { id: 'wlog-07', reservoirId: 'res-02', ph: 6.75, ec: 1.84, waterTemp: 21.8, doLevel: 7.2, waterLevelPercent: 92.0, recordedBy: 'IoT-Sensor-02', source: 'sensor' }
  ];

  for (const wl of waterLogs) {
    await prisma.waterQualityLog.upsert({
      where: { id: wl.id },
      update: wl,
      create: wl
    });
  }
  console.log(`✅ Đã tạo ${waterLogs.length} bản ghi đo đạc chất lượng nước bể`);

  // 11. Environment Logs
  const envLogs = [
    { id: 'env-01', zoneId: 'zone-a1', airTemp: 24.2, humidity: 68.5, co2: 450.0, ppfd: 210.0, dli: 15.2, vpd: 0.95, recordedBy: 'SEN-ENV-A1', source: 'sensor' },
    { id: 'env-02', zoneId: 'zone-a1', airTemp: 24.8, humidity: 66.0, co2: 460.0, ppfd: 225.0, dli: 15.8, vpd: 1.05, recordedBy: 'SEN-ENV-A1', source: 'sensor' },
    { id: 'env-03', zoneId: 'zone-b2', airTemp: 25.1, humidity: 70.0, co2: 440.0, ppfd: 215.0, dli: 14.9, vpd: 0.98, recordedBy: 'SEN-ENV-B2', source: 'sensor' },
    { id: 'env-04', zoneId: 'zone-b2', airTemp: 25.4, humidity: 69.2, co2: 445.0, ppfd: 230.0, dli: 15.5, vpd: 1.02, recordedBy: 'SEN-ENV-B2', source: 'sensor' }
  ];

  for (const el of envLogs) {
    await prisma.environmentLog.upsert({
      where: { id: el.id },
      update: el,
      create: el
    });
  }
  console.log(`✅ Đã tạo ${envLogs.length} bản ghi vi khí hậu môi trường`);

  // 12. Solution Drain Events
  const drainEvents = [
    {
      id: 'drain-01',
      reservoirId: 'res-01',
      batchId: 'batch-01',
      drainDate: '2026-08-25',
      volumeDrainedLiters: 500,
      finalPh: 6.4,
      finalEc: 2.1,
      finalDo: 5.8,
      reason: 'end_of_batch',
      operator: 'Lê Thị Kỹ Sư Nông Học',
      notes: 'Xả toàn bộ dung dịch cuối chu kỳ lô trước, vệ sinh máng khử trùng trước khi gieo lô LET-2026-001.'
    }
  ];

  for (const de of drainEvents) {
    await prisma.solutionDrainEvent.upsert({
      where: { id: de.id },
      update: de,
      create: de
    });
  }
  console.log(`✅ Đã tạo ${drainEvents.length} sự kiện xả/thay nước bể`);

  console.log('🎉 Hoàn thành nạp toàn bộ dữ liệu mẫu!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
