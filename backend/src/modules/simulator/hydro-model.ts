/**
 * hydro-model.ts
 * --------------------------------------------------------------------------
 * MÔ HÌNH VẬT LÝ - NÔNG HỌC CỦA HỆ THỐNG THỦY CANH NFT (XÀ LÁCH BATAVIA)
 *
 * Đây là "bản sao số" (digital twin) đơn giản hoá của một bể dung dịch NFT.
 * Mỗi bước mô phỏng (dtHours) tính lại các chỉ số mà cảm biến thật sẽ đo:
 *   pH, EC, nhiệt độ nước, oxy hoà tan (DO), mực nước + vi khí hậu nhà màng.
 *
 * Nguyên tắc mô phỏng (đều là hiện tượng có thật trong thủy canh):
 *  1. Cây hút nước (thoát hơi nước) nhanh hơn hút ion  → nước giảm, EC tăng dần.
 *  2. Cây hút NO3- trao đổi OH-/HCO3- ra vùng rễ        → pH trôi lên dần.
 *  3. Nhiệt độ nước bám theo nhiệt độ không khí, có độ trễ (quán tính nhiệt).
 *  4. DO bão hoà giảm khi nước nóng; mất sục khí → DO tụt nhanh.
 *  5. Ánh sáng/nhiệt/ẩm dao động theo chu kỳ ngày - đêm.
 *
 * Các hệ số được hiệu chỉnh ở mức "hợp lý để trình diễn", không thay thế
 * cho mô hình cơ học cây trồng đầy đủ (phát triển sau).
 */

// ===================== HỒ SƠ GIỐNG CÂY CHÍNH: BATAVIA =====================
export const BATAVIA_PROFILE = {
  name: 'Batavia Lettuce',
  scientificName: 'Lactuca sativa var. capitata',
  cycleDays: 36,
  expectedWeightG: 205,
  ph: { min: 5.8, max: 6.3 },
  ec: { min: 1.5, max: 2.0 },          // mS/cm
  waterTemp: { min: 19, max: 25 },     // °C
  doMin: 6.0,                          // mg/L
  airTemp: { min: 19, max: 27 },       // °C
  humidity: { min: 60, max: 80 },      // %
  dli: { min: 14, max: 18 },           // mol/m²/ngày
  maxWaterUptakeLPerPlantDay: 0.06     // L/cây/ngày khi cây trưởng thành (NFT)
};

// ===================== KIỂU DỮ LIỆU =====================
export interface WaterState {
  ph: number;
  ec: number;            // mS/cm
  waterTemp: number;     // °C
  doLevel: number;       // mg/L
  volumeLiters: number;
  capacityLiters: number;
}

export interface ClimateState {
  airTemp: number;       // °C
  humidity: number;      // %
  vpd: number;           // kPa
  ppfd: number;          // µmol/m²/s
  dli: number;           // mol/m²/ngày (cộng dồn từ 0h)
  co2: number;           // ppm
}

export type ScenarioKey =
  | 'normal'
  | 'heatwave'
  | 'aeration_fail'
  | 'nutrient_depletion'
  | 'ph_drift'
  | 'water_leak'
  | 'sensor_offline';

export interface PlantLoad {
  plants: number;        // tổng số cây đang hút dung dịch từ bể
  avgAgeDays: number;    // tuổi cây trung bình (ngày từ khi gieo)
}

// ===================== HÀM TIỆN ÍCH =====================
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Nhiễu Gauss (Box-Muller) mô phỏng sai số đo của cảm biến */
export function gaussian(sigma: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Áp suất hơi bão hoà (kPa) - công thức Tetens */
export function saturationVaporPressure(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/** VPD (kPa) từ nhiệt độ và độ ẩm tương đối */
export function computeVpd(tempC: number, rh: number): number {
  return saturationVaporPressure(tempC) * (1 - rh / 100);
}

/** DO bão hoà trong nước ngọt (mg/L) theo nhiệt độ - công thức APHA */
export function doSaturation(tempC: number): number {
  return 14.62 - 0.3898 * tempC + 0.006969 * tempC ** 2 - 0.00005897 * tempC ** 3;
}

/** Hệ số tán lá theo tuổi (0 → 1), đường cong logistic */
export function canopyFactor(ageDays: number, cycleDays = BATAVIA_PROFILE.cycleDays): number {
  const age = clamp(ageDays, 0, cycleDays);
  const mid = cycleDays * 0.6;
  return 1 / (1 + Math.exp(-0.25 * (age - mid)));
}

// ===================== VI KHÍ HẬU NHÀ MÀNG =====================
/**
 * Tính vi khí hậu theo giờ trong ngày (nhà màng có quạt hút + lưới cắt nắng, vùng nhiệt đới).
 * - Nhiệt độ thấp nhất ~3h sáng, cao nhất ~15h chiều.
 * - Độ ẩm ngược pha với nhiệt độ.
 * - PPFD hình sin từ 6h đến 18h.
 */
export function computeClimate(
  simTime: Date,
  prevDli: number,
  prevHour: number,
  dtHours: number,
  scenario: ScenarioKey
): ClimateState {
  const hour = simTime.getHours() + simTime.getMinutes() / 60;
  const phase = Math.sin((2 * Math.PI * (hour - 9)) / 24);

  const heatBoost = scenario === 'heatwave' ? 7 : 0;
  // Nhà màng có quạt hút + tấm làm mát: 21.0°C (đêm) → 24.0°C (chiều), độ ẩm 64% → 72%
  // (nằm gọn trong ngưỡng tối ưu 18–25°C và 60–75% khi vận hành bình thường, không sinh cảnh báo giả)
  const airTemp = 22.5 + 1.5 * phase + heatBoost + gaussian(0.12);
  const humidity = clamp(68 - 3.5 * phase - (scenario === 'heatwave' ? 14 : 0) + gaussian(0.35), 35, 98);

  const ppfd = hour >= 6 && hour <= 18
    ? Math.max(0, 550 * Math.sin((Math.PI * (hour - 6)) / 12) + gaussian(8))
    : 0;

  // DLI cộng dồn trong ngày, reset khi qua nửa đêm
  const crossedMidnight = hour < prevHour;
  const baseDli = crossedMidnight ? 0 : prevDli;
  const dli = baseDli + (ppfd * 3600 * dtHours) / 1_000_000;

  // CO2: ban đêm cây hô hấp → tăng, ban ngày quang hợp → giảm
  const co2 = ppfd > 0 ? 410 - ppfd * 0.05 + gaussian(4) : 470 + gaussian(5);

  return {
    airTemp: round(airTemp, 1),
    humidity: round(humidity, 1),
    vpd: round(computeVpd(airTemp, humidity), 2),
    ppfd: round(ppfd, 0),
    dli: round(dli, 2),
    co2: round(co2, 0)
  };
}

// ===================== BỂ DUNG DỊCH NFT =====================
export interface StepResult {
  next: WaterState;
  waterUptakeL: number;   // lượng nước cây hút trong bước
  evaporationL: number;   // lượng bay hơi bề mặt
}

/**
 * Tính trạng thái bể ở bước tiếp theo.
 * @param s           trạng thái "thật" hiện tại (chưa có nhiễu cảm biến)
 * @param climate     vi khí hậu hiện tại
 * @param load        tải cây trồng trên bể
 * @param dtHours     bước thời gian mô phỏng (giờ)
 * @param scenario    kịch bản sự cố đang áp dụng cho bể
 * @param aerationOn  máy sục khí có chạy không (đọc từ DB)
 * @param heatwave    nắng nóng toàn trang trại (có thể xảy ra đồng thời với sự cố của bể)
 */
export function stepReservoir(
  s: WaterState,
  climate: ClimateState,
  load: PlantLoad,
  dtHours: number,
  scenario: ScenarioKey,
  aerationOn: boolean,
  heatwave: boolean = scenario === 'heatwave'
): StepResult {
  const canopy = canopyFactor(load.avgAgeDays);

  // ---- 1. Cây hút nước (thoát hơi nước) ----
  const lightFactor = 0.3 + 0.7 * (climate.ppfd / 550);
  const vpdFactor = clamp(climate.vpd / 1.0, 0.5, 1.8);
  const uptakePerPlantH = (BATAVIA_PROFILE.maxWaterUptakeLPerPlantDay / 24) * canopy * lightFactor * vpdFactor;
  const wantedUptakeL = load.plants * uptakePerPlantH * dtHours;

  // ---- 2. Bay hơi bề mặt bể (không mang theo muối khoáng) ----
  const wantedEvapL = 0.015 * s.capacityLiters * (dtHours / 24) * (1 + Math.max(0, s.waterTemp - 20) * 0.05);

  // ---- 3. Rò rỉ (kịch bản) - mất cả nước lẫn muối, EC không đổi ----
  const wantedLeakL = scenario === 'water_leak' ? 0.04 * s.capacityLiters * dtHours : 0;

  // Bể không thể mất nhiều nước hơn lượng đang có (giữ lại 3% đáy bể - đầu hút bơm).
  // Khi gần cạn, các dòng mất nước bị co lại theo cùng tỷ lệ → khối lượng muối mất đi
  // luôn khớp với lượng nước THỰC SỰ mất (tránh lỗi EC tụt vô lý khi thể tích chạm sàn).
  const minVolume = s.capacityLiters * 0.03;
  const wantedLoss = wantedUptakeL + wantedEvapL + wantedLeakL;
  const available = Math.max(0, s.volumeLiters - minVolume);
  const k = wantedLoss > 0 ? Math.min(1, available / wantedLoss) : 1;
  const waterUptakeL = wantedUptakeL * k;
  const evaporationL = wantedEvapL * k;
  const leakL = wantedLeakL * k;

  // ---- 4. Cân bằng khối lượng muối: S = EC × V ----
  // Tỷ lệ hấp thu ion/nước: < 1 → EC tăng dần (bình thường); > 1 → cây "đói" ion, EC tụt.
  const uptakeRatio = scenario === 'nutrient_depletion' ? 3.2 : 0.9;
  const salt = s.ec * s.volumeLiters;
  // Cạn dinh dưỡng: ngoài hấp thu theo dòng nước, cây còn tiêu thụ ion chủ động (~2.5%/giờ)
  const activeDepletion = scenario === 'nutrient_depletion' ? salt * 0.025 * dtHours : 0;
  const saltRemoved = Math.min(salt, waterUptakeL * s.ec * uptakeRatio + leakL * s.ec + activeDepletion);
  const newVolume = clamp(s.volumeLiters - waterUptakeL - evaporationL - leakL, minVolume, s.capacityLiters);
  const newEc = clamp((salt - saltRemoved) / newVolume, 0.1, 5.0);

  // ---- 5. pH: hấp thu NO3- làm pH tăng dần ----
  const phDriftFactor = scenario === 'ph_drift' ? 10 : 1;
  const dPh = 0.8 * (waterUptakeL / Math.max(1, s.volumeLiters)) * phDriftFactor + 0.002 * dtHours * phDriftFactor;
  const newPh = clamp(s.ph + dPh, 3.5, 8.8);

  // ---- 6. Nhiệt độ nước: bám theo cân bằng nhiệt với độ trễ τ = 4h ----
  // Bình thường có chiller/bể cách nhiệt → dao động nhỏ quanh 21.3°C (20.7 → 21.9°C).
  // Nắng nóng: chiller quá tải → nước tiến dần về nhiệt độ không khí.
  const eqTemp = heatwave
    ? climate.airTemp - 1.0
    : 21.3 + 0.3 * (climate.airTemp - 22.5);
  const tempAlpha = 1 - Math.exp(-dtHours / 4);
  const newTemp = s.waterTemp + (eqTemp - s.waterTemp) * tempAlpha;

  // ---- 7. DO: tiến về mức cân bằng phụ thuộc sục khí, τ = 1.5h ----
  const sat = doSaturation(newTemp);
  const aerationWorking = aerationOn && scenario !== 'aeration_fail';
  const rootDemand = 0.12 * canopy * (load.plants / 1000) * (1 + Math.max(0, newTemp - 20) * 0.08);
  const doTarget = clamp((aerationWorking ? 0.9 : 0.42) * sat - rootDemand, 0.5, sat);
  const doAlpha = 1 - Math.exp(-dtHours / 1.5);
  const newDo = s.doLevel + (doTarget - s.doLevel) * doAlpha;

  return {
    next: {
      ph: newPh,
      ec: newEc,
      waterTemp: newTemp,
      doLevel: newDo,
      volumeLiters: newVolume,
      capacityLiters: s.capacityLiters
    },
    waterUptakeL,
    evaporationL: evaporationL + leakL
  };
}

// ===================== ĐÁNH GIÁ TÁC ĐỘNG LÊN CÂY BATAVIA =====================
export interface GrowthImpact {
  growthFactor: number;   // 0..1 - % tiềm năng sinh trưởng còn lại
  stressFlags: string[];  // các yếu tố đang gây stress
}

/** Hàm phạt tuyến tính khi giá trị lệch khỏi dải tối ưu */
function bandPenalty(v: number, min: number, max: number, tolerance: number): number {
  if (v >= min && v <= max) return 1;
  const d = v < min ? min - v : v - max;
  return clamp(1 - d / tolerance, 0.2, 1);
}

/**
 * Ước tính mức sinh trưởng tiềm năng trong điều kiện hiện tại.
 * Dùng để giải thích: "điều kiện nước xấu → AI dự báo năng suất giảm".
 * @param targets dải tối ưu của bể (theo lô đang trồng). Mặc định: hồ sơ Batavia.
 */
export function evaluateBataviaGrowth(
  w: WaterState,
  c: ClimateState,
  targets: { ph: { min: number; max: number }; ec: { min: number; max: number }; waterTemp: { min: number; max: number }; levelMin?: number } = BATAVIA_PROFILE
): GrowthImpact {
  const p = BATAVIA_PROFILE;
  const flags: string[] = [];

  const fPh = bandPenalty(w.ph, targets.ph.min, targets.ph.max, 1.2);
  const fEc = bandPenalty(w.ec, targets.ec.min, targets.ec.max, 1.0);
  const fTemp = bandPenalty(w.waterTemp, targets.waterTemp.min, targets.waterTemp.max, 6);
  const fDo = w.doLevel >= p.doMin ? 1 : clamp(w.doLevel / p.doMin, 0.2, 1);
  const fAir = bandPenalty(c.airTemp, p.airTemp.min, p.airTemp.max, 8);
  const level = (w.volumeLiters / w.capacityLiters) * 100;
  const levelMin = targets.levelMin ?? 20;
  const fLevel = level >= levelMin ? 1 : clamp(level / levelMin, 0.3, 1);

  if (fPh < 1) flags.push(w.ph > targets.ph.max ? 'pH cao → khoá hấp thu Fe, Mn' : 'pH thấp → sốc rễ');
  if (fEc < 1) flags.push(w.ec < targets.ec.min ? 'EC thấp → thiếu dinh dưỡng' : 'EC cao → sốc thẩm thấu, cháy mép lá');
  if (fTemp < 1) flags.push(w.waterTemp > targets.waterTemp.max ? 'Nước nóng → nguy cơ nấm Pythium' : 'Nước lạnh → rễ hút chậm');
  if (fDo < 1) flags.push('Thiếu oxy vùng rễ');
  if (fAir < 1) flags.push(c.airTemp > p.airTemp.max ? 'Không khí nóng → nguy cơ tipburn' : 'Không khí lạnh');
  if (fLevel < 1) flags.push('Mực nước thấp → nguy cơ cạn máng');

  const growthFactor = fPh * fEc * fTemp * fDo * fAir * fLevel;
  return { growthFactor: round(growthFactor, 2), stressFlags: flags };
}

export function round(v: number, digits: number): number {
  const m = 10 ** digits;
  return Math.round(v * m) / m;
}
