/**
 * simulator.service.ts
 * --------------------------------------------------------------------------
 * TRẠM GIẢ LẬP IoT (VIRTUAL DEVICES) CHO HỆ THỐNG THỦY CANH NFT
 *
 * Vai trò: đóng giả các node ESP32 ngoài trang trại.
 *   - Mỗi bể dung dịch  = 1 node "SIM-RES-xx"  (pH, EC, nhiệt độ nước, DO, mực nước)
 *   - Mỗi phân khu/nhà màng có trạm khí hậu = 1 node "SIM-ENV-xx" (nhiệt độ, độ ẩm, ánh sáng, CO2)
 *
 * Mỗi nhịp (tick):
 *   1. Tiến đồng hồ mô phỏng, tính vi khí hậu ngày/đêm.
 *   2. Đọc trạng thái bể trong DB → phát hiện can thiệp thủ công (châm phân, bù nước, xả bể...).
 *   3. Chạy mô hình thủy canh (hydro-model.ts) → giá trị "thật" + nhiễu cảm biến.
 *   4. Đóng gói DeviceTelemetryPayload → gửi vào SensorsService.ingestDeviceReadings()
 *      (CHÍNH LÀ hàm xử lý khi ESP32 thật POST lên /api/v1/sensors/telemetry/batch).
 *
 * → Khi có thiết bị thật: tắt simulator (DATA_SOURCE=device), cho ESP32 gửi cùng gói tin.
 */
import { prisma } from '../../utils/prisma';
import { config } from '../../config/env';
import { sensorsService, type DeviceTelemetryPayload, type DeviceReading } from '../sensors/sensors.service';
import {
  BATAVIA_PROFILE,
  computeClimate,
  evaluateBataviaGrowth,
  gaussian,
  round,
  stepReservoir,
  type ClimateState,
  type GrowthImpact,
  type ScenarioKey,
  type WaterState
} from './hydro-model';

// ===================== DANH MỤC KỊCH BẢN SỰ CỐ =====================
// scope = 'farm'      → sự cố của cả trang trại (thời tiết), áp dụng cho mọi bể & nhà màng
// scope = 'reservoir' → sự cố thiết bị của riêng 1 bể
// watch               → chỉ số nên theo dõi trên giao diện khi kích hoạt kịch bản
export const SCENARIOS: {
  key: ScenarioKey;
  title: string;
  short: string;
  scope: 'farm' | 'reservoir';
  watch: 'ph' | 'ec' | 'waterTemp' | 'doLevel' | 'levelPercent';
  cause: string;
  expected: string;
  response: string;
}[] = [
    {
      key: 'normal',
      title: 'Vận hành bình thường',
      short: 'Tắt sự cố, bể tự vận hành',
      scope: 'reservoir',
      watch: 'ec',
      cause: 'Bơm, sục khí, chiller hoạt động tốt. Các chỉ số chỉ trôi chậm theo quy luật tự nhiên.',
      expected: 'Mực nước giảm dần, EC tăng nhẹ, pH tăng chậm, nhiệt độ dao động ngày/đêm.',
      response: 'Theo dõi định kỳ; bù nước và chỉnh pH khi chỉ số chạm ngưỡng.'
    },
    {
      key: 'heatwave',
      title: 'Nắng nóng',
      short: 'Nhiệt độ nước tăng vượt 25°C',
      scope: 'farm',
      watch: 'waterTemp',
      cause: 'Thời tiết nắng nóng: nhiệt độ nhà màng tăng 6–7°C, máy làm lạnh nước không theo kịp. Áp dụng cho TOÀN trang trại.',
      expected: 'Nhiệt độ nước vượt 25°C, cảnh báo Temp (CRITICAL, EMERGENCY khi ≥ 29°C). DO giảm theo.',
      response: 'Bật chiller/quạt hút, kéo lưới cắt nắng, bù nước mát.'
    },
    {
      key: 'aeration_fail',
      title: 'Hỏng máy sục khí',
      short: 'Oxy hoà tan (DO) tụt mạnh',
      scope: 'reservoir',
      watch: 'doLevel',
      cause: 'Máy bơm khí hỏng hoặc mất điện, nước không được bổ sung oxy.',
      expected: 'DO tụt dưới 6 mg/L, cảnh báo DO (EMERGENCY khi ≤ 3.5 mg/L).',
      response: 'Kiểm tra máy sục, bật máy dự phòng, giảm nhiệt độ nước.'
    },
    {
      key: 'nutrient_depletion',
      title: 'Cạn dinh dưỡng',
      short: 'EC giảm dưới ngưỡng',
      scope: 'reservoir',
      watch: 'ec',
      cause: 'Cây giai đoạn lớn nhanh hút ion mạnh, lâu ngày chưa châm phân.',
      expected: 'EC giảm xuống dưới ngưỡng tối thiểu, cảnh báo EC.',
      response: 'Châm Stock A & B theo Dosing Calculator ở màn hình Bể nước.'
    },
    {
      key: 'ph_drift',
      title: 'pH trôi lên kiềm',
      short: 'pH vượt ngưỡng trên',
      scope: 'reservoir',
      watch: 'ph',
      cause: 'Cây hút NO3- mạnh, nguồn nước có độ kiềm (alkalinity) cao.',
      expected: 'pH vượt ngưỡng tối đa (6.2–6.3), cảnh báo pH.',
      response: 'Châm pH Down (H3PO4 / HNO3 loãng), đo lại sau 15 phút.'
    },
    {
      key: 'water_leak',
      title: 'Rò rỉ nước',
      short: 'Mực nước tụt nhanh',
      scope: 'reservoir',
      watch: 'levelPercent',
      cause: 'Vỡ ống, tràn máng NFT hoặc van xả bị hở.',
      expected: 'Mực nước tụt nhanh xuống dưới 20%, cảnh báo WaterLevel (nguy cơ cháy bơm).',
      response: 'Khoá van, kiểm tra đường ống, bù nước sạch.'
    },
    {
      key: 'sensor_offline',
      title: 'Mất tín hiệu cảm biến',
      short: 'Cảm biến pH ngừng gửi dữ liệu',
      scope: 'reservoir',
      watch: 'ph',
      cause: 'Node ESP32 mất WiFi, mất nguồn hoặc đứt dây đầu dò pH.',
      expected: 'Sau ~3 nhịp không có dữ liệu, cảm biến chuyển Offline và có cảnh báo System.',
      response: 'Kiểm tra nguồn, dây, WiFi; tạm đo tay bằng bút đo pH.'
    }
  ];

export const SPEED_PRESETS = [
  { minutesPerTick: 1, label: '1 nhịp = 1 phút' },
  { minutesPerTick: 10, label: '1 nhịp = 10 phút' },
  { minutesPerTick: 30, label: '1 nhịp = 30 phút' },
  { minutesPerTick: 60, label: '1 nhịp = 1 giờ' }
];

// ===================== KIỂU DỮ LIỆU NỘI BỘ =====================
interface HistoryPoint {
  simTime: string;
  ph: number;
  ec: number;
  waterTemp: number;
  doLevel: number;
  levelPercent: number;
  airTemp: number;
}

interface Range { min: number; max: number }
interface Targets { ph: Range; ec: Range; waterTemp: Range; doMin: number; levelMin: number; source: string }

interface SimBatchInfo {
  id: string;
  code: string;
  cultivar: string;
  plants: number;
  isBatavia: boolean;
  stage: string;
  ageDays: number;
  cycleDays: number;
  daysLeft: number;
  leafCount: number;
  heightCm: number;
  weightG: number;
  targetWeightG: number;
}

interface ReservoirSim {
  id: string;
  name: string;
  truth: WaterState;
  lastWritten: { ph: number; ec: number; waterTemp: number; doLevel: number; volumeLiters: number } | null;
  scenario: ScenarioKey;
  plants: number;
  avgAgeDays: number;
  hasBatavia: boolean;
  batches: SimBatchInfo[];
  sensors: { code: string; type: string }[];
  targets: Targets;
  growth: GrowthImpact;
  lastWaterUptakeL: number;
  history: HistoryPoint[];
}

interface ZoneSim {
  id: string;
  code: string;
  name: string;
  greenhouse: string;
  sensorCode: string;
}

export interface SimEvent {
  id: number;
  realTime: string;
  simTime: string;
  type: 'system' | 'scenario' | 'intervention' | 'alert' | 'device';
  message: string;
}

const SENSOR_PREFIX: Record<string, string> = {
  ph: 'SEN-PH',
  ec: 'SEN-EC',
  water_temp: 'SEN-TEMP',
  do: 'SEN-DO',
  water_level: 'SEN-LVL'
};
const SENSOR_NAME: Record<string, string> = {
  ph: 'Cảm biến pH',
  ec: 'Cảm biến độ dẫn điện EC',
  water_temp: 'Cảm biến nhiệt độ nước',
  do: 'Cảm biến oxy hoà tan DO',
  water_level: 'Cảm biến mực nước'
};
const SENSOR_UNIT: Record<string, string> = {
  ph: 'pH',
  ec: 'mS/cm',
  water_temp: '°C',
  do: 'mg/L',
  water_level: '%'
};

const MAX_HISTORY = 240;
const MAX_EVENTS = 60;
const isBatavia = (name?: string | null) => !!name && /batavia/i.test(name);

/** Vị trí điển hình của mỗi giai đoạn trong chu kỳ trồng (tỷ lệ 0..1 của số ngày chu kỳ) */
const STAGE_AGE_FRACTION: Record<string, number> = {
  seed: 0.03,
  germination: 0.1,
  seedling: 0.28,
  transplant: 0.38,
  vegetative: 0.6,
  pre_harvest: 0.85,
  harvest: 0.97
};

// ===================== SERVICE =====================
class SimulatorService {
  private running = false;
  private ticking = false;
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = config.SIMULATOR_INTERVAL_MS;
  private minutesPerTick = 30;
  private simTime = new Date();
  private prevHour = new Date().getHours();
  private tickCount = 0;
  private startedAt: string | null = null;
  private climate: ClimateState = { airTemp: 24.5, humidity: 70, vpd: 0.92, ppfd: 0, dli: 0, co2: 430 };
  private reservoirs = new Map<string, ReservoirSim>();
  private zones: ZoneSim[] = [];
  private events: SimEvent[] = [];
  private eventSeq = 0;
  private lastPackets: DeviceTelemetryPayload[] = [];
  private lastError: string | null = null;
  /** Nắng nóng là sự cố thời tiết của cả trang trại (không gắn với riêng 1 bể) */
  private farmHeatwave = false;
  /** Mốc thời gian mô phỏng bắt đầu - dùng ước tính tuổi cây cho dữ liệu seed đã quá hạn */
  private simEpoch = new Date();

  /** Chặn mọi thao tác làm thay đổi dữ liệu khi hệ thống đang nhận dữ liệu từ thiết bị thật */
  private assertSimulatorMode() {
    if (config.DATA_SOURCE === 'device') {
      throw new Error('Hệ thống đang ở chế độ thiết bị thật (DATA_SOURCE=device). Trạm giả lập bị khoá để không ghi đè dữ liệu thật.');
    }
  }

  /** Ghi trạng thái máy sục khí vào DB cho các bể đang ở kịch bản hỏng sục khí */
  private async syncAerationToDb(failed: boolean) {
    for (const r of this.reservoirs.values()) {
      if (r.scenario !== 'aeration_fail') continue;
      await prisma.reservoir.update({ where: { id: r.id }, data: { aerationStatus: failed ? 'inactive' : 'active' } }).catch(() => { });
    }
  }

  // ---------- Điều khiển ----------
  async start(options?: { intervalMs?: number; minutesPerTick?: number }) {
    this.assertSimulatorMode();
    if (options?.intervalMs) this.intervalMs = Math.max(1000, Math.min(10000, options.intervalMs));
    if (options?.minutesPerTick) this.minutesPerTick = Math.max(1, Math.min(120, options.minutesPerTick));
    if (this.running) return this.getStatus();

    await this.syncTopology(true);
    // Kịch bản hỏng sục khí vẫn còn trong bộ nhớ → áp lại trạng thái máy sục khí vào DB
    await this.syncAerationToDb(true);
    this.running = true;
    this.startedAt = new Date().toISOString();
    this.pushEvent('system', `▶ Bật Trạm giả lập: ${this.reservoirs.size} node bể + ${this.zones.length} node khí hậu, chu kỳ gửi ${this.intervalMs / 1000}s.`);
    this.timer = setInterval(() => { void this.tick(); }, this.intervalMs);
    await this.tick();
    return this.getStatus();
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.running) {
      this.pushEvent('system', '⏸ Tạm dừng Trạm giả lập. Các thiết bị ảo ngừng gửi dữ liệu (thời gian mô phỏng đóng băng).');
      // Không để DB "kẹt" trạng thái máy sục khí hỏng khi giả lập đã dừng.
      // Kịch bản vẫn được nhớ và áp lại khi bấm Bắt đầu.
      await this.syncAerationToDb(false);
    }
    this.running = false;
    return this.getStatus();
  }

  async setSpeed(minutesPerTick: number) {
    this.assertSimulatorMode();
    this.minutesPerTick = Math.max(1, Math.min(120, Math.round(minutesPerTick)));
    this.pushEvent('system', `⏱ Tốc độ mô phỏng: 1 nhịp = ${this.minutesPerTick} phút.`);
    return this.getStatus();
  }

  /** Chạy đúng 1 nhịp (dùng khi thuyết trình muốn đi từng bước) */
  async stepOnce() {
    this.assertSimulatorMode();
    if (this.reservoirs.size === 0) await this.syncTopology(true);
    await this.tick();
    return this.getStatus();
  }

  async setScenario(reservoirId: string, scenario: ScenarioKey) {
    this.assertSimulatorMode();
    const def = SCENARIOS.find(s => s.key === scenario);
    if (!def) throw new Error(`Kịch bản không hợp lệ: ${scenario}`);
    if (this.reservoirs.size === 0) await this.syncTopology(true);

    // Nắng nóng = sự cố thời tiết của cả trang trại
    if (def.scope === 'farm') {
      this.farmHeatwave = true;
      for (const r of this.reservoirs.values()) {
        r.truth.waterTemp = Math.max(r.truth.waterTemp, r.targets.waterTemp.max + 0.6);
        r.lastWritten = null;
      }
      this.pushEvent('scenario', `⚡ Toàn trang trại: kích hoạt "${def.title}". Dự kiến: ${def.expected}`);
      // Bơm 1 nhịp ngay để thấy hiệu ứng tức thì
      await this.tick();
      return this.getStatus();
    }

    const targets = reservoirId === 'all' ? [...this.reservoirs.values()] : [this.reservoirs.get(reservoirId)].filter(Boolean) as ReservoirSim[];
    if (targets.length === 0) throw new Error('Không tìm thấy bể cần áp dụng kịch bản');

    // "Vận hành bình thường" tắt luôn nắng nóng (nếu đang bật) để demo quay về trạng thái tốt
    if (scenario === 'normal' && this.farmHeatwave) {
      this.farmHeatwave = false;
      this.pushEvent('scenario', 'Toàn trang trại: hết nắng nóng, chiller hoạt động bình thường.');
    }

    for (const r of targets) {
      const prev = r.scenario;
      r.scenario = scenario;

      // Kịch bản hỏng sục khí phản ánh luôn trạng thái thiết bị trong DB
      if (scenario === 'aeration_fail') {
        await prisma.reservoir.update({ where: { id: r.id }, data: { aerationStatus: 'inactive' } });
      } else if (prev === 'aeration_fail') {
        await prisma.reservoir.update({ where: { id: r.id }, data: { aerationStatus: 'active' } });
      }

      // Khi chọn "Vận hành bình thường", đưa chỉ số về lại vùng an toàn ngay để demo mượt mà
      if (scenario === 'normal') {
        const t = r.targets;
        r.truth = {
          ph: round(t.ph.min + (t.ph.max - t.ph.min) * 0.35, 2),
          ec: round((t.ec.min + t.ec.max) / 2, 2),
          waterTemp: round((t.waterTemp.min + t.waterTemp.max) / 2, 1),
          doLevel: 7.6,
          volumeLiters: Math.max(r.truth.volumeLiters, r.truth.capacityLiters * 0.85),
          capacityLiters: r.truth.capacityLiters
        };
        r.growth = evaluateBataviaGrowth(r.truth, this.climate, r.targets);
        await this.sendReservoirPacket(r, r.truth, false);
      } else {
        // Tạo bước nhảy khởi đầu khi bấm kịch bản sự cố để thuyết trình thấy ngay sự thay đổi & cảnh báo,
        // sau đó mô hình vật lý tiếp tục cho chỉ số trôi sâu hơn theo thời gian.
        const t = r.targets;
        if (scenario === 'aeration_fail') {
          r.truth.doLevel = Math.min(r.truth.doLevel, 5.2);
        } else if (scenario === 'nutrient_depletion') {
          r.truth.ec = Math.min(r.truth.ec, round(t.ec.min - 0.12, 2));
        } else if (scenario === 'ph_drift') {
          r.truth.ph = Math.max(r.truth.ph, round(t.ph.max + 0.18, 2));
        } else if (scenario === 'water_leak') {
          r.truth.volumeLiters = Math.min(r.truth.volumeLiters, r.truth.capacityLiters * Math.max(0.14, (t.levelMin - 4) / 100));
        }
        r.lastWritten = null;
      }

      if (scenario === 'normal' && prev === 'normal') continue;
      this.pushEvent(
        'scenario',
        scenario === 'normal'
          ? `${shortName(r.name)}: khôi phục vận hành bình thường và cân bằng lại chỉ số.`
          : `⚡ ${shortName(r.name)}: kích hoạt sự cố "${def.title}". Dự kiến: ${def.expected}`
      );
    }

    // Nếu vừa kích hoạt sự cố mới, chạy luôn 1 nhịp để giao diện phản hồi ngay lập tức
    if (scenario !== 'normal') {
      await this.tick();
    }
    return this.getStatus();
  }

  /** Đưa toàn bộ bể về trạng thái khoẻ mạnh chuẩn cho Batavia (dùng trước buổi demo) */
  async reset() {
    this.assertSimulatorMode();
    await this.syncTopology(true);
    this.simTime = new Date();
    this.simEpoch = new Date(this.simTime);
    this.prevHour = this.simTime.getHours();
    this.tickCount = 0;
    this.events = [];
    this.lastPackets = [];
    this.farmHeatwave = false;
    this.climate = computeClimate(this.simTime, 0, this.prevHour, 0, 'normal');

    for (const r of this.reservoirs.values()) {
      r.scenario = 'normal';
      r.history = [];
      const t = r.targets;
      r.truth = {
        // pH đặt thấp trong dải vì pH sẽ trôi lên tự nhiên
        ph: round(t.ph.min + (t.ph.max - t.ph.min) * 0.3, 2),
        ec: round((t.ec.min + t.ec.max) / 2, 2),
        waterTemp: Math.min(t.waterTemp.max - 0.8, Math.max(t.waterTemp.min + 0.8, 21.2)),
        doLevel: 7.8,
        volumeLiters: r.truth.capacityLiters * 0.9,
        capacityLiters: r.truth.capacityLiters
      };
      r.growth = evaluateBataviaGrowth(r.truth, this.climate, r.targets);
      r.history = [{
        simTime: this.simTime.toISOString(),
        ph: r.truth.ph,
        ec: r.truth.ec,
        waterTemp: r.truth.waterTemp,
        doLevel: r.truth.doLevel,
        levelPercent: 90,
        airTemp: this.climate.airTemp
      }];
      await prisma.reservoir.update({
        where: { id: r.id },
        data: { aerationStatus: 'active', pumpStatus: 'running' }
      });
      // Gửi 1 gói tin chuẩn để DB, cảm biến và cảnh báo cùng đồng bộ về trạng thái tốt
      const pkt = await this.sendReservoirPacket(r, r.truth, false);
      if (pkt) this.lastPackets.push(pkt);
    }
    // Gửi luôn gói khí hậu bình thường để cảnh báo nhiệt độ/ẩm không khí được đánh giá lại
    await this.sendZonePackets(this.lastPackets);
    // Đặt lại các lô cây đang trồng về tuổi và kích thước thực tế để demo quá trình cây lớn lên
    await this.resetPlantGrowthToBaseline();
    // Xóa toàn bộ cảnh báo cũ / đã xử lý để trang Cảnh báo sạch hoàn toàn khi bắt đầu demo mới
    await prisma.alert.deleteMany({});
    await this.syncTopology(false);
    this.pushEvent('system', '♻ Đặt lại kịch bản demo: xóa cảnh báo cũ, đưa mọi bể về giữa dải tối ưu, làm mới tuổi & kích thước các lô cây trồng.');
    return this.getStatus();
  }

  /**
   * Tua nhanh sự phát triển của cây trồng thêm `days` ngày (mặc định +1 ngày).
   * Tốc độ tăng trọng lượng, chiều cao và số lá phụ thuộc trực tiếp vào chất lượng nước hiện tại
   * (growthFactor = 1.0 khi nước tốt; bị giảm nếu nước đang gặp sự cố nhiệt độ/pH/EC/DO).
   * Dữ liệu được cập nhật thẳng vào bảng CropBatch & CropObservation để đồng bộ sang
   * trang Lô cây trồng (/batches), Dashboard và Dự báo AI (/forecast).
   */
  async growPlants(days = 1, batchId?: string) {
    this.assertSimulatorMode();
    const stepDays = Math.max(1, Math.min(15, Math.round(days)));
    if (this.reservoirs.size === 0) await this.syncTopology(true);

    const activeBatches = await prisma.cropBatch.findMany({
      where: {
        status: 'active',
        ...(batchId ? { id: batchId } : {})
      },
      include: {
        cultivar: true,
        observations: { orderBy: { date: 'desc' }, take: 1 }
      }
    });

    if (activeBatches.length === 0) {
      throw new Error('Không tìm thấy lô cây đang trồng để mô phỏng tăng trưởng');
    }

    const todayStr = formatIsoDate(new Date());

    for (const b of activeBatches) {
      const cycleDays = b.cultivar?.targetCycleDays || BATAVIA_PROFILE.cycleDays;
      const targetWeightG = b.cultivar?.expectedWeightG || BATAVIA_PROFILE.expectedWeightG;
      const resSim = this.reservoirs.get(b.reservoirId);
      const growthFactor = resSim ? resSim.growth.growthFactor : 1.0;
      const stressNote = resSim && resSim.growth.stressFlags.length > 0
        ? `Cây lớn chậm (${Math.round(growthFactor * 100)}%) do: ${resSim.growth.stressFlags.join(', ')}`
        : `Nước đạt chuẩn (${Math.round(growthFactor * 100)}%), cây phát triển khỏe mạnh`;

      const currentAge = Math.round(this.estimateAgeDays(b));
      const newAge = Math.min(cycleDays, currentAge + stepDays);
      const actualAddedDays = Math.max(1, newAge - currentAge);

      // Tính sinh trắc học hiện tại từ bản ghi đo gần nhất (hoặc nội suy theo tuổi)
      const latestObs = b.observations[0];
      const baseBio = biometricAtAge(currentAge, cycleDays, targetWeightG);
      const curLeaves = latestObs?.avgLeafCount ?? baseBio.leafCount;
      const curHeight = latestObs?.avgHeightCm ?? baseBio.heightCm;
      const curWeight = latestObs?.sampleWeightG ?? baseBio.weightG;

      // Mức tăng chuẩn khi nước lý tưởng (100%), nhân với hệ số sức khỏe nước hiện tại
      const nextIdealBio = biometricAtAge(newAge, cycleDays, targetWeightG);
      const dLeaves = Math.max(0.4 * actualAddedDays, nextIdealBio.leafCount - baseBio.leafCount) * growthFactor;
      const dHeight = Math.max(0.45 * actualAddedDays, nextIdealBio.heightCm - baseBio.heightCm) * growthFactor;
      const dWeight = Math.max(3.5 * actualAddedDays, nextIdealBio.weightG - baseBio.weightG) * growthFactor;

      const newLeaves = round(Math.min(28, curLeaves + dLeaves), 1);
      const newHeight = round(Math.min(26, curHeight + dHeight), 1);
      const newWeight = round(Math.min(targetWeightG * 1.15, curWeight + dWeight), 1);
      const newStage = stageForAge(newAge, cycleDays);

      // Cập nhật lại mốc ngày gieo / chuyển máng / dự kiến thu hoạch xoay quanh ngày hôm nay
      // để mọi màn hình (Dashboard, Lô cây trồng, AI Dự báo) hiển thị đúng số ngày tuổi mới
      const newSeedDate = shiftDateFromToday(-newAge);
      const newTransplantDate = shiftDateFromToday(-Math.max(1, newAge - 11));
      const newExpectedHarvestDate = shiftDateFromToday(Math.max(0, cycleDays - newAge));

      await prisma.cropBatch.update({
        where: { id: b.id },
        data: {
          seedDate: newSeedDate,
          transplantDate: newTransplantDate,
          expectedHarvestDate: newExpectedHarvestDate,
          currentStage: newStage as any,
          notes: `Ngày tuổi ${newAge}/${cycleDays} (${STAGE_VN[newStage]}). ${stressNote}.`
        }
      });

      if (latestObs) {
        await prisma.cropObservation.update({
          where: { id: latestObs.id },
          data: {
            date: todayStr,
            avgLeafCount: newLeaves,
            avgHeightCm: newHeight,
            sampleWeightG: newWeight,
            notes: `Tua nhanh +${actualAddedDays} ngày (${newAge}/${cycleDays} ngày tuổi). ${stressNote}.`
          }
        });
      } else {
        await prisma.cropObservation.create({
          data: {
            batchId: b.id,
            date: todayStr,
            avgLeafCount: newLeaves,
            avgHeightCm: newHeight,
            sampleWeightG: newWeight,
            notes: `Tua nhanh +${actualAddedDays} ngày (${newAge}/${cycleDays} ngày tuổi). ${stressNote}.`
          }
        });
      }
    }

    await this.syncTopology(false);
    this.pushEvent(
      'system',
      `🌱 Tua nhanh sự phát triển cây trồng +${stepDays} ngày cho ${activeBatches.length} lô canh tác.`
    );
    return this.getStatus();
  }

  /** Đặt lại các lô cây đang trồng về tuổi chuẩn ban đầu để dễ thuyết trình từ giai đoạn đang lớn */
  private async resetPlantGrowthToBaseline() {
    const activeBatches = await prisma.cropBatch.findMany({
      where: { status: 'active' },
      include: {
        cultivar: true,
        observations: { orderBy: { date: 'desc' }, take: 1 }
      },
      orderBy: { batchCode: 'asc' }
    });

    const todayStr = formatIsoDate(new Date());
    const presetAges: Record<string, number> = {
      'LET-2026-001': 22,
      'LET-2026-002': 15,
      'LET-2026-003': 31
    };

    for (const b of activeBatches) {
      const cycleDays = b.cultivar?.targetCycleDays || BATAVIA_PROFILE.cycleDays;
      const targetWeightG = b.cultivar?.expectedWeightG || BATAVIA_PROFILE.expectedWeightG;
      const baseAge = presetAges[b.batchCode] ?? Math.round(cycleDays * 0.55);
      const bio = biometricAtAge(baseAge, cycleDays, targetWeightG);
      const stage = stageForAge(baseAge, cycleDays);

      await prisma.cropBatch.update({
        where: { id: b.id },
        data: {
          seedDate: shiftDateFromToday(-baseAge),
          transplantDate: shiftDateFromToday(-Math.max(1, baseAge - 11)),
          expectedHarvestDate: shiftDateFromToday(Math.max(1, cycleDays - baseAge)),
          currentStage: stage as any,
          notes: `Ngày tuổi ${baseAge}/${cycleDays} (${STAGE_VN[stage]}). Nước đạt chuẩn, rễ trắng khỏe.`
        }
      });

      const latestObs = b.observations[0];
      if (latestObs) {
        await prisma.cropObservation.update({
          where: { id: latestObs.id },
          data: {
            date: todayStr,
            avgLeafCount: bio.leafCount,
            avgHeightCm: bio.heightCm,
            sampleWeightG: bio.weightG,
            notes: `Đo sinh trắc học ngày thứ ${baseAge}/${cycleDays}: cây khỏe mạnh, đồng đều.`
          }
        });
      }
    }
  }

  // ---------- Vòng lặp chính ----------
  private async tick() {
    if (this.ticking) return;
    this.ticking = true;
    const tickStartedAt = new Date();

    try {
      const dtHours = this.minutesPerTick / 60;
      this.simTime = new Date(this.simTime.getTime() + this.minutesPerTick * 60_000);
      this.tickCount++;

      await this.syncTopology(false);

      const anyHeat = this.farmHeatwave;
      this.climate = computeClimate(this.simTime, this.climate.dli, this.prevHour, dtHours, anyHeat ? 'heatwave' : 'normal');
      this.prevHour = this.simTime.getHours() + this.simTime.getMinutes() / 60;

      const packets: DeviceTelemetryPayload[] = [];

      // ---- Node bể dung dịch ----
      for (const r of this.reservoirs.values()) {
        const db = await prisma.reservoir.findUnique({ where: { id: r.id } });
        if (!db) continue;

        this.reconcileWithDatabase(r, db);

        const { next, waterUptakeL } = stepReservoir(
          r.truth,
          this.climate,
          { plants: r.plants, avgAgeDays: r.avgAgeDays },
          dtHours,
          r.scenario,
          db.aerationStatus === 'active',
          this.farmHeatwave
        );
        r.truth = next;
        r.lastWaterUptakeL = round(waterUptakeL, 2);
        r.growth = evaluateBataviaGrowth(next, this.climate, r.targets);

        const packet = await this.sendReservoirPacket(r, next, true);
        if (packet) packets.push(packet);

        r.history.push({
          simTime: this.simTime.toISOString(),
          ph: round(next.ph, 2),
          ec: round(next.ec, 2),
          waterTemp: round(next.waterTemp, 1),
          doLevel: round(next.doLevel, 1),
          levelPercent: round((next.volumeLiters / next.capacityLiters) * 100, 1),
          airTemp: this.climate.airTemp
        });
        if (r.history.length > MAX_HISTORY) r.history.shift();
      }

      // ---- Node khí hậu nhà màng ----
      await this.sendZonePackets(packets);

      this.lastPackets = packets;

      // ---- Giám sát nhịp tim thiết bị ----
      const simCodes = [
        ...[...this.reservoirs.values()].flatMap(r => r.sensors.map(s => s.code)),
        ...this.zones.map(z => z.sensorCode)
      ];
      const offline = await sensorsService.markStaleSensors(simCodes, Math.max(this.intervalMs * 3, 6000));
      for (const code of offline) {
        this.pushEvent('device', `📡 Cảm biến ${code} mất tín hiệu → chuyển Offline, tạo cảnh báo System.`);
      }

      // ---- Ghi nhận cảnh báo mới sinh ra trong nhịp này ----
      const newAlerts = await prisma.alert.findMany({
        where: { createdAt: { gte: tickStartedAt } },
        orderBy: { createdAt: 'asc' }
      });
      for (const a of newAlerts) {
        this.pushEvent('alert', `🚨 [${a.severity.toUpperCase()}] ${a.title}`);
      }

      this.lastError = null;
    } catch (err: any) {
      this.lastError = err?.message || String(err);
      console.error('[Simulator] Lỗi nhịp mô phỏng:', this.lastError);
    } finally {
      this.ticking = false;
    }
  }

  /** Gửi gói dữ liệu của các node khí hậu nhà màng */
  private async sendZonePackets(packets: DeviceTelemetryPayload[]) {
    for (const z of this.zones) {
      const offset = z.greenhouse.includes('2') ? 0.4 : 0;
      const packet: DeviceTelemetryPayload = {
        deviceId: `SIM-ENV-${z.code}`,
        source: 'simulator',
        timestamp: this.simTime.toISOString(),
        readings: [
          { sensorCode: z.sensorCode, metric: 'air_temp', value: round(this.climate.airTemp + offset + gaussian(0.1), 1) },
          { sensorCode: z.sensorCode, metric: 'humidity', value: round(this.climate.humidity - offset + gaussian(0.4), 1) },
          { sensorCode: z.sensorCode, metric: 'ppfd', value: this.climate.ppfd },
          { sensorCode: z.sensorCode, metric: 'dli', value: this.climate.dli },
          { sensorCode: z.sensorCode, metric: 'co2', value: this.climate.co2 }
        ]
      };
      await sensorsService.ingestDeviceReadings(packet);
      packets.push(packet);
    }
  }

  /**
   * Phát hiện can thiệp từ người vận hành: nếu giá trị trong DB khác giá trị
   * simulator đã ghi ở nhịp trước → có người châm phân / bù nước / xả bể / đo tay.
   * Khi đó mô hình nhận giá trị mới làm trạng thái thật.
   */
  private reconcileWithDatabase(r: ReservoirSim, db: {
    currentPh: number; currentEc: number; currentWaterTemp: number; currentDo: number | null;
    currentVolumeLiters: number; capacityLiters: number;
  }) {
    r.truth.capacityLiters = db.capacityLiters;
    const lw = r.lastWritten;
    if (!lw) return;

    const changes: string[] = [];
    if (Math.abs(db.currentPh - lw.ph) > 0.05) {
      changes.push(`pH ${lw.ph.toFixed(2)} → ${db.currentPh.toFixed(2)}`);
      r.truth.ph = db.currentPh;
    }
    if (Math.abs(db.currentEc - lw.ec) > 0.05) {
      changes.push(`EC ${lw.ec.toFixed(2)} → ${db.currentEc.toFixed(2)}`);
      r.truth.ec = db.currentEc;
    }
    if (Math.abs(db.currentWaterTemp - lw.waterTemp) > 0.5) {
      changes.push(`Nhiệt độ ${lw.waterTemp.toFixed(1)} → ${db.currentWaterTemp.toFixed(1)}°C`);
      r.truth.waterTemp = db.currentWaterTemp;
    }
    if (db.currentDo !== null && Math.abs(db.currentDo - lw.doLevel) > 0.5) {
      changes.push(`DO ${lw.doLevel.toFixed(1)} → ${db.currentDo.toFixed(1)}`);
      r.truth.doLevel = db.currentDo;
    }
    if (Math.abs(db.currentVolumeLiters - lw.volumeLiters) > db.capacityLiters * 0.015) {
      changes.push(`Thể tích ${Math.round(lw.volumeLiters)} → ${Math.round(db.currentVolumeLiters)} L`);
      r.truth.volumeLiters = db.currentVolumeLiters;
    }

    if (changes.length > 0) {
      this.pushEvent('intervention', `🧑‍🌾 ${shortName(r.name)}: ghi nhận thao tác của người vận hành (${changes.join(', ')}). Mô hình cập nhật theo giá trị mới.`);
    }
  }

  /** Đóng gói và gửi dữ liệu của 1 node bể (thêm nhiễu cảm biến nếu withNoise) */
  private async sendReservoirPacket(r: ReservoirSim, s: WaterState, withNoise: boolean) {
    const n = (sigma: number) => (withNoise ? gaussian(sigma) : 0);
    const measured = {
      ph: round(s.ph + n(0.015), 2),
      ec: round(s.ec + n(0.012), 2),
      water_temp: round(s.waterTemp + n(0.08), 1),
      do: round(s.doLevel + n(0.08), 1),
      water_level: round((s.volumeLiters / s.capacityLiters) * 100 + n(0.2), 1)
    } as Record<string, number>;

    const readings: DeviceReading[] = [];
    for (const sensor of r.sensors) {
      // Kịch bản mất tín hiệu: node không gửi số đo pH
      if (r.scenario === 'sensor_offline' && sensor.type === 'ph') continue;
      const value = measured[sensor.type];
      if (value === undefined) continue;
      readings.push({ sensorCode: sensor.code, value });
    }
    if (readings.length === 0) return null;

    const packet: DeviceTelemetryPayload = {
      deviceId: `SIM-RES-${codeSuffix(r)}`,
      source: 'simulator',
      timestamp: this.simTime.toISOString(),
      readings
    };
    await sensorsService.ingestDeviceReadings(packet);

    // Ghi nhớ giá trị đã ghi vào DB để nhận biết can thiệp ở nhịp sau
    const db = await prisma.reservoir.findUnique({ where: { id: r.id } });
    if (db) {
      r.lastWritten = {
        ph: db.currentPh,
        ec: db.currentEc,
        waterTemp: db.currentWaterTemp,
        doLevel: db.currentDo ?? measured.do,
        volumeLiters: db.currentVolumeLiters
      };
    }
    return packet;
  }

  /** Đồng bộ danh sách bể, lô cây, cảm biến từ DB. Tự đăng ký cảm biến còn thiếu cho node bể. */
  private async syncTopology(provision: boolean) {
    // Nếu các lô cây trong DB đang có ngày thu hoạch quá hạn (dữ liệu seed cũ),
    // tự động cập nhật lại ngày gieo/thu hoạch về hiện tại để hiển thị đúng trên toàn hệ thống
    if (provision) {
      const staleBatch = await prisma.cropBatch.findFirst({
        where: { status: 'active' }
      });
      if (staleBatch && new Date(staleBatch.expectedHarvestDate).getTime() < Date.now() - 86_400_000) {
        await this.resetPlantGrowthToBaseline().catch(() => { });
      }
    }

    const reservoirs = await prisma.reservoir.findMany({
      include: {
        sensors: true,
        batches: {
          where: { status: 'active' },
          include: {
            cultivar: true,
            observations: { orderBy: { date: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    for (const res of reservoirs) {
      if (provision) {
        const suffix = inferSuffix(res.sensors.map(s => s.code), res.id);
        for (const type of Object.keys(SENSOR_PREFIX)) {
          if (!res.sensors.some(s => s.sensorType === type)) {
            const code = `${SENSOR_PREFIX[type]}-${suffix}`;
            const created = await prisma.sensor.upsert({
              where: { code },
              update: { reservoirId: res.id, sensorType: type },
              create: {
                code,
                name: `${SENSOR_NAME[type]} ${shortName(res.name)}`,
                sensorType: type,
                unit: SENSOR_UNIT[type],
                status: 'online',
                reservoirId: res.id
              }
            });
            res.sensors.push(created);
            this.pushEvent('device', `🔌 Đăng ký thêm thiết bị ${code} cho ${shortName(res.name)}.`);
          }
        }
      }

      const sim = this.reservoirs.get(res.id);
      const plants = res.batches.reduce((sum, b) => sum + (b.currentQuantity || 0), 0);
      const ages = res.batches.map(b => this.estimateAgeDays(b));
      const avgAgeDays = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
      const batches: SimBatchInfo[] = res.batches.map(b => {
        const cycleDays = b.cultivar?.targetCycleDays || BATAVIA_PROFILE.cycleDays;
        const targetWeightG = b.cultivar?.expectedWeightG || BATAVIA_PROFILE.expectedWeightG;
        const ageDays = Math.round(this.estimateAgeDays(b));
        const obs = b.observations[0];
        const fallbackBio = biometricAtAge(ageDays, cycleDays, targetWeightG);
        return {
          id: b.id,
          code: b.batchCode,
          cultivar: b.cultivar?.name || '—',
          plants: b.currentQuantity,
          isBatavia: isBatavia(b.cultivar?.name),
          stage: b.currentStage as string,
          ageDays,
          cycleDays,
          daysLeft: Math.max(0, cycleDays - ageDays),
          leafCount: round(obs?.avgLeafCount ?? fallbackBio.leafCount, 1),
          heightCm: round(obs?.avgHeightCm ?? fallbackBio.heightCm, 1),
          weightG: round(obs?.sampleWeightG ?? fallbackBio.weightG, 1),
          targetWeightG
        };
      });

      const base = {
        id: res.id,
        name: res.name,
        plants,
        avgAgeDays,
        batches,
        hasBatavia: batches.some(b => b.isBatavia),
        targets: computeTargets(res.batches),
        sensors: res.sensors
          .filter(s => SENSOR_PREFIX[s.sensorType])
          .map(s => ({ code: s.code, type: s.sensorType }))
      };

      if (sim) {
        Object.assign(sim, base);
      } else {
        const truth: WaterState = {
          ph: res.currentPh,
          ec: res.currentEc,
          waterTemp: res.currentWaterTemp,
          doLevel: res.currentDo ?? 7.5,
          volumeLiters: res.currentVolumeLiters,
          capacityLiters: res.capacityLiters
        };
        this.reservoirs.set(res.id, {
          ...base,
          truth,
          lastWritten: null,
          scenario: 'normal',
          growth: evaluateBataviaGrowth(truth, this.climate, base.targets),
          lastWaterUptakeL: 0,
          history: []
        });
      }
    }

    // Bỏ các bể đã bị xoá khỏi DB
    for (const id of [...this.reservoirs.keys()]) {
      if (!reservoirs.some(r => r.id === id)) this.reservoirs.delete(id);
    }

    // Trạm khí hậu theo phân khu
    const zoneSensors = await prisma.sensor.findMany({
      where: { zoneId: { not: null }, sensorType: { in: ['multi', 'air_temp'] } },
      include: { zone: true },
      orderBy: { code: 'asc' }
    });
    this.zones = zoneSensors
      .filter(s => s.zone)
      .map(s => ({
        id: s.zone!.id,
        code: s.zone!.code,
        name: s.zone!.name,
        greenhouse: s.zone!.greenhouse,
        sensorCode: s.code
      }));
  }

  /**
   * Tuổi cây (ngày từ khi gieo) theo thời gian mô phỏng.
   * Dữ liệu seed có ngày gieo cũ (lô đáng lẽ đã thu hoạch) → nếu tính thẳng thì mọi lô đều bị
   * kẹp ở cuối chu kỳ (tán lá tối đa). Khi đó ước tính tuổi theo GIAI ĐOẠN SINH TRƯỞNG đang ghi
   * nhận trong DB, cộng thêm số ngày đã mô phỏng.
   */
  private estimateAgeDays(b: { seedDate: string; currentStage: string; cultivar: { targetCycleDays?: number | null } | null }) {
    const cycle = b.cultivar?.targetCycleDays || BATAVIA_PROFILE.cycleDays;
    const days = (this.simTime.getTime() - new Date(b.seedDate).getTime()) / 86_400_000;
    if (Number.isFinite(days) && days <= cycle) return Math.max(1, days);

    const elapsedSimDays = Math.max(0, (this.simTime.getTime() - this.simEpoch.getTime()) / 86_400_000);
    const stageFraction = STAGE_AGE_FRACTION[b.currentStage] ?? 0.6;
    return Math.max(1, Math.min(cycle, cycle * stageFraction + elapsedSimDays));
  }

  private pushEvent(type: SimEvent['type'], message: string) {
    this.events.unshift({
      id: ++this.eventSeq,
      realTime: new Date().toISOString(),
      simTime: this.simTime.toISOString(),
      type,
      message
    });
    if (this.events.length > MAX_EVENTS) this.events.length = MAX_EVENTS;
  }

  // ---------- Trạng thái trả về giao diện ----------
  /** Bản rút gọn để các trang khác kiểm tra nhanh (không kèm lịch sử, gói tin) */
  getHeartbeat() {
    return {
      dataSource: config.DATA_SOURCE,
      running: this.running,
      tickCount: this.tickCount,
      simTime: this.simTime.toISOString()
    };
  }

  async getStatus() {
    if (this.reservoirs.size === 0) {
      await this.syncTopology(true).catch(() => { });
    }
    return {
      dataSource: config.DATA_SOURCE,
      running: this.running,
      intervalMs: this.intervalMs,
      minutesPerTick: this.minutesPerTick,
      simTime: this.simTime.toISOString(),
      tickCount: this.tickCount,
      startedAt: this.startedAt,
      lastError: this.lastError,
      farmHeatwave: this.farmHeatwave,
      deviceStaleSeconds: Math.round(config.DEVICE_STALE_MS / 1000),
      climate: this.climate,
      batavia: BATAVIA_PROFILE,
      reservoirs: [...this.reservoirs.values()].map(r => ({
        id: r.id,
        name: r.name,
        scenario: r.scenario,
        deviceId: `SIM-RES-${codeSuffix(r)}`,
        plants: r.plants,
        avgAgeDays: round(r.avgAgeDays, 1),
        hasBatavia: r.hasBatavia,
        batches: r.batches,
        sensors: r.sensors,
        targets: r.targets,
        waterUptakeLPerTick: r.lastWaterUptakeL,
        state: {
          ph: round(r.truth.ph, 2),
          ec: round(r.truth.ec, 2),
          waterTemp: round(r.truth.waterTemp, 1),
          doLevel: round(r.truth.doLevel, 1),
          volumeLiters: round(r.truth.volumeLiters, 1),
          capacityLiters: r.truth.capacityLiters,
          levelPercent: round((r.truth.volumeLiters / r.truth.capacityLiters) * 100, 1)
        },
        growth: r.growth,
        history: r.history
      })),
      zones: this.zones.map(z => ({ code: z.code, name: z.name, deviceId: `SIM-ENV-${z.code}`, sensorCode: z.sensorCode })),
      lastPackets: this.lastPackets,
      events: this.events,
      scenarios: SCENARIOS,
      speedPresets: SPEED_PRESETS
    };
  }
}

// ===================== HÀM PHỤ =====================
/**
 * Tính dải mục tiêu của bể = giao của dải tối ưu (theo giai đoạn hiện tại) của mọi lô đang
 * lấy dung dịch từ bể. Nếu các lô mâu thuẫn (giao rỗng) → ưu tiên dải của Batavia.
 */
function computeTargets(batches: { currentStage: string; cultivar: any }[]): Targets {
  const ranges = batches.map(b => {
    const c = b.cultivar || {};
    let r = {
      ph: { min: c.recommendedPhMin ?? 5.8, max: c.recommendedPhMax ?? 6.3 },
      ec: { min: c.recommendedEcMin ?? 1.5, max: c.recommendedEcMax ?? 2.0 },
      waterTemp: { min: c.optimalWaterTempMin ?? 19, max: c.optimalWaterTempMax ?? 25 },
      levelMin: c.minWaterLevelPercent ?? 20,
      isBatavia: isBatavia(c.name)
    };
    const stage = (c.stageConfigs as any)?.stages?.find((s: any) => s.stage === b.currentStage);
    if (stage) {
      r = {
        ...r,
        ph: { min: stage.phMin ?? r.ph.min, max: stage.phMax ?? r.ph.max },
        ec: { min: stage.ecMin ?? r.ec.min, max: stage.ecMax ?? r.ec.max },
        waterTemp: { min: stage.waterTempMin ?? r.waterTemp.min, max: stage.waterTempMax ?? r.waterTemp.max }
      };
    }
    return r;
  });

  if (ranges.length === 0) {
    const p = BATAVIA_PROFILE;
    return { ph: p.ph, ec: p.ec, waterTemp: p.waterTemp, doMin: p.doMin, levelMin: 20, source: 'Hồ sơ Batavia (bể chưa có lô)' };
  }

  const preferred = ranges.find(r => r.isBatavia) || ranges[0];
  const intersect = (key: 'ph' | 'ec' | 'waterTemp'): Range => {
    const min = Math.max(...ranges.map(r => r[key].min));
    const max = Math.min(...ranges.map(r => r[key].max));
    return min < max ? { min, max } : preferred[key];
  };

  return {
    ph: intersect('ph'),
    ec: intersect('ec'),
    waterTemp: intersect('waterTemp'),
    doMin: 6.0,
    levelMin: Math.max(...ranges.map(r => r.levelMin)),
    source: ranges.length > 1 ? 'Giao dải tối ưu của các lô đang trồng' : 'Dải tối ưu của lô đang trồng'
  };
}
function shortName(name: string) {
  return name.split('-')[0].trim();
}

function inferSuffix(codes: string[], fallbackId: string) {
  for (const c of codes) {
    const m = c.match(/-(\d+)$/);
    if (m) return m[1];
  }
  return fallbackId.replace(/[^0-9A-Za-z]/g, '').slice(-4).toUpperCase();
}

function codeSuffix(r: ReservoirSim) {
  return inferSuffix(r.sensors.map(s => s.code), r.id);
}

const STAGE_VN: Record<string, string> = {
  seed: 'Hạt giống',
  germination: 'Nảy mầm',
  seedling: 'Cây con',
  transplant: 'Chuyển máng',
  vegetative: 'Sinh dưỡng',
  pre_harvest: 'Tích lũy sinh khối',
  harvest: 'Sẵn sàng thu hoạch'
};

/** Xác định giai đoạn sinh trưởng theo số ngày tuổi */
function stageForAge(ageDays: number, cycleDays: number): 'seedling' | 'vegetative' | 'pre_harvest' | 'harvest' {
  const ratio = ageDays / Math.max(1, cycleDays);
  if (ageDays <= 11 || ratio < 0.32) return 'seedling';
  if (ageDays >= cycleDays - 1 || ratio >= 0.96) return 'harvest';
  if (ageDays >= cycleDays - 6 || ratio >= 0.80) return 'pre_harvest';
  return 'vegetative';
}

/** Đường cong sinh trưởng chuẩn (Logistic) cho số lá, chiều cao (cm) và khối lượng tươi (g) */
function biometricAtAge(ageDays: number, cycleDays: number, targetWeightG: number) {
  const progress = Math.max(0.03, Math.min(1.05, ageDays / Math.max(1, cycleDays)));
  // Hàm Sigmoid cho khối lượng tươi (tăng chậm giai đoạn đầu, bứt tốc giai đoạn sinh dưỡng)
  const inflection = cycleDays * 0.62;
  const logistic = 1 / (1 + Math.exp(-0.22 * (ageDays - inflection)));
  const logisticMax = 1 / (1 + Math.exp(-0.22 * (cycleDays - inflection)));
  const normalizedWeight = logistic / Math.max(0.5, logisticMax);

  const leafCount = round(Math.max(2, Math.min(26, 2 + progress * 21)), 1);
  const heightCm = round(Math.max(2.5, Math.min(25, 2.2 + progress * 20.5)), 1);
  const weightG = round(Math.max(5, targetWeightG * normalizedWeight), 1);
  return { leafCount, heightCm, weightG };
}

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDateFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(offsetDays));
  return formatIsoDate(d);
}

export const simulatorService = new SimulatorService();

/** Tự khởi động khi server bật (nếu SIMULATOR_AUTOSTART=true) */
export function bootstrapSimulator() {
  if (config.DATA_SOURCE === 'simulator' && config.SIMULATOR_AUTOSTART) {
    simulatorService.start().catch(err => console.error('[Simulator] Không thể tự khởi động:', err.message));
  }
}
