import type { Cultivar, CropBatch, Reservoir, NutrientFormula, Alert, HarvestRecord, Channel, SolutionDrainEvent, FarmZone, Sensor } from '../types/farm';

function dateFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(offsetDays));
  return d.toISOString().slice(0, 10);
}

export const INITIAL_CULTIVARS: Cultivar[] = [
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

export const INITIAL_RESERVOIRS: Reservoir[] = [
  {
    id: 'res-01',
    name: 'Bể Tuần Hoàn 01 - Giàn NFT Tầng 1 (Khu A & E)',
    systemType: 'NFT',
    capacityLiters: 600,
    currentVolumeLiters: 540,
    currentPh: 5.95,
    currentEc: 1.72,
    currentWaterTemp: 21.8,
    currentDo: 7.5,
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
    capacityLiters: 1000,
    currentVolumeLiters: 900,
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

export const INITIAL_FORMULAS: NutrientFormula[] = [
  {
    id: 'form-01',
    name: 'Chuẩn Hoagland - Resh Xà Lách Thủy Canh (NFT Sinh Trưởng)',
    applicableCrop: 'Xà lách mỡ, Oak Leaf, Lollo Bionda, Batavia',
    systemType: 'Hệ thống màng dinh dưỡng NFT',
    scientificStandard: 'Chuẩn quốc tế Hoagland & Resh (2012) cải tiến bởi ĐH Cornell cho rau xà lách',
    targetEc: 1.68,
    targetPh: 5.85,
    dosingRatio: '1:100 (10 ml Stock A + 10 ml Stock B trên 1 Lít nước sạch -> tăng ~1.65 mS/cm)',
    chemicalIncompatibilityReason: 'Tuyệt đối không pha chung Stock A và B ở dạng đậm đặc vì ion Ca²⁺ phản ứng với SO₄²⁻ và PO₄³⁻ tạo kết tủa trắng CaSO₄ (thạch cao) và Ca₃(PO₄)₂, làm tắc máng NFT và rễ cây thiếu Canxi gây cháy mép lá (tipburn).',
    stockADetails: 'Canxi Nitrat [Ca(NO3)2·4H2O]: 1,000g, Kali Nitrat [KNO3]: 200g, Sắt Chelate [Fe-EDDHA 6%]: 40g (cho 10L dung dịch mẹ)',
    stockBDetails: 'MKP [KH2PO4]: 250g, Kali Nitrat [KNO3]: 400g, Magie Sulfat [MgSO4·7H2O]: 550g, Kali Sulfat [K2SO4]: 100g, Vi lượng Chelate: 25g (cho 10L dung dịch mẹ)',
    stockAItems: [
      { name: 'Canxi Nitrat Tinh Khiết', chemicalFormula: 'Ca(NO3)2·4H2O', gramsPer10LStock: 1000, primaryNutrients: 'Ca (165 ppm), N-NO3 (118 ppm)', grade: 'YaraLiva Calcinit (Hòa tan 100%)' },
      { name: 'Kali Nitrat Bổ Sung', chemicalFormula: 'KNO3', gramsPer10LStock: 200, primaryNutrients: 'K (77 ppm), N-NO3 (26 ppm)', grade: 'Haifa Multi-K' },
      { name: 'Sắt Chelate Hữu Cơ Bền Vững', chemicalFormula: 'Fe-EDDHA (6% Fe)', gramsPer10LStock: 40, primaryNutrients: 'Fe (2.4 - 3.0 ppm)', grade: 'AkzoNobel Dissolvine' }
    ],
    stockBItems: [
      { name: 'Monopotassium Phosphate (MKP)', chemicalFormula: 'KH2PO4', gramsPer10LStock: 250, primaryNutrients: 'P (50 ppm), K (65 ppm)', grade: 'Haifa MKP Tinh Khiết' },
      { name: 'Magie Sulfat Nông Nghiệp', chemicalFormula: 'MgSO4·7H2O', gramsPer10LStock: 550, primaryNutrients: 'Mg (54 ppm), S (72 ppm)', grade: 'Epsom Salt Nông Nghiệp' },
      { name: 'Kali Sulfat Tan Nhanh', chemicalFormula: 'K2SO4', gramsPer10LStock: 100, primaryNutrients: 'K (45 ppm), S (18 ppm)', grade: 'Haifa SOP' },
      { name: 'Hỗn Hợp Vi Lượng Chelate Tổng Hợp', chemicalFormula: 'B, Mn, Zn, Cu, Mo', gramsPer10LStock: 25, primaryNutrients: 'B (0.5ppm), Mn (0.5ppm), Zn (0.1ppm), Cu (0.05ppm), Mo (0.03ppm)', grade: 'Tenso Cocktail Micronutrients' }
    ],
    targetPpm: { n: 165, p: 48, k: 210, ca: 165, mg: 45, s: 65, fe: 2.8 },
    notes: 'Công thức cân bằng tối ưu cho máng mỏng NFT vùng khí hậu nhiệt đới, giữ pH ổn định và hạn chế tối đa nguy cơ cháy lá sinh lý.'
  }
];

export const INITIAL_BATCHES: CropBatch[] = [
  {
    id: 'batch-01',
    batchCode: 'LET-2026-001',
    cultivarId: 'cult-01',
    cultivarName: 'Green Oak Leaf',
    cropName: 'Xà lách (Lettuce)',
    systemType: 'NFT',
    reservoirId: 'res-01',
    reservoirName: 'Bể Tuần Hoàn 01 (NFT)',
    zoneId: 'zone-a1',
    zoneCode: 'A1',
    zoneName: 'Phân khu A1 - Nhà màng 1',
    plantQuantity: 650,
    currentQuantity: 642,
    seedDate: dateFromToday(-22),
    transplantDate: dateFromToday(-11),
    expectedHarvestDate: dateFromToday(13),
    currentStage: 'vegetative',
    status: 'active',
    densityPlantsPerM2: 26,
    notes: 'Ngày tuổi 22/35 (Sinh dưỡng). Nước đạt chuẩn, rễ trắng khỏe.',
    lastObservation: {
      date: dateFromToday(0),
      avgLeafCount: 15.2,
      avgHeightCm: 15.1,
      sampleWeightG: 103.4,
      notes: 'Đo sinh trắc học ngày thứ 22/35: cây khỏe mạnh, đồng đều.'
    }
  },
  {
    id: 'batch-02',
    batchCode: 'LET-2026-002',
    cultivarId: 'cult-02',
    cultivarName: 'Batavia Lettuce',
    cropName: 'Xà lách (Lettuce)',
    systemType: 'NFT',
    reservoirId: 'res-01',
    reservoirName: 'Bể Tuần Hoàn 01 (NFT)',
    zoneId: 'zone-a2',
    zoneCode: 'A2',
    zoneName: 'Phân khu A2 - Nhà màng 1',
    plantQuantity: 500,
    currentQuantity: 495,
    seedDate: dateFromToday(-15),
    transplantDate: dateFromToday(-4),
    expectedHarvestDate: dateFromToday(21),
    currentStage: 'vegetative',
    status: 'active',
    densityPlantsPerM2: 24,
    notes: 'Ngày tuổi 15/36 (Sinh dưỡng - Xà lách Batavia hỗ trợ AI Dự báo). Nước đạt chuẩn, rễ trắng khỏe.',
    lastObservation: {
      date: dateFromToday(0),
      avgLeafCount: 10.8,
      avgHeightCm: 10.7,
      sampleWeightG: 35.8,
      notes: 'Đo sinh trắc học ngày thứ 15/36: cây Batavia bén rễ khỏe, đang tăng sinh khối.'
    }
  },
  {
    id: 'batch-03',
    batchCode: 'LET-2026-003',
    cultivarId: 'cult-03',
    cultivarName: 'Romaine (Cos)',
    cropName: 'Xà lách (Lettuce)',
    systemType: 'NFT',
    reservoirId: 'res-02',
    reservoirName: 'Bể Tuần Hoàn 02 (NFT)',
    zoneId: 'zone-b2',
    zoneCode: 'B2',
    zoneName: 'Phân khu B2 - Nhà màng 1',
    plantQuantity: 800,
    currentQuantity: 785,
    seedDate: dateFromToday(-31),
    transplantDate: dateFromToday(-20),
    expectedHarvestDate: dateFromToday(7),
    currentStage: 'pre_harvest',
    status: 'active',
    densityPlantsPerM2: 22,
    notes: 'Ngày tuổi 31/38 (Tích lũy sinh khối). Búp cuộn chắc, chuẩn bị thu hoạch.',
    lastObservation: {
      date: dateFromToday(0),
      avgLeafCount: 19.1,
      avgHeightCm: 18.9,
      sampleWeightG: 200.6,
      notes: 'Đo sinh trắc học ngày thứ 31/38: búp cuộn đặc, đồng đều.'
    }
  },
  {
    id: 'batch-00-hist',
    batchCode: 'LET-2026-000',
    cultivarId: 'cult-02',
    cultivarName: 'Batavia Lettuce',
    cropName: 'Xà lách (Lettuce)',
    systemType: 'NFT',
    reservoirId: 'res-02',
    reservoirName: 'Bể Tuần Hoàn 02 (NFT)',
    zoneId: 'zone-d1',
    zoneCode: 'D1',
    zoneName: 'Phân khu D1 - Nhà màng 2',
    plantQuantity: 760,
    currentQuantity: 750,
    seedDate: dateFromToday(-46),
    transplantDate: dateFromToday(-35),
    expectedHarvestDate: dateFromToday(-10),
    actualHarvestDate: dateFromToday(-10),
    currentStage: 'harvest',
    status: 'harvested',
    densityPlantsPerM2: 24,
    notes: 'Lô Xà lách Batavia vụ trước tại Phân khu D1 đã thu hoạch hoàn tất, đạt chuẩn loại A.',
    lastObservation: {
      date: dateFromToday(-10),
      avgLeafCount: 22.0,
      avgHeightCm: 21.5,
      sampleWeightG: 204.8,
      notes: 'Kiểm tra sinh khối trước khi thu hoạch toàn bộ lô.'
    }
  }
];

export const INITIAL_SENSOR_HISTORY = [
  { day: '04/09', time: '08:00', ph: 5.75, ec: 1.62, waterTemp: 22.0, airTemp: 26.5, humidity: 68, vpd: 1.08 },
  { day: '04/09', time: '14:00', ph: 5.82, ec: 1.68, waterTemp: 23.2, airTemp: 29.8, humidity: 62, vpd: 1.58 },
  { day: '05/09', time: '08:00', ph: 5.80, ec: 1.66, waterTemp: 22.1, airTemp: 26.0, humidity: 70, vpd: 1.01 },
  { day: '05/09', time: '14:00', ph: 5.91, ec: 1.74, waterTemp: 23.5, airTemp: 30.2, humidity: 60, vpd: 1.71 },
  { day: '06/09', time: '08:00', ph: 5.85, ec: 1.70, waterTemp: 22.3, airTemp: 26.8, humidity: 67, vpd: 1.16 },
  { day: '06/09', time: '14:00', ph: 5.98, ec: 1.82, waterTemp: 23.8, airTemp: 30.8, humidity: 58, vpd: 1.87 },
  { day: '07/09', time: '08:00', ph: 5.88, ec: 1.75, waterTemp: 22.2, airTemp: 26.2, humidity: 69, vpd: 1.05 },
  { day: '07/09', time: '14:00', ph: 6.02, ec: 1.88, waterTemp: 24.1, airTemp: 31.0, humidity: 59, vpd: 1.84 },
  { day: '08/09', time: '08:00', ph: 5.84, ec: 1.72, waterTemp: 22.0, airTemp: 25.8, humidity: 71, vpd: 0.96 },
  { day: '08/09', time: '14:00', ph: 5.90, ec: 1.76, waterTemp: 23.0, airTemp: 29.5, humidity: 64, vpd: 1.48 },
  { day: '09/09', time: '08:00', ph: 5.82, ec: 1.69, waterTemp: 22.2, airTemp: 26.0, humidity: 70, vpd: 1.01 },
  { day: '09/09', time: '14:00', ph: 5.89, ec: 1.74, waterTemp: 22.8, airTemp: 29.0, humidity: 65, vpd: 1.40 },
  { day: '10/09', time: '08:00', ph: 5.85, ec: 1.72, waterTemp: 22.4, airTemp: 26.4, humidity: 68, vpd: 1.10 }
];

export const INITIAL_ALERTS: Alert[] = [];

export const INITIAL_HARVESTS: HarvestRecord[] = [
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
    lossPercentage: 1.32,
    aiPredictedWeightG: 202.5,
    differencePercent: 1.14,
    grade: 'A',
    unitPriceVnd: 45000,
    totalRevenueVnd: 6912000,
    operatorName: 'Phạm Văn Vận Hành',
    notes: 'Thu hoạch vụ trước tại Phân khu D1 (Xà lách Batavia), búp cuộn giòn ngọt, sai số so với AI chỉ 1.14%.'
  }
];

export const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-01', name: 'Máng NFT A1', reservoirId: 'res-01', batchId: 'batch-01', slotCount: 100, activePlants: 162, status: 'active', notes: 'Tầng 1, giàn A1' },
  { id: 'ch-02', name: 'Máng NFT A2', reservoirId: 'res-01', batchId: 'batch-01', slotCount: 100, activePlants: 160, status: 'active', notes: 'Tầng 1, giàn A1' },
  { id: 'ch-03', name: 'Máng NFT A3', reservoirId: 'res-01', batchId: 'batch-01', slotCount: 100, activePlants: 160, status: 'active', notes: 'Tầng 2, giàn A1' },
  { id: 'ch-04', name: 'Máng NFT A4', reservoirId: 'res-01', batchId: 'batch-01', slotCount: 100, activePlants: 160, status: 'active', notes: 'Tầng 2, giàn A1' },
  { id: 'ch-05', name: 'Máng NFT A5', reservoirId: 'res-01', batchId: 'batch-02', slotCount: 100, activePlants: 248, status: 'active', notes: 'Tầng 3, giàn A2 — Batavia' },
  { id: 'ch-06', name: 'Máng NFT A6', reservoirId: 'res-01', batchId: 'batch-02', slotCount: 100, activePlants: 247, status: 'active', notes: 'Tầng 3, giàn A2 — Batavia' },
  { id: 'ch-07', name: 'Máng NFT B1', reservoirId: 'res-02', batchId: 'batch-03', slotCount: 120, activePlants: 197, status: 'active', notes: 'Tầng 1, giàn B2 — Romaine' },
  { id: 'ch-08', name: 'Máng NFT B2', reservoirId: 'res-02', batchId: 'batch-03', slotCount: 120, activePlants: 196, status: 'active', notes: 'Tầng 2, giàn B2 — Romaine' },
  { id: 'ch-09', name: 'Máng NFT B3', reservoirId: 'res-02', batchId: 'batch-03', slotCount: 120, activePlants: 196, status: 'active', notes: 'Tầng 3, giàn B2 — Romaine' },
  { id: 'ch-10', name: 'Máng NFT B4', reservoirId: 'res-02', batchId: 'batch-03', slotCount: 120, activePlants: 196, status: 'active', notes: 'Tầng 4, giàn B2 — Romaine' },
  { id: 'ch-11', name: 'Máng NFT B5', reservoirId: 'res-02', batchId: undefined, slotCount: 120, activePlants: 0, status: 'empty', notes: 'Đang trống, chuẩn bị cho lô mới' }
];

export const INITIAL_DRAIN_EVENTS: SolutionDrainEvent[] = [];

export const INITIAL_SENSORS: Sensor[] = [
  { id: 'sen-01', code: 'SEN-PH-01', name: 'Cảm biến pH Bể Tuần Hoàn 01', sensorType: 'ph', status: 'online', reservoirId: 'res-01', lastReading: 5.95, unit: 'pH', batteryLevel: 98.0 },
  { id: 'sen-02', code: 'SEN-EC-01', name: 'Cảm biến EC Bể Tuần Hoàn 01', sensorType: 'ec', status: 'online', reservoirId: 'res-01', lastReading: 1.72, unit: 'mS/cm', batteryLevel: 97.0 },
  { id: 'sen-03', code: 'SEN-TEMP-01', name: 'Cảm biến Nhiệt nước Bể 01', sensorType: 'water_temp', status: 'online', reservoirId: 'res-01', lastReading: 21.8, unit: '°C', batteryLevel: 99.0 },
  { id: 'sen-04', code: 'SEN-DO-01', name: 'Cảm biến Oxy hòa tan Bể 01', sensorType: 'do', status: 'online', reservoirId: 'res-01', lastReading: 7.5, unit: 'mg/L', batteryLevel: 95.0 },
  { id: 'sen-05', code: 'SEN-LVL-01', name: 'Cảm biến Mực nước Bể 01', sensorType: 'water_level', status: 'online', reservoirId: 'res-01', lastReading: 90.0, unit: '%', batteryLevel: 99.0 },
  { id: 'sen-06', code: 'SEN-PH-02', name: 'Cảm biến pH Bể Tuần Hoàn 02', sensorType: 'ph', status: 'online', reservoirId: 'res-02', lastReading: 5.82, unit: 'pH', batteryLevel: 96.0 },
  { id: 'sen-07', code: 'SEN-EC-02', name: 'Cảm biến EC Bể Tuần Hoàn 02', sensorType: 'ec', status: 'online', reservoirId: 'res-02', lastReading: 1.75, unit: 'mS/cm', batteryLevel: 95.0 },
  { id: 'sen-08', code: 'SEN-TEMP-02', name: 'Cảm biến Nhiệt nước Bể 02', sensorType: 'water_temp', status: 'online', reservoirId: 'res-02', lastReading: 21.4, unit: '°C', batteryLevel: 98.0 },
  { id: 'sen-09', code: 'SEN-DO-02', name: 'Cảm biến Oxy hòa tan Bể 02', sensorType: 'do', status: 'online', reservoirId: 'res-02', lastReading: 7.6, unit: 'mg/L', batteryLevel: 94.0 },
  { id: 'sen-12', code: 'SEN-LVL-02', name: 'Cảm biến Mực nước Bể 02', sensorType: 'water_level', status: 'online', reservoirId: 'res-02', lastReading: 90.0, unit: '%', batteryLevel: 98.0 },
  { id: 'sen-10', code: 'SEN-ENV-A1', name: 'Trạm vi khí hậu giàn Nhà màng 1', sensorType: 'multi', status: 'online', zoneId: 'zone-a1', lastReading: 22.8, unit: '°C', batteryLevel: 100.0 },
  { id: 'sen-11', code: 'SEN-ENV-B2', name: 'Trạm vi khí hậu giàn Nhà màng 2', sensorType: 'multi', status: 'online', zoneId: 'zone-b2', lastReading: 23.2, unit: '°C', batteryLevel: 100.0 }
];

export const INITIAL_ZONES: FarmZone[] = [
  {
    id: 'zone-a1',
    code: 'A1',
    name: 'Phân khu A1 - Nhà màng 1',
    greenhouse: 'Nhà màng 1',
    areaM2: 500,
    slotCapacity: 12500,
    color: '#16a34a',
    status: 'growing',
    currentBatchId: 'batch-01',
    currentBatchCode: 'LET-2026-001',
    cultivarName: 'Green Oak Leaf',
    cropName: 'Xà lách (Lettuce)',
    plantQuantity: 650,
    currentQuantity: 642,
    currentStage: 'vegetative',
    seedDate: '2026-08-15',
    expectedHarvestDate: '2026-09-19',
    daysRemaining: 10,
    biomassProgress: 55,
    reservoirId: 'res-01',
    reservoirName: 'Bể Tuần Hoàn 01 (NFT)',
    ph: 5.85,
    ec: 1.72,
    waterTemp: 22.4
  },
  {
    id: 'zone-a2',
    code: 'A2',
    name: 'Phân khu A2 - Nhà màng 1',
    greenhouse: 'Nhà màng 1',
    areaM2: 600,
    slotCapacity: 15000,
    color: '#84cc16',
    status: 'growing',
    currentBatchId: 'batch-02',
    currentBatchCode: 'LET-2026-002',
    cultivarName: 'Batavia Lettuce',
    cropName: 'Xà lách (Lettuce)',
    plantQuantity: 500,
    currentQuantity: 495,
    currentStage: 'seedling',
    seedDate: '2026-08-28',
    expectedHarvestDate: '2026-10-02',
    daysRemaining: 23,
    biomassProgress: 25,
    reservoirId: 'res-01',
    reservoirName: 'Bể Tuần Hoàn 01 (NFT)',
    ph: 5.85,
    ec: 1.72,
    waterTemp: 22.4
  },
  {
    id: 'zone-b2',
    code: 'B2',
    name: 'Phân khu B2 - Nhà màng 1',
    greenhouse: 'Nhà màng 1',
    areaM2: 300,
    slotCapacity: 7500,
    color: '#f59e0b',
    status: 'ready_soon',
    currentBatchId: 'batch-03',
    currentBatchCode: 'LET-2026-003',
    cultivarName: 'Romaine (Cos)',
    cropName: 'Xà lách (Lettuce)',
    plantQuantity: 800,
    currentQuantity: 785,
    currentStage: 'pre_harvest',
    seedDate: '2026-08-04',
    expectedHarvestDate: '2026-09-12',
    daysRemaining: 3,
    biomassProgress: 80,
    reservoirId: 'res-02',
    reservoirName: 'Bể Tuần Hoàn 02 (NFT)',
    ph: 6.02,
    ec: 1.84,
    waterTemp: 21.8
  },
  {
    id: 'zone-d1',
    code: 'D1',
    name: 'Phân khu D1 - Nhà màng 2',
    greenhouse: 'Nhà màng 2',
    areaM2: 400,
    slotCapacity: 10000,
    color: '#0ea5e9',
    status: 'completed',
    currentBatchCode: 'LET-2026-000A',
    cultivarName: 'Butterhead',
    cropName: 'Xà lách (Lettuce)',
    plantQuantity: 950,
    currentQuantity: 0,
    currentStage: 'harvest',
    seedDate: '2026-07-10',
    expectedHarvestDate: '2026-08-15',
    daysRemaining: 0,
    biomassProgress: 100,
    reservoirId: 'res-02',
    reservoirName: 'Bể Tuần Hoàn 02 (NFT)',
    ph: 6.0,
    ec: 1.8,
    waterTemp: 22.0
  },
  {
    id: 'zone-c1',
    code: 'C1',
    name: 'Phân khu C1 - Nhà màng 2',
    greenhouse: 'Nhà màng 2',
    areaM2: 800,
    slotCapacity: 20000,
    color: '#8b5cf6',
    status: 'completed',
    currentBatchCode: 'LET-2026-000B',
    cultivarName: 'Lollo Rossa',
    cropName: 'Xà lách (Lettuce)',
    plantQuantity: 1800,
    currentQuantity: 0,
    currentStage: 'harvest',
    seedDate: '2026-07-15',
    expectedHarvestDate: '2026-08-20',
    daysRemaining: 0,
    biomassProgress: 100,
    reservoirId: 'res-02',
    reservoirName: 'Bể Tuần Hoàn 02 (NFT)',
    ph: 6.0,
    ec: 1.8,
    waterTemp: 22.0
  },
  {
    id: 'zone-e1',
    code: 'E1',
    name: 'Phân khu E1 - Nhà màng 2',
    greenhouse: 'Nhà màng 2',
    areaM2: 100,
    slotCapacity: 2500,
    color: '#ef4444',
    status: 'needs_attention',
    currentBatchCode: 'LET-2026-EXP (Bảo trì béc)',
    cultivarName: 'Red Oak Leaf',
    cropName: 'Xà lách (Lettuce)',
    plantQuantity: 250,
    currentQuantity: 210,
    currentStage: 'seedling',
    seedDate: '2026-08-30',
    expectedHarvestDate: '2026-10-05',
    daysRemaining: 26,
    biomassProgress: 15,
    reservoirId: 'res-01',
    reservoirName: 'Bể Tuần Hoàn 01 (NFT)',
    ph: 6.4,
    ec: 2.3,
    waterTemp: 25.5
  }
];
