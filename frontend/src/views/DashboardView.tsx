import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  Info, 
  Sprout, 
  BarChart3, 
  MapPin, 
  RotateCw, 
  AlertTriangle, 
  Droplets, 
  Sparkles, 
  Layers, 
  ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { CropBatch, Reservoir, Alert, FarmZone } from '../types/farm';
import { farmStore } from '../mock/store';
import { 
  fetchLiveWeather, 
  getCachedWeather,
  POPULAR_LOCATIONS, 
  DEFAULT_WEATHER, 
  type WeatherData, 
  type WeatherType 
} from '../services/weatherService';

interface DashboardViewProps {
  batches: CropBatch[];
  reservoirs: Reservoir[];
  sensorHistory: any[];
  alerts: Alert[];
  onNavigateTab: (tab: any) => void;
  onSelectBatchForAI: (batch: CropBatch) => void;
}

// Monthly Yield Data in Vietnamese
const MONTHLY_YIELD_DATA = [
  { month: 'Th1', tons: 48 },
  { month: 'Th2', tons: 53 },
  { month: 'Th3', tons: 78 },
  { month: 'Th4', tons: 42 },
  { month: 'Th5', tons: 74 },
  { month: 'Th6', tons: 108 },
  { month: 'Th7', tons: 180 }, // Đỉnh thu hoạch mùa hè
  { month: 'Th8', tons: 88 },
  { month: 'Th9', tons: 124 },
];

// Weather Graphic Component
const WeatherGraphic: React.FC<{ type: WeatherType }> = ({ type }) => {
  switch (type) {
    case 'sunny':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="sunGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#f59e0b" floodOpacity="0.3" />
            </filter>
          </defs>
          <g transform="translate(52, 36)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
              <line
                key={idx}
                x1={23 * Math.cos((angle * Math.PI) / 180)}
                y1={23 * Math.sin((angle * Math.PI) / 180)}
                x2={31 * Math.cos((angle * Math.PI) / 180)}
                y2={31 * Math.sin((angle * Math.PI) / 180)}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}
            <circle cx="0" cy="0" r="18" fill="url(#sunGrad)" filter="url(#sunGlow)" />
          </g>
        </svg>
      );

    case 'rainy':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <path d="M 28 26 C 28 18 36 12 46 12 C 54 12 61 17 64 23 C 68 21 74 22 77 26 C 81 29 81 35 78 39 C 84 40 88 45 88 50 C 88 56 82 61 75 61 L 26 61 C 17 61 10 55 10 47 C 10 40 16 33 24 32 C 25 29 26 27 28 26 Z" fill="#94a3b8" />
          <path d="M 22 30 C 22 23 30 17 40 17 C 48 17 54 21 57 26 C 61 25 66 26 69 29 C 72 32 73 36 70 40 C 75 41 78 45 78 49 C 78 55 73 59 67 59 L 20 59 C 12 59 6 54 6 47 C 6 41 12 35 19 34 C 20 32 21 31 22 30 Z" fill="#ffffff" />
          <line x1="28" y1="64" x2="24" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="64" x2="40" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="60" y1="64" x2="56" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'partly_cloudy':
    default:
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="sunGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <g transform="translate(24, 0)">
            <line x1="58" y1="4" x2="58" y2="-2" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="10" x2="77" y2="6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="78" y1="24" x2="84" y2="24" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="58" cy="24" r="15" fill="url(#sunGradient)" />
          </g>
          <path d="M 28 38 C 28 29 36 22 46 22 C 54 22 61 27 64 34 C 68 32 74 33 77 37 C 81 41 81 48 78 52 C 84 53 88 58 88 64 C 88 71 82 76 75 76 L 26 76 C 17 76 10 69 10 60 C 10 52 16 45 24 44 C 25 41 26 39 28 38 Z" fill="#e2e8f0" />
          <path d="M 22 42 C 22 34 30 27 40 27 C 48 27 54 32 57 38 C 61 36 66 37 69 40 C 72 43 73 48 70 52 C 75 53 78 57 78 62 C 78 68 73 73 67 73 L 20 73 C 12 73 6 67 6 59 C 6 52 12 45 19 44 C 20 42 21 41 22 42 Z" fill="#ffffff" />
        </svg>
      );
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  batches = [],
  reservoirs = [],
  sensorHistory: _sensorHistory = [],
  alerts = [],
  onNavigateTab,
  onSelectBatchForAI,
}) => {
  const [yieldYear, setYieldYear] = useState('2024');
  const [selectedResId, setSelectedResId] = useState<string>('res-01');

  // Live Weather API state
  const [selectedCityId, setSelectedCityId] = useState('hcm');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData>(() => {
    return getCachedWeather(10.8231, 106.6297) || DEFAULT_WEATHER;
  });

  const loadWeatherForCity = (locId: string, force: boolean = false) => {
    const found = POPULAR_LOCATIONS.find((l) => l.id === locId) || POPULAR_LOCATIONS[0];
    if (!force) {
      const cached = getCachedWeather(found.lat, found.lon);
      if (cached) {
        setWeather(cached);
        return;
      }
    }
    setIsWeatherLoading(true);
    fetchLiveWeather(found.lat, found.lon, found.shortName)
      .then((data) => setWeather(data))
      .catch((err) => console.warn('Lỗi thời tiết:', err))
      .finally(() => setIsWeatherLoading(false));
  };

  useEffect(() => {
    loadWeatherForCity(selectedCityId);
  }, [selectedCityId]);

  // Dynamic calculations from live store data
  const zones: FarmZone[] = useMemo(() => farmStore.getZones(), []);
  const harvestRecords = useMemo(() => farmStore.getHarvests(), []);

  const activeBatches = useMemo(() => batches.filter(b => b.status === 'active'), [batches]);
  const totalActivePlants = useMemo(() => activeBatches.reduce((sum, b) => sum + (b.currentQuantity || b.plantQuantity), 0), [activeBatches]);
  const totalInitialPlants = useMemo(() => activeBatches.reduce((sum, b) => sum + b.plantQuantity, 0), [activeBatches]);
  const survivalRate = totalInitialPlants > 0 ? ((totalActivePlants / totalInitialPlants) * 100).toFixed(1) : '98.5';

  const totalHarvestKg = useMemo(() => harvestRecords.reduce((acc, h) => acc + h.totalWeightKg, 0).toFixed(1), [harvestRecords]);
  const totalRevenue = useMemo(() => {
    return harvestRecords.reduce((sum, h) => {
      const price = h.unitPriceVnd || 45000;
      return sum + (h.totalRevenueVnd || (h.totalWeightKg * price));
    }, 0);
  }, [harvestRecords]);

  // Open & critical alerts - prioritized by severity (emergency > critical > warning > info)
  const openAlerts = useMemo(() => {
    const list = alerts.filter(a => a.status === 'open' || a.status === 'acknowledged');
    const severityWeight: Record<string, number> = { emergency: 4, critical: 3, warning: 2, info: 1 };
    return [...list].sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));
  }, [alerts]);
  const primaryAlert = openAlerts[0];

  // Active reservoir data
  const currentReservoir = useMemo(() => {
    return reservoirs.find(r => r.id === selectedResId) || reservoirs[0] || {
      id: 'res-01',
      name: 'Bể Tuần Hoàn 01 - Giàn NFT Tầng 1',
      currentPh: 5.85,
      currentEc: 1.72,
      currentWaterTemp: 22.4,
      currentDo: 6.8,
      capacityLiters: 600,
      currentVolumeLiters: 540,
      pumpStatus: 'running' as const,
      aerationStatus: 'active' as const,
      formulaName: 'Chuẩn Hoagland - Resh'
    };
  }, [reservoirs, selectedResId]);

  const reservoirBatches = useMemo(() => {
    return activeBatches.filter(b => b.reservoirId === currentReservoir.id);
  }, [activeBatches, currentReservoir.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng !';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều !';
    return 'Chào buổi tối !';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <style>{`
        @keyframes weatherSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseAlert {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ========================================================
          THÔNG BÁO CẢNH BÁO TỰ ĐỘNG THỜI GIAN THỰC (Nếu có sự cố)
          ======================================================== */}
      {primaryAlert && (
        <div style={{
          backgroundColor: primaryAlert.severity === 'emergency' ? '#fff1f2' : primaryAlert.severity === 'critical' ? '#fef2f2' : '#fffbeb',
          border: `1.5px solid ${primaryAlert.severity === 'emergency' ? '#fda4af' : primaryAlert.severity === 'critical' ? '#fca5a5' : '#fcd34d'}`,
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: primaryAlert.severity === 'emergency' ? '#dc2626' : primaryAlert.severity === 'critical' ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              animation: 'pulseAlert 2s infinite ease-in-out'
            }}>
              <AlertTriangle size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  {primaryAlert.title}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: primaryAlert.severity === 'emergency' ? '#fee2e2' : primaryAlert.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                  color: primaryAlert.severity === 'emergency' ? '#991b1b' : primaryAlert.severity === 'critical' ? '#b91c1c' : '#b45309'
                }}>
                  {primaryAlert.severity === 'emergency' ? 'KHẨN CẤP' : `${primaryAlert.metric} Cần Can Thiệp`}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {primaryAlert.message} {primaryAlert.suggestedAction && `— ${primaryAlert.suggestedAction}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => onNavigateTab(primaryAlert.metric === 'EC' || primaryAlert.metric === 'pH' ? 'reservoirs' : 'alerts')}
              className="farmvista-btn-green"
              style={{ fontSize: '0.78rem', padding: '6px 14px', height: '32px' }}
            >
              <span>{primaryAlert.metric === 'EC' ? 'Châm Phân Ngay' : 'Xử Lý Sự Cố'}</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onNavigateTab('alerts')}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#475569',
                padding: '6px 10px',
                cursor: 'pointer'
              }}
            >
              Xem tất cả ({openAlerts.length})
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          HÀNG 1: Lời chào & Vi khí hậu + BỂ DINH DƯỠNG TRỰC TIẾP + KPIs
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* THẺ 1: Lời chào & Thời tiết Thực */}
        <div className="farmvista-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.005em', margin: 0, fontFamily: 'var(--font-sans)' }}>
              {getGreeting()}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px', lineHeight: 1.4, margin: '6px 0 0 0' }}>
              Vận hành thủy canh NFT thông minh, liên kết dưỡng chất & sinh trắc học.
            </p>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#f1fdf5',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid #d1fae5',
                fontSize: '0.75rem'
              }}>
                <MapPin size={12} color="#00a651" strokeWidth={2.5} />
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#00a651',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0
                  }}
                  title="Chọn trạm thời tiết"
                >
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id} style={{ color: '#0f172a' }}>
                      {loc.shortName}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => loadWeatherForCity(selectedCityId, true)}
                  disabled={isWeatherLoading}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00a651',
                    opacity: isWeatherLoading ? 0.6 : 1
                  }}
                  title="Cập nhật thời tiết"
                >
                  <RotateCw
                    size={11}
                    style={{
                      animation: isWeatherLoading ? 'weatherSpin 0.9s linear infinite' : 'none'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '10px'
          }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {weather.dayOfWeek}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {weather.formattedDate}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {isWeatherLoading ? '--° C' : `${weather.temperature}° C`}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                  {isWeatherLoading ? 'H:--° | L:--°' : `H:${weather.tempMax}° | L:${weather.tempMin}°`}
                </div>
              </div>
            </div>

            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '120px' }}>
              <div style={{ width: '88px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WeatherGraphic type={weather.weatherType} />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {isWeatherLoading ? 'Đang cập nhật...' : weather.weatherDescription}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Cảm giác {weather.apparentTemperature}°
              </div>
            </div>
          </div>
        </div>

        {/* THẺ 2: BỂ DINH DƯỠNG TUẦN HOÀN THỜI GIAN THỰC (Connected Hydroponic Reservoir) */}
        <div className="farmvista-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={18} color="#00a651" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Bể Dinh Dưỡng NFT
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setSelectedResId('res-01')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: selectedResId === 'res-01' ? '#00a651' : '#ffffff',
                    color: selectedResId === 'res-01' ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Bể 01 (Tầng 1)
                </button>
                <button
                  onClick={() => setSelectedResId('res-02')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: selectedResId === 'res-02' ? '#00a651' : '#ffffff',
                    color: selectedResId === 'res-02' ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Bể 02 (Tầng 2)
                </button>
              </div>
            </div>

            {/* Thông số 4 cột: pH, EC, Temp, DO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '14px 0' }}>
              <div style={{ padding: '10px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Độ pH</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentReservoir.currentPh >= 5.5 && currentReservoir.currentPh <= 6.5 ? '#16a34a' : '#dc2626' }}>
                  {currentReservoir.currentPh.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 600 }}>Chuẩn 5.6-6.2</span>
              </div>

              <div style={{ padding: '10px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>EC (mS/cm)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentReservoir.currentEc >= 1.4 && currentReservoir.currentEc <= 2.0 ? '#16a34a' : '#d97706' }}>
                  {currentReservoir.currentEc.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 600 }}>Chuẩn 1.5-1.9</span>
              </div>

              <div style={{ padding: '10px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Nhiệt nước</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentReservoir.currentWaterTemp <= 24 ? '#0284c7' : '#dc2626' }}>
                  {currentReservoir.currentWaterTemp.toFixed(1)}°
                </div>
                <span style={{ fontSize: '0.62rem', color: '#0284c7', fontWeight: 600 }}>Mát rễ &lt;24°</span>
              </div>

              <div style={{ padding: '10px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>DO (mg/L)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                  {currentReservoir.currentDo || 6.8}
                </div>
                <span style={{ fontSize: '0.62rem', color: '#059669', fontWeight: 600 }}>Oxy hòa tan</span>
              </div>
            </div>

            {/* Mức nước bể */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                <span>Thể tích bồn: {currentReservoir.currentVolumeLiters}L / {currentReservoir.capacityLiters}L</span>
                <span style={{ color: '#00a651' }}>{Math.round((currentReservoir.currentVolumeLiters / currentReservoir.capacityLiters) * 100)}% dung tích</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Math.round((currentReservoir.currentVolumeLiters / currentReservoir.capacityLiters) * 100))}%`,
                  height: '100%',
                  backgroundColor: '#00a651'
                }} />
              </div>
            </div>

            {/* Các lô kết nối */}
            <div style={{ fontSize: '0.72rem', color: '#475569', backgroundColor: '#f1fdf5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1fae5' }}>
              <strong>Cây trồng cấp dinh dưỡng: </strong>
              {reservoirBatches.length > 0 ? (
                reservoirBatches.map(b => `${b.cultivarName} (${b.batchCode})`).join(', ')
              ) : (
                'Giàn NFT A1 (Green Oak Leaf), Giàn NFT A2 (Batavia)'
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => onNavigateTab('reservoirs')}
              className="farmvista-btn-green"
              style={{ flex: 1, fontSize: '0.75rem', height: '32px' }}
            >
              <Droplets size={13} />
              <span>Châm Stock A & B</span>
            </button>
            <button
              onClick={() => onNavigateTab('reservoirs')}
              style={{
                flex: 1,
                fontSize: '0.75rem',
                height: '32px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Quản lý bể
            </button>
          </div>
        </div>

        {/* THẺ 3 & 4: Cột Thống Kê KPI (Quy mô máng trồng & Doanh thu) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* KPI Trên: Quy Mô Máng Trồng */}
          <div className="farmvista-card" style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>Quy Mô Cây Đang Trồng</span>
                <Info size={14} color="var(--text-disabled)" />
              </div>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#00a651',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Sprout size={18} />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em' }}>
                {totalActivePlants.toLocaleString('vi-VN')} cây
              </div>

              <div style={{ width: '100%', height: '7px', backgroundColor: '#e5e7eb', borderRadius: 'var(--radius-full)', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.round(Number(survivalRate)))}%`, height: '100%', backgroundColor: '#00a651', borderRadius: 'var(--radius-full)' }} />
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00a651', marginTop: '6px' }}>
                Tỷ lệ sống {survivalRate}% ({activeBatches.length} lô máng NFT đang sinh trưởng)
              </div>
            </div>
          </div>

          {/* KPI Dưới: Doanh Thu Thực Tế */}
          <div className="farmvista-card" style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>Doanh Thu Xuất Bán Nông Sản</span>
                <Info size={14} color="var(--text-disabled)" />
              </div>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <BarChart3 size={18} />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em' }}>
                {totalRevenue > 0 ? totalRevenue.toLocaleString('vi-VN') + ' ₫' : '7.582.500 ₫'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#00a651', marginTop: '6px' }}>
                <span>{totalHarvestKg} kg xà lách sạch</span>
                <span style={{ fontWeight: 400, color: 'var(--text-subtle)' }}>đạt chuẩn loại 1 (Grade A)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          HÀNG 2: SƠ ĐỒ 6 PHÂN KHU THỰC ĐỊA NFT (A1, A2, B2, D1, C1, E1)
          ======================================================== */}
      <div className="farmvista-card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#00a651" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Sơ Đồ Thực Địa 6 Phân Khu NFT
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Tình trạng giàn máng tuần hoàn, giống xà lách, số lượng cây và bể dinh dưỡng cung cấp
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} /> Đang trồng ({zones.filter(z => z.status === 'growing').length})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Sắp thu hoạch ({zones.filter(z => z.status === 'ready_soon').length})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} /> Đã hoàn thành ({zones.filter(z => z.status === 'completed').length})
            </span>
            <button
              onClick={() => onNavigateTab('batches')}
              className="farmvista-btn-green"
              style={{ fontSize: '0.75rem', height: '30px' }}
            >
              <span>Quản lý giàn</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Grid 6 Khối Phân Khu */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {zones.map((zone) => {
            const batch = batches.find(b => b.zoneId === zone.id || b.zoneCode === zone.code || b.id === zone.currentBatchId);
            const statusConfig = {
              growing: { label: 'Đang sinh trưởng', bg: '#ecfdf5', color: '#15803d', border: '#bbf7d0' },
              ready_soon: { label: 'Sẵn sàng thu hoạch', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
              completed: { label: 'Đã hoàn thành', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
              needs_attention: { label: 'Cần bảo trì béc', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
              empty: { label: 'Giàn trống', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
            }[zone.status] || { label: zone.status, bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };

            return (
              <div
                key={zone.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1.5px solid ${statusConfig.border}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: zone.color,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800
                      }}>
                        {zone.code}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{zone.name}</strong>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.color,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.45, marginTop: '8px' }}>
                    <div><strong>Giống rau: </strong>{zone.cultivarName || 'Chưa gieo'}</div>
                    <div><strong>Mã lô: </strong>{zone.currentBatchCode || 'Trống'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span>Số cây: <strong>{zone.plantQuantity || zone.slotCapacity} cây</strong></span>
                      <span>Bể: <strong>{zone.reservoirId === 'res-01' ? 'Bể 01 (NFT)' : 'Bể 02 (NFT)'}</strong></span>
                    </div>
                  </div>

                  {zone.biomassProgress !== undefined && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '3px' }}>
                        <span>Tiến độ sinh khối</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>{zone.biomassProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${zone.biomassProgress}%`, height: '100%', backgroundColor: zone.color }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  {batch && (
                    <button
                      onClick={() => onSelectBatchForAI(batch)}
                      className="farmvista-btn-green"
                      style={{ flex: 1, fontSize: '0.72rem', height: '28px', padding: '0 8px' }}
                      title="Chạy mô hình AI dự báo năng suất lô này"
                    >
                      <Sparkles size={11} />
                      <span>Dự báo AI</span>
                    </button>
                  )}
                  {zone.status === 'ready_soon' ? (
                    <button
                      onClick={() => onNavigateTab('harvest')}
                      style={{
                        flex: 1,
                        fontSize: '0.72rem',
                        height: '28px',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Thu hoạch
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateTab('batches')}
                      style={{
                        flex: 1,
                        fontSize: '0.72rem',
                        height: '28px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#475569',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Xem chi tiết
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          HÀNG 3: Bảng Các Lô Canh Tác Thực Tế + Năng Suất Hàng Tháng
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* THẺ TRÁI: Danh Sách Các Lô Đang Sinh Trưởng Trực Tiếp */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Các Lô Đang Canh Tác NFT
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Theo dõi sinh trắc học và thời gian dự kiến thu hoạch
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('batches')}
              className="farmvista-btn-green"
              style={{ fontSize: '0.75rem', height: '30px' }}
            >
              <span>Thêm lô</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Mã Lô & Giống</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Giàn Máng</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Số Cây</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Giai Đoạn</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500, textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {activeBatches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.batchCode}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.cultivarName}</div>
                    </td>
                    <td style={{ padding: '10px 10px', color: '#475569', fontWeight: 600 }}>
                      {b.zoneCode ? `Giàn ${b.zoneCode}` : 'Máng NFT A1'}
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#00a651' }}>
                      {b.currentQuantity || b.plantQuantity} cây
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {b.currentStage === 'seedling' ? 'Cây con' : b.currentStage === 'vegetative' ? 'Sinh dưỡng' : 'Tích lũy sinh khối'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectBatchForAI(b)}
                        className="farmvista-btn-green"
                        style={{ fontSize: '0.7rem', height: '26px', padding: '0 8px' }}
                        title="Dự báo sản lượng AI"
                      >
                        <Sparkles size={11} /> Dự báo AI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* THẺ PHẢI: Phân Tích Năng Suất Hàng Tháng */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Năng Suất Xuất Bán Hàng Tháng (kg)
            </h3>
            <select
              value={yieldYear}
              onChange={(e) => setYieldYear(e.target.value)}
              className="farmvista-select-pill"
            >
              <option value="2024">Năm 2024</option>
              <option value="2023">Năm 2023</option>
            </select>
          </div>

          <div style={{ width: '100%', height: '230px', marginTop: '6px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_YIELD_DATA} margin={{ top: 20, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-subtle)" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 200]} stroke="var(--text-subtle)" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any) => [`${val} kg`, 'Sản lượng']}
                  labelFormatter={(lbl: any) => `Tháng: ${lbl}`}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Line type="monotone" dataKey="tons" stroke="#00a651" strokeWidth={2.5} dot={{ r: 4, fill: '#00a651' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
