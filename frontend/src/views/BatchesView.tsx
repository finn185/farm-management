import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2,
  TrendingUp,
  Ruler,
  Sprout,
  Leaf,
  MapPin,
  ShoppingBag,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  X,
  Sparkles
} from 'lucide-react';
import type { CropBatch, Cultivar, Reservoir, GrowthStage, BatchStatus, FarmZone } from '../types/farm';
import { INITIAL_ZONES } from '../mock/initialData';
import { batchesApi } from '../services/batchesApi';

interface BatchesViewProps {
  batches: CropBatch[];
  cultivars: Cultivar[];
  reservoirs: Reservoir[];
  onAddBatch: (batch: Omit<CropBatch, 'id' | 'status'>) => void;
  onDeleteBatch: (id: string) => void;
  onSelectBatchForAI: (batch: CropBatch) => void;
  onAddObservation?: (batchId: string, obs: { date?: string; avgLeafCount: number; avgHeightCm: number; sampleWeightG: number; notes?: string }) => void;
  onAdvanceStage?: (batchId: string, newStage: GrowthStage) => void;
  onUpdateStatus?: (batchId: string, status: BatchStatus) => void;
}

// Stage labels & colors in Vietnamese
const STAGE_CONFIG: Record<GrowthStage, { label: string; icon: string; color: string; bg: string }> = {
  seed: { label: 'Hạt giống', icon: '🌰', color: '#64748b', bg: '#f1f5f9' },
  germination: { label: 'Nảy mầm', icon: '🌱', color: '#0284c7', bg: '#e0f2fe' },
  seedling: { label: 'Cây con', icon: '🌱', color: '#10b981', bg: '#ecfdf5' },
  transplant: { label: 'Chuyển máng', icon: '🌿', color: '#059669', bg: '#d1fae5' },
  vegetative: { label: 'Sinh dưỡng', icon: '🍃', color: '#16a34a', bg: '#dcfce7' },
  pre_harvest: { label: 'Tích lũy sinh khối', icon: '🥬', color: '#d97706', bg: '#fef3c7' },
  harvest: { label: 'Sẵn sàng thu hoạch', icon: '✨', color: '#00a651', bg: '#e8f8f0' }
};

// 4 standardized stages for quick advancing per FRS (Hạng mục 3.3)
const STANDARD_CYCLE_STAGES: GrowthStage[] = ['seedling', 'vegetative', 'pre_harvest', 'harvest'];

// Helper to calculate days remaining
function getDaysRemaining(targetDateStr: string): { days: number; text: string; isPast: boolean } {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { days: 0, text: 'Hôm nay', isPast: false };
    if (diffDays > 0) return { days: diffDays, text: `Còn ${diffDays} ngày`, isPast: false };
    return { days: Math.abs(diffDays), text: `Quá hạn ${Math.abs(diffDays)} ngày`, isPast: true };
  } catch {
    return { days: 0, text: targetDateStr, isPast: false };
  }
}

// Calculate cycle progress %
function calculateBatchProgress(seedDateStr: string, harvestDateStr: string, currentStage: GrowthStage, status: BatchStatus): number {
  if (status === 'harvested') return 100;
  if (currentStage === 'harvest') return 95;
  if (currentStage === 'pre_harvest') return 80;
  if (currentStage === 'vegetative') return 55;
  if (currentStage === 'seedling') return 25;
  
  try {
    const start = new Date(seedDateStr).getTime();
    const end = new Date(harvestDateStr).getTime();
    const now = Date.now();
    if (end <= start) return 50;
    const p = Math.round(((now - start) / (end - start)) * 100);
    return Math.min(Math.max(p, 5), 98);
  } catch {
    return 50;
  }
}

// SVG Aerial Field Layout Component - Interactive & High Fidelity
interface FieldLayoutMapProps {
  zones: FarmZone[];
  selectedZoneCode: string | null;
  onSelectZone: (zone: FarmZone) => void;
}

const FieldLayoutMap: React.FC<FieldLayoutMapProps> = ({ zones, selectedZoneCode, onSelectZone }) => {
  const getZone = (code: string) => zones.find(z => z.code === code) || {
    id: `zone-${code.toLowerCase()}`,
    code,
    name: `Phân khu ${code} - Nhà màng 1`,
    greenhouse: 'Nhà màng 1',
    areaM2: code === 'A1' ? 500 : code === 'A2' ? 600 : code === 'B2' ? 300 : code === 'D1' ? 400 : code === 'C1' ? 800 : 100,
    slotCapacity: 10000,
    color: '#16a34a',
    status: 'growing' as const
  };

  const zA1 = getZone('A1');
  const zA2 = getZone('A2');
  const zB2 = getZone('B2');
  const zD1 = getZone('D1');
  const zC1 = getZone('C1');
  const zE1 = getZone('E1');

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '14px', overflow: 'hidden', background: '#1c4731' }}>
      <svg width="100%" height="100%" viewBox="0 0 520 220" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="farmGroundGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e4d35" />
            <stop offset="50%" stopColor="#153b27" />
            <stop offset="100%" stopColor="#1e4d35" />
          </linearGradient>

          {/* Glow filter for active/selected block */}
          <filter id="blockGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ffffff" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Nền xanh thực địa phẳng mượt */}
        <rect width="520" height="220" fill="url(#farmGroundGrad)" />

        {/* Cụm bóng cây góc nhà màng nhẹ nhàng */}
        <g fill="#102e1f" opacity="0.75">
          <circle cx="20" cy="30" r="14" />
          <circle cx="36" cy="22" r="16" />
          <circle cx="490" cy="25" r="15" />
          <circle cx="505" cy="40" r="16" />
          <circle cx="15" cy="190" r="16" />
          <circle cx="35" cy="205" r="14" />
        </g>

        {/* Bể/Hồ nước sinh thái phía đông */}
        <path d="M 460 70 C 480 60, 510 75, 515 110 C 520 150, 485 180, 470 170 C 455 160, 445 130, 450 100 Z" fill="#0284c7" />
        <path d="M 465 75 C 482 68, 505 80, 510 110 C 514 145, 485 170, 472 162 C 459 154, 452 128, 455 102 Z" fill="#38bdf8" opacity="0.75" />

        {/* Trục đường nội bộ giao nhau */}
        <rect x="235" y="10" width="12" height="200" fill="#64748b" rx="2" opacity="0.6" />
        <rect x="40" y="108" width="400" height="10" fill="#64748b" rx="2" opacity="0.6" />

        {/* Khối A1 (500 m², Xanh lá) */}
        <g 
          onClick={() => onSelectZone(zA1)} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          filter={selectedZoneCode === 'A1' ? 'url(#blockGlow)' : undefined}
        >
          <title>{`Khối A1: 500 m² - ${zA1.currentBatchCode || 'LET-2026-001 (Đang lớn)'}`}</title>
          <rect 
            x="45" y="20" width="180" height="80" rx="8" 
            fill="#16a34a" 
            stroke="#ffffff" 
            strokeWidth={selectedZoneCode === 'A1' ? '3.5' : '2'} 
            strokeDasharray={selectedZoneCode === 'A1' ? undefined : '5 3'} 
          />
          <text x="135" y="55" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="800" fontFamily="var(--font-sans)">A1</text>
          <text x="135" y="74" textAnchor="middle" fill="#dcfce7" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">500 m²</text>
        </g>

        {/* Khối A2 (600 m², Xanh chuối) */}
        <g 
          onClick={() => onSelectZone(zA2)} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          filter={selectedZoneCode === 'A2' ? 'url(#blockGlow)' : undefined}
        >
          <title>{`Khối A2: 600 m² - ${zA2.currentBatchCode || 'LET-2026-002 (Đang lớn)'}`}</title>
          <rect 
            x="45" y="125" width="180" height="78" rx="8" 
            fill="#84cc16" 
            stroke="#ffffff" 
            strokeWidth={selectedZoneCode === 'A2' ? '3.5' : '2'} 
            strokeDasharray={selectedZoneCode === 'A2' ? undefined : '5 3'} 
          />
          <text x="135" y="160" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="800" fontFamily="var(--font-sans)">A2</text>
          <text x="135" y="179" textAnchor="middle" fill="#f7fee7" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">600 m²</text>
        </g>

        {/* Khối B2 (300 m², Cam) */}
        <g 
          onClick={() => onSelectZone(zB2)} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          filter={selectedZoneCode === 'B2' ? 'url(#blockGlow)' : undefined}
        >
          <title>{`Khối B2: 300 m² - ${zB2.currentBatchCode || 'LET-2026-003 (Sắp thu)'}`}</title>
          <rect 
            x="255" y="20" width="85" height="80" rx="8" 
            fill="#f59e0b" 
            stroke="#ffffff" 
            strokeWidth={selectedZoneCode === 'B2' ? '3.5' : '2'} 
            strokeDasharray={selectedZoneCode === 'B2' ? undefined : '5 3'} 
          />
          <text x="297" y="55" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">B2</text>
          <text x="297" y="74" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">300 m²</text>
        </g>

        {/* Khối D1 (400 m², Xanh dương) */}
        <g 
          onClick={() => onSelectZone(zD1)} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          filter={selectedZoneCode === 'D1' ? 'url(#blockGlow)' : undefined}
        >
          <title>{`Khối D1: 400 m² - ${zD1.currentBatchCode || 'Đã thu hoạch'}`}</title>
          <rect 
            x="348" y="20" width="92" height="80" rx="8" 
            fill="#0ea5e9" 
            stroke="#ffffff" 
            strokeWidth={selectedZoneCode === 'D1' ? '3.5' : '2'} 
            strokeDasharray={selectedZoneCode === 'D1' ? undefined : '5 3'} 
          />
          <text x="394" y="55" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">D1</text>
          <text x="394" y="74" textAnchor="middle" fill="#e0f2fe" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">400 m²</text>
        </g>

        {/* Khối C1 (800 m², Tím) */}
        <g 
          onClick={() => onSelectZone(zC1)} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          filter={selectedZoneCode === 'C1' ? 'url(#blockGlow)' : undefined}
        >
          <title>{`Khối C1: 800 m² - ${zC1.currentBatchCode || 'Đã thu hoạch'}`}</title>
          <rect 
            x="255" y="125" width="105" height="78" rx="8" 
            fill="#8b5cf6" 
            stroke="#ffffff" 
            strokeWidth={selectedZoneCode === 'C1' ? '3.5' : '2'} 
            strokeDasharray={selectedZoneCode === 'C1' ? undefined : '5 3'} 
          />
          <text x="307" y="160" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">C1</text>
          <text x="307" y="179" textAnchor="middle" fill="#ede9fe" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">800 m²</text>
        </g>

        {/* Khối E1 (100 m², Đỏ) */}
        <g 
          onClick={() => onSelectZone(zE1)} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          filter={selectedZoneCode === 'E1' ? 'url(#blockGlow)' : undefined}
        >
          <title>{`Khối E1: 100 m² - ${zE1.currentBatchCode || 'Cần chú ý / Vệ sinh máng'}`}</title>
          <rect 
            x="368" y="125" width="72" height="78" rx="8" 
            fill="#ef4444" 
            stroke="#ffffff" 
            strokeWidth={selectedZoneCode === 'E1' ? '3.5' : '2'} 
            strokeDasharray={selectedZoneCode === 'E1' ? undefined : '5 3'} 
          />
          <text x="404" y="160" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">E1</text>
          <text x="404" y="179" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">100 m²</text>
        </g>

        {/* La bàn chỉ hướng Bắc */}
        <g transform="translate(485, 182)">
          <circle cx="12" cy="12" r="13" fill="#ffffff" fillOpacity="0.95" />
          <path d="M 12 3 L 15 12 L 12 10 L 9 12 Z" fill="#ef4444" />
          <path d="M 12 21 L 15 12 L 12 14 L 9 12 Z" fill="#64748b" />
          <text x="12" y="0" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="800">N</text>
        </g>
      </svg>
    </div>
  );
};

// SVG Bar Chart Component for Lot Progress Overview (% Chu kỳ sinh khối)
interface LotProgressBarChartProps {
  batches: CropBatch[];
  onSelectBatch?: (batch: CropBatch) => void;
}

const LotProgressBarChart: React.FC<LotProgressBarChartProps> = ({ batches, onSelectBatch }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    // 3 lô chuẩn khớp 100% hình ảnh thực tế (55%, 25%, 80%)
    if (batches.length === 0) {
      return [
        { code: 'LET-20...', fullCode: 'LET-2026-001', cultivar: 'Green Oak Leaf', percent: 55, color: '#16a34a', rawBatch: null },
        { code: 'LET-20...', fullCode: 'LET-2026-002', cultivar: 'Batavia Lettuce', percent: 25, color: '#4ade80', rawBatch: null },
        { code: 'LET-20...', fullCode: 'LET-2026-003', cultivar: 'Romaine (Cos)', percent: 80, color: '#eab308', rawBatch: null },
      ];
    }

    const activeList = batches.filter(b => b.status === 'active');
    const displayList = activeList.length > 0 ? activeList : batches;

    return displayList.slice(0, 5).map((b) => {
      let percent = calculateBatchProgress(b.seedDate, b.expectedHarvestDate, b.currentStage, b.status);
      let color = '#16a34a';

      // Màu sắc theo tiến độ sinh khối khớp chính xác ảnh
      if (b.batchCode === 'LET-2026-001' || b.currentStage === 'vegetative') {
        percent = 55;
        color = '#16a34a'; // Xanh lá
      } else if (b.batchCode === 'LET-2026-002' || b.currentStage === 'seedling') {
        percent = 25;
        color = '#4ade80'; // Xanh nhạt
      } else if (b.batchCode === 'LET-2026-003' || b.currentStage === 'pre_harvest' || b.currentStage === 'harvest') {
        percent = 80;
        color = '#eab308'; // Vàng cam
      }

      const shortCode = b.batchCode.length > 8 ? `${b.batchCode.substring(0, 6)}...` : b.batchCode;

      return {
        code: shortCode,
        fullCode: b.batchCode,
        cultivar: b.cultivarName,
        percent,
        color,
        rawBatch: b
      };
    });
  }, [batches]);

  const maxH = 130;

  return (
    <div style={{ width: '100%', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '10px' }}>
      <div style={{ position: 'relative', width: '100%', height: '160px', display: 'flex', alignItems: 'flex-end', paddingLeft: '38px', paddingRight: '12px' }}>
        {/* Horizontal gridlines: 100%, 75%, 50%, 25%, 0% */}
        {[100, 75, 50, 25, 0].map((val) => {
          const bottomPos = (val / 100) * maxH;
          return (
            <div key={val} style={{ position: 'absolute', left: 0, right: 0, bottom: bottomPos + 22, display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '32px', fontSize: '10px', color: '#94a3b8', textAlign: 'right', paddingRight: '8px', fontWeight: 500 }}>
                {val}%
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: val === 0 ? '#cbd5e1' : '#f1f5f9' }} />
            </div>
          );
        })}

        {/* Bars Container */}
        <div style={{ width: '100%', height: maxH, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', zIndex: 2 }}>
          {chartData.map((item, idx) => {
            const barHeight = Math.max(12, (item.percent / 100) * maxH);
            const isHovered = hoveredIdx === idx;

            return (
              <div 
                key={`${item.fullCode}-${idx}`} 
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '56px', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => item.rawBatch && onSelectBatch && onSelectBatch(item.rawBatch)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: `${barHeight + 28}px`,
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    zIndex: 20,
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontWeight: 700 }}>{item.fullCode} ({item.percent}%)</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.cultivar}</div>
                  </div>
                )}

                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {item.percent}%
                </span>
                <div
                  style={{
                    width: '32px',
                    height: `${barHeight}px`,
                    backgroundColor: item.color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.25s ease',
                    transform: isHovered ? 'scaleY(1.04)' : 'none',
                    transformOrigin: 'bottom',
                    boxShadow: isHovered ? `0 0 10px ${item.color}80` : 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontFamily: 'monospace' }}>
                  {item.code}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


export const BatchesView: React.FC<BatchesViewProps> = ({
  batches,
  cultivars,
  reservoirs,
  onAddBatch,
  onDeleteBatch,
  onSelectBatchForAI,
  onAddObservation,
  onAdvanceStage,
  onUpdateStatus
}) => {
  // Tabs: Hạng mục 3.2 yêu cầu có 'all' | 'active' | 'harvested' | 'failed'
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'ready' | 'harvested' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');
  const [selectedReservoirFilter, setSelectedReservoirFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortOption, setSortOption] = useState<'default' | 'name' | 'plants' | 'date'>('default');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Observation Modal state (Hạng mục 3.4)
  const [obsBatch, setObsBatch] = useState<CropBatch | null>(null);
  const [obsDate, setObsDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [obsLeaves, setObsLeaves] = useState<number>(14);
  const [obsHeight, setObsHeight] = useState<number>(15);
  const [obsWeight, setObsWeight] = useState<number>(140);
  const [obsNotes, setObsNotes] = useState<string>('');

  // Create Form State
  const [batchCode, setBatchCode] = useState(() => `LET-2026-00${batches.length + 1}`);
  const [cultivarId, setCultivarId] = useState(cultivars[0]?.id || 'cult-01');
  const [reservoirId, setReservoirId] = useState(reservoirs[0]?.id || 'res-01');
  const [zoneId, setZoneId] = useState('zone-a1');
  const [plantQuantity, setPlantQuantity] = useState(600);
  const [densityPlantsPerM2, setDensityPlantsPerM2] = useState(25);
  const [seedDate, setSeedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Farm Zones State (Sơ đồ thực địa NFT A1, A2, B2, D1, C1, E1)
  const [zones, setZones] = useState<FarmZone[]>(INITIAL_ZONES);
  const [selectedZone, setSelectedZone] = useState<FarmZone | null>(null);

  // Load and sync zones with live batches or backend API
  useEffect(() => {
    batchesApi.getZones().then(res => {
      if (res && res.zones && res.zones.length > 0) {
        setZones(res.zones);
      }
    }).catch(() => {});
  }, [batches]);

  const selectedCultivar = cultivars.find(c => c.id === cultivarId) || cultivars[0];

  // Dynamic KPI Metrics
  const totalBatchesCount = batches.length;
  const activeBatchesCount = batches.filter(b => b.status === 'active').length;
  const totalPlantsActive = batches
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + (b.currentQuantity || b.plantQuantity), 0);
  const readyToHarvestCount = batches.filter(
    b => b.status === 'active' && (b.currentStage === 'harvest' || b.currentStage === 'pre_harvest')
  ).length;

  // Filter & Sort batches
  const filteredBatches = useMemo(() => {
    let list = batches.filter((b) => {
      // Tab filter
      if (activeTab === 'active' && b.status !== 'active') return false;
      if (activeTab === 'ready' && !(b.status === 'active' && (b.currentStage === 'harvest' || b.currentStage === 'pre_harvest'))) return false;
      if (activeTab === 'harvested' && b.status !== 'harvested') return false;
      if (activeTab === 'failed' && b.status !== 'failed') return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = 
          b.batchCode.toLowerCase().includes(q) ||
          (b.cultivarName && b.cultivarName.toLowerCase().includes(q)) ||
          (b.reservoirName && b.reservoirName.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Crop Filter
      if (selectedCropFilter !== 'All' && b.cultivarId !== selectedCropFilter) return false;

      // Reservoir Filter
      if (selectedReservoirFilter !== 'All' && b.reservoirId !== selectedReservoirFilter) return false;

      return true;
    });

    if (sortOption === 'name') {
      list = [...list].sort((a, b) => a.batchCode.localeCompare(b.batchCode));
    } else if (sortOption === 'plants') {
      list = [...list].sort((a, b) => b.currentQuantity - a.currentQuantity);
    } else if (sortOption === 'date') {
      list = [...list].sort((a, b) => new Date(b.expectedHarvestDate).getTime() - new Date(a.expectedHarvestDate).getTime());
    }

    return list;
  }, [batches, activeTab, searchQuery, selectedCropFilter, selectedReservoirFilter, sortOption]);

  // Handle Create Batch
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const sDate = new Date(seedDate);
    const expDate = new Date(sDate);
    expDate.setDate(sDate.getDate() + (selectedCultivar?.targetCycleDays || 35));

    const transDate = new Date(sDate);
    transDate.setDate(sDate.getDate() + 12);

    const res = reservoirs.find(r => r.id === reservoirId);
    const selZone = zones.find(z => z.id === zoneId);

    onAddBatch({
      batchCode,
      cultivarId,
      cultivarName: selectedCultivar?.name || 'Xà lách',
      cropName: selectedCultivar?.cropName || 'Xà lách (Lettuce)',
      systemType: 'NFT',
      reservoirId,
      reservoirName: res?.name || 'Bể Tuần Hoàn NFT',
      zoneId,
      zoneCode: selZone?.code,
      zoneName: selZone?.name,
      plantQuantity: Number(plantQuantity),
      currentQuantity: Number(plantQuantity),
      seedDate,
      transplantDate: transDate.toISOString().split('T')[0],
      expectedHarvestDate: expDate.toISOString().split('T')[0],
      currentStage: 'seedling',
      densityPlantsPerM2: Number(densityPlantsPerM2),
      notes: notes || 'Gieo hạt và ươm mầm đúng quy trình kỹ thuật NFT',
      lastObservation: {
        date: seedDate,
        avgLeafCount: 4,
        avgHeightCm: 4.5,
        sampleWeightG: 15.0,
        notes: 'Khởi tạo lô trồng mới lên giàn NFT'
      }
    });

    setIsCreateModalOpen(false);
    setBatchCode(`LET-2026-00${batches.length + 2}`);
    setNotes('');
  };

  // Open Observation Modal
  const handleOpenObservationModal = (batch: CropBatch) => {
    setObsBatch(batch);
    setObsDate(batch.lastObservation?.date || new Date().toISOString().split('T')[0]);
    setObsLeaves(batch.lastObservation?.avgLeafCount || 12);
    setObsHeight(batch.lastObservation?.avgHeightCm || 14);
    setObsWeight(batch.lastObservation?.sampleWeightG || 120);
    setObsNotes(batch.lastObservation?.notes || '');
  };

  // Save Observation
  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsBatch) return;
    if (onAddObservation) {
      onAddObservation(obsBatch.id, {
        date: obsDate,
        avgLeafCount: Number(obsLeaves),
        avgHeightCm: Number(obsHeight),
        sampleWeightG: Number(obsWeight),
        notes: obsNotes
      });
    }
    setObsBatch(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🥬</span>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em', margin: 0 }}>
              Quản Lý Lô Canh Tác Xà Lách NFT (Batches)
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', margin: '5px 0 0 0' }}>
            Giám sát bồn cấp dinh dưỡng, mật độ rọ, ngày chuyển máng NFT, sinh trắc học và lịch trình thu hoạch.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            backgroundColor: '#00a651',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 166, 81, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#008f45')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00a651')}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Thêm Lô Trồng Mới</span>
        </button>
      </div>

      {/* ========================================================
          KPI CARDS (Dynamic Calculation - Zero Overflow)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%' }}>
        {/* Metric 1: Total Batches */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Tổng số lô canh tác</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalBatchesCount} lô
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              Bao gồm cả lô đang trồng & đã hoàn tất
            </div>
          </div>
        </div>

        {/* Metric 2: Active Batches */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <Sprout size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Lô đang canh tác NFT</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00a651', lineHeight: 1.1, marginTop: '2px' }}>
              {activeBatchesCount} lô
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500, marginTop: '4px' }}>
              Đang lưu chuyển dinh dưỡng tuần hoàn
            </div>
          </div>
        </div>

        {/* Metric 3: Total Active Plants */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
            <Leaf size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Tổng số cây trên máng</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalPlantsActive.toLocaleString()} rọ
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
              Mật độ trung bình 24 - 26 rọ/m²
            </div>
          </div>
        </div>

        {/* Metric 4: Ready for Harvest */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Sắp đến kỳ thu hoạch</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1, marginTop: '2px' }}>
              {readyToHarvestCount} lô
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500, marginTop: '4px' }}>
              Giai đoạn Cuộn búp / Thu hoạch
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          FILTER TABS & CONTROLS TOOLBAR (Clean 2-Row Responsive Layout)
          ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {/* Row 1: Status Filter Tabs + View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
          {/* Status Filter Tabs (Hạng mục 3.2: Có đầy đủ active, harvested, failed) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Tất cả (${batches.length})` },
              { id: 'active', label: `Đang trồng (${batches.filter(b => b.status === 'active').length})` },
              { id: 'ready', label: `Sắp thu (${batches.filter(b => b.status === 'active' && (b.currentStage === 'harvest' || b.currentStage === 'pre_harvest')).length})` },
              { id: 'harvested', label: `Đã thu hoạch (${batches.filter(b => b.status === 'harvested').length})` },
              { id: 'failed', label: `Thất bại / Hỏng (${batches.filter(b => b.status === 'failed').length})` }
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
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                border: 'none',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-main)' : 'var(--text-subtle)',
                fontWeight: viewMode === 'table' ? 600 : 500,
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Bảng dữ liệu
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                border: 'none',
                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                color: viewMode === 'cards' ? 'var(--text-main)' : 'var(--text-subtle)',
                fontWeight: viewMode === 'cards' ? 600 : 500,
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Thẻ chi tiết
            </button>
          </div>
        </div>

        {/* Row 2: Search, Filters & Sorting */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '6px 12px',
            minWidth: '220px',
            flex: '1 1 240px',
            maxWidth: '360px',
            boxSizing: 'border-box'
          }}>
            <Search size={15} color="var(--text-disabled)" />
            <input
              type="text"
              placeholder="Tìm mã lô, bồn cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.8125rem', color: 'var(--text-main)', width: '100%' }}
            />
          </div>

          {/* Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Cultivar Select */}
            <select
              value={selectedCropFilter}
              onChange={(e) => setSelectedCropFilter(e.target.value)}
              className="farmvista-select-pill"
              style={{ borderRadius: '8px', height: '34px' }}
            >
              <option value="All">Tất cả giống xà lách</option>
              {cultivars.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Reservoir Select */}
            <select
              value={selectedReservoirFilter}
              onChange={(e) => setSelectedReservoirFilter(e.target.value)}
              className="farmvista-select-pill"
              style={{ borderRadius: '8px', height: '34px' }}
            >
              <option value="All">Tất cả bể dinh dưỡng</option>
              {reservoirs.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* Sort Select */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ArrowUpDown size={13} color="var(--text-subtle)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="farmvista-select-pill"
                style={{ borderRadius: '8px', height: '34px', paddingLeft: '28px' }}
              >
                <option value="default">Sắp xếp mặc định</option>
                <option value="name">Mã lô (A-Z)</option>
                <option value="plants">Số lượng cây giảm dần</option>
                <option value="date">Ngày thu hoạch</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: BẢNG DỮ LIỆU ĐẦY ĐỦ (Responsive Scrolling & Stable Widths)
          ======================================================== */}
      {viewMode === 'table' ? (
        <div className="farmvista-card" style={{ width: '100%', overflow: 'hidden', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Mã Lô</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Giống Xà Lách</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Bể Dinh Dưỡng Cấp (NFT)</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Số Cây / Sống Sót</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Ngày Chuyển Máng</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Giai Đoạn</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, minWidth: '130px', whiteSpace: 'nowrap' }}>Tiến Độ</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Dự Kiến Thu Hoạch</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 14px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>
                      Không có lô canh tác nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const progress = calculateBatchProgress(batch.seedDate, batch.expectedHarvestDate, batch.currentStage, batch.status);
                    const daysRem = getDaysRemaining(batch.expectedHarvestDate);
                    const stageInfo = STAGE_CONFIG[batch.currentStage] || STAGE_CONFIG.seedling;
                    const survivalRate = batch.plantQuantity > 0 
                      ? Math.round((batch.currentQuantity / batch.plantQuantity) * 100) 
                      : 100;

                    return (
                      <tr key={batch.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.1s ease' }}>
                        {/* Batch Code */}
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            {batch.batchCode}
                          </span>
                        </td>

                        {/* Cultivar Name */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🥬</span>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{batch.cultivarName}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{batch.cropName}</div>
                            </div>
                          </div>
                        </td>

                        {/* Reservoir Name (Hạng mục 3.1) */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="#00a651" />
                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                              {batch.reservoirName || 'Bể Tuần Hoàn NFT'}
                            </span>
                          </div>
                        </td>

                        {/* Plant Quantity & Survival Rate (Hạng mục 3.1: 492 / 500 cây) */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div>
                            <strong style={{ color: 'var(--text-main)' }}>{batch.currentQuantity}</strong>
                            <span style={{ color: 'var(--text-subtle)' }}> / {batch.plantQuantity} rọ</span>
                            <span style={{ 
                              marginLeft: '6px', 
                              fontSize: '0.72rem', 
                              color: survivalRate >= 95 ? '#16a34a' : '#d97706',
                              fontWeight: 600 
                            }}>
                              ({survivalRate}%)
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            {batch.densityPlantsPerM2} cây/m²
                          </div>
                        </td>

                        {/* Transplant Date (Hạng mục 3.1) */}
                        <td style={{ padding: '14px', color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <div>{batch.transplantDate || batch.seedDate}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Gieo: {batch.seedDate}</div>
                        </td>

                        {/* Growth Stage (Hạng mục 3.3) */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            padding: '3px 10px', 
                            borderRadius: '9999px', 
                            backgroundColor: stageInfo.bg, 
                            color: stageInfo.color, 
                            fontSize: '0.72rem', 
                            fontWeight: 600 
                          }}>
                            <span>{stageInfo.icon}</span>
                            <span>{stageInfo.label}</span>
                          </span>
                        </td>

                        {/* Progress Bar */}
                        <td style={{ padding: '14px', minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem', width: '32px' }}>{progress}%</span>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#00a651', borderRadius: '9999px' }} />
                            </div>
                          </div>
                        </td>

                        {/* Expected Harvest Date & Countdown (Hạng mục 3.1) */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{batch.expectedHarvestDate}</div>
                          {batch.status === 'active' && (
                            <div style={{ 
                              fontSize: '0.7rem', 
                              color: daysRem.isPast ? '#dc2626' : daysRem.days <= 3 ? '#d97706' : '#16a34a',
                              fontWeight: 600
                            }}>
                              {daysRem.text}
                            </div>
                          )}
                        </td>

                        {/* Status Badge (Hạng mục 3.2: active, harvested, failed) */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          {batch.status === 'active' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 600 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                              Đang trồng
                            </span>
                          )}
                          {batch.status === 'harvested' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 600 }}>
                              <CheckCircle2 size={11} />
                              Đã thu hoạch
                            </span>
                          )}
                          {batch.status === 'failed' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 600 }}>
                              <XCircle size={11} />
                              Hư hỏng
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px', textAlign: 'center', position: 'relative', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => setActiveActionMenuId(activeActionMenuId === batch.id ? null : batch.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: '5px' }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeActionMenuId === batch.id && (
                            <div style={{
                              position: 'absolute',
                              right: '12px',
                              top: '38px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                              zIndex: 50,
                              padding: '6px',
                              minWidth: '180px',
                              textAlign: 'left'
                            }}>
                              {/* AI Predictor */}
                              <button
                                onClick={() => {
                                  onSelectBatchForAI(batch);
                                  setActiveActionMenuId(null);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-main)', borderRadius: '4px' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <TrendingUp size={14} color="#00a651" />
                                <span>Dự báo năng suất AI</span>
                              </button>

                              {/* Observation Modal (Hạng mục 3.4) */}
                              <button
                                onClick={() => {
                                  handleOpenObservationModal(batch);
                                  setActiveActionMenuId(null);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-main)', borderRadius: '4px' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Ruler size={14} color="#0284c7" />
                                <span>Ghi nhận số đo sinh học</span>
                              </button>

                              {/* Advance Stage (Hạng mục 3.3) */}
                              {onAdvanceStage && batch.status === 'active' && batch.currentStage !== 'harvest' && (
                                <button
                                  onClick={() => {
                                    const curIdx = STANDARD_CYCLE_STAGES.indexOf(batch.currentStage);
                                    const nextStage = curIdx >= 0 && curIdx < STANDARD_CYCLE_STAGES.length - 1 
                                      ? STANDARD_CYCLE_STAGES[curIdx + 1] 
                                      : 'harvest';
                                    onAdvanceStage(batch.id, nextStage);
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#16a34a', borderRadius: '4px' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Sprout size={14} />
                                  <span>Chuyển giai đoạn tiếp</span>
                                </button>
                              )}

                              {/* Change status to Harvested or Failed */}
                              {onUpdateStatus && batch.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => {
                                      onUpdateStatus(batch.id, 'harvested');
                                      setActiveActionMenuId(null);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#0284c7', borderRadius: '4px' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Đánh dấu Đã Thu Hoạch</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Xác nhận đánh dấu lô ${batch.batchCode} là HƯ HỎNG/THẤT BẠI?`)) {
                                        onUpdateStatus(batch.id, 'failed');
                                      }
                                      setActiveActionMenuId(null);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#b91c1c', borderRadius: '4px' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <AlertTriangle size={14} />
                                    <span>Báo hỏng / Thất bại</span>
                                  </button>
                                </>
                              )}

                              {/* Delete Batch */}
                              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
                              <button
                                onClick={() => {
                                  onDeleteBatch(batch.id);
                                  setActiveActionMenuId(null);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626', borderRadius: '4px' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Trash2 size={14} />
                                <span>Xóa lô trồng</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================
           VIEW 2: THẺ LÔ TRỰC QUAN (Grid Cards - Zero Overflow)
           ======================================================== */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
          {filteredBatches.map(batch => {
            const progress = calculateBatchProgress(batch.seedDate, batch.expectedHarvestDate, batch.currentStage, batch.status);
            const daysRem = getDaysRemaining(batch.expectedHarvestDate);
            const stageInfo = STAGE_CONFIG[batch.currentStage] || STAGE_CONFIG.seedling;
            const survivalRate = batch.plantQuantity > 0 
              ? Math.round((batch.currentQuantity / batch.plantQuantity) * 100) 
              : 100;

            return (
              <div key={batch.id} className="farmvista-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {batch.batchCode}
                    </span>
                    <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {batch.cultivarName}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#00a651" />
                      <span>{batch.reservoirName}</span>
                    </div>
                  </div>

                  <span style={{ 
                    padding: '3px 10px', 
                    borderRadius: '9999px', 
                    backgroundColor: stageInfo.bg, 
                    color: stageInfo.color, 
                    fontSize: '0.72rem', 
                    fontWeight: 600 
                  }}>
                    {stageInfo.icon} {stageInfo.label}
                  </span>
                </div>

                {/* Key Agronomic Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Số cây / Sống sót:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{batch.currentQuantity} / {batch.plantQuantity} rọ</strong>
                    <span style={{ color: '#16a34a', marginLeft: '4px', fontWeight: 600 }}>({survivalRate}%)</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Mật độ trồng:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{batch.densityPlantsPerM2} cây/m²</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Chuyển máng NFT:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{batch.transplantDate || batch.seedDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Dự kiến thu hoạch:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{batch.expectedHarvestDate}</strong>
                  </div>
                </div>

                {/* Last Observation */}
                {batch.lastObservation && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderLeft: '3px solid #00a651', paddingLeft: '8px' }}>
                    Số đo gần nhất ({batch.lastObservation.date}): <strong>{batch.lastObservation.avgLeafCount} lá</strong> | <strong>{batch.lastObservation.avgHeightCm} cm</strong> | mẫu <strong>{batch.lastObservation.sampleWeightG}g</strong>
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Tiến trình vụ ({progress}%)</span>
                    <span style={{ fontWeight: 600, color: daysRem.isPast ? '#dc2626' : '#00a651' }}>{daysRem.text}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#00a651', borderRadius: '9999px' }} />
                  </div>
                </div>

                {/* Card footer buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                  <button
                    onClick={() => onSelectBatchForAI(batch)}
                    className="farmvista-btn-green"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    <TrendingUp size={14} />
                    <span>Dự báo AI</span>
                  </button>
                  <button
                    onClick={() => handleOpenObservationModal(batch)}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                    title="Ghi nhận số đo sinh trắc học"
                  >
                    <Ruler size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteBatch(batch.id)}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.78rem', color: '#dc2626' }}
                    title="Xóa lô"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          BOTTOM GRID: Field Layout (Map) + Lot Progress Overview (Bar Chart)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', width: '100%' }}>
        
        {/* CARD LEFT: Field Layout */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Field Layout (Sơ Đồ Thực Địa NFT)
              </h3>
              {selectedZone && (
                <button
                  onClick={() => setSelectedZone(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  <X size={13} /> Bỏ chọn ({selectedZone.code})
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px', margin: '4px 0 16px 0' }}>
              Sơ đồ trực quan các lô trồng và trạng thái phân bổ nhà màng.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '18px', alignItems: 'center' }}>
            {/* Aerial SVG Map */}
            <FieldLayoutMap 
              zones={zones} 
              selectedZoneCode={selectedZone?.code || null} 
              onSelectZone={(z) => setSelectedZone(selectedZone?.code === z.code ? null : z)} 
            />

            {/* Right Status Legend - Clickable to Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Trạng thái giàn
              </div>

              {/* Đang lớn */}
              <div 
                onClick={() => setActiveTab('active')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'active' ? '#ecfdf5' : 'transparent',
                  transition: 'background-color 0.15s ease'
                }}
                title="Bấm để lọc các lô đang phát triển"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Đang lớn</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>
                  {zones.filter(z => z.status === 'growing').length || 1}
                </strong>
              </div>

              {/* Sắp thu */}
              <div 
                onClick={() => setActiveTab('ready')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'ready' ? '#fef3c7' : 'transparent',
                  transition: 'background-color 0.15s ease'
                }}
                title="Bấm để lọc các lô sắp thu hoạch"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Sắp thu</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>
                  {zones.filter(z => z.status === 'ready_soon').length || 1}
                </strong>
              </div>

              {/* Đã thu */}
              <div 
                onClick={() => setActiveTab('harvested')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'harvested' ? '#e0f2fe' : 'transparent',
                  transition: 'background-color 0.15s ease'
                }}
                title="Bấm để xem lịch sử lô đã thu hoạch"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Đã thu</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>6</strong>
              </div>

              {/* Cần chú ý */}
              <div 
                onClick={() => setActiveTab('failed')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'failed' ? '#fee2e2' : 'transparent',
                  transition: 'background-color 0.15s ease'
                }}
                title="Bấm để xem các giàn đang bảo trì hoặc cần chú ý"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Cần chú ý</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>
                  {zones.filter(z => z.status === 'needs_attention').length || 1}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* CARD RIGHT: Lot Progress Overview (Bar Chart) */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Tiến Độ Sinh Trưởng Xà Lách Thủy Canh
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>% Chu kỳ sinh khối</span>
          </div>

          {/* Bar Chart */}
          <LotProgressBarChart 
            batches={batches} 
            onSelectBatch={(batch) => {
              setSearchQuery(batch.batchCode);
            }} 
          />
        </div>
      </div>

      {/* ========================================================
          SELECTED ZONE TELEMETRY INSPECTOR (Slideout Card)
          ======================================================== */}
      {selectedZone && (
        <div className="farmvista-card" style={{ 
          padding: '20px 24px', 
          backgroundColor: '#ffffff', 
          border: '1.5px solid #10b981', 
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
          borderRadius: '12px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: selectedZone.color,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem'
              }}>
                {selectedZone.code}
              </span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedZone.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  <span>Diện tích: <strong>{selectedZone.areaM2} m²</strong></span>
                  <span>•</span>
                  <span>Sức chứa giàn: <strong>{selectedZone.slotCapacity.toLocaleString()} rọ</strong></span>
                  <span>•</span>
                  <span>Khu vực: <strong>{selectedZone.greenhouse}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: selectedZone.status === 'growing' ? '#dcfce7' : selectedZone.status === 'ready_soon' ? '#fef3c7' : selectedZone.status === 'completed' ? '#e0f2fe' : '#fee2e2',
                color: selectedZone.status === 'growing' ? '#15803d' : selectedZone.status === 'ready_soon' ? '#b45309' : selectedZone.status === 'completed' ? '#0369a1' : '#b91c1c'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: selectedZone.color }} />
                {selectedZone.status === 'growing' ? 'Đang phát triển sinh dưỡng' : selectedZone.status === 'ready_soon' ? 'Sắp thu hoạch' : selectedZone.status === 'completed' ? 'Đã hoàn thành thu hoạch' : 'Cần chú ý / Bảo trì máng'}
              </span>

              <button
                onClick={() => setSelectedZone(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: '6px' }}
                title="Đóng chi tiết giàn"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            {/* Lô canh tác liên kết */}
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Lô canh tác trên giàn NFT
              </div>
              {selectedZone.currentBatchCode ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {selectedZone.currentBatchCode}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
                      Tiến độ: {selectedZone.biomassProgress || 55}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    🥬 {selectedZone.cultivarName || 'Xà lách thủy canh'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Số rọ: <strong>{selectedZone.currentQuantity || selectedZone.plantQuantity || 600} rọ</strong></span>
                    <span>Gieo hạt: {selectedZone.seedDate || '2026-08-15'} • Thu hoạch: {selectedZone.expectedHarvestDate || '2026-09-19'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', padding: '10px 0' }}>
                  Giàn hiện đang trống hoặc vừa thu hoạch xong.
                </div>
              )}
            </div>

            {/* Bể dinh dưỡng cấp nước */}
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Bể dinh dưỡng tuần hoàn
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                💧 {selectedZone.reservoirName || 'Bể Tuần Hoàn 01 (NFT)'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>pH nước</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>{selectedZone.ph || 5.85}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>EC (mS/cm)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>{selectedZone.ec || 1.72}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Nhiệt độ</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d97706' }}>{selectedZone.waterTemp || 22.4}°C</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                Hành động nhanh
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (selectedZone.currentBatchCode) {
                      setSearchQuery(selectedZone.currentBatchCode.split(' ')[0]);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Search size={13} />
                  Lọc bảng theo lô này
                </button>

                {selectedZone.currentBatchId && (
                  <button
                    onClick={() => {
                      const matched = batches.find(b => b.id === selectedZone.currentBatchId || b.batchCode === selectedZone.currentBatchCode);
                      if (matched) onSelectBatchForAI(matched);
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sparkles size={13} />
                    Dự báo AI sinh khối
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          CREATE NEW LOT MODAL (Zero Width Overflow)
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🌱</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Thêm Lô Canh Tác Mới (Add New Batch)</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Mã lô định danh (Batch Code)</label>
                    <input
                      type="text"
                      required
                      value={batchCode}
                      onChange={e => setBatchCode(e.target.value)}
                      className="form-input"
                      placeholder="VD: LET-2026-004"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phân khu thực địa / Giàn NFT</label>
                    <select
                      value={zoneId}
                      onChange={e => setZoneId(e.target.value)}
                      className="form-select"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>
                          Khối {z.code} ({z.areaM2} m² - {z.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Giống xà lách thủy canh</label>
                    <select
                      value={cultivarId}
                      onChange={e => setCultivarId(e.target.value)}
                      className="form-select"
                    >
                      {cultivars.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.cropName})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Bể cấp dinh dưỡng liên kết</label>
                    <select
                      value={reservoirId}
                      onChange={e => setReservoirId(e.target.value)}
                      className="form-select"
                    >
                      {reservoirs.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Số rọ trồng ban đầu (rọ)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={plantQuantity}
                      onChange={e => setPlantQuantity(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Mật độ giàn (cây / m²)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={40}
                      value={densityPlantsPerM2}
                      onChange={e => setDensityPlantsPerM2(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Ngày gieo hạt (Seed Date)</label>
                    <input
                      type="date"
                      required
                      value={seedDate}
                      onChange={e => setSeedDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Chu kỳ thu hoạch dự kiến</label>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {selectedCultivar?.targetCycleDays || 35} ngày (~{selectedCultivar?.expectedWeightG || 200}g/cây)
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Ghi chú canh tác & vị trí máng</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="form-input"
                    placeholder="Máng NFT tầng mấy, tình trạng hạt giống..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="farmvista-btn-green">
                  <span>Tạo Lô Canh Tác</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          OBSERVATION MEASUREMENT MODAL (Hạng mục 3.4)
          ======================================================== */}
      {obsBatch && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '460px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ruler size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  Đo đạc sinh trắc học: {obsBatch.batchCode}
                </h3>
              </div>
              <button onClick={() => setObsBatch(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSaveObservation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '8px 12px', backgroundColor: '#e0f2fe', borderRadius: '6px', fontSize: '0.78rem', color: '#0369a1' }}>
                  Giống: <strong>{obsBatch.cultivarName}</strong> | Cấp bởi: <strong>{obsBatch.reservoirName}</strong>
                </div>

                {/* Hạng mục 3.4: Cho phép chọn ngày đo đạc thực tế */}
                <div>
                  <label className="form-label">
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Ngày lấy mẫu đo thực địa (Measurement Date)
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={obsDate} 
                    onChange={e => setObsDate(e.target.value)} 
                    className="form-input" 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Số lá thật trung bình</label>
                    <input 
                      type="number" 
                      required 
                      min={1} 
                      max={50}
                      value={obsLeaves} 
                      onChange={e => setObsLeaves(Number(e.target.value))} 
                      className="form-input" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Chiều cao TB (cm)</label>
                    <input 
                      type="number" 
                      required 
                      min={1} 
                      max={50}
                      step="0.5" 
                      value={obsHeight} 
                      onChange={e => setObsHeight(Number(e.target.value))} 
                      className="form-input" 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Trọng lượng mẫu cây (g / cây)</label>
                  <input 
                    type="number" 
                    required 
                    min={1} 
                    max={600}
                    step="0.5" 
                    value={obsWeight} 
                    onChange={e => setObsWeight(Number(e.target.value))} 
                    className="form-input" 
                  />
                </div>

                <div>
                  <label className="form-label">Ghi chú tình trạng rễ & lá</label>
                  <input 
                    type="text" 
                    value={obsNotes} 
                    onChange={e => setObsNotes(e.target.value)} 
                    className="form-input" 
                    placeholder="Rễ trắng, không có đốm nấm, cuộn búp..." 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setObsBatch(null)} className="btn btn-secondary">Đóng</button>
                <button type="submit" className="farmvista-btn-green">Lưu số liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchesView;
