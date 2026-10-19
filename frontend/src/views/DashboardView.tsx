import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  Sprout, 
  BarChart3, 
  MapPin, 
  RotateCw, 
  AlertTriangle, 
  Droplets, 
  Sparkles, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Scale,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { CropBatch, Reservoir, Alert, FarmZone, HarvestRecord } from '../types/farm';
import { 
  fetchLiveWeather, 
  getCachedWeather,
  POPULAR_LOCATIONS, 
  DEFAULT_WEATHER, 
  type WeatherData 
} from '../services/weatherService';
import './DashboardView.css';

interface DashboardViewProps {
  batches: CropBatch[];
  reservoirs: Reservoir[];
  sensorHistory?: any[];
  alerts: Alert[];
  harvests?: any[];
  onNavigateTab: (tab: any) => void;
  onSelectBatchForAI: (batch: CropBatch) => void;
  onSelectBatchForHarvest?: (batch: CropBatch) => void;
}

// Monthly Yield Data (kg)
const MONTHLY_YIELD_DATA = [
  { month: 'Tháng 1', yieldKg: 48 },
  { month: 'Tháng 2', yieldKg: 53 },
  { month: 'Tháng 3', yieldKg: 78 },
  { month: 'Tháng 4', yieldKg: 42 },
  { month: 'Tháng 5', yieldKg: 74 },
  { month: 'Tháng 6', yieldKg: 108 },
  { month: 'Tháng 7', yieldKg: 180 },
  { month: 'Tháng 8', yieldKg: 88 },
  { month: 'Tháng 9', yieldKg: 124 },
  { month: 'Tháng 10', yieldKg: 145 },
];

// Helper to calculate days remaining until harvest
function getDaysRemaining(targetDateStr?: string): { days: number; text: string; isPast: boolean } {
  if (!targetDateStr) return { days: 0, text: '--', isPast: false };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { days: 0, text: 'Hôm nay', isPast: false };
    if (diffDays > 0) return { days: diffDays, text: `Còn ${diffDays} ngày`, isPast: false };
    return { days: Math.abs(diffDays), text: 'Đến hạn thu', isPast: true };
  } catch {
    return { days: 0, text: targetDateStr, isPast: false };
  }
}

// Helper to calculate plant age in days
function getPlantAge(seedDateStr?: string): number {
  if (!seedDateStr) return 25;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seed = new Date(seedDateStr);
    seed.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - seed.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return 25;
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  batches = [],
  reservoirs = [],
  alerts = [],
  harvests: propHarvests = [],
  zones = [],
  harvests = [],
  onNavigateTab,
  onSelectBatchForAI,
  onSelectBatchForHarvest,
}) => {
  const [selectedResId, setSelectedResId] = useState<string>('res-01');
  const [zoneFilter, setZoneFilter] = useState<'all' | 'growing' | 'ready_soon' | 'completed'>('all');

  // Weather state
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

  // Farm Store data
  const zones: FarmZone[] = useMemo(() => farmStore.getZones(), []);
  const harvestRecords = useMemo(() => {
    if (propHarvests && propHarvests.length > 0) return propHarvests;
    return farmStore.getHarvests();
  }, [propHarvests]);

  // Aggregated KPIs
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

  // Open Alerts sorted by severity
  const openAlerts = useMemo(() => {
    const list = alerts.filter(a => a.status === 'open' || a.status === 'acknowledged');
    const severityWeight: Record<string, number> = { emergency: 4, critical: 3, warning: 2, info: 1 };
    return [...list].sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));
  }, [alerts]);
  const primaryAlert = openAlerts[0];

  // Active Reservoir
  const currentReservoir = useMemo(() => {
    return reservoirs.find(r => r.id === selectedResId) || reservoirs[0] || {
      id: 'res-01',
      name: 'Bể Tuần Hoàn 01',
      currentPh: 5.85,
      currentEc: 1.72,
      currentWaterTemp: 22.4,
      currentDo: 6.8,
      capacityLiters: 600,
      currentVolumeLiters: 540,
    };
  }, [reservoirs, selectedResId]);

  // Filtered Zones
  const filteredZones = useMemo(() => {
    if (zoneFilter === 'all') return zones;
    return zones.filter(z => z.status === zoneFilter);
  }, [zones, zoneFilter]);

  return (
    <div className="dash-container">
      {/* ========================================================
          1. TOP BAR: Farm Overview + Live Weather Widget
          ======================================================== */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div>
            <h1 className="dash-hero-title">
              <Activity size={22} color="#00a651" />
              Tổng Quan Vận Hành NFT
            </h1>
            <div className="dash-hero-subtitle">
              6/6 giàn máng tuần hoàn • 2 trạm cấp dinh dưỡng tự động
            </div>
          </div>
        </div>

        <div className="dash-hero-badges">
          {/* Live Weather Pill */}
          <div className="dash-pill dash-pill-green">
            <MapPin size={13} color="#00a651" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="dash-weather-select"
            >
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.shortName}</option>
              ))}
            </select>
            <span style={{ fontWeight: 800 }}>
              {isWeatherLoading ? '--°C' : `${weather.temperature}°C`}
            </span>
            <span style={{ color: '#047857', opacity: 0.85 }}>({weather.weatherDescription})</span>
            <button
              onClick={() => loadWeatherForCity(selectedCityId, true)}
              disabled={isWeatherLoading}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex' }}
              title="Cập nhật thời tiết"
            >
              <RotateCw size={11} color="#00a651" style={{ animation: isWeatherLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* System Status Pill */}
          <div className="dash-pill dash-pill-blue">
            <CheckCircle2 size={13} color="#0284c7" />
            <span>NFT Sensor Link: 100% Online</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. COMPACT ALERT BANNER (Only when active alert exists)
          ======================================================== */}
      {primaryAlert && (
        <div className="dash-alert-bar" style={{
          backgroundColor: primaryAlert.severity === 'emergency' ? '#fff1f2' : primaryAlert.severity === 'critical' ? '#fef2f2' : '#fffbeb',
          borderColor: primaryAlert.severity === 'emergency' ? '#fda4af' : primaryAlert.severity === 'critical' ? '#fca5a5' : '#fde68a'
        }}>
          <div className="dash-alert-left">
            <div className="dash-alert-icon" style={{
              backgroundColor: primaryAlert.severity === 'emergency' ? '#dc2626' : primaryAlert.severity === 'critical' ? '#ef4444' : '#f59e0b'
            }}>
              <AlertTriangle size={15} />
            </div>
            <div className="dash-alert-text">
              <span>{primaryAlert.title}:</span>
              <span className="dash-alert-subtext">{primaryAlert.message}</span>
            </div>
          </div>
          <div className="dash-alert-actions">
            <button
              onClick={() => onNavigateTab(primaryAlert.metric === 'EC' || primaryAlert.metric === 'pH' ? 'reservoirs' : 'alerts')}
              className="farmvista-btn-green"
              style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px' }}
            >
              <span>Xử lý ngay</span>
              <ArrowRight size={12} />
            </button>
            <button
              onClick={() => onNavigateTab('alerts')}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              Xem ({openAlerts.length})
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          3. 4 KEY METRIC CARDS (Minimalist, Data-Dense, Scannable)
          ======================================================== */}
      <div className="dash-kpis">
        {/* Card 1: Active Plants */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Cây Đang Trồng</span>
            <div className="dash-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <Sprout size={18} />
            </div>
          </div>
          <div className="dash-kpi-value">{totalActivePlants.toLocaleString('vi-VN')}</div>
          <div className="dash-kpi-meta">
            <span>{activeBatches.length} lô máng NFT</span>
            <span className="dash-kpi-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
              {survivalRate}% sống
            </span>
          </div>
        </div>

        {/* Card 2: Harvest Yield */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Sản Lượng Đã Thu</span>
            <div className="dash-kpi-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="dash-kpi-value">{totalHarvestKg} <span style={{ fontSize: '1rem', fontWeight: 600 }}>kg</span></div>
          <div className="dash-kpi-meta">
            <span>Rau ăn lá sạch</span>
            <span className="dash-kpi-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
              Grade A 98%
            </span>
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Doanh Thu Xuất Bán</span>
            <div className="dash-kpi-icon" style={{ backgroundColor: '#fdf4ff', color: '#a855f7' }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="dash-kpi-value">
            {totalRevenue > 0 ? (totalRevenue / 1000000).toFixed(2) : '7.58'} <span style={{ fontSize: '1rem', fontWeight: 600 }}>tr ₫</span>
          </div>
          <div className="dash-kpi-meta">
            <span>Giá TB: 45k/kg</span>
            <span className="dash-kpi-badge" style={{ backgroundColor: '#fae8ff', color: '#86198f' }}>
              +12% MoM
            </span>
          </div>
        </div>

        {/* Card 4: System Health */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Tình Trạng Kỹ Thuật</span>
            <div className="dash-kpi-icon" style={{
              backgroundColor: openAlerts.length > 0 ? '#fffbeb' : '#ecfdf5',
              color: openAlerts.length > 0 ? '#d97706' : '#16a34a'
            }}>
              <Droplets size={18} />
            </div>
          </div>
          <div className="dash-kpi-value" style={{ color: openAlerts.length > 0 ? '#d97706' : '#16a34a' }}>
            {openAlerts.length > 0 ? `${openAlerts.length} Lưu ý` : 'Chuẩn NFT'}
          </div>
          <div className="dash-kpi-meta">
            <span>pH 5.8 • EC 1.7</span>
            <span className="dash-kpi-badge" style={{
              backgroundColor: openAlerts.length > 0 ? '#fef3c7' : '#dcfce7',
              color: openAlerts.length > 0 ? '#b45309' : '#15803d'
            }}>
              2/2 Bể Bơm Tốt
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. MAIN GRID: NFT Zones (7 cols) + Live Reservoir & Analytics (5 cols)
          ======================================================== */}
      <div className="dash-main-grid">
        {/* LEFT: Sơ Đồ Thực Địa Giàn NFT */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">
                <Layers size={18} color="#00a651" />
                Giàn Máng Canh Tác NFT
              </h2>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'growing', 'ready_soon', 'completed'] as const).map((filterKey) => {
                const labels: Record<string, string> = {
                  all: `Tất cả (${zones.length})`,
                  growing: `Đang trồng (${zones.filter(z => z.status === 'growing').length})`,
                  ready_soon: `Sắp thu (${zones.filter(z => z.status === 'ready_soon').length})`,
                  completed: `Xong (${zones.filter(z => z.status === 'completed').length})`
                };
                return (
                  <button
                    key={filterKey}
                    onClick={() => setZoneFilter(filterKey)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: zoneFilter === filterKey ? '#00a651' : '#e2e8f0',
                      backgroundColor: zoneFilter === filterKey ? '#ecfdf5' : '#ffffff',
                      color: zoneFilter === filterKey ? '#065f46' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {labels[filterKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zones Grid */}
          <div className="dash-zones-grid">
            {filteredZones.map((zone) => {
              const batch = batches.find(b => b.zoneId === zone.id || b.zoneCode === zone.code || b.id === zone.currentBatchId);
              const statusBadge = {
                growing: { label: 'Đang sinh trưởng', bg: '#ecfdf5', color: '#15803d' },
                ready_soon: { label: 'Sẵn sàng thu hoạch', bg: '#fef3c7', color: '#b45309' },
                completed: { label: 'Đã thu hoạch', bg: '#f0f9ff', color: '#0369a1' },
                needs_attention: { label: 'Cần bảo trì', bg: '#fef2f2', color: '#b91c1c' },
                empty: { label: 'Giàn trống', bg: '#f8fafc', color: '#64748b' }
              }[zone.status] || { label: zone.status, bg: '#f8fafc', color: '#64748b' };

              return (
                <div key={zone.id} className="dash-zone-card">
                  <div>
                    <div className="dash-zone-header">
                      <span className="dash-zone-tag" style={{ backgroundColor: zone.color || '#00a651' }}>
                        Giàn {zone.code}
                      </span>
                      <span className="dash-zone-status" style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="dash-zone-cultivar">
                      {zone.cultivarName || 'Chưa gieo'}
                    </div>

                    <div className="dash-zone-metrics">
                      <span><strong>{zone.plantQuantity || zone.slotCapacity}</strong> rọ</span>
                      <span>•</span>
                      <span>{zone.reservoirId === 'res-01' ? 'Bể 01' : 'Bể 02'}</span>
                      {batch?.batchCode && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#00a651', fontWeight: 600 }}>{batch.batchCode}</span>
                        </>
                      )}
                    </div>

                    {zone.biomassProgress !== undefined && (
                      <div className="dash-zone-progress-wrap">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '3px' }}>
                          <span>Sinh khối</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{zone.biomassProgress}%</span>
                        </div>
                        <div className="dash-zone-progress-bar">
                          <div
                            className="dash-zone-progress-fill"
                            style={{ width: `${zone.biomassProgress}%`, backgroundColor: zone.color || '#00a651' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="dash-zone-actions">
                    {batch && (
                      <button
                        onClick={() => onSelectBatchForAI(batch)}
                        className="dash-zone-btn dash-zone-btn-ai"
                        title="Dự báo năng suất bằng mô hình AI"
                      >
                        <Sparkles size={11} />
                        <span>Dự báo AI</span>
                      </button>
                    )}
                    {zone.status === 'ready_soon' ? (
                      <button
                        onClick={() => onNavigateTab('harvest')}
                        className="dash-zone-btn"
                        style={{ backgroundColor: '#f59e0b', color: '#ffffff', borderColor: '#f59e0b', fontWeight: 700 }}
                      >
                        Thu hoạch
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('batches')}
                        className="dash-zone-btn"
                      >
                        Chi tiết
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Bể Dinh Dưỡng + Biểu Đồ Năng Suất */}
        <div className="dash-right-col">
          {/* Card: Bể Dinh Dưỡng Tuần Hoàn */}
          <div className="dash-card">
            <div className="dash-card-header" style={{ marginBottom: '10px' }}>
              <h2 className="dash-card-title">
                <Droplets size={17} color="#00a651" />
                Bể Dinh Dưỡng
              </h2>
              <div className="dash-res-selector">
                <button
                  className={`dash-res-tab ${selectedResId === 'res-01' ? 'active' : ''}`}
                  onClick={() => setSelectedResId('res-01')}
                >
                  Bể 01 (Tầng 1)
                </button>
                <button
                  className={`dash-res-tab ${selectedResId === 'res-02' ? 'active' : ''}`}
                  onClick={() => setSelectedResId('res-02')}
                >
                  Bể 02 (Tầng 2)
                </button>
              </div>
            </div>

            {/* 4 Metric Boxes */}
            <div className="dash-res-metrics">
              <div className="dash-res-item">
                <div className="dash-res-item-label">pH</div>
                <div className="dash-res-item-val" style={{ color: currentReservoir.currentPh >= 5.5 && currentReservoir.currentPh <= 6.5 ? '#16a34a' : '#dc2626' }}>
                  {currentReservoir.currentPh.toFixed(2)}
                </div>
                <div className="dash-res-item-status">Mục tiêu 5.8</div>
              </div>

              <div className="dash-res-item">
                <div className="dash-res-item-label">EC (mS)</div>
                <div className="dash-res-item-val" style={{ color: currentReservoir.currentEc >= 1.4 && currentReservoir.currentEc <= 2.0 ? '#16a34a' : '#d97706' }}>
                  {currentReservoir.currentEc.toFixed(2)}
                </div>
                <div className="dash-res-item-status">Mục tiêu 1.7</div>
              </div>

              <div className="dash-res-item">
                <div className="dash-res-item-label">Nước (°C)</div>
                <div className="dash-res-item-val" style={{ color: currentReservoir.currentWaterTemp <= 24 ? '#0284c7' : '#dc2626' }}>
                  {currentReservoir.currentWaterTemp.toFixed(1)}°
                </div>
                <div className="dash-res-item-status" style={{ color: '#0284c7' }}>Mát rễ</div>
              </div>

              <div className="dash-res-item">
                <div className="dash-res-item-label">DO (mg/L)</div>
                <div className="dash-res-item-val" style={{ color: '#059669' }}>
                  {currentReservoir.currentDo || 6.8}
                </div>
                <div className="dash-res-item-status">Oxy hòa tan</div>
              </div>
            </div>

            {/* Tank Liquid Level */}
            <div className="dash-res-tank">
              <div className="dash-res-tank-header">
                <span>Mức dung dịch trong bể: <strong>{currentReservoir.currentVolumeLiters}L / {currentReservoir.capacityLiters}L</strong></span>
                <span style={{ color: '#00a651' }}>{Math.round((currentReservoir.currentVolumeLiters / currentReservoir.capacityLiters) * 100)}%</span>
              </div>
              <div className="dash-zone-progress-bar" style={{ height: '7px' }}>
                <div
                  className="dash-zone-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round((currentReservoir.currentVolumeLiters / currentReservoir.capacityLiters) * 100))}%`,
                    backgroundColor: '#00a651'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                onClick={() => onNavigateTab('reservoirs')}
                className="farmvista-btn-green"
                style={{ flex: 1, height: '32px', fontSize: '0.75rem' }}
              >
                <Droplets size={13} />
                <span>Châm Stock A & B</span>
              </button>
              <button
                onClick={() => onNavigateTab('reservoirs')}
                style={{
                  padding: '0 12px',
                  height: '32px',
                  fontSize: '0.75rem',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Chi tiết
              </button>
            </div>
          </div>

          {/* Card: Biểu Đồ Sản Lượng Xuất Bán (Sleek Area Chart) */}
          <div className="dash-card">
            <div className="dash-card-header" style={{ marginBottom: '8px' }}>
              <h2 className="dash-card-title">
                <TrendingUp size={17} color="#00a651" />
                Sản Lượng Thu Hoạch (kg)
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Năm 2024</span>
            </div>

            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_YIELD_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00a651" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00a651" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 200]} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} kg`, 'Sản lượng']}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  />
                  <Area type="monotone" dataKey="yieldKg" stroke="#00a651" strokeWidth={2.5} fillOpacity={1} fill="url(#yieldGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. BOTTOM: Bảng Các Lô Đang Sinh Trưởng (Clean & Minimalist)
          ======================================================== */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <h2 className="dash-card-title">
              <Sprout size={18} color="#00a651" />
              Lô Cây Trồng Đang Sinh Trưởng
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('batches')}
            className="farmvista-btn-green"
            style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px' }}
          >
            <span>Thêm lô</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Mã Lô & Giống</th>
                <th>Vị Trí & Bồn Cấp</th>
                <th>Số Cây</th>
                <th>Tuổi Cây & Giai Đoạn</th>
                <th>Hạn Thu Hoạch</th>
                <th style={{ textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {activeBatches.map((b) => {
                const daysRem = getDaysRemaining(b.expectedHarvestDate);
                const ageDays = getPlantAge(b.seedDate);
                const reservoirName = b.reservoirName || reservoirs.find(r => r.id === b.reservoirId)?.name || 'Bể Tuần Hoàn 01';

                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.batchCode}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.cultivarName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {b.zoneCode ? `Giàn ${b.zoneCode}` : 'Máng NFT A1'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                        <Droplets size={11} color="#0284c7" />
                        <span>{reservoirName}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#00a651' }}>
                      {b.currentQuantity || b.plantQuantity} rọ
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', marginBottom: '3px' }}>
                        {ageDays} ngày tuổi
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        display: 'inline-block'
                      }}>
                        {b.currentStage === 'seedling' ? 'Cây con' : b.currentStage === 'vegetative' ? 'Sinh dưỡng' : 'Tích lũy sinh khối'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: daysRem.isPast ? '#fee2e2' : daysRem.days <= 3 ? '#fffbeb' : '#ecfdf5',
                        color: daysRem.isPast ? '#b91c1c' : daysRem.days <= 3 ? '#b45309' : '#16a34a',
                        border: `1px solid ${daysRem.isPast ? '#fecaca' : daysRem.days <= 3 ? '#fef3c7' : '#bbf7d0'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        <Clock size={11} />
                        {daysRem.text}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onSelectBatchForAI(b)}
                          className="dash-zone-btn dash-zone-btn-ai"
                          style={{ padding: '4px 8px', display: 'inline-flex', width: 'auto', fontSize: '0.72rem' }}
                          title="Chạy mô hình dự báo năng suất AI"
                        >
                          <Sparkles size={11} />
                          <span>Dự báo AI</span>
                        </button>
                        <button
                          onClick={() => onSelectBatchForHarvest ? onSelectBatchForHarvest(b) : onNavigateTab('harvest')}
                          className="dash-zone-btn"
                          style={{
                            padding: '4px 8px',
                            display: 'inline-flex',
                            width: 'auto',
                            fontSize: '0.72rem',
                            backgroundColor: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Ghi nhận thu hoạch cho lô này"
                        >
                          <Scale size={11} />
                          <span>Thu hoạch</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
