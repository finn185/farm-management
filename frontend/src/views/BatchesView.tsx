import React, { useState } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import type { CropBatch, Cultivar, Reservoir, GrowthStage } from '../types/farm';

interface BatchesViewProps {
  batches: CropBatch[];
  cultivars: Cultivar[];
  reservoirs: Reservoir[];
  onAddBatch: (batch: Omit<CropBatch, 'id' | 'status'>) => void;
  onDeleteBatch: (id: string) => void;
  onSelectBatchForAI: (batch: CropBatch) => void;
  onAddObservation?: (batchId: string, obs: { date?: string; avgLeafCount: number; avgHeightCm: number; sampleWeightG: number; notes?: string }) => void;
  onAdvanceStage?: (batchId: string, newStage: GrowthStage) => void;
}

// Initial mock lots matching FarmVista Lot Management screenshot
interface LotItem {
  id: string;
  lotId: string;
  lotName: string;
  cropName: string;
  cropIcon: string;
  fieldZone: string;
  areaAcres: number;
  plantingDate: string;
  growthStage: string;
  growthStageIcon: string;
  progressPercent: number;
  expectedHarvest: string;
  status: 'Growing' | 'Ready Soon' | 'Completed' | 'Needs Attention';
  linkedBatchId?: string;
}

const DEFAULT_LOTS: LotItem[] = [
  {
    id: 'l1',
    lotId: 'LT-001',
    lotName: 'Giàn NFT A1 - Nhà màng 1',
    cropName: 'Romaine Lettuce',
    cropIcon: '🥬',
    fieldZone: 'Nhà màng A',
    areaAcres: 500,
    plantingDate: '18 Mar 2024',
    growthStage: 'Sinh dưỡng',
    growthStageIcon: '🌿',
    progressPercent: 75,
    expectedHarvest: '20 Oct 2024',
    status: 'Growing',
  },
  {
    id: 'l2',
    lotId: 'LT-002',
    lotName: 'Giàn NFT B2 - Nhà màng 1',
    cropName: 'Green Oak Leaf',
    cropIcon: '🥬',
    fieldZone: 'Nhà màng B',
    areaAcres: 300,
    plantingDate: '12 Aug 2024',
    growthStage: 'Hồi xanh',
    growthStageIcon: '🍃',
    progressPercent: 60,
    expectedHarvest: '15 Sep 2024',
    status: 'Ready Soon',
  },
  {
    id: 'l3',
    lotId: 'LT-003',
    lotName: 'Giàn NFT C1 - Nhà màng 2',
    cropName: 'Batavia Lettuce',
    cropIcon: '🥬',
    fieldZone: 'Nhà màng C',
    areaAcres: 800,
    plantingDate: '05 Apr 2024',
    growthStage: 'Phát triển thân tán',
    growthStageIcon: '🌱',
    progressPercent: 50,
    expectedHarvest: '15 Nov 2024',
    status: 'Growing',
  },
  {
    id: 'l4',
    lotId: 'LT-004',
    lotName: 'Giàn NFT D1 - Nhà màng 2',
    cropName: 'Butterhead',
    cropIcon: '🥬',
    fieldZone: 'Nhà màng D',
    areaAcres: 400,
    plantingDate: '10 Apr 2024',
    growthStage: 'Cuộn búp',
    growthStageIcon: '🥬',
    progressPercent: 90,
    expectedHarvest: '25 Oct 2024',
    status: 'Growing',
  },
  {
    id: 'l5',
    lotId: 'LT-005',
    lotName: 'Vườn ươm E1 - Nhà màng 1',
    cropName: 'Sweet Basil',
    cropIcon: '🌿',
    fieldZone: 'Khu ươm E',
    areaAcres: 100,
    plantingDate: '20 Aug 2024',
    growthStage: 'Cây con (Seedling)',
    growthStageIcon: '🌱',
    progressPercent: 40,
    expectedHarvest: '10 Oct 2024',
    status: 'Needs Attention',
  },
  {
    id: 'l6',
    lotId: 'LT-006',
    lotName: 'Giàn NFT A2 - Nhà màng 1',
    cropName: 'Cải Kale thủy canh',
    cropIcon: '🥬',
    fieldZone: 'Nhà màng A',
    areaAcres: 600,
    plantingDate: '01 Mar 2024',
    growthStage: 'Thu hoạch (Harvest)',
    growthStageIcon: '🍃',
    progressPercent: 95,
    expectedHarvest: '05 Oct 2024',
    status: 'Completed',
  },
];

// SVG Aerial Field Layout Component - Clean & Minimal
const FieldLayoutMap: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '14px', overflow: 'hidden', background: '#1c4731' }}>
      <svg width="100%" height="100%" viewBox="0 0 520 220" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="farmGroundGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e4d35" />
            <stop offset="50%" stopColor="#153b27" />
            <stop offset="100%" stopColor="#1e4d35" />
          </linearGradient>
        </defs>

        {/* Nền xanh phẳng mượt */}
        <rect width="520" height="220" fill="url(#farmGroundGrad)" />

        {/* Cụm bóng cây góc nhẹ nhàng */}
        <g fill="#102e1f" opacity="0.75">
          <circle cx="20" cy="30" r="14" />
          <circle cx="36" cy="22" r="16" />
          <circle cx="490" cy="25" r="15" />
          <circle cx="505" cy="40" r="16" />
          <circle cx="15" cy="190" r="16" />
          <circle cx="35" cy="205" r="14" />
        </g>

        {/* Hồ nước xanh trong phẳng mượt */}
        <path d="M 460 70 C 480 60, 510 75, 515 110 C 520 150, 485 180, 470 170 C 455 160, 445 130, 450 100 Z" fill="#0284c7" />
        <path d="M 465 75 C 482 68, 505 80, 510 110 C 514 145, 485 170, 472 162 C 459 154, 452 128, 455 102 Z" fill="#38bdf8" opacity="0.75" />

        {/* Trục đường giao nhau đơn giản */}
        <rect x="235" y="10" width="12" height="200" fill="#64748b" rx="2" opacity="0.6" />
        <rect x="40" y="108" width="400" height="10" fill="#64748b" rx="2" opacity="0.6" />

        {/* Khối A1 (500 m², Xanh lá) */}
        <g style={{ cursor: 'pointer' }}>
          <rect x="45" y="20" width="180" height="80" rx="8" fill="#16a34a" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
          <text x="135" y="55" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="800" fontFamily="var(--font-sans)">A1</text>
          <text x="135" y="74" textAnchor="middle" fill="#dcfce7" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">500 m²</text>
        </g>

        {/* Khối A2 (600 m², Xanh chuối) */}
        <g style={{ cursor: 'pointer' }}>
          <rect x="45" y="125" width="180" height="78" rx="8" fill="#84cc16" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
          <text x="135" y="160" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="800" fontFamily="var(--font-sans)">A2</text>
          <text x="135" y="179" textAnchor="middle" fill="#f7fee7" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">600 m²</text>
        </g>

        {/* Khối B2 (300 m², Cam) */}
        <g style={{ cursor: 'pointer' }}>
          <rect x="255" y="20" width="85" height="80" rx="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
          <text x="297" y="55" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">B2</text>
          <text x="297" y="74" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">300 m²</text>
        </g>

        {/* Khối D1 (400 m², Xanh dương) */}
        <g style={{ cursor: 'pointer' }}>
          <rect x="348" y="20" width="92" height="80" rx="8" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
          <text x="394" y="55" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">D1</text>
          <text x="394" y="74" textAnchor="middle" fill="#e0f2fe" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">400 m²</text>
        </g>

        {/* Khối C1 (800 m², Tím) */}
        <g style={{ cursor: 'pointer' }}>
          <rect x="255" y="125" width="105" height="78" rx="8" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
          <text x="307" y="160" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">C1</text>
          <text x="307" y="179" textAnchor="middle" fill="#ede9fe" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">800 m²</text>
        </g>

        {/* Khối E1 (100 m², Đỏ) */}
        <g style={{ cursor: 'pointer' }}>
          <rect x="368" y="125" width="72" height="78" rx="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
          <text x="404" y="160" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)">E1</text>
          <text x="404" y="179" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">100 m²</text>
        </g>

        {/* La bàn tròn nhỏ ở góc dưới phải */}
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

// SVG Bar Chart Component for Lot Progress Overview
const LotProgressBarChart: React.FC = () => {
  const data = [
    { name: 'Xà lách Romaine', count: '6 giàn', percent: 75, color: '#22c55e' },
    { name: 'Green Oak Leaf', count: '4 giàn', percent: 60, color: '#86efac' },
    { name: 'Batavia Lettuce', count: '3 giàn', percent: 50, color: '#facc15' },
    { name: 'Butterhead', count: '4 giàn', percent: 90, color: '#f97316' },
    { name: 'Sweet Basil', count: '2 giàn', percent: 40, color: '#a855f7' },
  ];

  const maxH = 140;

  return (
    <div style={{ width: '100%', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '10px' }}>
      <div style={{ position: 'relative', width: '100%', height: '170px', display: 'flex', alignItems: 'flex-end', paddingLeft: '36px', paddingRight: '12px' }}>
        {/* Horizontal gridlines and Y-axis percentage labels */}
        {[100, 75, 50, 25, 0].map((val) => {
          const bottomPos = (val / 100) * maxH;
          return (
            <div key={val} style={{ position: 'absolute', left: 0, right: 0, bottom: bottomPos + 20, display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '32px', fontSize: '10px', color: '#94a3b8', textAlign: 'right', paddingRight: '6px' }}>
                {val}%
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: val === 0 ? '#cbd5e1' : '#f1f5f9' }} />
            </div>
          );
        })}

        {/* Bars Container */}
        <div style={{ width: '100%', height: maxH, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', zIndex: 2 }}>
          {data.map((item) => {
            const barHeight = (item.percent / 100) * maxH;
            return (
              <div key={item.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '42px' }}>
                {/* Value on top of bar */}
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  {item.percent}%
                </span>
                {/* Bar */}
                <div
                  style={{
                    width: '36px',
                    height: `${barHeight}px`,
                    backgroundColor: item.color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis Crop Labels underneath */}
      <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: '36px', paddingRight: '12px', marginTop: '6px' }}>
        {data.map((item) => (
          <div key={item.name} style={{ textAlign: 'center', width: '56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>({item.count})</div>
          </div>
        ))}
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
  onAdvanceStage
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'growing' | 'ready' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All Crops');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [sortOption, setSortOption] = useState('Default');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Observation Modal state
  const [obsBatch, setObsBatch] = useState<CropBatch | null>(null);
  const [obsDate, setObsDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [obsLeaves, setObsLeaves] = useState<number>(14);
  const [obsHeight, setObsHeight] = useState<number>(14);
  const [obsWeight, setObsWeight] = useState<number>(120);
  const [obsNotes, setObsNotes] = useState<string>('');

  // Form State for creating batch
  const [batchCode, setBatchCode] = useState(`LT-00${DEFAULT_LOTS.length + batches.length + 1}`);
  const [lotName, setLotName] = useState('Greenhouse Zone A');
  const [cultivarId, setCultivarId] = useState(cultivars[0]?.id || '');
  const [reservoirId, setReservoirId] = useState(reservoirs[0]?.id || '');
  const [plantQuantity, setPlantQuantity] = useState(500);
  const [areaAcres, setAreaAcres] = useState(30);
  const [seedDate, setSeedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const selectedCultivar = cultivars.find(c => c.id === cultivarId) || cultivars[0];

  // Combine default lots with user created batches
  const userLots: LotItem[] = batches.map((b, idx) => {
    let status: LotItem['status'] = 'Growing';
    if (b.status === 'harvested') status = 'Completed';
    else if (b.currentStage === 'pre_harvest' || b.currentStage === 'harvest') status = 'Ready Soon';

    return {
      id: b.id,
      lotId: b.batchCode || `LT-0${idx + 7}`,
      lotName: b.notes ? b.notes.split('\n')[0] : `Máng ${b.reservoirName || 'Khu A'}`,
      cropName: b.cropName || b.cultivarName || 'Lettuce',
      cropIcon: b.cropName?.toLowerCase().includes('tomato') ? '🍅' : b.cropName?.toLowerCase().includes('basil') ? '🌿' : '🥬',
      fieldZone: b.reservoirName ? b.reservoirName.split(' ')[0] : 'Zone A',
      areaAcres: b.plantQuantity ? Math.round(b.plantQuantity / 25) : 25,
      plantingDate: b.seedDate,
      growthStage: b.currentStage === 'seedling' ? 'Seedling' : b.currentStage === 'vegetative' ? 'Vegetative' : 'Harvesting',
      growthStageIcon: '🍃',
      progressPercent: b.status === 'harvested' ? 100 : b.currentStage === 'pre_harvest' ? 85 : 55,
      expectedHarvest: b.expectedHarvestDate,
      status,
      linkedBatchId: b.id
    };
  });

  const allLots = [...DEFAULT_LOTS, ...userLots];

  // Filter lots
  const filteredLots = allLots.filter((lot) => {
    // Tab Filter
    if (activeTab === 'active' && lot.status === 'Completed') return false;
    if (activeTab === 'growing' && lot.status !== 'Growing') return false;
    if (activeTab === 'ready' && lot.status !== 'Ready Soon') return false;
    if (activeTab === 'completed' && lot.status !== 'Completed') return false;

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = lot.lotId.toLowerCase().includes(q) || lot.lotName.toLowerCase().includes(q) || lot.cropName.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Crop Filter
    if (selectedCropFilter !== 'All Crops' && lot.cropName !== selectedCropFilter) return false;

    // Status Filter
    if (selectedStatusFilter !== 'All Status' && lot.status !== selectedStatusFilter) return false;

    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const sDate = new Date(seedDate);
    const expDate = new Date(sDate);
    expDate.setDate(sDate.getDate() + (selectedCultivar?.targetCycleDays || 35));

    const transDate = new Date(sDate);
    transDate.setDate(sDate.getDate() + 12);

    const res = reservoirs.find(r => r.id === reservoirId);

    onAddBatch({
      batchCode,
      cultivarId,
      cultivarName: selectedCultivar?.name || 'Xà lách',
      cropName: selectedCultivar?.cropName || 'Xà lách',
      systemType: 'NFT',
      reservoirId,
      reservoirName: res?.name || 'Bể A',
      plantQuantity: Number(plantQuantity),
      currentQuantity: Number(plantQuantity),
      seedDate,
      transplantDate: transDate.toISOString().split('T')[0],
      expectedHarvestDate: expDate.toISOString().split('T')[0],
      currentStage: 'seedling',
      densityPlantsPerM2: 25,
      notes: `${lotName} - Diện tích: ${areaAcres} acres. ${notes}`,
      lastObservation: {
        date: seedDate,
        avgLeafCount: 4,
        avgHeightCm: 4.5,
        sampleWeightG: 15.0
      }
    });

    setIsCreateModalOpen(false);
    setBatchCode(`LT-00${allLots.length + 2}`);
  };

  const handleOpenObservationModal = (batch: CropBatch) => {
    setObsBatch(batch);
    setObsDate(batch.lastObservation?.date || new Date().toISOString().split('T')[0]);
    setObsLeaves(batch.lastObservation?.avgLeafCount || 10);
    setObsHeight(batch.lastObservation?.avgHeightCm || 10);
    setObsWeight(batch.lastObservation?.sampleWeightG || 80);
    setObsNotes(batch.lastObservation?.notes || '');
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* ========================================================
          PAGE HEADER: Title, Subtitle & "+ Add New Lot" Button
          ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em', margin: 0 }}>
            Quản Lý Lô Trồng Thủy Canh
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px', margin: '4px 0 0 0' }}>
            Giám sát và quản lý các giàn NFT, máng trồng, bể dinh dưỡng tuần hoàn và tiến độ sinh trưởng rau xà lách.
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
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#008f45')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00a651')}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Thêm Lô Trồng Mới</span>
        </button>
      </div>

      {/* ========================================================
          KPI CARDS (4 Cards in a Row)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {/* Metric 1: Total Lots */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <Sprout size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Tổng số giàn NFT</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              24 giàn
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              ↑ +3 giàn so với vụ trước
            </div>
          </div>
        </div>

        {/* Metric 2: Active Lots */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <Leaf size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Giàn đang vận hành</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              18 giàn
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              75% công suất nhà màng
            </div>
          </div>
        </div>

        {/* Metric 3: Total Planting Area */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Tổng diện tích giàn NFT</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              3,200 m²
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              12,000 rọ trồng (↑ +12%)
            </div>
          </div>
        </div>

        {/* Metric 4: Ready for Harvest */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Sắp thu hoạch</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              5 lô
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500, marginTop: '4px' }}>
              Trong 7 - 10 ngày tới
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          FILTER TABS & CONTROLS TOOLBAR
          ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        {/* Left Filter Pill Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả giàn (${allLots.length})` },
            { id: 'active', label: `Đang trồng (18)` },
            { id: 'growing', label: `Sinh dưỡng (12)` },
            { id: 'ready', label: `Sắp thu hoạch (5)` },
            { id: 'completed', label: `Đã hoàn tất (6)` }
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

        {/* Right Search and Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search lots input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '200px'
          }}>
            <Search size={15} color="var(--text-disabled)" />
            <input
              type="text"
              placeholder="Tìm lô, máng NFT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.8125rem', color: 'var(--text-main)', width: '100%' }}
            />
          </div>

          {/* All Crops Select */}
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="farmvista-select-pill"
            style={{ borderRadius: '8px', height: '34px' }}
          >
            <option value="All Crops">Tất cả giống rau</option>
            <option value="Romaine Lettuce">Xà lách Romaine</option>
            <option value="Green Oak Leaf">Green Oak Leaf</option>
            <option value="Batavia Lettuce">Batavia Lettuce</option>
            <option value="Butterhead">Butterhead</option>
            <option value="Sweet Basil">Sweet Basil</option>
            <option value="Cải Kale thủy canh">Cải Kale thủy canh</option>
          </select>

          {/* All Status Select */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="farmvista-select-pill"
            style={{ borderRadius: '8px', height: '34px' }}
          >
            <option value="All Status">Tất cả trạng thái</option>
            <option value="Growing">Đang lớn (Growing)</option>
            <option value="Ready Soon">Sắp thu hoạch (Ready Soon)</option>
            <option value="Needs Attention">Cần chú ý EC/pH</option>
            <option value="Completed">Đã thu hoạch (Completed)</option>
          </select>

          {/* Sort By Select */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ArrowUpDown size={13} color="var(--text-subtle)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="farmvista-select-pill"
              style={{ borderRadius: '8px', height: '34px', paddingLeft: '28px' }}
            >
              <option value="Default">Sắp xếp theo</option>
              <option value="Name">Tên giàn / Lô</option>
              <option value="Area">Diện tích (m²)</option>
              <option value="Harvest">Ngày thu hoạch</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          LOTS DATA TABLE (Exact Columns from FarmVista)
          ======================================================== */}
      <div className="farmvista-card" style={{ padding: '16px 20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Mã Lô</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Tên Giàn / Lô</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Giống Rau</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Khu / Nhà Màng</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Diện tích (m²)</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Ngày Gieo / Cấy</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Giai Đoạn</th>
              <th style={{ padding: '12px 10px', fontWeight: 600, minWidth: '120px' }}>Tiến Độ</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Dự Kiến Thu Hoạch</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Trạng Thái</th>
              <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredLots.map((lot) => {
              const matchedBatch = batches.find(b => b.id === lot.linkedBatchId);

              return (
                <tr key={lot.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.1s ease' }}>
                  {/* Lot ID */}
                  <td style={{ padding: '14px 10px', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    {lot.lotId}
                  </td>

                  {/* Lot Name */}
                  <td style={{ padding: '14px 10px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {lot.lotName}
                  </td>

                  {/* Crop */}
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.15rem' }}>{lot.cropIcon}</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{lot.cropName}</span>
                    </div>
                  </td>

                  {/* Field / Zone */}
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                    {lot.fieldZone}
                  </td>

                  {/* Area */}
                  <td style={{ padding: '14px 10px', color: 'var(--text-main)', fontWeight: 500 }}>
                    {lot.areaAcres} m²
                  </td>

                  {/* Planting Date */}
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                    {lot.plantingDate}
                  </td>

                  {/* Growth Stage */}
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                      <span>{lot.growthStageIcon}</span>
                      <span>{lot.growthStage}</span>
                    </div>
                  </td>

                  {/* Progress */}
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.75rem', width: '32px' }}>{lot.progressPercent}%</span>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${lot.progressPercent}%`, height: '100%', backgroundColor: '#00a651', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </td>

                  {/* Expected Harvest */}
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                    {lot.expectedHarvest}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '14px 10px' }}>
                    {lot.status === 'Growing' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                        Growing
                      </span>
                    )}
                    {lot.status === 'Ready Soon' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.72rem', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        Ready Soon
                      </span>
                    )}
                    {lot.status === 'Needs Attention' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        Needs Attention
                      </span>
                    )}
                    {lot.status === 'Completed' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
                        Completed
                      </span>
                    )}
                  </td>

                  {/* Actions Three Dots Menu */}
                  <td style={{ padding: '14px 10px', textAlign: 'center', position: 'relative' }}>
                    <button
                      onClick={() => setActiveActionMenuId(activeActionMenuId === lot.id ? null : lot.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: '4px' }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeActionMenuId === lot.id && (
                      <div style={{
                        position: 'absolute',
                        right: '10px',
                        top: '40px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 20,
                        padding: '6px',
                        minWidth: '160px',
                        textAlign: 'left'
                      }}>
                        <button
                          onClick={() => {
                            if (matchedBatch) {
                              onSelectBatchForAI(matchedBatch);
                            } else {
                              alert(`Lô ${lot.lotId} được chuyển tới phân hệ Dự báo sản lượng AI!`);
                            }
                            setActiveActionMenuId(null);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-main)', borderRadius: '4px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <TrendingUp size={14} color="#00a651" />
                          <span>Dự báo AI</span>
                        </button>

                        <button
                          onClick={() => {
                            if (matchedBatch) {
                              handleOpenObservationModal(matchedBatch);
                            } else {
                              alert(`Mở phiếu ghi nhận sinh trưởng cho lô ${lot.lotId}`);
                            }
                            setActiveActionMenuId(null);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-main)', borderRadius: '4px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Ruler size={14} color="#0284c7" />
                          <span>Ghi nhận số đo</span>
                        </button>

                        {onAdvanceStage && matchedBatch && matchedBatch.currentStage !== 'harvest' && (
                          <button
                            onClick={() => {
                              const stages: GrowthStage[] = ['seed', 'germination', 'seedling', 'transplant', 'vegetative', 'pre_harvest', 'harvest'];
                              const curIdx = stages.indexOf(matchedBatch.currentStage);
                              if (curIdx >= 0 && curIdx < stages.length - 1) {
                                onAdvanceStage(matchedBatch.id, stages[curIdx + 1]);
                              }
                              setActiveActionMenuId(null);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-main)', borderRadius: '4px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Sprout size={14} color="#16a34a" />
                            <span>Chuyển giai đoạn tiếp</span>
                          </button>
                        )}

                        {matchedBatch && (
                          <button
                            onClick={() => {
                              onDeleteBatch(matchedBatch.id);
                              setActiveActionMenuId(null);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626', borderRadius: '4px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={14} />
                            <span>Xóa lô</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ========================================================
          BOTTOM GRID: Field Layout (Map) + Lot Progress Overview (Bar Chart)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)', gap: '20px' }}>
        
        {/* CARD LEFT: Field Layout */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Field Layout
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px', margin: '4px 0 16px 0' }}>
              Sơ đồ trực quan các lô trồng và trạng thái thực địa.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '18px', alignItems: 'center' }}>
            {/* Aerial SVG Map */}
            <FieldLayoutMap />

            {/* Right Status Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Lot Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Growing</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>12</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Ready Soon</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>5</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Completed</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>6</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Needs Attention</span>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>1</strong>
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
            <select className="farmvista-select-pill" style={{ borderRadius: '8px', height: '30px' }}>
              <option value="All Crops">Tất cả giống rau</option>
              <option value="Romaine Lettuce">Xà lách Romaine</option>
              <option value="Green Oak Leaf">Green Oak Leaf</option>
              <option value="Batavia Lettuce">Batavia Lettuce</option>
              <option value="Butterhead">Xà lách Butterhead</option>
              <option value="Sweet Basil">Sweet Basil</option>
            </select>
          </div>

          {/* Bar Chart */}
          <LotProgressBarChart />
        </div>
      </div>

      {/* ========================================================
          CREATE NEW LOT MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Thêm Lô Canh Tác Mới (Add New Lot)</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Mã lô (Lot ID)</label>
                    <input
                      type="text"
                      required
                      value={batchCode}
                      onChange={e => setBatchCode(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Tên khu vực (Lot Name)</label>
                    <input
                      type="text"
                      required
                      value={lotName}
                      onChange={e => setLotName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Giống cây trồng (Crop)</label>
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
                    <label className="form-label">Bể cấp dinh dưỡng</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Số rọ trồng NFT (rọ)</label>
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
                    <label className="form-label">Diện tích máng trồng (m²)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={areaAcres}
                      onChange={e => setAreaAcres(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Ngày gieo trồng (Planting Date)</label>
                  <input
                    type="date"
                    required
                    value={seedDate}
                    onChange={e => setSeedDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Ghi chú canh tác</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="form-input"
                    placeholder="Máng canh tác, tình trạng hạt giống..."
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
                  <span>Tạo Lô Trồng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          OBSERVATION MEASUREMENT MODAL
          ======================================================== */}
      {obsBatch && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Ghi nhận sinh trưởng: {obsBatch.batchCode}</h3>
              <button onClick={() => setObsBatch(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSaveObservation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Ngày đo đạc thực tế</label>
                  <input 
                    type="date" 
                    required 
                    value={obsDate} 
                    onChange={e => setObsDate(e.target.value)} 
                    className="form-input" 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Số lá thật TB</label>
                    <input type="number" required min={1} value={obsLeaves} onChange={e => setObsLeaves(Number(e.target.value))} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Chiều cao TB (cm)</label>
                    <input type="number" required min={1} step="0.5" value={obsHeight} onChange={e => setObsHeight(Number(e.target.value))} className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Trọng lượng mẫu cây (g)</label>
                  <input type="number" required min={1} step="1" value={obsWeight} onChange={e => setObsWeight(Number(e.target.value))} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Ghi chú</label>
                  <input type="text" value={obsNotes} onChange={e => setObsNotes(e.target.value)} className="form-input" placeholder="Tình trạng lá, rễ..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setObsBatch(null)} className="btn btn-secondary">Đóng</button>
                <button type="submit" className="farmvista-btn-green">Lưu dữ liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchesView;
