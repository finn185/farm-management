import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parseIntInRange(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/hydrosmart?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'hydrosmart_super_secret_jwt_key_2026_farm_management',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  // ===== NGUỒN DỮ LIỆU CẢM BIẾN =====
  // DATA_SOURCE=simulator → cho phép chạy Trạm giả lập (demo / thuyết trình)
  // DATA_SOURCE=device    → chỉ nhận dữ liệu từ thiết bị thật (ESP32), khoá simulator
  DATA_SOURCE: (process.env.DATA_SOURCE === 'device' ? 'device' : 'simulator') as 'simulator' | 'device',
  SIMULATOR_AUTOSTART: process.env.SIMULATOR_AUTOSTART === 'true',
  // Giá trị không hợp lệ (NaN, quá nhỏ/lớn) → kẹp về 1000..10000 ms, mặc định 2000 ms
  SIMULATOR_INTERVAL_MS: parseIntInRange(process.env.SIMULATOR_INTERVAL_MS, 2000, 1000, 10000),
  // Khoá xác thực thiết bị (để trống = không kiểm tra). ESP32 gửi header: x-device-key
  DEVICE_API_KEY: process.env.DEVICE_API_KEY || '',
  // Thiết bị thật im lặng quá thời gian này → coi là mất tín hiệu.
  // Mặc định 3 phút = 3 chu kỳ gửi 60 giây của firmware ESP32.
  DEVICE_STALE_MS: parseIntInRange(process.env.DEVICE_STALE_MS, 180000, 10000, 3600000)
};
