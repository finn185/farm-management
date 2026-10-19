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
  Sprout
} from 'lucide-react';
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
  { day: '04/09', ec1: 1.82, ph1: 5.82, ec2: 1.88, ph2: 5.98 },
  { day: '05/09', ec1: 1.78, ph1: 5.84, ec2: 1.85, ph2: 6.00 },
  { day: '06/09', ec1: 1.74, ph1: 5.87, ec2: 1.82, ph2: 6.02 },
  { day: '07/09', ec1: 1.68, ph1: 5.92, ec2: 1.79, ph2: 6.05 },
  { day: '08/09', ec1: 1.64, ph1: 5.95, ec2: 1.76, ph2: 6.08 },
  { day: '09/09', ec1: 1.76, ph1: 5.85, ec2: 1.84, ph2: 6.01 }, // After dosing
  { day: '10/09', ec1: 1.72, ph1: 5.85, ec2: 1.84, ph2: 6.02 }
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
  const [selectedChartTank, setSelectedChartTank] = useState<'all' | 'res-01' | 'res-02'>('res-01');

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

  const showNotice = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4500);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* ========================================================
          1. PAGE HEADER: Title, Subtitle & Action Buttons
          ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em', margin: 0 }}>
            Quản Lý Bể & Dinh Dưỡng Thủy Canh
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', margin: '4px 0 0 0' }}>
            Giám sát nồng độ pH, EC, nhiệt độ nước tuần hoàn, mực nước và tự động tính toán bù dinh dưỡng Can A & B.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsFormulaModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ height: '38px', padding: '0 14px', fontSize: '0.8125rem' }}
          >
            <FlaskConical size={15} color="#00a651" />
            <span>Công thức pha kho</span>
          </button>

          <button
            onClick={() => setIsDrainHistoryModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ height: '38px', padding: '0 14px', fontSize: '0.8125rem' }}
          >
            <History size={15} color="var(--text-subtle)" />
            <span>Nhật ký xả nước ({drainEvents.length})</span>
          </button>

          <button
            onClick={() => openLogModal(reservoirs[0] || activeModalRes)}
            className="farmvista-btn-green"
            style={{ height: '38px', padding: '0 16px', fontSize: '0.8125rem' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Ghi Số Đo Mới</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#15803d',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.08)'
        }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================
          2. TOP KPI CARDS (4 Cards in a Row - FarmVista Style)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        
        {/* Metric 1: Total Water Volume */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
            <Droplets size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Tổng Dung Tích Nước</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalCurrentVolume} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {totalCapacity}L</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
              ↑ {volumePercent}% dung tích tuần hoàn
            </div>
          </div>
        </div>

        {/* Metric 2: Average EC */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Nồng Độ EC Trung Bình</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {avgEc} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>mS/cm</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              Tối ưu cho xà lách (1.5 - 1.9)
            </div>
          </div>
        </div>

        {/* Metric 3: Average pH */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
            <FlaskConical size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Độ pH Trung Bình</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {avgPh} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>pH</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              Hấp thụ tối đa (5.6 - 6.2)
            </div>
          </div>
        </div>

        {/* Metric 4: Devices Status */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Thiết Bị Vận Hành</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalActiveDevices} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {maxDevices} ON</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              100% Bơm & Sục khí hoạt động
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. FILTER TABS & SEARCH TOOLBAR
          ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        {/* Left Filter Pill Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả bồn (${reservoirs.length})` },
            { id: 'res-01', label: 'Bể Tuần Hoàn 01' },
            { id: 'res-02', label: 'Bể Tuần Hoàn 02' },
            { id: 'needs-dosing', label: 'Cần bù dinh dưỡng' },
            { id: 'optimal', label: 'Đạt chuẩn tối ưu' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                border: activeTab === tab.id ? 'none' : '1px solid var(--border-medium)',
                backgroundColor: activeTab === tab.id ? '#00a651' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.8125rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0, 166, 81, 0.25)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Search and Dropdown Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            width: '230px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <Search size={15} color="var(--text-disabled)" />
            <input
              type="text"
              placeholder="Tìm bồn, công thức..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.8125rem', color: 'var(--text-main)', width: '100%', background: 'transparent' }}
            />
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ArrowUpDown size={13} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="farmvista-select-pill"
              style={{ height: '36px', paddingLeft: '32px' }}
            >
              <option value="default">Sắp xếp theo</option>
              <option value="volume">Mực nước cao nhất</option>
              <option value="ec">Nồng độ EC cao nhất</option>
              <option value="ph">Độ pH cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. MAIN SECTION: SIDE-BY-SIDE RESERVOIR CARDS
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '20px'
      }}>
        {filteredReservoirs.map((res) => {
          const shortName = res.name.split('-')[0].trim();
          const subTitle = res.name.split('-')[1]?.trim() || 'Hệ thống giàn NFT';
          const fillPercent = Math.round((res.currentVolumeLiters / res.capacityLiters) * 100);

          // Target EC & Deficit calculation
          const currentTargetEc = targetEcs[res.id] ?? (res.currentEc < 1.7 ? 1.75 : res.currentEc);
          const ecDeficit = Math.max(0, parseFloat((currentTargetEc - res.currentEc).toFixed(2)));
          const doseMl = Math.round((ecDeficit / 0.10) * 10 * (res.currentVolumeLiters / 100));

          // Channels connected to this reservoir
          const resChans = channels.filter(c => c.reservoirId === res.id);
          const totalActivePlants = resChans.reduce((sum, c) => sum + c.activePlants, 0);
          const resBatches = batches.filter(b => b.reservoirId === res.id && b.status === 'active');

          // Evaluation status
          const isPhOk = res.currentPh >= 5.6 && res.currentPh <= 6.2;
          const isEcOk = res.currentEc >= 1.5 && res.currentEc <= 1.85;
          const isTempOk = res.currentWaterTemp >= 19 && res.currentWaterTemp <= 24;

          return (
            <div 
              key={res.id} 
              className="farmvista-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                position: 'relative'
              }}
            >
              {/* Card Header: Tank Title, Status Dot & Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: '#16a34a',
                      boxShadow: '0 0 0 4px #dcfce7'
                    }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {shortName}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px', marginLeft: '20px' }}>
                    {subTitle} • Cấp {resChans.length} máng ({totalActivePlants} rọ NFT)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => openTopUpModal(res)}
                    className="farmvista-btn-secondary"
                    style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}
                  >
                    + Bù nước
                  </button>
                  <button
                    onClick={() => openDrainModal(res)}
                    className="farmvista-btn-danger"
                    style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}
                  >
                    Xả bể
                  </button>
                  <button
                    onClick={() => openLogModal(res)}
                    className="farmvista-btn-green"
                    style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}
                  >
                    <Plus size={14} />
                    <span>Ghi số đo</span>
                  </button>
                </div>
              </div>

              {/* Water Volume Progress Bar & Equipment Status */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Droplets size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Mực nước: {res.currentVolumeLiters} / {res.capacityLiters} Lít
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>
                    {fillPercent}% Dung tích
                  </span>
                </div>

                {/* Smooth Gradient Water Level Bar */}
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${fillPercent}%`,
                    background: fillPercent > 50 ? 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)' : '#f59e0b',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Pumps & Aerators status indicators */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span>
                      Bơm tuần hoàn:{' '}
                      <strong style={{ color: res.pumpStatus === 'running' ? '#16a34a' : 'var(--text-muted)' }}>
                        {res.pumpStatus === 'running' ? '● Đang chạy' : '○ Dừng'}
                      </strong>
                    </span>
                    <span>
                      Sục khí oxy:{' '}
                      <strong style={{ color: res.aerationStatus === 'active' ? '#16a34a' : 'var(--text-muted)' }}>
                        {res.aerationStatus === 'active' ? '● Đang bật' : '○ Tắt'}
                      </strong>
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    Cập nhật: {res.lastTopUpDate || 'Hôm nay'}
                  </span>
                </div>
              </div>

              {/* 4 Sensor Metric Tiles (pH, EC, Nhiệt độ, Oxy DO) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {/* pH */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Độ pH</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '3px 0' }}>
                    {res.currentPh.toFixed(2)}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: isPhOk ? '#dcfce7' : '#fef3c7',
                    color: isPhOk ? '#15803d' : '#b45309'
                  }}>
                    {isPhOk ? 'Tối ưu' : 'Cần chỉnh'}
                  </span>
                </div>

                {/* EC */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Nồng độ EC</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00a651', margin: '3px 0' }}>
                    {res.currentEc.toFixed(2)}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: isEcOk ? '#dcfce7' : '#fee2e2',
                    color: isEcOk ? '#15803d' : '#b91c1c'
                  }}>
                    {isEcOk ? 'Chuẩn' : res.currentEc < 1.5 ? 'Thiếu phân' : 'Đậm phân'}
                  </span>
                </div>

                {/* Water Temp */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Nhiệt độ nước</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '3px 0' }}>
                    {res.currentWaterTemp.toFixed(1)}°C
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: isTempOk ? '#dcfce7' : '#fef3c7',
                    color: isTempOk ? '#15803d' : '#b45309'
                  }}>
                    {isTempOk ? 'Mát' : 'Hơi ấm'}
                  </span>
                </div>

                {/* Dissolved Oxygen DO */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Oxy DO</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', margin: '3px 0' }}>
                    {(res.currentDo ?? 6.8).toFixed(1)}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1'
                  }}>
                    mg/L (Tốt)
                  </span>
                </div>
              </div>

              {/* Smart Dosing Calculator Box */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#00a651" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Bù Dinh Dưỡng Tuần Hoàn (Dosing)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Mục tiêu EC:</span>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      padding: '2px 4px',
                      gap: '4px'
                    }}>
                      <button
                        type="button"
                        onClick={() => setTargetEcs(prev => ({ ...prev, [res.id]: Math.max(1.0, parseFloat((currentTargetEc - 0.05).toFixed(2))) }))}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#f1f5f9',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          fontSize: '0.85rem'
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.05"
                        min="1.0"
                        max="2.5"
                        value={currentTargetEc}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setTargetEcs(prev => ({ ...prev, [res.id]: val }));
                        }}
                        className="clean-number"
                        style={{
                          width: '44px',
                          height: '24px',
                          fontSize: '0.875rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          color: '#00a651',
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'transparent'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setTargetEcs(prev => ({ ...prev, [res.id]: Math.min(2.5, parseFloat((currentTargetEc + 0.05).toFixed(2))) }))}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#f1f5f9',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          fontSize: '0.85rem'
                        }}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>mS/cm</span>
                  </div>
                </div>

                {/* Result Bottles (Can A & Can B) */}
                {ecDeficit > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Can A */}
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fef3c7',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Can A (Canxi/Sắt)</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
                            {doseMl} <span style={{ fontSize: '0.85rem' }}>ml</span>
                          </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                          <FlaskConical size={18} />
                        </div>
                      </div>

                      {/* Can B */}
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0f2fe',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Can B (Lân/Khoáng)</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1' }}>
                            {doseMl} <span style={{ fontSize: '0.85rem' }}>ml</span>
                          </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
                          <FlaskConical size={18} />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyDosingForTank(res, currentTargetEc, doseMl)}
                      className="farmvista-btn-green"
                      style={{ width: '100%', height: '38px', justifyContent: 'center', fontSize: '0.875rem' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Xác nhận đã châm {doseMl}ml Can A & B</span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.82rem',
                    color: '#15803d',
                    backgroundColor: '#dcfce7',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span>Dinh dưỡng đang ở mức tối ưu ({res.currentEc} mS/cm). Chưa cần châm thêm.</span>
                  </div>
                )}
              </div>

              {/* Connected Batches & Cultivar Agronomic Standards */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #d1fae5',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>
                    <Sprout size={15} />
                    <span>Giống Cây & Lô Canh Tác Đang Cấp Dinh Dưỡng ({resBatches.length} lô)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Tiêu chuẩn nông học NFT
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {resBatches.length > 0 ? (
                    resBatches.map(b => (
                      <div
                        key={b.id}
                        style={{
                          padding: '8px 10px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0f172a' }}>{b.cultivarName}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>({b.batchCode} — Giàn {b.zoneCode || 'NFT'})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#475569' }}>
                            pH: <strong>{b.cultivarName.includes('Oak') ? '5.6 - 6.2' : b.cultivarName.includes('Romaine') ? '5.5 - 6.0' : '5.8 - 6.3'}</strong>
                          </span>
                          <span style={{ color: '#475569' }}>
                            EC: <strong>{b.cultivarName.includes('Oak') ? '1.4 - 1.9' : b.cultivarName.includes('Romaine') ? '1.6 - 2.1' : '1.5 - 2.0'}</strong> mS/cm
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const target = b.cultivarName.includes('Romaine') ? 1.85 : 1.75;
                              setTargetEcs(prev => ({ ...prev, [res.id]: target }));
                            }}
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '4px',
                              border: '1px solid #86efac',
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              cursor: 'pointer'
                            }}
                            title="Đặt mục tiêu EC theo chuẩn giống này"
                          >
                            Áp chuẩn
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
                      Chưa có lô cây trồng liên kết trực tiếp
                    </div>
                  )}
                </div>
              </div>

              {/* Connected NFT Gullies / Channels */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <Layers size={14} color="var(--text-subtle)" />
                    <span>Máng NFT đang cấp nước ({resChans.length} máng)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    {totalActivePlants} rọ cây
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {resChans.map(ch => {
                    const batch = batches.find(b => b.id === ch.batchId);
                    return (
                      <div
                        key={ch.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{ch.name}</strong>
                          {batch ? (
                            <span style={{ color: 'var(--text-muted)' }}>
                              🥬 {batch.cultivarName} ({batch.batchCode})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-disabled)' }}>Máng trống</span>
                          )}
                        </div>

                        <span style={{ fontWeight: 700, color: ch.activePlants > 0 ? '#00a651' : 'var(--text-muted)' }}>
                          {ch.activePlants} / {ch.slotCount} rọ
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================
          5. BOTTOM GRID: 7-Day Trend Chart + Standard Formulation
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Card Left: 7-Day EC & pH Trend Chart */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Biến Thiên EC & pH 7 Ngày Gần Nhất
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '2px', margin: '2px 0 0 0' }}>
                Theo dõi xu hướng tiêu thụ dinh dưỡng và ổn định môi trường rễ xà lách.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={selectedChartTank}
                onChange={e => setSelectedChartTank(e.target.value as any)}
                className="farmvista-select-pill"
                style={{ borderRadius: '8px', height: '32px', fontSize: '0.8rem' }}
              >
                <option value="res-01">Bể Tuần Hoàn 01</option>
                <option value="res-02">Bể Tuần Hoàn 02</option>
              </select>
            </div>
          </div>

          {/* Recharts Area / Line Chart */}
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SENSOR_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={[1.4, 2.2]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[5.0, 7.0]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey={selectedChartTank === 'res-02' ? 'ec2' : 'ec1'} 
                  name="Nồng độ EC (mS/cm)" 
                  stroke="#00a651" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#ecGrad)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey={selectedChartTank === 'res-02' ? 'ph2' : 'ph1'} 
                  name="Độ pH" 
                  stroke="#0284c7" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#phGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Right: Standard Nutrient Formulation & Salt Composition */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Công Thức Hoagland & Resh Chuẩn
              </h3>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#e8f8f0', color: '#00a651', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>
                Tỷ lệ 1:100
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '0 0 14px 0' }}>
              {defaultFormula?.scientificStandard || 'Chuẩn dinh dưỡng Cornell cho xà lách thủy canh NFT'}
            </p>

            {/* Salt ingredients mini preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 600, color: '#92400e' }}>Can A • Canxi Nitrat</span>
                <strong style={{ color: '#b45309' }}>1,000g / 10L</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#e0f2fe', borderRadius: '6px', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 600, color: '#075985' }}>Can B • Magie Sulfat (Muối Epsom)</span>
                <strong style={{ color: '#0284c7' }}>550g / 10L</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Can B • Monopotassium Phosphate (MKP)</span>
                <strong style={{ color: 'var(--text-main)' }}>250g / 10L</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Can A • Sắt Chelate Fe-EDDHA (6%)</span>
                <strong style={{ color: '#00a651' }}>40g / 10L</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsFormulaModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ width: '100%', height: '36px', justifyContent: 'center', marginTop: '14px', fontSize: '0.8125rem' }}
          >
            <FlaskConical size={14} color="#00a651" />
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
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Ghi Số Đo Mới: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button 
                onClick={() => setIsLogModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '30px', 
                  height: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Độ pH (Chuẩn: 5.6 - 6.2)</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="4.0"
                    max="9.0"
                    className="form-input clean-number" 
                    value={formPh} 
                    onChange={e => setFormPh(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nồng độ EC (mS/cm - Chuẩn: 1.5 - 1.9)</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0.5"
                    max="3.5"
                    className="form-input clean-number" 
                    value={formEc} 
                    onChange={e => setFormEc(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nhiệt độ nước (°C - Chuẩn: 20 - 24°C)</label>
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
                  <label className="form-label">Oxy hòa tan DO (mg/L - Chuẩn: 6.0 - 8.0)</label>
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
                  <label className="form-label">Mực nước (% dung tích bể - Ngưỡng an toàn: &gt;20%)</label>
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
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '36px', padding: '0 16px' }}>
                  Hủy
                </button>
                <button type="submit" className="farmvista-btn-green" style={{ height: '36px', padding: '0 18px' }}>
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
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Bù Nước Sạch: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button 
                onClick={() => setIsTopUpModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '30px', 
                  height: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Số lít nước châm thêm (Lít)</label>
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
                        height: '34px',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        border: topUpLiters === amt ? '1px solid #00a651' : '1px solid var(--border-medium)',
                        backgroundColor: topUpLiters === amt ? '#e8f8f0' : '#ffffff',
                        color: topUpLiters === amt ? '#00a651' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      +{amt} Lít
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsTopUpModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '36px', padding: '0 16px' }}>
                  Hủy
                </button>
                <button type="submit" className="farmvista-btn-green" style={{ height: '36px', padding: '0 18px' }}>
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
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#dc2626' }}>
                Xác Nhận Xả Bể: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button 
                onClick={() => setIsDrainModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '30px', 
                  height: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDrainSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '12px 14px', borderRadius: '10px', color: '#b91c1c', fontSize: '0.8rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>Thao tác này sẽ ghi nhận xả toàn bộ <strong>{activeModalRes?.currentVolumeLiters}L</strong> nước dinh dưỡng hiện tại.</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lý do xả nước</label>
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
                  <label className="form-label">Người thực hiện</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={drainOperator} 
                    onChange={e => setDrainOperator(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ghi chú kỹ thuật</label>
                  <input 
                    type="text"
                    className="form-input" 
                    value={drainNotes} 
                    onChange={e => setDrainNotes(e.target.value)} 
                    placeholder="Ví dụ: Vệ sinh bồn trước khi pha dung dịch mới."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsDrainModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '36px', padding: '0 16px' }}>
                  Hủy
                </button>
                <button type="submit" className="farmvista-btn-danger" style={{ height: '36px', padding: '0 18px' }}>
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
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="#00a651" />
                <span>Nhật Ký Xả & Thay Nước</span>
              </h3>
              <button 
                onClick={() => setIsDrainHistoryModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '30px', 
                  height: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drainEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                  Chưa có lần xả nước nào được ghi nhận.
                </div>
              ) : (
                drainEvents.map(ev => {
                  const res = reservoirs.find(r => r.id === ev.reservoirId);
                  return (
                    <div key={ev.id} style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', fontSize: '0.8125rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{res?.name.split('-')[0].trim() || 'Bể'} • Xả {ev.volumeDrainedLiters} Lít</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {ev.drainDate}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        <span>pH: <strong style={{ color: 'var(--text-main)' }}>{ev.finalPh}</strong></span>
                        <span>EC: <strong style={{ color: '#00a651' }}>{ev.finalEc} mS/cm</strong></span>
                        <span>Kỹ thuật viên: <strong style={{ color: 'var(--text-main)' }}>{ev.operator}</strong></span>
                      </div>
                      {ev.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '6px', fontStyle: 'italic' }}>
                          Ghi chú: {ev.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsDrainHistoryModalOpen(false)} className="farmvista-btn-secondary" style={{ height: '36px', padding: '0 18px' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Công thức pha can 10L tại kho */}
      {isFormulaModalOpen && defaultFormula && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={18} color="#00a651" />
                <span>Công Thức Pha Can 10L Tại Kho (Stock Solution)</span>
              </h3>
              <button 
                onClick={() => setIsFormulaModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '30px', 
                  height: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', color: '#166534', fontSize: '0.78rem' }}>
                {defaultFormula.scientificStandard} • Tỷ lệ pha 1:100 (10ml Can A + 10ml Can B trên 1L nước sạch).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Can A */}
                <div style={{ border: '1px solid #fef3c7', borderRadius: '10px', padding: '14px', backgroundColor: '#fffbeb' }}>
                  <strong style={{ color: '#b45309', display: 'block', marginBottom: '10px', fontSize: '0.85rem' }}>
                    Can A (10 Lít mẹ)
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {defaultFormula.stockAItems?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-main)' }}>{it.name}</span>
                        <strong style={{ color: '#b45309' }}>{it.gramsPer10LStock}g</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Can B */}
                <div style={{ border: '1px solid #e0f2fe', borderRadius: '10px', padding: '14px', backgroundColor: '#f0f9ff' }}>
                  <strong style={{ color: '#0369a1', display: 'block', marginBottom: '10px', fontSize: '0.85rem' }}>
                    Can B (10 Lít mẹ)
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {defaultFormula.stockBItems?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-main)' }}>{it.name}</span>
                        <strong style={{ color: '#0369a1' }}>{it.gramsPer10LStock}g</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <strong>Lưu ý quan trọng:</strong> {defaultFormula.chemicalIncompatibilityReason}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsFormulaModalOpen(false)} className="farmvista-btn-green" style={{ height: '36px', padding: '0 20px' }}>
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
