import 'dotenv/config';
import { PrismaClient, Role, GrowthStage, BatchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Tính ngày YYYY-MM-DD lệch `offsetDays` so với hôm nay để dữ liệu mẫu luôn khớp ngày thực tế khi chạy */
function dateFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(offsetDays));
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('🌱 Đang làm sạch dữ liệu cũ và khởi tạo bộ dữ liệu gọn sạch (Seeding)...');

  // Xóa toàn bộ dữ liệu thừa / rác tích lũy từ các phiên test trước (theo thứ tự khóa ngoại)
  await prisma.auditLog.deleteMany({});
  await prisma.waterQualityLog.deleteMany({});
  await prisma.environmentLog.deleteMany({});
  await prisma.solutionDrainEvent.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.harvestRecord.deleteMany({});
  await prisma.cropObservation.deleteMany({});
  await prisma.sensor.deleteMany({});
  await prisma.cropBatch.deleteMany({});
  await prisma.farmZone.deleteMany({});
  await prisma.reservoir.deleteMany({});
  await prisma.cultivar.deleteMany({});
  await prisma.nutrientFormula.deleteMany({});
  await prisma.user.deleteMany({});

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
        isActive: true
      }
    });
    console.log(`Đã tạo/cập nhật tài khoản: ${user.email} (${user.role})`);
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
    }
  ];

  for (const c of cultivars) {
    await prisma.cultivar.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log(`Đã tạo/cập nhật ${cultivars.length} giống cây trồng đầy đủ thông số`);

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
      lastTopUpDate: dateFromToday(-2),
      lastReplacementDate: dateFromToday(-16),
      pumpStatus: 'running',
      aerationStatus: 'active'
    },
    {
      id: 'res-02',
      name: 'Bể Tuần Hoàn 02 - Giàn NFT Tầng 2 (Khu B, C, D)',
      systemType: 'NFT',
      capacityLiters: 1000.0,
      currentVolumeLiters: 900.0,
      currentPh: 5.82,
      currentEc: 1.75,
      currentWaterTemp: 21.4,
      currentDo: 7.6,
      formulaName: 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)',
      lastTopUpDate: dateFromToday(-3),
      lastReplacementDate: dateFromToday(-18),
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
  console.log(`Đã tạo ${reservoirs.length} bể dinh dưỡng tuần hoàn NFT`);

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
  console.log(`Đã tạo ${farmZones.length} phân khu thực địa NFT`);

  // 5. Batches & Observations (3 lô đang trồng + 1 lô lịch sử đã thu hoạch ở phân khu D1)
  const todayStr = dateFromToday(0);
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
      seedDate: dateFromToday(-22),
      transplantDate: dateFromToday(-11),
      expectedHarvestDate: dateFromToday(13),
      actualHarvestDate: null,
      currentStage: GrowthStage.vegetative,
      status: BatchStatus.active,
      densityPlantsPerM2: 26.0,
      notes: 'Ngày tuổi 22/35 (Sinh dưỡng). Nước đạt chuẩn, rễ trắng khỏe.',
      observations: [
        {
          id: 'obs-01',
          date: todayStr,
          avgLeafCount: 15.2,
          avgHeightCm: 15.1,
          sampleWeightG: 103.4,
          notes: 'Đo sinh trắc học ngày thứ 22/35: cây khỏe mạnh, đồng đều.'
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
      seedDate: dateFromToday(-15),
      transplantDate: dateFromToday(-4),
      expectedHarvestDate: dateFromToday(21),
      actualHarvestDate: null,
      currentStage: GrowthStage.vegetative,
      status: BatchStatus.active,
      densityPlantsPerM2: 24.0,
      notes: 'Ngày tuổi 15/36 (Sinh dưỡng - Xà lách Batavia hỗ trợ AI Dự báo). Nước đạt chuẩn, rễ trắng khỏe.',
      observations: [
        {
          id: 'obs-02',
          date: todayStr,
          avgLeafCount: 10.8,
          avgHeightCm: 10.7,
          sampleWeightG: 35.8,
          notes: 'Đo sinh trắc học ngày thứ 15/36: cây Batavia bén rễ khỏe, đang tăng sinh khối.'
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
      seedDate: dateFromToday(-31),
      transplantDate: dateFromToday(-20),
      expectedHarvestDate: dateFromToday(7),
      actualHarvestDate: null,
      currentStage: GrowthStage.pre_harvest,
      status: BatchStatus.active,
      densityPlantsPerM2: 22.0,
      notes: 'Ngày tuổi 31/38 (Tích lũy sinh khối). Búp cuộn chắc, chuẩn bị thu hoạch.',
      observations: [
        {
          id: 'obs-03',
          date: todayStr,
          avgLeafCount: 19.1,
          avgHeightCm: 18.9,
          sampleWeightG: 200.6,
          notes: 'Đo sinh trắc học ngày thứ 31/38: búp cuộn đặc, đồng đều.'
        }
      ]
    },
    {
      id: 'batch-00-hist',
      batchCode: 'LET-2026-000',
      cultivarId: 'cult-02',
      reservoirId: 'res-02',
      zoneId: 'zone-d1',
      systemType: 'NFT',
      plantQuantity: 760,
      currentQuantity: 750,
      seedDate: dateFromToday(-46),
      transplantDate: dateFromToday(-35),
      expectedHarvestDate: dateFromToday(-10),
      actualHarvestDate: dateFromToday(-10),
      currentStage: GrowthStage.harvest,
      status: BatchStatus.harvested,
      densityPlantsPerM2: 24.0,
      notes: 'Lô Xà lách Batavia vụ trước tại Phân khu D1 đã thu hoạch hoàn tất, đạt chuẩn loại A.',
      observations: [
        {
          id: 'obs-00-hist',
          date: dateFromToday(-10),
          avgLeafCount: 22.0,
          avgHeightCm: 21.5,
          sampleWeightG: 204.8,
          notes: 'Kiểm tra sinh khối trước khi thu hoạch toàn bộ lô.'
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
  console.log(`Đã tạo ${batches.length} lô canh tác kèm dữ liệu đo sinh trắc học`);

  // 6. Nutrient Formulas (Chỉ giữ công thức chuẩn Hoagland - Resh đang gắn với 2 bể tuần hoàn)
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
    }
  ];

  for (const f of formulas) {
    await prisma.nutrientFormula.upsert({
      where: { id: f.id },
      update: f,
      create: f
    });
  }
  console.log(`Đã tạo ${formulas.length} công thức dinh dưỡng tiêu chuẩn khoa học`);

  // 7. IoT Sensors (Đầy đủ 5 cảm biến cho mỗi bể + 2 trạm vi khí hậu nhà màng, khớp 100% với Simulator)
  const sensors = [
    { id: 'sen-01', code: 'SEN-PH-01', name: 'Cảm biến pH Bể Tuần Hoàn 01', sensorType: 'ph', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 5.85, unit: 'pH', batteryLevel: 98.0 },
    { id: 'sen-02', code: 'SEN-EC-01', name: 'Cảm biến Độ dẫn điện EC Bể 01', sensorType: 'ec', status: 'warning', reservoirId: 'res-01', zoneId: null, lastReading: 1.42, unit: 'mS/cm', batteryLevel: 97.0 },
    { id: 'sen-03', code: 'SEN-TEMP-01', name: 'Cảm biến Nhiệt độ nước Bể 01', sensorType: 'water_temp', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 22.4, unit: '°C', batteryLevel: 99.0 },
    { id: 'sen-04', code: 'SEN-DO-01', name: 'Cảm biến Oxy hòa tan DO Bể 01', sensorType: 'do', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 6.8, unit: 'mg/L', batteryLevel: 95.0 },
    { id: 'sen-05', code: 'SEN-LVL-01', name: 'Cảm biến Mực nước Bể 01', sensorType: 'water_level', status: 'online', reservoirId: 'res-01', zoneId: null, lastReading: 90.0, unit: '%', batteryLevel: 99.0 },
    { id: 'sen-06', code: 'SEN-PH-02', name: 'Cảm biến pH Bể Tuần Hoàn 02', sensorType: 'ph', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 5.82, unit: 'pH', batteryLevel: 96.0 },
    { id: 'sen-07', code: 'SEN-EC-02', name: 'Cảm biến EC Bể Tuần Hoàn 02', sensorType: 'ec', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 1.75, unit: 'mS/cm', batteryLevel: 95.0 },
    { id: 'sen-08', code: 'SEN-TEMP-02', name: 'Cảm biến Nhiệt độ nước Bể 02', sensorType: 'water_temp', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 21.4, unit: '°C', batteryLevel: 98.0 },
    { id: 'sen-09', code: 'SEN-DO-02', name: 'Cảm biến Oxy hòa tan DO Bể 02', sensorType: 'do', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 7.6, unit: 'mg/L', batteryLevel: 94.0 },
    { id: 'sen-12', code: 'SEN-LVL-02', name: 'Cảm biến Mực nước Bể 02', sensorType: 'water_level', status: 'online', reservoirId: 'res-02', zoneId: null, lastReading: 90.0, unit: '%', batteryLevel: 98.0 },
    { id: 'sen-10', code: 'SEN-ENV-A1', name: 'Trạm vi khí hậu giàn NFT Nhà màng 1', sensorType: 'multi', status: 'online', reservoirId: null, zoneId: 'zone-a1', lastReading: 22.8, unit: '°C', batteryLevel: 100.0 },
    { id: 'sen-11', code: 'SEN-ENV-B2', name: 'Trạm vi khí hậu giàn NFT Nhà màng 2', sensorType: 'multi', status: 'online', reservoirId: null, zoneId: 'zone-b2', lastReading: 23.2, unit: '°C', batteryLevel: 100.0 }
  ];

  for (const s of sensors) {
    const { id: _id, ...sensorData } = s;
    await prisma.sensor.upsert({
      where: { code: s.code },
      update: sensorData,
      create: s
    });
  }
  console.log(`Đã tạo ${sensors.length} cảm biến IoT thực tế`);

  // 8. Harvest Records (1 lô lịch sử `batch-00-hist` đã thu hoạch để đối chiếu sai số AI)
  const harvestRecords = [
    {
      id: 'harv-01',
      batchId: 'batch-00-hist',
      batchCode: 'LET-2026-000',
      cultivarName: 'Batavia Lettuce',
      harvestDate: dateFromToday(-10),
      harvestedPlants: 750,
      totalWeightKg: 153.6,
      avgWeightG: 204.8,
      rejectedWeightKg: 3.2,
      aiPredictedWeightG: 202.5,
      differencePercent: 1.14,
      lossPercentage: 1.32,
      grade: 'A',
      unitPriceVnd: 45000,
      totalRevenueVnd: 6912000,
      notes: 'Thu hoạch vụ trước tại Phân khu D1 (Xà lách Batavia), búp cuộn giòn ngọt, sai số so với AI chỉ 1.14%.',
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
  console.log(`Đã tạo ${harvestRecords.length} nhật ký thu hoạch đối chiếu AI`);

  // 9. Water Quality Logs
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
  console.log(`Đã tạo ${waterLogs.length} bản ghi đo đạc chất lượng nước khởi tạo`);

  // 10. Environment Logs (1 bản ghi khởi tạo cho mỗi nhà màng)
  const envLogs = [
    { id: 'env-01', zoneId: 'zone-a1', airTemp: 22.8, humidity: 68.0, co2: 435.0, ppfd: 215.0, dli: 15.4, vpd: 0.88, recordedBy: 'SEN-ENV-A1', source: 'sensor' },
    { id: 'env-02', zoneId: 'zone-b2', airTemp: 23.2, humidity: 68.5, co2: 435.0, ppfd: 220.0, dli: 15.2, vpd: 0.89, recordedBy: 'SEN-ENV-B2', source: 'sensor' }
  ];

  for (const el of envLogs) {
    await prisma.environmentLog.upsert({
      where: { id: el.id },
      update: el,
      create: el
    });
  }
  console.log(`Đã tạo ${envLogs.length} bản ghi vi khí hậu khởi tạo`);

  console.log('🎉 Hoàn thành nạp dữ liệu gọn sạch (đã xóa toàn bộ dữ liệu thừa)!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
