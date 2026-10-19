import React, { useState } from 'react';
import { 
  Plus, 
  Droplets,
  CheckCircle2,
  AlertCircle,
  Layers,
  History,
  FlaskConical,
  X,
  Zap,
  Search,
  ArrowUpDown,
  Activity,
  Calendar,
  Sprout,
  Shield
} from 'lucide-react';
import { detectReservoirAnomalyRemote, type AnomalyDetectionResult } from '../services/aiPredictor';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { Reservoir, NutrientFormula, Channel, SolutionDrainEvent, CropBatch } from '../types/farm';
import './ReservoirsView.css';

interface ReservoirsViewProps {
  reservoirs: Reservoir[];
  formulas: NutrientFormula[];
  channels: Channel[];
  batches: CropBatch[];
  drainEvents: SolutionDrainEvent[];
  onAddMeasurement: (data: { reservoirId: string; ph: number; ec: number; waterTemp: number; doLevel?: number; waterLevelPercent?: number }) => void;
  onUpdateVolume: (reservoirId: string, addedLiters: number) => void;
  onDrainReservoir: (event: Omit<SolutionDrainEvent, 'id'>) => void;
  onApplyDosing?: (reservoirId: string, targetEc: number, doseMl: number) => void;
}

// 7-day trend mock data for sensor chart
const SENSOR_TREND_DATA = [
  { day: '04/10', ec1: 1.82, ph1: 5.82, ec2: 1.88, ph2: 5.98 },
  { day: '05/10', ec1: 1.78, ph1: 5.84, ec2: 1.85, ph2: 6.00 },
  { day: '06/10', ec1: 1.74, ph1: 5.87, ec2: 1.82, ph2: 6.02 },
  { day: '07/10', ec1: 1.68, ph1: 5.92, ec2: 1.79, ph2: 6.05 },
  { day: '08/10', ec1: 1.64, ph1: 5.95, ec2: 1.76, ph2: 6.08 },
  { day: '09/10', ec1: 1.76, ph1: 5.85, ec2: 1.84, ph2: 6.01 },
  { day: '10/10', ec1: 1.72, ph1: 5.85, ec2: 1.84, ph2: 6.02 }
];

export const ReservoirsView: React.FC<ReservoirsViewProps> = ({
  reservoirs,
  formulas = [],
  channels = [],
  batches = [],
  drainEvents = [],
  onAddMeasurement,
  onUpdateVolume,
  onDrainReservoir,
  onApplyDosing
}) => {
  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState<'all' | 'res-01' | 'res-02' | 'needs-dosing' | 'optimal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [selectedChartTank, setSelectedChartTank] = useState<'res-01' | 'res-02'>('res-01');

  // Modal states
  const [activeModalResId, setActiveModalResId] = useState<string>(reservoirs[0]?.id || 'res-01');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isDrainModalOpen, setIsDrainModalOpen] = useState(false);
  const [isDrainHistoryModalOpen, setIsDrainHistoryModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  // Per-reservoir Target EC state
  const defaultFormula = formulas[0];
  const [targetEcs, setTargetEcs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    reservoirs.forEach(r => {
      init[r.id] = r.currentEc < 1.7 ? 1.75 : r.currentEc;
    });
    return init;
  });

  // Success toast message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const activeModalRes = reservoirs.find(r => r.id === activeModalResId) || reservoirs[0];
  const [formPh, setFormPh] = useState(5.85);
  const [formEc, setFormEc] = useState(1.72);
  const [formTemp, setFormTemp] = useState(22.4);
  const [formDo, setFormDo] = useState(6.8);
  const [formWaterLevel, setFormWaterLevel] = useState(90);
  const [topUpLiters, setTopUpLiters] = useState(50);
  const [drainReason, setDrainReason] = useState<SolutionDrainEvent['reason']>('end_of_batch');
  const [drainOperator, setDrainOperator] = useState('Kỹ thuật viên trang trại');
  const [drainNotes, setDrainNotes] = useState('');

  // Top KPI calculations
  const totalCurrentVolume = reservoirs.reduce((sum, r) => sum + r.currentVolumeLiters, 0);
  const totalCapacity = reservoirs.reduce((sum, r) => sum + r.capacityLiters, 0);
  const volumePercent = totalCapacity > 0 ? Math.round((totalCurrentVolume / totalCapacity) * 100) : 0;
  
  const avgEc = reservoirs.length > 0 
    ? (reservoirs.reduce((sum, r) => sum + r.currentEc, 0) / reservoirs.length).toFixed(2) 
    : '1.75';
    
  const avgPh = reservoirs.length > 0 
    ? (reservoirs.reduce((sum, r) => sum + r.currentPh, 0) / reservoirs.length).toFixed(2) 
    : '5.85';

  const runningPumpsCount = reservoirs.filter(r => r.pumpStatus === 'running').length;
  const activeAeratorsCount = reservoirs.filter(r => r.aerationStatus === 'active').length;
  const totalActiveDevices = runningPumpsCount + activeAeratorsCount;
  const maxDevices = reservoirs.length * 2;

  // Modals actions
  const openLogModal = (res: Reservoir) => {
    setActiveModalResId(res.id);
    setFormPh(res.currentPh);
    setFormEc(res.currentEc);
    setFormTemp(res.currentWaterTemp);
    setFormDo(res.currentDo ?? 6.8);
    const lvl = res.currentWaterLevelPercent ?? (res.capacityLiters > 0 ? Math.round((res.currentVolumeLiters / res.capacityLiters) * 100) : 90);
    setFormWaterLevel(lvl);
    setIsLogModalOpen(true);
  };

  const openTopUpModal = (res: Reservoir) => {
    setActiveModalResId(res.id);
    setTopUpLiters(50);
    setIsTopUpModalOpen(true);
  };

  const openDrainModal = (res: Reservoir) => {
    setActiveModalResId(res.id);
    setDrainNotes('');
    setIsDrainModalOpen(true);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMeasurement({
      reservoirId: activeModalResId,
      ph: parseFloat(String(formPh)),
      ec: parseFloat(String(formEc)),
      waterTemp: parseFloat(String(formTemp)),
      doLevel: parseFloat(String(formDo)),
      waterLevelPercent: parseFloat(String(formWaterLevel))
    });
    setIsLogModalOpen(false);
    showNotice(`Đã cập nhật số đo mới cho ${activeModalRes?.name.split('-')[0].trim() || 'Bể'}`);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVolume(activeModalResId, Number(topUpLiters));
    setIsTopUpModalOpen(false);
    showNotice(`Đã bù ${topUpLiters}L nước sạch vào ${activeModalRes?.name.split('-')[0].trim() || 'Bể'}`);
  };

  const handleDrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalRes) return;
    onDrainReservoir({
      reservoirId: activeModalResId,
      drainDate: new Date().toISOString().split('T')[0],
      volumeDrainedLiters: activeModalRes.currentVolumeLiters,
      finalPh: activeModalRes.currentPh,
      finalEc: activeModalRes.currentEc,
      finalDo: activeModalRes.currentDo ?? 6.5,
      reason: drainReason,
      operator: drainOperator,
      notes: drainNotes
    });
    setIsDrainModalOpen(false);
    showNotice(`Đã ghi nhận xả bể ${activeModalRes.name.split('-')[0].trim()}`);
  };

  const [anomalyMap, setAnomalyMap] = useState<Record<string, AnomalyDetectionResult>>({});
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);

  const showNotice = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4500);
  };

  const handleScanAiAnomaly = async (res: Reservoir) => {
    try {
      const result = await detectReservoirAnomalyRemote({
        reservoirId: res.id,
        reservoirName: res.name,
        avgPh: res.currentPh,
        avgEc: res.currentEc,
        avgWaterTemp: res.currentWaterTemp
      });
      setAnomalyMap(prev => ({ ...prev, [res.id]: result }));
      const shortName = res.name.split('-')[0].trim();
      if (result.isAnomaly) {
        showNotice(`🚨 AI Phát hiện bất thường tại ${shortName}: ${result.riskFactors.join('. ')}`);
      } else {
        showNotice(`✅ AI Giám Sát: Các chỉ số của ${shortName} an toàn (Isolation Forest).`);
      }
      return result;
    } catch (err: any) {
      showNotice('Không thể quét AI lúc này: ' + err.message);
      return null;
    }
  };

  const handleApplyDosingForTank = (res: Reservoir, targetEc: number, doseMl: number) => {
    if (onApplyDosing && doseMl > 0) {
      onApplyDosing(res.id, targetEc, doseMl);
      const shortName = res.name.split('-')[0].trim();
      showNotice(`Đã châm ${doseMl}ml Can A & B vào ${shortName}. Nồng độ EC đạt ${targetEc} mS/cm.`);
    }
  };

  // Filtered Reservoirs
  const filteredReservoirs = reservoirs.filter(res => {
    if (activeTab === 'res-01' && res.id !== 'res-01') return false;
    if (activeTab === 'res-02' && res.id !== 'res-02') return false;
    
    const curTarget = targetEcs[res.id] ?? (res.currentEc < 1.7 ? 1.75 : res.currentEc);
    const isDeficit = curTarget > res.currentEc;
    if (activeTab === 'needs-dosing' && !isDeficit) return false;
    if (activeTab === 'optimal' && isDeficit) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = res.name.toLowerCase().includes(q);
      const matchForm = res.formulaName?.toLowerCase().includes(q);
      if (!matchName && !matchForm) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortOption === 'volume') return b.currentVolumeLiters - a.currentVolumeLiters;
    if (sortOption === 'ec') return b.currentEc - a.currentEc;
    if (sortOption === 'ph') return b.currentPh - a.currentPh;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="res-container">
      
      {/* ========================================================
          1. PAGE HEADER: Title, Subtitle & Action Buttons
          ======================================================== */}
      <div className="res-header">
        <div className="res-header-left">
          <div>
            <h1 className="res-title">
              <Droplets size={22} color="#00a651" />
              Bể Dinh Dưỡng & Tuần Hoàn NFT
            </h1>
            <div className="res-subtitle">
              Giám sát pH, EC, nhiệt độ & mực nước 2 trạm bồn tuần hoàn
            </div>
          </div>
        </div>

        <div className="res-header-actions">
          <button
            onClick={() => setIsFormulaModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
          >
            <FlaskConical size={14} color="#00a651" />
            <span>Công thức kho</span>
          </button>

          <button
            onClick={() => setIsDrainHistoryModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
          >
            <History size={14} color="#64748b" />
            <span>Nhật ký xả ({drainEvents.length})</span>
          </button>

          <button
            onClick={async () => {
              setIsScanningAi(true);
              for (const r of reservoirs) {
                await handleScanAiAnomaly(r);
              }
              setIsScanningAi(false);
            }}
            className="farmvista-btn-secondary"
            style={{
              height: '38px',
              padding: '0 14px',
              fontSize: '0.8125rem',
              borderColor: '#38bdf8',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              fontWeight: 700
            }}
          >
            <Shield size={15} color="#0284c7" />
            <span>{isScanningAi ? 'Đang Quét AI...' : 'Quét Bất Thường AI'}</span>
          </button>

          <button
            onClick={() => openLogModal(reservoirs[0] || activeModalRes)}
            className="farmvista-btn-green"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 14px' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Ghi Số Đo</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#065f46',
          fontSize: '0.8125rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================
          2. TOP KPI CARDS (4 Sleek Metric Cards)
          ======================================================== */}
      <div className="res-kpis">
        {/* Metric 1: Total Water Volume */}
        <div className="res-kpi-card">
          <div className="res-kpi-top">
            <span className="res-kpi-label">Tổng Thể Tích Nước</span>
            <div className="res-kpi-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Droplets size={17} />
            </div>
          </div>
          <div className="res-kpi-val">
            {totalCurrentVolume} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>/ {totalCapacity}L</span>
          </div>
          <div className="res-kpi-meta">
            <span>Tuần hoàn giàn NFT</span>
            <span className="res-kpi-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
              {volumePercent}% dung tích
            </span>
          </div>
        </div>

        {/* Metric 2: Average EC */}
        <div className="res-kpi-card">
          <div className="res-kpi-top">
            <span className="res-kpi-label">EC Trung Bình</span>
            <div className="res-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <Zap size={17} />
            </div>
          </div>
          <div className="res-kpi-val">
            {avgEc} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>mS/cm</span>
          </div>
          <div className="res-kpi-meta">
            <span>Chuẩn: 1.5 - 1.9</span>
            <span className="res-kpi-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
              Ổn định
            </span>
          </div>
        </div>

        {/* Metric 3: Average pH */}
        <div className="res-kpi-card">
          <div className="res-kpi-top">
            <span className="res-kpi-label">pH Trung Bình</span>
            <div className="res-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <FlaskConical size={17} />
            </div>
          </div>
          <div className="res-kpi-val">
            {avgPh} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>pH</span>
          </div>
          <div className="res-kpi-meta">
            <span>Chuẩn: 5.6 - 6.2</span>
            <span className="res-kpi-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
              Hấp thụ tối đa
            </span>
          </div>
        </div>

        {/* Metric 4: Devices Status */}
        <div className="res-kpi-card">
          <div className="res-kpi-top">
            <span className="res-kpi-label">Bơm & Sục Khí</span>
            <div className="res-kpi-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <Activity size={17} />
            </div>
          </div>
          <div className="res-kpi-val">
            {totalActiveDevices}/{maxDevices} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>ON</span>
          </div>
          <div className="res-kpi-meta">
            <span>2 Bơm • 2 Sục oxy</span>
            <span className="res-kpi-badge" style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}>
              100% Online
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. FILTER TABS & SEARCH TOOLBAR
          ======================================================== */}
      <div className="res-toolbar">
        <div className="res-filters">
          {[
            { id: 'all', label: `Tất cả (${reservoirs.length})` },
            { id: 'res-01', label: 'Bể 01 (Tầng 1)' },
            { id: 'res-02', label: 'Bể 02 (Tầng 2)' },
            { id: 'needs-dosing', label: 'Cần bù dinh dưỡng' },
            { id: 'optimal', label: 'Đạt chuẩn' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`res-filter-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="res-search-box">
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm kiếm bồn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="res-search-input"
            />
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ArrowUpDown size={12} color="#64748b" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="farmvista-select-pill"
              style={{ height: '34px', paddingLeft: '28px', fontSize: '0.75rem' }}
            >
              <option value="default">Sắp xếp</option>
              <option value="volume">Mực nước</option>
              <option value="ec">Nồng độ EC</option>
              <option value="ph">Độ pH</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. MAIN SECTION: RESERVOIR HARDWARE CARDS
          ======================================================== */}
      <div className="res-grid">
        {filteredReservoirs.map((res) => {
          const shortName = res.name.split('-')[0].trim();
          const subTitle = res.name.split('-')[1]?.trim() || 'Giàn NFT';
          const fillPercent = Math.round((res.currentVolumeLiters / res.capacityLiters) * 100);

          // Target EC & Deficit calculation
          const currentTargetEc = targetEcs[res.id] ?? (res.currentEc < 1.7 ? 1.75 : res.currentEc);
          const ecDeficit = Math.max(0, parseFloat((currentTargetEc - res.currentEc).toFixed(2)));
          const doseMl = Math.round((ecDeficit / 0.10) * 10 * (res.currentVolumeLiters / 100));

          // Channels & batches connected
          const resChans = channels.filter(c => c.reservoirId === res.id);
          const totalActivePlants = resChans.reduce((sum, c) => sum + c.activePlants, 0);
          const resBatches = batches.filter(b => b.reservoirId === res.id && b.status === 'active');

          // Status checks
          const isPhOk = res.currentPh >= 5.6 && res.currentPh <= 6.2;
          const isEcOk = res.currentEc >= 1.5 && res.currentEc <= 1.85;
          const isTempOk = res.currentWaterTemp >= 19 && res.currentWaterTemp <= 24;

          return (
            <div key={res.id} className="res-card">
              {/* Header */}
              <div className="res-card-top">
                <div>
                  <div className="res-card-title-group">
                    <span className="res-card-dot" />
                    <h3 className="res-card-title">{shortName}</h3>
                  </div>
                  <div className="res-card-sub">
                    {subTitle} • {resChans.length} máng ({totalActivePlants} rọ NFT)
                  </div>
                </div>

                <div className="res-card-actions">
                  <button
                    onClick={() => openTopUpModal(res)}
                    className="res-btn-action farmvista-btn-secondary"
                  >
                    + Bù nước
                  </button>
                  <button
                    onClick={() => openDrainModal(res)}
                    className="res-btn-action farmvista-btn-danger"
                  >
                    Xả bể
                  </button>
                  <button
                    onClick={() => handleScanAiAnomaly(res)}
                    className="farmvista-btn-secondary"
                    style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem', borderColor: '#38bdf8', color: '#0284c7', fontWeight: 600 }}
                    title="Quét bất thường bằng mô hình Isolation Forest"
                  >
                    <Shield size={13} color="#0284c7" />
                    <span>Quét AI</span>
                  </button>
                  <button
                    onClick={() => openLogModal(res)}
                    className="res-btn-action farmvista-btn-green"
                  >
                    <Plus size={13} />
                    <span>Ghi số đo</span>
                  </button>
                </div>
              </div>

              {/* Tank Water Level & Equipment */}
              <div className="res-tank-block">
                <div className="res-tank-head">
                  <span>Dung tích nước: <strong>{res.currentVolumeLiters}L / {res.capacityLiters}L</strong></span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{fillPercent}%</span>
                </div>

                <div className="res-tank-bar">
                  <div
                    className="res-tank-fill"
                    style={{
                      width: `${fillPercent}%`,
                      background: fillPercent > 50 ? 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)' : '#f59e0b'
                    }}
                  />
                </div>

                <div className="res-tank-status">
                  <span>Bơm: <strong style={{ color: res.pumpStatus === 'running' ? '#16a34a' : '#64748b' }}>{res.pumpStatus === 'running' ? '● Chạy' : '○ Dừng'}</strong></span>
                  <span>Sục khí: <strong style={{ color: res.aerationStatus === 'active' ? '#16a34a' : '#64748b' }}>{res.aerationStatus === 'active' ? '● Bật' : '○ Tắt'}</strong></span>
                  <span style={{ color: '#94a3b8' }}>Cập nhật: {res.lastTopUpDate || 'Hôm nay'}</span>
                </div>
              </div>

              {/* AI Isolation Forest Monitor Banner */}
              {anomalyMap[res.id] && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backgroundColor: anomalyMap[res.id].isAnomaly ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${anomalyMap[res.id].isAnomaly ? '#fecaca' : '#bbf7d0'}`,
                  fontSize: '0.8rem',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={15} color={anomalyMap[res.id].isAnomaly ? '#dc2626' : '#16a34a'} />
                    <span style={{ fontWeight: 700, color: anomalyMap[res.id].isAnomaly ? '#991b1b' : '#166534' }}>
                      {anomalyMap[res.id].isAnomaly
                        ? `🚨 Cảnh báo AI: ${anomalyMap[res.id].riskFactors.join('. ')}`
                        : '✅ AI Giám Sát: Môi trường an toàn (Mô hình Isolation Forest)'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    Score: {anomalyMap[res.id].anomalyScore}
                  </span>
                </div>
              )}

              {/* 4 Sensor Metric Tiles */}
              <div className="res-sensors-grid">
                <div className="res-sensor-tile">
                  <div className="res-sensor-label">pH</div>
                  <div className="res-sensor-val" style={{ color: isPhOk ? '#16a34a' : '#d97706' }}>
                    {res.currentPh.toFixed(2)}
                  </div>
                  <span className="res-sensor-pill" style={{ backgroundColor: isPhOk ? '#dcfce7' : '#fef3c7', color: isPhOk ? '#15803d' : '#b45309' }}>
                    {isPhOk ? 'Tối ưu' : 'Cần chỉnh'}
                  </span>
                </div>

                <div className="res-sensor-tile">
                  <div className="res-sensor-label">EC (mS)</div>
                  <div className="res-sensor-val" style={{ color: '#00a651' }}>
                    {res.currentEc.toFixed(2)}
                  </div>
                  <span className="res-sensor-pill" style={{ backgroundColor: isEcOk ? '#dcfce7' : '#fee2e2', color: isEcOk ? '#15803d' : '#b91c1c' }}>
                    {isEcOk ? 'Chuẩn' : res.currentEc < 1.5 ? 'Thiếu phân' : 'Đậm phân'}
                  </span>
                </div>

                <div className="res-sensor-tile">
                  <div className="res-sensor-label">Nhiệt nước</div>
                  <div className="res-sensor-val" style={{ color: isTempOk ? '#0284c7' : '#dc2626' }}>
                    {res.currentWaterTemp.toFixed(1)}°
                  </div>
                  <span className="res-sensor-pill" style={{ backgroundColor: isTempOk ? '#e0f2fe' : '#fee2e2', color: isTempOk ? '#0369a1' : '#b91c1c' }}>
                    {isTempOk ? 'Mát rễ' : 'Ấm'}
                  </span>
                </div>

                <div className="res-sensor-tile">
                  <div className="res-sensor-label">Oxy DO</div>
                  <div className="res-sensor-val" style={{ color: '#059669' }}>
                    {(res.currentDo ?? 6.8).toFixed(1)}
                  </div>
                  <span className="res-sensor-pill" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                    Bão hòa
                  </span>
                </div>
              </div>

              {/* Dosing Calculator */}
              <div className="res-dosing-box">
                <div className="res-dosing-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                    <Zap size={15} color="#00a651" />
                    <span>Bù Dinh Dưỡng Tuần Hoàn</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Mục tiêu:</span>
                    <div className="res-target-control">
                      <button
                        type="button"
                        onClick={() => setTargetEcs(prev => ({ ...prev, [res.id]: Math.max(1.0, parseFloat((currentTargetEc - 0.05).toFixed(2))) }))}
                        className="res-target-btn"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        min="1.0"
                        max="2.5"
                        value={currentTargetEc}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setTargetEcs(prev => ({ ...prev, [res.id]: val }));
                        }}
                        className="clean-number"
                        style={{
                          width: '42px',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          color: '#00a651',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setTargetEcs(prev => ({ ...prev, [res.id]: Math.min(2.5, parseFloat((currentTargetEc + 0.05).toFixed(2))) }))}
                        className="res-target-btn"
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>mS</span>
                  </div>
                </div>

                {ecDeficit > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="res-dosing-bottles">
                      <div className="res-bottle-card" style={{ border: '1px solid #fef3c7' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Can A (Canxi/Sắt)</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309' }}>
                            {doseMl} <span style={{ fontSize: '0.75rem' }}>ml</span>
                          </div>
                        </div>
                        <FlaskConical size={16} color="#b45309" />
                      </div>

                      <div className="res-bottle-card" style={{ border: '1px solid #e0f2fe' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Can B (Lân/Khoáng)</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369a1' }}>
                            {doseMl} <span style={{ fontSize: '0.75rem' }}>ml</span>
                          </div>
                        </div>
                        <FlaskConical size={16} color="#0369a1" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyDosingForTank(res, currentTargetEc, doseMl)}
                      className="farmvista-btn-green"
                      style={{ width: '100%', height: '34px', justifyContent: 'center', fontSize: '0.8125rem' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Châm {doseMl}ml Can A & B</span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#15803d',
                    backgroundColor: '#dcfce7',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span>Nồng độ EC đạt chuẩn ({res.currentEc} mS/cm). Chưa cần châm thêm.</span>
                  </div>
                )}
              </div>

              {/* Connected Batches */}
              <div className="res-batches-block">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                    <Sprout size={14} />
                    <span>Lô Canh Tác Cấp Dinh Dưỡng ({resBatches.length})</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resBatches.length > 0 ? (
                    resBatches.map(b => (
                      <div key={b.id} className="res-batch-row">
                        <div>
                          <strong style={{ color: '#0f172a' }}>{b.cultivarName}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>({b.batchCode})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#00a651', fontWeight: 600 }}>
                            EC: {b.cultivarName.includes('Oak') ? '1.4 - 1.9' : '1.5 - 2.0'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const target = b.cultivarName.includes('Romaine') ? 1.85 : 1.75;
                              setTargetEcs(prev => ({ ...prev, [res.id]: target }));
                            }}
                            style={{
                              padding: '2px 6px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              borderRadius: '4px',
                              border: '1px solid #86efac',
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              cursor: 'pointer'
                            }}
                          >
                            Áp chuẩn
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa có lô cây trồng liên kết
                    </div>
                  )}
                </div>
              </div>

              {/* Channels List */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={13} color="#94a3b8" />
                  <span>{resChans.map(c => c.name).join(', ')}</span>
                </div>
                <strong style={{ color: '#00a651' }}>{totalActivePlants} rọ</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          5. BOTTOM GRID: 7-Day Trend Chart + Standard Formulation
          ======================================================== */}
      <div className="res-bottom-grid">
        {/* Left: Trend Chart */}
        <div className="farmvista-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Biến Thiên EC & pH 7 Ngày Gần Nhất
              </h3>
            </div>

            <select
              value={selectedChartTank}
              onChange={e => setSelectedChartTank(e.target.value as any)}
              className="farmvista-select-pill"
              style={{ borderRadius: '8px', height: '30px', fontSize: '0.75rem' }}
            >
              <option value="res-01">Bể 01 (Tầng 1)</option>
              <option value="res-02">Bể 02 (Tầng 2)</option>
            </select>
          </div>

          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SENSOR_TREND_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="ecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a651" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00a651" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={[1.4, 2.2]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[5.0, 7.0]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '11px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey={selectedChartTank === 'res-02' ? 'ec2' : 'ec1'} 
                  name="EC (mS/cm)" 
                  stroke="#00a651" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#ecGrad)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey={selectedChartTank === 'res-02' ? 'ph2' : 'ph1'} 
                  name="pH" 
                  stroke="#0284c7" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#phGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Salt composition */}
        <div className="farmvista-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Công Thức Hoagland & Resh Chuẩn
              </h3>
              <span style={{ fontSize: '0.7rem', backgroundColor: '#e8f8f0', color: '#00a651', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                1:100 Stock
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#92400e' }}>Can A • Canxi Nitrat</span>
                <strong style={{ color: '#b45309' }}>1,000g / 10L</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#e0f2fe', borderRadius: '6px', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#075985' }}>Can B • Magie Sulfat</span>
                <strong style={{ color: '#0284c7' }}>550g / 10L</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Can B • Monopotassium Phosphate (MKP)</span>
                <strong>250g / 10L</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Can A • Sắt Chelate Fe-EDDHA (6%)</span>
                <strong style={{ color: '#00a651' }}>40g / 10L</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsFormulaModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ width: '100%', height: '32px', justifyContent: 'center', marginTop: '12px', fontSize: '0.78rem' }}
          >
            <FlaskConical size={13} color="#00a651" />
            <span>Xem Chi Tiết Định Lượng Muối Khoáng</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          6. MODALS
          ======================================================== */}

      {/* Modal 1: Ghi nhận số đo mới */}
      {isLogModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Ghi Số Đo Mới: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button 
                onClick={() => setIsLogModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Độ pH (Chuẩn: 5.6 - 6.2)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="4.0"
                    max="9.0"
                    className="form-input clean-number" 
                    value={formPh} 
                    onChange={e => setFormPh(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Nồng độ EC (mS/cm - Chuẩn: 1.5 - 1.9)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.5"
                    max="3.5"
                    className="form-input clean-number" 
                    value={formEc} 
                    onChange={e => setFormEc(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Nhiệt độ nước (°C - Chuẩn: 20 - 24°C)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="15.0"
                    max="35.0"
                    className="form-input clean-number" 
                    value={formTemp} 
                    onChange={e => setFormTemp(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Oxy hòa tan DO (mg/L - Chuẩn: 6.0 - 8.0)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="2.0"
                    max="12.0"
                    className="form-input clean-number" 
                    value={formDo} 
                    onChange={e => setFormDo(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Mực nước (% dung tích bể)</label>
                  <input 
                    type="number" 
                    step="1"
                    min="0"
                    max="100"
                    className="form-input clean-number" 
                    value={formWaterLevel} 
                    onChange={e => setFormWaterLevel(parseFloat(e.target.value))} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '34px', padding: '0 14px' }}>
                  Hủy
                </button>
                <button type="submit" className="farmvista-btn-green" style={{ height: '34px', padding: '0 16px' }}>
                  Lưu số đo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bù nước sạch */}
      {isTopUpModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Bù Nước Sạch: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button 
                onClick={() => setIsTopUpModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Số lít nước châm thêm (Lít)</label>
                  <input 
                    type="number" 
                    min="10"
                    max="500"
                    className="form-input clean-number" 
                    value={topUpLiters} 
                    onChange={e => setTopUpLiters(Number(e.target.value))} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {[20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpLiters(amt)}
                      style={{
                        flex: 1,
                        height: '32px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: topUpLiters === amt ? '1px solid #00a651' : '1px solid var(--border-medium)',
                        backgroundColor: topUpLiters === amt ? '#e8f8f0' : '#ffffff',
                        color: topUpLiters === amt ? '#00a651' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      +{amt}L
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsTopUpModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '34px', padding: '0 14px' }}>
                  Hủy
                </button>
                <button type="submit" className="farmvista-btn-green" style={{ height: '34px', padding: '0 16px' }}>
                  Xác nhận bù nước
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Xả bể */}
      {isDrainModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>
                Xác Nhận Xả Bể: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button 
                onClick={() => setIsDrainModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleDrainSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 12px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.78rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>Xả toàn bộ <strong>{activeModalRes?.currentVolumeLiters}L</strong> nước dinh dưỡng hiện tại.</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Lý do xả</label>
                  <select 
                    className="form-select" 
                    value={drainReason} 
                    onChange={e => setDrainReason(e.target.value as any)}
                  >
                    <option value="end_of_batch">Kết thúc đợt trồng</option>
                    <option value="scheduled_replacement">Thay nước định kỳ</option>
                    <option value="contamination">Vệ sinh / Xử lý bể</option>
                    <option value="other">Lý do khác</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Người thực hiện</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={drainOperator} 
                    onChange={e => setDrainOperator(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Ghi chú kỹ thuật</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={drainNotes} 
                    onChange={e => setDrainNotes(e.target.value)} 
                    placeholder="Vệ sinh bồn trước khi pha dung dịch mới."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsDrainModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '34px', padding: '0 14px' }}>
                  Hủy
                </button>
                <button type="submit" className="farmvista-btn-danger" style={{ height: '34px', padding: '0 16px' }}>
                  Xác nhận xả bể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Lịch sử xả nước */}
      {isDrainHistoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="#00a651" />
                <span>Nhật Ký Xả & Thay Nước</span>
              </h3>
              <button 
                onClick={() => setIsDrainHistoryModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {drainEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.8125rem' }}>
                  Chưa có lần xả nước nào được ghi nhận.
                </div>
              ) : (
                drainEvents.map(ev => {
                  const res = reservoirs.find(r => r.id === ev.reservoirId);
                  return (
                    <div key={ev.id} style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '8px', padding: '12px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>{res?.name.split('-')[0].trim() || 'Bể'} • Xả {ev.volumeDrainedLiters}L</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} />
                          {ev.drainDate}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', color: '#475569', fontSize: '0.75rem' }}>
                        <span>pH: <strong>{ev.finalPh}</strong></span>
                        <span>EC: <strong style={{ color: '#00a651' }}>{ev.finalEc} mS</strong></span>
                        <span>KTV: <strong>{ev.operator}</strong></span>
                      </div>
                      {ev.notes && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                          Ghi chú: {ev.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsDrainHistoryModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '34px', padding: '0 16px' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Công thức pha can 10L tại kho */}
      {isFormulaModalOpen && defaultFormula && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={16} color="#00a651" />
                <span>Công Thức Pha Can 10L Tại Kho (Stock)</span>
              </h3>
              <button 
                onClick={() => setIsFormulaModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '6px', color: '#166534' }}>
                {defaultFormula.scientificStandard} • Tỷ lệ pha 1:100 (10ml Can A + 10ml Can B trên 1L nước sạch).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Can A */}
                <div style={{ border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', backgroundColor: '#fffbeb' }}>
                  <strong style={{ color: '#b45309', display: 'block', marginBottom: '8px', fontSize: '0.8125rem' }}>
                    Can A (10 Lít mẹ)
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {defaultFormula.stockAItems?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{it.name}</span>
                        <strong style={{ color: '#b45309' }}>{it.gramsPer10LStock}g</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Can B */}
                <div style={{ border: '1px solid #e0f2fe', borderRadius: '8px', padding: '12px', backgroundColor: '#f0f9ff' }}>
                  <strong style={{ color: '#0369a1', display: 'block', marginBottom: '8px', fontSize: '0.8125rem' }}>
                    Can B (10 Lít mẹ)
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {defaultFormula.stockBItems?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{it.name}</span>
                        <strong style={{ color: '#0369a1' }}>{it.gramsPer10LStock}g</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <strong>Lưu ý:</strong> {defaultFormula.chemicalIncompatibilityReason}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsFormulaModalOpen(false)} className="farmvista-btn-green" style={{ height: '34px', padding: '0 18px' }}>
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReservoirsView;
