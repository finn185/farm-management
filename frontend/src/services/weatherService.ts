export type WeatherType = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'storm' | 'fog';

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  weatherDescription: string;
  weatherType: WeatherType;
  dayOfWeek: string;
  formattedDate: string;
  cityName: string;
  isDay: boolean;
  updatedAt: string;
}

export interface FarmLocation {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
}

export const POPULAR_LOCATIONS: FarmLocation[] = [
  { id: 'hcm', name: 'TP. Hồ Chí Minh', shortName: 'TP. HCM', lat: 10.8231, lon: 106.6297 },
  { id: 'dalat', name: 'Đà Lạt (Lâm Đồng)', shortName: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'hanoi', name: 'Hà Nội', shortName: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'danang', name: 'Đà Nẵng', shortName: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'cantho', name: 'Cần Thơ', shortName: 'Cần Thơ', lat: 10.0452, lon: 105.7469 }
];

const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function mapWmoCode(code: number, isDay: boolean = true): { description: string; type: WeatherType } {
  switch (code) {
    case 0:
      return { description: isDay ? 'Quang đãng' : 'Trời quang', type: 'sunny' };
    case 1:
      return { description: 'Nắng nhẹ', type: 'sunny' };
    case 2:
      return { description: 'Có mây rải rác', type: 'partly_cloudy' };
    case 3:
      return { description: 'Nhiều mây', type: 'cloudy' };
    case 45:
    case 48:
      return { description: 'Sương mù', type: 'fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Mưa phùn', type: 'rainy' };
    case 56:
    case 57:
      return { description: 'Mưa phùn lạnh', type: 'rainy' };
    case 61:
      return { description: 'Mưa nhỏ', type: 'rainy' };
    case 63:
      return { description: 'Mưa vừa', type: 'rainy' };
    case 65:
      return { description: 'Mưa to', type: 'rainy' };
    case 66:
    case 67:
      return { description: 'Mưa lạnh', type: 'rainy' };
    case 80:
      return { description: 'Mưa rào nhẹ', type: 'rainy' };
    case 81:
      return { description: 'Mưa rào', type: 'rainy' };
    case 82:
      return { description: 'Mưa rào lớn', type: 'rainy' };
    case 95:
      return { description: 'Dông bão', type: 'storm' };
    case 96:
    case 99:
      return { description: 'Dông sét', type: 'storm' };
    default:
      if (code >= 70 && code <= 77) {
        return { description: 'Tuyết rơi', type: 'cloudy' };
      }
      return { description: 'Có mây', type: 'partly_cloudy' };
  }
}

// Default initial state if offline or during load
export const DEFAULT_WEATHER: WeatherData = {
  temperature: 28,
  apparentTemperature: 32,
  tempMax: 32,
  tempMin: 25,
  weatherCode: 2,
  weatherDescription: 'Có mây rải rác',
  weatherType: 'partly_cloudy',
  dayOfWeek: VIETNAMESE_DAYS[new Date().getDay()],
  formattedDate: `${new Date().getDate()} Th${new Date().getMonth() + 1} ${new Date().getFullYear()}`,
  cityName: 'TP. HCM',
  isDay: true,
  updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
};

const CACHE_KEY = 'hydrosmart_weather_cache';
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export function getCachedWeather(lat: number = 10.8231, lon: number = 106.6297): WeatherData | null {
  try {
    const cacheKey = `${CACHE_KEY}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        return parsed.data;
      }
    }
  } catch {
    // sessionStorage not available
  }
  return null;
}

export async function fetchLiveWeather(
  lat: number = 10.8231,
  lon: number = 106.6297,
  cityName: string = 'TP. HCM'
): Promise<WeatherData> {
  const cacheKey = `${CACHE_KEY}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  
  // Return cache immediately if valid
  const cached = getCachedWeather(lat, lon);
  if (cached) {
    return cached;
  }

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(endpoint, { 
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const now = new Date();
    const dayOfWeek = VIETNAMESE_DAYS[now.getDay()];
    const formattedDate = `${now.getDate()} Th${now.getMonth() + 1} ${now.getFullYear()}`;

    const isDay = current.is_day === 1;
    const { description, type } = mapWmoCode(current.weather_code, isDay);

    const weatherResult: WeatherData = {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      tempMax: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 3),
      tempMin: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 3),
      weatherCode: current.weather_code,
      weatherDescription: description,
      weatherType: type,
      dayOfWeek,
      formattedDate,
      cityName,
      isDay,
      updatedAt: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: weatherResult
      }));
    } catch {
      // ignore
    }

    return weatherResult;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Không thể tải thời tiết trực tuyến, sử dụng dữ liệu mặc định:', err);
    return {
      ...DEFAULT_WEATHER,
      cityName,
      dayOfWeek: VIETNAMESE_DAYS[new Date().getDay()],
      formattedDate: `${new Date().getDate()} Th${new Date().getMonth() + 1} ${new Date().getFullYear()}`
    };
  }
}
