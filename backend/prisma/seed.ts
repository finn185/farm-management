import 'dotenv/config';
import { PrismaClient, Role, GrowthStage, BatchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seeding)...');

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('HydroSmart123@', salt);

  // 1. Users
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
            details: `Khởi tạo tài khoản mẫu: ${u.role}`
          }
        }
      }
    });
    console.log(`✅ Đã tạo tài khoản: ${user.email} (${user.role})`);
  }

  // 2. Cultivars
  const cultivars = [
    {
      id: 'cult-01',
      cropName: 'Xà lách (Lettuce)',
      name: 'Green Oak Leaf',
      scientificName: 'Lactuca sativa var. crispa',
      description: 'Xà lách lá sồi xanh, tán xòe đẹp, thích hợp hệ thống NFT, chu kỳ ngắn, năng suất cao.',
      targetCycleDays: 35,
      expectedWeightG: 190.0,
      recommendedPhMin: 5.6,
      recommendedPhMax: 6.2,
      recommendedEcMin: 1.4,
      recommendedEcMax: 1.9,
      optimalWaterTempMin: 20.0,
      optimalWaterTempMax: 24.0
    },
    {
      id: 'cult-02',
      cropName: 'Xà lách (Lettuce)',
      name: 'Batavia Lettuce',
      scientificName: 'Lactuca sativa var. capitata',
      description: 'Xà lách cuộn giòn, chịu nhiệt tốt, thích hợp hệ thống máng tuần hoàn NFT.',
      targetCycleDays: 36,
      expectedWeightG: 205.0,
      recommendedPhMin: 5.8,
      recommendedPhMax: 6.3,
      recommendedEcMin: 1.5,
      recommendedEcMax: 2.0,
      optimalWaterTempMin: 21.0,
      optimalWaterTempMax: 25.0
    },
    {
      id: 'cult-03',
      cropName: 'Xà lách (Lettuce)',
      name: 'Romaine (Cos)',
      scientificName: 'Lactuca sativa var. longifolia',
      description: 'Xà lách La Mã thân đứng, lá dày nhiều dinh dưỡng, thích hợp máng hồi lưu NFT.',
      targetCycleDays: 38,
      expectedWeightG: 230.0,
      recommendedPhMin: 5.5,
      recommendedPhMax: 6.0,
      recommendedEcMin: 1.6,
      recommendedEcMax: 2.1,
      optimalWaterTempMin: 19.0,
      optimalWaterTempMax: 23.5
    }
  ];

  for (const c of cultivars) {
    await prisma.cultivar.upsert({
      where: { id: c.id },
      update: {},
      create: c
    });
  }
  console.log(`✅ Đã tạo ${cultivars.length} giống cây trồng`);

  // 3. Reservoirs
  const reservoirs = [
    {
      id: 'res-01',
      name: 'Bể Tuần Hoàn 01 - Giàn NFT Tầng 1',
      systemType: 'NFT',
      capacityLiters: 600.0,
      currentVolumeLiters: 540.0,
      currentPh: 5.85,
      currentEc: 1.72,
      currentWaterTemp: 22.4,
      formulaName: 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)',
      lastTopUpDate: '2026-09-09',
      lastReplacementDate: '2026-08-25',
      pumpStatus: 'running',
      aerationStatus: 'active'
    },
    {
      id: 'res-02',
      name: 'Bể Tuần Hoàn 02 - Giàn NFT Tầng 2',
      systemType: 'NFT',
      capacityLiters: 1000.0,
      currentVolumeLiters: 920.0,
      currentPh: 6.02,
      currentEc: 1.84,
      currentWaterTemp: 21.8,
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
      update: {},
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
  console.log(`✅ Đã tạo ${farmZones.length} phân khu thực địa NFT (A1, A2, B2, D1, C1, E1)`);

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
      notes: 'Máng NFT tầng 2, tốc độ sinh trưởng đồng đều, rễ trắng khỏe.',
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
      notes: 'Mới chuyển máng NFT 2 ngày, bén rễ tốt, bắt đầu bung lá thật thứ 3.',
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
      notes: 'Giai đoạn cuối trước thu hoạch. Cây cuộn búp chắc, lá xanh bóng.',
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
      update: {},
      create: batchData
    });

    for (const obs of observations) {
      await prisma.cropObservation.upsert({
        where: { id: obs.id },
        update: {},
        create: {
          ...obs,
          batchId: createdBatch.id
        }
      });
    }
  }
  console.log(`✅ Đã tạo ${batches.length} lô canh tác xà lách thủy canh kèm dữ liệu đo đạc`);

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
      update: {},
      create: f
    });
  }
  console.log(`✅ Đã tạo ${formulas.length} công thức dinh dưỡng tiêu chuẩn khoa học`);

  // 7. Alerts
  const alerts = [
    {
      id: 'alert-01',
      severity: 'warning',
      status: 'open',
      metric: 'EC',
      title: 'Độ dẫn điện EC bể 01 giảm nhẹ',
      message: 'EC hiện tại 1.42 mS/cm thấp hơn ngưỡng khuyến nghị (1.5 - 2.0 mS/cm) cho lô LET-2026-001 giàn A1.',
      suggestedAction: 'Châm thêm 350ml dung dịch mẹ Stock A & Stock B vào Bể Tuần Hoàn 01.',
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
      message: 'pH hiện tại 6.75 cao hơn ngưỡng tối ưu (5.5 - 6.5) cho giống Romaine lô LET-2026-003 giàn B2.',
      suggestedAction: 'Châm 150ml axit Phosphoric (pH Down 10%) để hạ pH về mức 5.8.',
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
      update: {},
      create: a
    });
  }
  console.log(`✅ Đã tạo ${alerts.length} cảnh báo kỹ thuật liên kết thực địa`);

  // 8. Harvest Records
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
      update: {},
      create: h
    });
  }
  console.log(`✅ Đã tạo ${harvestRecords.length} nhật ký thu hoạch đối chiếu AI`);

  // 9. Water Quality Logs
  const waterLogs = [
    { id: 'wlog-01', reservoirId: 'res-01', ph: 5.85, ec: 1.72, waterTemp: 22.4, doLevel: 6.8, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-02', reservoirId: 'res-01', ph: 5.82, ec: 1.70, waterTemp: 22.6, doLevel: 6.7, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-03', reservoirId: 'res-01', ph: 5.84, ec: 1.71, waterTemp: 22.5, doLevel: 6.8, recordedBy: 'IoT-Sensor-01', source: 'sensor' },
    { id: 'wlog-04', reservoirId: 'res-02', ph: 6.02, ec: 1.84, waterTemp: 21.8, doLevel: 7.2, recordedBy: 'IoT-Sensor-02', source: 'sensor' },
    { id: 'wlog-05', reservoirId: 'res-02', ph: 6.10, ec: 1.80, waterTemp: 22.0, doLevel: 7.1, recordedBy: 'IoT-Sensor-02', source: 'sensor' },
    { id: 'wlog-06', reservoirId: 'res-02', ph: 6.05, ec: 1.82, waterTemp: 21.9, doLevel: 7.1, recordedBy: 'IoT-Sensor-02', source: 'sensor' }
  ];

  for (const wl of waterLogs) {
    await prisma.waterQualityLog.upsert({
      where: { id: wl.id },
      update: {},
      create: wl
    });
  }
  console.log(`✅ Đã tạo ${waterLogs.length} bản ghi đo đạc chất lượng nước bể`);

  // 10. Solution Drain Events
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
      update: {},
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
