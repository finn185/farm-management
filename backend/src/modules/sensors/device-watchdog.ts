/**
 * device-watchdog.ts
 * --------------------------------------------------------------------------
 * GIÁM SÁT MẤT TÍN HIỆU THIẾT BỊ THẬT (chạy độc lập với Trạm giả lập).
 *
 * - Chỉ hoạt động khi DATA_SOURCE=device.
 * - Cứ mỗi ~15 giây kiểm tra toàn bộ cảm biến đã đăng ký: cảm biến nào không gửi dữ liệu
 *   quá DEVICE_STALE_MS (mặc định 3 phút = 3 chu kỳ gửi của ESP32) → chuyển Offline và
 *   tạo cảnh báo System. Khi thiết bị gửi lại, cảnh báo tự đóng (xem SensorsService).
 * - Có "thời gian ân hạn" bằng DEVICE_STALE_MS sau khi server khởi động, để các node ESP32
 *   kịp kết nối lại sau khi backend restart mà không bị báo động nhầm.
 *
 * Ở chế độ simulator, mất tín hiệu của thiết bị ảo do chính Trạm giả lập kiểm tra trong
 * mỗi nhịp (ngưỡng = 3 nhịp). Khi bấm Tạm dừng, thời gian mô phỏng "đóng băng" nên
 * không sinh cảnh báo mất tín hiệu.
 */
import { config } from '../../config/env';
import { sensorsService } from './sensors.service';

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startDeviceWatchdog() {
  if (config.DATA_SOURCE !== 'device' || timer) return;

  const startedAt = Date.now();
  const staleMs = config.DEVICE_STALE_MS;
  const everyMs = Math.min(15000, Math.max(5000, Math.round(staleMs / 4)));

  timer = setInterval(async () => {
    if (running || Date.now() - startedAt < staleMs) return;
    running = true;
    try {
      const offline = await sensorsService.markStaleSensors(null, staleMs);
      for (const code of offline) {
        console.warn(`[Watchdog] Cảm biến ${code} mất tín hiệu quá ${Math.round(staleMs / 1000)}s → Offline`);
      }
    } catch (err: any) {
      console.error('[Watchdog] Lỗi kiểm tra thiết bị:', err?.message || err);
    } finally {
      running = false;
    }
  }, everyMs);

  console.log(`🛡  Watchdog thiết bị thật: kiểm tra mỗi ${everyMs / 1000}s, ngưỡng mất tín hiệu ${staleMs / 1000}s`);
}

export function stopDeviceWatchdog() {
  if (timer) clearInterval(timer);
  timer = null;
}
