import { prisma } from '../../utils/prisma';
import { alertEngine } from '../alerts/alert-engine.service';

/**
 * =====================================================================
 *  HỢP ĐỒNG DỮ LIỆU THIẾT BỊ (DEVICE TELEMETRY CONTRACT)
 * =====================================================================
 *  Đây là định dạng gói tin DUY NHẤT mà backend chấp nhận từ thiết bị.
 *  - Hiện tại: Trạm giả lập (simulator) tạo gói tin này.
 *  - Triển khai thật: ESP32/Arduino gửi đúng gói tin này qua HTTP
 *    (POST /api/v1/sensors/telemetry/batch) hoặc qua MQTT bridge.
 *  → Thay nguồn dữ liệu KHÔNG cần sửa backend, database hay giao diện.
 * =====================================================================
 */
export type EnvMetric = 'air_temp' | 'humidity' | 'ppfd' | 'dli' | 'co2';

export interface DeviceReading {
  sensorCode: string;      // Mã cảm biến đã đăng ký trong bảng sensors (VD: SEN-PH-01)
  value: number;           // Giá trị đo
  metric?: EnvMetric;      // Bắt buộc với trạm đa chỉ số (sensorType = multi)
  batteryLevel?: number;   // % pin (nếu thiết bị chạy pin)
}

export interface DeviceTelemetryPayload {
  deviceId: string;        // Định danh node: ESP32-RES-01, SIM-RES-01...
  source?: 'sensor' | 'simulator' | 'manual';
  timestamp?: string;      // ISO time thiết bị đo (tuỳ chọn, ESP32 lấy giờ qua NTP)
  readings: DeviceReading[];
}

export interface SensorTelemetryInput {
  sensorCode: string;
  reading: number;
  batteryLevel?: number;
  source?: 'sensor' | 'manual' | 'simulator';
}

/** Tiêu đề cảnh báo mất tín hiệu - dùng so khớp CHÍNH XÁC (tránh SEN-PH-01 khớp nhầm SEN-PH-010) */
export const connectionAlertTitle = (code: string) => `Mất tín hiệu cảm biến ${code}`;

/** Độ lệch tối đa chấp nhận cho timestamp thiết bị gửi lên */
const MAX_PAST_MS = 24 * 60 * 60 * 1000; // dữ liệu gửi bù tối đa 24h (ESP32 mất mạng rồi gửi lại)
const MAX_FUTURE_MS = 60 * 1000;         // cho phép lệch đồng hồ 1 phút

export class SensorsService {
  async getAllSensors() {
    return prisma.sensor.findMany({
      include: {
        reservoir: {
          select: { id: true, name: true, currentVolumeLiters: true, capacityLiters: true }
        },
        zone: {
          select: { id: true, code: true, name: true, greenhouse: true }
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  async getSensorById(id: string) {
    const sensor = await prisma.sensor.findUnique({
      where: { id },
      include: {
        reservoir: true,
        zone: true
      }
    });

    if (!sensor) {
      throw new Error(`Không tìm thấy cảm biến với ID: ${id}`);
    }

    return sensor;
  }

  /**
   * Tiếp nhận 1 số đo đơn lẻ (giữ tương thích API cũ POST /sensors/telemetry).
   * Nội bộ chuyển thành gói tin thiết bị để đi chung một luồng xử lý.
   */
  async ingestTelemetry(data: SensorTelemetryInput) {
    await this.ingestDeviceReadings({
      deviceId: `LEGACY-${data.sensorCode}`,
      source: data.source === 'manual' ? 'manual' : data.source === 'simulator' ? 'simulator' : 'sensor',
      readings: [{ sensorCode: data.sensorCode, value: data.reading, batteryLevel: data.batteryLevel }]
    });

    const sensor = await prisma.sensor.findUnique({ where: { code: data.sensorCode } });
    if (!sensor) {
      throw new Error(`Không tìm thấy cảm biến với mã: ${data.sensorCode}`);
    }
    return sensor;
  }

  /**
   * Tiếp nhận gói tin nhiều số đo từ 1 thiết bị (Telemetry Ingestion).
   * Luồng xử lý:
   *  1. Kiểm tra mã cảm biến đã đăng ký → cập nhật lastReading / online (mỗi cảm biến 1 lần ghi).
   *  2. Gom số đo theo bể → cập nhật bể, ghi 1 dòng water_quality_logs, chạy Alert Engine.
   *  3. Gom số đo theo phân khu → ghi environment_logs, chạy Alert Engine vi khí hậu.
   */
  async ingestDeviceReadings(payload: DeviceTelemetryPayload) {
    if (!payload || !Array.isArray(payload.readings) || payload.readings.length === 0) {
      throw new Error('Gói tin thiết bị không hợp lệ: thiếu danh sách readings');
    }

    const source = payload.source || 'sensor';
    const codes = [...new Set(payload.readings.map(r => r.sensorCode))];
    const sensors = await prisma.sensor.findMany({ where: { code: { in: codes } } });
    const sensorMap = new Map(sensors.map(s => [s.code, s]));
    const now = new Date();
    const recordedAt = this.resolveRecordedAt(payload, now);

    const rejected: { sensorCode: string; reason: string }[] = [];

    // Gom nhóm theo cảm biến / bể / phân khu
    const sensorUpdates = new Map<string, { lastReading?: number; batteryLevel?: number }>();
    const reservoirGroups = new Map<string, { type: string; value: number }[]>();
    const zoneGroups = new Map<string, { metric: EnvMetric; value: number; sensorCode: string }[]>();

    for (const r of payload.readings) {
      const sensor = sensorMap.get(r.sensorCode);
      const value = Number(r.value);
      if (!sensor) {
        rejected.push({ sensorCode: r.sensorCode, reason: 'Mã cảm biến chưa đăng ký trong hệ thống' });
        continue;
      }
      if (!Number.isFinite(value)) {
        rejected.push({ sensorCode: r.sensorCode, reason: 'Giá trị đo không hợp lệ' });
        continue;
      }

      // Trạm đa chỉ số: lastReading hiển thị nhiệt độ không khí
      const isMainReading = sensor.sensorType !== 'multi' || !r.metric || r.metric === 'air_temp';
      const upd = sensorUpdates.get(sensor.code) || {};
      if (isMainReading) upd.lastReading = value;
      if (r.batteryLevel !== undefined && Number.isFinite(Number(r.batteryLevel))) upd.batteryLevel = Number(r.batteryLevel);
      sensorUpdates.set(sensor.code, upd);

      if (sensor.reservoirId) {
        const list = reservoirGroups.get(sensor.reservoirId) || [];
        list.push({ type: sensor.sensorType, value });
        reservoirGroups.set(sensor.reservoirId, list);
      }

      if (sensor.zoneId) {
        const metric = this.resolveEnvMetric(sensor.sensorType, r.metric);
        if (metric) {
          const list = zoneGroups.get(sensor.zoneId) || [];
          list.push({ metric, value, sensorCode: sensor.code });
          zoneGroups.set(sensor.zoneId, list);
        }
      }
    }

    // ---- Cập nhật trạng thái cảm biến: mỗi cảm biến đúng 1 lần ghi / gói tin ----
    for (const [code, upd] of sensorUpdates) {
      const sensor = sensorMap.get(code)!;
      // Thiết bị có tín hiệu trở lại → đóng cảnh báo mất kết nối
      if (sensor.status === 'offline') {
        await this.resolveConnectionAlert(sensor.code);
      }
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: {
          ...(upd.lastReading !== undefined ? { lastReading: upd.lastReading } : {}),
          lastSeenAt: now, // nhịp tim = thời điểm server NHẬN gói tin
          status: 'online',
          ...(upd.batteryLevel !== undefined ? { batteryLevel: upd.batteryLevel } : {})
        }
      });
    }

    // ---- Xử lý theo bể dung dịch ----
    for (const [reservoirId, readings] of reservoirGroups) {
      const res = await prisma.reservoir.findUnique({ where: { id: reservoirId } });
      if (!res) continue;

      let ph = res.currentPh;
      let ec = res.currentEc;
      let waterTemp = res.currentWaterTemp;
      let doLevel = res.currentDo;
      let volume = res.currentVolumeLiters;
      let levelPercent = Math.round((res.currentVolumeLiters / res.capacityLiters) * 100);

      for (const r of readings) {
        if (r.type === 'ph') ph = r.value;
        else if (r.type === 'ec') ec = r.value;
        else if (r.type === 'water_temp') waterTemp = r.value;
        else if (r.type === 'do') doLevel = r.value;
        else if (r.type === 'water_level') {
          // Mực nước (%) phải cập nhật lại thể tích thực của bể
          levelPercent = Math.max(0, Math.min(100, r.value));
          volume = Number(((res.capacityLiters * levelPercent) / 100).toFixed(1));
        }
      }

      await prisma.waterQualityLog.create({
        data: {
          reservoirId,
          ph,
          ec,
          waterTemp,
          doLevel,
          waterLevelPercent: levelPercent,
          source,
          recordedBy: payload.deviceId,
          createdAt: recordedAt
        }
      });

      await prisma.reservoir.update({
        where: { id: reservoirId },
        data: {
          currentPh: ph,
          currentEc: ec,
          currentWaterTemp: waterTemp,
          currentDo: doLevel,
          currentVolumeLiters: volume
        }
      });

      await alertEngine.evaluateWaterQuality(reservoirId, {
        ph,
        ec,
        waterTemp,
        doLevel,
        waterLevelPercent: levelPercent,
        recordedBy: payload.deviceId
      });
    }

    // ---- Xử lý theo phân khu / nhà màng ----
    for (const [zoneId, readings] of zoneGroups) {
      // Chỉ ghi đè chỉ số được đo, các chỉ số còn lại lấy từ bản ghi gần nhất
      const last = await prisma.environmentLog.findFirst({
        where: { zoneId },
        orderBy: { createdAt: 'desc' }
      });

      const env = {
        airTemp: last?.airTemp ?? 24.5,
        humidity: last?.humidity ?? 70,
        ppfd: last?.ppfd ?? null,
        dli: last?.dli ?? null,
        co2: last?.co2 ?? null
      } as { airTemp: number; humidity: number; ppfd: number | null; dli: number | null; co2: number | null };

      for (const r of readings) {
        if (r.metric === 'air_temp') env.airTemp = r.value;
        else if (r.metric === 'humidity') env.humidity = r.value;
        else if (r.metric === 'ppfd') env.ppfd = r.value;
        else if (r.metric === 'dli') env.dli = r.value;
        else if (r.metric === 'co2') env.co2 = r.value;
      }

      const vpd = Number((0.6108 * Math.exp((17.27 * env.airTemp) / (env.airTemp + 237.3)) * (1 - env.humidity / 100)).toFixed(2));

      await prisma.environmentLog.create({
        data: {
          zoneId,
          airTemp: env.airTemp,
          humidity: env.humidity,
          ppfd: env.ppfd,
          dli: env.dli,
          co2: env.co2,
          vpd,
          recordedBy: payload.deviceId,
          source,
          createdAt: recordedAt
        }
      });

      await alertEngine.evaluateEnvironment(zoneId, {
        airTemp: env.airTemp,
        humidity: env.humidity,
        recordedBy: payload.deviceId
      });
    }

    return {
      deviceId: payload.deviceId,
      receivedAt: now.toISOString(),
      recordedAt: recordedAt.toISOString(),
      accepted: sensorUpdates.size,
      rejected,
      reservoirsUpdated: [...reservoirGroups.keys()],
      zonesUpdated: [...zoneGroups.keys()]
    };
  }

  /**
   * Giám sát nhịp tim thiết bị (heartbeat watchdog).
   * Cảm biến không gửi dữ liệu quá `staleMs` → chuyển offline + tạo cảnh báo System.
   * @param codes giới hạn danh sách cảm biến cần giám sát; `null` = toàn bộ cảm biến đã đăng ký
   */
  async markStaleSensors(codes: string[] | null, staleMs: number) {
    if (codes && codes.length === 0) return [];
    const threshold = new Date(Date.now() - staleMs);
    const stale = await prisma.sensor.findMany({
      where: {
        ...(codes ? { code: { in: codes } } : {}),
        status: { not: 'offline' },
        lastSeenAt: { lt: threshold }
      }
    });

    for (const s of stale) {
      await prisma.sensor.update({ where: { id: s.id }, data: { status: 'offline' } });

      const title = connectionAlertTitle(s.code);
      const existing = await prisma.alert.findFirst({
        where: { metric: 'System', status: { in: ['open', 'acknowledged'] }, title }
      });
      if (!existing) {
        await prisma.alert.create({
          data: {
            severity: 'critical',
            status: 'open',
            metric: 'System',
            title,
            message: `${s.name} không gửi dữ liệu quá ${Math.round(staleMs / 1000)} giây. Số liệu hiển thị có thể đã cũ, không còn tin cậy.`,
            suggestedAction: 'Kiểm tra nguồn điện, dây tín hiệu, kết nối WiFi của node ESP32; đo kiểm chứng bằng bút đo cầm tay trong lúc chờ khắc phục.',
            reservoirId: s.reservoirId,
            zoneId: s.zoneId
          }
        });
      }
    }
    return stale.map(s => s.code);
  }

  private async resolveConnectionAlert(code: string) {
    await prisma.alert.updateMany({
      where: {
        metric: 'System',
        status: { in: ['open', 'acknowledged'] },
        title: connectionAlertTitle(code)
      },
      data: {
        status: 'resolved',
        resolvedBy: 'Hệ thống tự động',
        resolvedAt: new Date(),
        resolutionNote: `Cảm biến ${code} đã gửi dữ liệu trở lại.`
      }
    });
  }

  /**
   * Thời điểm ĐO của gói tin (dùng làm createdAt cho log).
   * - Thiết bị thật: dùng `timestamp` thiết bị gửi (ESP32 lấy giờ NTP), cho phép gửi bù dữ liệu
   *   tối đa 24h khi mất mạng. Timestamp sai/ở tương lai → dùng giờ server.
   * - Trạm giả lập: luôn dùng giờ thực của server. "Giờ mô phỏng" tua nhanh chỉ hiển thị trên
   *   trang Trạm giả lập, để log trong DB không nhảy vào tương lai và các báo cáo theo thời gian
   *   (24h gần nhất, Dashboard...) vẫn đúng.
   */
  private resolveRecordedAt(payload: DeviceTelemetryPayload, now: Date): Date {
    if (payload.source === 'simulator' || !payload.timestamp) return now;
    const t = new Date(payload.timestamp);
    const diff = t.getTime() - now.getTime();
    if (Number.isNaN(t.getTime()) || diff > MAX_FUTURE_MS || diff < -MAX_PAST_MS) return now;
    return t;
  }

  private resolveEnvMetric(sensorType: string, metric?: EnvMetric): EnvMetric | null {
    if (sensorType === 'air_temp') return 'air_temp';
    if (sensorType === 'humidity') return 'humidity';
    if (sensorType === 'light') return metric === 'dli' ? 'dli' : 'ppfd';
    if (sensorType === 'multi') return metric || 'air_temp';
    return null;
  }
}

export const sensorsService = new SensorsService();
