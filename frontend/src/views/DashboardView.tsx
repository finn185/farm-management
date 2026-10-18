import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Info, 
  Sprout, 
  BarChart3, 
  Calendar,
  MapPin,
  RotateCw
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
import type { CropBatch, Reservoir, Alert } from '../types/farm';
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

// Tasks Data in Vietnamese
const INITIAL_TASKS = [
  { id: 't1', name: 'Châm dinh dưỡng Can A & B vào Bể 01', assignedTo: 'Nguyễn Văn An', dueDate: '26/08/2024', status: 'Đang thực hiện', statusColor: '#00a651' },
  { id: 't2', name: 'Kiểm tra máy bơm hồi lưu NFT Nhà màng A', assignedTo: 'Trần Minh Bình', dueDate: '26/08/2024', status: 'Đang chờ', statusColor: '#f59e0b' },
  { id: 't3', name: 'Thu hoạch xà lách Lollo Bionda Lô A1', assignedTo: 'Lê Thị Cúc', dueDate: '27/08/2024', status: 'Chưa bắt đầu', statusColor: '#3b82f6' },
  { id: 't4', name: 'Hiệu chuẩn cảm biến pH & nồng độ EC', assignedTo: 'Phạm Văn Dũng', dueDate: '28/08/2024', status: 'Đang thực hiện', statusColor: '#00a651' },
];

// Harvest Vegetables Summary Data (Vietnamese Hydroponic Crops)
const VEGETABLE_HARVEST = [
  { id: 'v1', icon: '🥬', name: 'Xà lách Lollo Bionda', harvest: '520 kg', target: '600 kg' },
  { id: 'v2', icon: '🥗', name: 'Xà lách Romaine', harvest: '380 kg', target: '450 kg' },
  { id: 'v3', icon: '🌿', name: 'Húng quế Sweet Basil', harvest: '180 kg', target: '200 kg' },
  { id: 'v4', icon: '🥬', name: 'Cải Kale xoăn', harvest: '170 kg', target: '200 kg' },
];

// Component: Segmented Radial Rainbow Gauge (Chuẩn xác 100% theo ảnh mẫu: 26 nan viên thuốc dày, Blue -> Purple -> Green)
const SegmentedRainbowGauge: React.FC = () => {
  const cx = 160;
  const cy = 145;
  const rInner = 80;
  const rOuter = 125;
  const numSegments = 26;

  // Generate 26 thick radial capsule bars from 180deg (left) to 0deg (right)
  const segments = [];
  for (let i = 0; i < numSegments; i++) {
    const fraction = i / (numSegments - 1);
    const angleDeg = 180 - fraction * 180;
    const angleRad = (angleDeg * Math.PI) / 180;

    const x1 = cx + rInner * Math.cos(angleRad);
    const y1 = cy - rInner * Math.sin(angleRad);
    const x2 = cx + rOuter * Math.cos(angleRad);
    const y2 = cy - rOuter * Math.sin(angleRad);

    // Exact color matching the sample crop:
    // 4 bars Blue (bottom-left) -> 6 bars Purple -> 16 bars Green (top & right)
    let stroke = '#00a651';
    if (i < 4) {
      stroke = '#0096eb'; // 4 thanh Xanh lam / Cyan
    } else if (i < 10) {
      stroke = '#7c3aed'; // 6 thanh Tím
    } else {
      stroke = '#00a651'; // 16 thanh Xanh lá
    }

    segments.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={10.5}
        strokeLinecap="round"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: 'auto 0' }}>
      <svg width="100%" height="165" viewBox="0 0 320 165" style={{ maxWidth: '320px', overflow: 'visible' }}>
        {segments}
        {/* Center Text inside the Arch matching sample crop */}
        <text
          x={cx}
          y={cy - 24}
          textAnchor="middle"
          fontSize="24"
          fontWeight="800"
          fill="#0f172a"
          fontFamily="var(--font-sans)"
          letterSpacing="0.005em"
        >
          1.000 tấn
        </text>
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="500"
          fill="#64748b"
          fontFamily="var(--font-sans)"
        >
          Tổng sản lượng
        </text>
      </svg>

      {/* Legend underneath the Gauge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginTop: '10px',
        fontSize: '0.8125rem',
        color: '#475569',
        fontWeight: 500
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
          <span>Xà lách 40%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0096eb' }} />
          <span>Bắp ngô 30%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00a651' }} />
          <span>Húng quế 20%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
          <span>Khác 10%</span>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip Pinned on July (180 kg) in Vietnamese - Căn chỉnh hoàn hảo không bị che khuất
const CustomizedDotWithPeakTooltip = (props: any) => {
  const { cx, cy, payload } = props;
  const isJulyPeak = payload && payload.month === 'Th7';

  return (
    <g style={{ overflow: 'visible' }}>
      {/* Circle dot on every line point */}
      <circle
        cx={cx}
        cy={cy}
        r={isJulyPeak ? 5 : 3.5}
        fill="#00a651"
        stroke="#ffffff"
        strokeWidth={2}
      />

      {/* Pinned Tooltip Box on July 180kg point */}
      {isJulyPeak && (
        <g transform={`translate(${cx}, ${cy - 46})`} style={{ overflow: 'visible' }}>
          {/* Tooltip Card Box */}
          <rect
            x="-29"
            y="0"
            width="58"
            height="34"
            rx="6"
            fill="#00a651"
          />
          {/* Tooltip Down Triangle Pointer */}
          <polygon
            points="0,40 -5,34 5,34"
            fill="#00a651"
          />
          {/* Text inside badge */}
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="600"
            fontFamily="var(--font-sans)"
          >
            Tháng 7
          </text>
          <text
            x="0"
            y="27"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="700"
            fontFamily="var(--font-sans)"
          >
            180 kg
          </text>
        </g>
      )}
    </g>
  );
};

// Component: Dynamic Weather SVG Graphic based on Weather Condition
const WeatherGraphic: React.FC<{ type: WeatherType }> = ({ type }) => {
  switch (type) {
    case 'sunny':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
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

    case 'cloudy':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="fluffyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#64748b" floodOpacity="0.12" />
            </filter>
          </defs>
          <path
            d="M 28 34 C 28 25 36 18 46 18 C 54 18 61 23 64 30 C 68 28 74 29 77 33 C 81 37 81 44 78 48 C 84 49 88 54 88 60 C 88 67 82 72 75 72 L 26 72 C 17 72 10 65 10 56 C 10 48 16 41 24 40 C 25 37 26 35 28 34 Z"
            fill="#cbd5e1"
          />
          <path
            d="M 22 38 C 22 30 30 23 40 23 C 48 23 54 28 57 34 C 61 32 66 33 69 36 C 72 39 73 44 70 48 C 75 49 78 53 78 58 C 78 64 73 69 67 69 L 20 69 C 12 69 6 63 6 55 C 6 48 12 41 19 40 C 20 38 21 37 22 38 Z"
            fill="#ffffff"
            filter="url(#fluffyShadow)"
          />
        </svg>
      );

    case 'rainy':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="fluffyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#64748b" floodOpacity="0.12" />
            </filter>
          </defs>
          <path
            d="M 28 26 C 28 18 36 12 46 12 C 54 12 61 17 64 23 C 68 21 74 22 77 26 C 81 29 81 35 78 39 C 84 40 88 45 88 50 C 88 56 82 61 75 61 L 26 61 C 17 61 10 55 10 47 C 10 40 16 33 24 32 C 25 29 26 27 28 26 Z"
            fill="#94a3b8"
          />
          <path
            d="M 22 30 C 22 23 30 17 40 17 C 48 17 54 21 57 26 C 61 25 66 26 69 29 C 72 32 73 36 70 40 C 75 41 78 45 78 49 C 78 55 73 59 67 59 L 20 59 C 12 59 6 54 6 47 C 6 41 12 35 19 34 C 20 32 21 31 22 30 Z"
            fill="#ffffff"
            filter="url(#fluffyShadow)"
          />
          <line x1="28" y1="64" x2="24" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="64" x2="40" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="60" y1="64" x2="56" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'storm':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="fluffyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#334155" floodOpacity="0.2" />
            </filter>
          </defs>
          <path
            d="M 28 26 C 28 18 36 12 46 12 C 54 12 61 17 64 23 C 68 21 74 22 77 26 C 81 29 81 35 78 39 C 84 40 88 45 88 50 C 88 56 82 61 75 61 L 26 61 C 17 61 10 55 10 47 C 10 40 16 33 24 32 C 25 29 26 27 28 26 Z"
            fill="#64748b"
          />
          <path
            d="M 22 30 C 22 23 30 17 40 17 C 48 17 54 21 57 26 C 61 25 66 26 69 29 C 72 32 73 36 70 40 C 75 41 78 45 78 49 C 78 55 73 59 67 59 L 20 59 C 12 59 6 54 6 47 C 6 41 12 35 19 34 C 20 32 21 31 22 30 Z"
            fill="#e2e8f0"
            filter="url(#fluffyShadow)"
          />
          <polygon points="46,50 40,61 47,61 43,72 54,59 47,59" fill="#eab308" />
        </svg>
      );

    case 'fog':
      return (
        <svg width="105" height="72" viewBox="0 0 105 72" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="fluffyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#64748b" floodOpacity="0.12" />
            </filter>
          </defs>
          <path
            d="M 22 28 C 22 21 30 15 40 15 C 48 15 54 19 57 24 C 61 23 66 24 69 27 C 72 30 73 34 70 38 C 75 39 78 43 78 47 C 78 53 73 57 67 57 L 20 57 C 12 57 6 52 6 45 C 6 39 12 33 19 32 C 20 30 21 29 22 28 Z"
            fill="#cbd5e1"
            filter="url(#fluffyShadow)"
          />
          <line x1="16" y1="62" x2="72" y2="62" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="68" x2="64" y2="68" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
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
            <filter id="fluffyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#64748b" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Sun with Radiating Rays on top-right */}
          <g transform="translate(24, 0)">
            <line x1="58" y1="4" x2="58" y2="-2" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="10" x2="77" y2="6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="78" y1="24" x2="84" y2="24" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="38" x2="77" y2="42" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="44" y1="10" x2="39" y2="6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="58" cy="24" r="15" fill="url(#sunGradient)" />
          </g>

          {/* Back Soft Cloud */}
          <path
            d="M 28 38 C 28 29 36 22 46 22 C 54 22 61 27 64 34 C 68 32 74 33 77 37 C 81 41 81 48 78 52 C 84 53 88 58 88 64 C 88 71 82 76 75 76 L 26 76 C 17 76 10 69 10 60 C 10 52 16 45 24 44 C 25 41 26 39 28 38 Z"
            fill="#e2e8f0"
          />

          {/* Front White Fluffy Cloud */}
          <path
            d="M 22 42 C 22 34 30 27 40 27 C 48 27 54 32 57 38 C 61 36 66 37 69 40 C 72 43 73 48 70 52 C 75 53 78 57 78 62 C 78 68 73 73 67 73 L 20 73 C 12 73 6 67 6 59 C 6 52 12 45 19 44 C 20 42 21 41 22 42 Z"
            fill="#ffffff"
            filter="url(#fluffyShadow)"
          />
        </svg>
      );
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
}) => {
  const [productionYear, setProductionYear] = useState('Năm nay');
  const [yieldYear, setYieldYear] = useState('2024');
  const [selectedField, setSelectedField] = useState('Nhà màng NFT Khu A');
  const [taskAssignee, setTaskAssignee] = useState('Tất cả người thực hiện');
  const [harvestMonth, setHarvestMonth] = useState('Tháng này');

  // Live Weather API state with instant cache initialization
  const [selectedCityId, setSelectedCityId] = useState('hcm');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData>(() => {
    return getCachedWeather(10.8231, 106.6297) || DEFAULT_WEATHER;
  });

  const loadWeatherForCity = (locId: string, force: boolean = false) => {
    const found = POPULAR_LOCATIONS.find((l) => l.id === locId) || POPULAR_LOCATIONS[0];
    
    // If not forced and we have cache, load immediately with zero wait
    if (!force) {
      const cached = getCachedWeather(found.lat, found.lon);
      if (cached) {
        setWeather(cached);
        return;
      }
    }

    setIsWeatherLoading(true);
    fetchLiveWeather(found.lat, found.lon, found.shortName)
      .then((data) => {
        setWeather(data);
      })
      .catch((err) => {
        console.warn('Lỗi khi tải dữ liệu thời tiết:', err);
      })
      .finally(() => {
        setIsWeatherLoading(false);
      });
  };

  // Immediate fetch on mount or city change
  useEffect(() => {
    loadWeatherForCity(selectedCityId);
  }, [selectedCityId]);

  // Dynamic field metadata based on selection
  const getFieldInfo = () => {
    switch (selectedField) {
      case 'Máng Hồi Lưu NFT Khu B':
        return { varietal: 'Xà lách Romaine', date: '02/10/2024', stage: '21 ngày tuổi (Phát triển)' };
      case 'Khu Canh Tác Sweet Basil C':
        return { varietal: 'Húng quế Sweet Basil', date: '15/09/2024', stage: '35 ngày tuổi (Thu hoạch)' };
      case 'Khu Ươm Cây Con D':
        return { varietal: 'Xà lách Oakleaf', date: '10/10/2024', stage: '10 ngày tuổi (Cây con)' };
      case 'Nhà màng NFT Khu A':
      default:
        return { varietal: 'Xà lách Lollo Bionda', date: '18/03/2024', stage: '28 ngày tuổi (Sắp thu hoạch)' };
    }
  };

  // Dynamic time-based greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng !';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều !';
    return 'Chào buổi tối !';
  };

  const fieldInfo = getFieldInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Keyframe animation for spinning loader */}
      <style>{`
        @keyframes weatherSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* ========================================================
          HÀNG 1: Lời chào & Vi khí hậu + Phân bổ sản lượng + KPIs
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
              Tối ưu hóa vận hành trang trại với thông tin chi tiết theo thời gian thực.
            </p>

            {/* Bộ chọn trạm thời tiết & Nút làm mới */}
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
                  title="Chọn trạm nông trại để xem thời tiết"
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
                  title="Cập nhật thời tiết mới nhất"
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

          {/* Bottom Weather Section: Gọn gàng, không bị tràn chữ */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '10px'
          }}>
            {/* Left: Thứ, Ngày, Nhiệt độ lớn, H/L */}
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {weather.dayOfWeek}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {weather.formattedDate}
                </span>
                {/* Outlined Cloud SVG icon */}
                <svg width="24" height="15" viewBox="0 0 32 20" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M 7 18 L 24 18 C 27.5 18 30 15.5 30 12 C 30 8.8 27.5 6.4 24.5 6.2 C 23.8 3.2 21 1 17.5 1 C 14.2 1 11.5 2.8 10.5 5.5 C 9.8 5.2 9 5 8.2 5 C 4.8 5 2 7.8 2 11.2 C 2 14.8 4.2 17.6 7 18 Z"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <div style={{
                  fontSize: '1.9rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  letterSpacing: '0.005em',
                  whiteSpace: 'nowrap',
                  opacity: isWeatherLoading ? 0.45 : 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  {isWeatherLoading ? '--° C' : `${weather.temperature}° C`}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginTop: '6px',
                  whiteSpace: 'nowrap',
                  opacity: isWeatherLoading ? 0.45 : 1
                }}>
                  {isWeatherLoading ? 'H:--° | L:--°' : `H:${weather.tempMax}° | L:${weather.tempMin}°`}
                </div>
              </div>
            </div>

            {/* Right: Dynamic Weather Graphic, Condition, Feels like */}
            <div style={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '120px'
            }}>
              <div style={{
                width: '88px',
                height: '62px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <WeatherGraphic type={weather.weatherType} />
                {isWeatherLoading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2.5px solid #d1fae5',
                      borderTopColor: '#00a651',
                      animation: 'weatherSpin 0.8s linear infinite'
                    }} />
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginTop: '4px',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '115px'
                }}
                title={weather.weatherDescription}
              >
                {isWeatherLoading ? 'Đang cập nhật...' : weather.weatherDescription}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 500,
                marginTop: '2px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap'
              }}>
                {isWeatherLoading ? '...' : `Cảm giác ${weather.apparentTemperature}°`}
              </div>
            </div>
          </div>
        </div>

        {/* THẺ 2: Tổng quan sản lượng (Segmented Rainbow Gauge) */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Tiêu đề */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Tổng Quan Sản Lượng
            </h3>
            <select
              value={productionYear}
              onChange={(e) => setProductionYear(e.target.value)}
              className="farmvista-select-pill"
            >
              <option value="Năm nay">Năm nay</option>
              <option value="Năm trước">Năm trước</option>
              <option value="Toàn thời gian">Toàn thời gian</option>
            </select>
          </div>

          {/* Đồng hồ nan vòm cầu */}
          <SegmentedRainbowGauge />
        </div>

        {/* THẺ 3 & 4: Cột Thống Kê KPI (Quy mô máng trồng & Doanh thu) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* KPI Trên: Quy Mô Máng Trồng */}
          <div className="farmvista-card" style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>Quy Mô Máng Trồng</span>
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
                4.500 cây
              </div>

              {/* Thanh tiến trình */}
              <div style={{ width: '100%', height: '7px', backgroundColor: '#e5e7eb', borderRadius: 'var(--radius-full)', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', backgroundColor: '#00a651', borderRadius: 'var(--radius-full)' }} />
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00a651', marginTop: '6px' }}>
                85% đang canh tác (1.200 m²)
              </div>
            </div>
          </div>

          {/* KPI Dưới: Doanh Thu Ước Tính */}
          <div className="farmvista-card" style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>Doanh Thu Ước Tính</span>
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
                125.000.000 ₫
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#00a651', marginTop: '6px' }}>
                <span>+12%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-subtle)' }}>so với tháng trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          HÀNG 2: Phân Tích Năng Suất Hàng Tháng + Lô Canh Tác Mẫu
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* THẺ TRÁI: Phân Tích Năng Suất Hàng Tháng */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Phân Tích Năng Suất Hàng Tháng
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

          {/* Biểu đồ đường cong uốn lượn mượt mà */}
          <div style={{ width: '100%', height: '245px', marginTop: '6px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_YIELD_DATA} margin={{ top: 56, right: 15, left: -20, bottom: 0 }} style={{ overflow: 'visible' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="var(--text-subtle)" 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 200]} 
                  ticks={[0, 50, 100, 150, 200]}
                  stroke="var(--text-subtle)" 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(val: any) => [`${val} kg`, 'Sản lượng']}
                  labelFormatter={(lbl: any) => `Tháng: ${lbl}`}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="tons" 
                  stroke="#00a651" 
                  strokeWidth={2.5} 
                  dot={<CustomizedDotWithPeakTooltip />} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* THẺ PHẢI: Nhà Màng & Lô Canh Tác Mẫu */}
        <div className="farmvista-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Ảnh nhà màng cánh đồng xà lách xanh tươi */}
          <div style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden' }}>
            <img
              src="/farm_crop_field.jpg"
              alt="Nhà màng xà lách thủy canh"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          {/* Bảng thông tin chi tiết lô cây */}
          <div style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Dropdown chọn khu vực & Link xem chi tiết */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="farmvista-select-pill"
                style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', paddingRight: '28px' }}
              >
                <option value="Nhà màng NFT Khu A">Nhà màng NFT Khu A</option>
                <option value="Máng Hồi Lưu NFT Khu B">Máng Hồi Lưu NFT Khu B</option>
                <option value="Khu Canh Tác Sweet Basil C">Khu Canh Tác Sweet Basil C</option>
                <option value="Khu Ươm Cây Con D">Khu Ươm Cây Con D</option>
              </select>
              <button
                onClick={() => onNavigateTab('batches')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <span>Xem chi tiết</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* 3 Cột thông số nông học */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '14px',
              marginTop: '14px'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                  Giống cây trồng
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '3px' }}>
                  {fieldInfo.varietal}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                  Ngày gieo hạt
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '3px' }}>
                  <span>{fieldInfo.date}</span>
                  <Calendar size={13} color="var(--text-disabled)" />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                  Giai đoạn sinh trưởng
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '3px' }}>
                  {fieldInfo.stage}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          HÀNG 3: Bảng Phân Công Nhiệm Vụ + Tổng Hợp Thu Hoạch
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* THẺ TRÁI: Bảng Phân Công Nhiệm Vụ Trang Trại */}
        <div className="farmvista-card" style={{ padding: '22px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Nhiệm Vụ Vận Hành Trang Trại
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="farmvista-select-pill"
              >
                <option value="Tất cả người thực hiện">Tất cả người thực hiện</option>
                <option value="Nguyễn Văn An">Nguyễn Văn An</option>
                <option value="Trần Minh Bình">Trần Minh Bình</option>
                <option value="Lê Thị Cúc">Lê Thị Cúc</option>
                <option value="Phạm Văn Dũng">Phạm Văn Dũng</option>
              </select>

              <button
                className="farmvista-btn-green"
                onClick={() => alert('Chuyển tới danh mục phân công công việc chi tiết nhà màng')}
              >
                <span>Xem tất cả</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Bảng danh sách công việc */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Nhiệm vụ</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Người thực hiện</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Hạn chót</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_TASKS
                  .filter(t => taskAssignee === 'Tất cả người thực hiện' || t.assignedTo === taskAssignee)
                  .map((task) => (
                    <tr key={task.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '12px 12px', fontWeight: 500, color: 'var(--text-main)' }}>
                        {task.name}
                      </td>
                      <td style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>
                        {task.assignedTo}
                      </td>
                      <td style={{ padding: '12px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {task.dueDate}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: task.statusColor }} />
                          <span>{task.status}</span>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* THẺ PHẢI: Bảng Tổng Hợp Thu Hoạch Các Giống Rau */}
        <div className="farmvista-card" style={{ padding: '22px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Tổng Hợp Thu Hoạch Các Giống Rau
            </h3>
            <select
              value={harvestMonth}
              onChange={(e) => setHarvestMonth(e.target.value)}
              className="farmvista-select-pill"
            >
              <option value="Tháng này">Tháng này</option>
              <option value="Tháng trước">Tháng trước</option>
              <option value="Quý 3/2024">Quý 3/2024</option>
            </select>
          </div>

          {/* Bảng sản lượng thu hoạch nông sản */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Giống rau</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Đã thu hoạch</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Mục tiêu</th>
                </tr>
              </thead>
              <tbody>
                {VEGETABLE_HARVEST.map((crop) => (
                  <tr key={crop.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                      <span style={{ marginRight: '8px', fontSize: '1rem' }}>{crop.icon}</span>
                      <span>{crop.name}</span>
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {crop.harvest}
                    </td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>
                      {crop.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
