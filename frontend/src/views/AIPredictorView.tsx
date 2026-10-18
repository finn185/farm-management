import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, 
  Calendar, 
  Leaf, 
  Zap, 
  Thermometer, 
  CheckCircle2, 
  Scale, 
  Sprout, 
  Sliders, 
  Check, 
  TrendingUp, 
  Clock, 
  Sparkles,
  Download,
  X,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import type { CropBatch, Reservoir, Cultivar } from '../types/farm';
import { predictLettuceYield } from '../services/aiPredictor';

interface AIPredictorViewProps {
  batches: CropBatch[];
  selectedBatch?: CropBatch | null;
  reservoirs?: Reservoir[];
  cultivars?: Cultivar[];
}

interface CustomGrowthTooltipProps {
  active?: boolean;
  payload?: any[];
  targetDays: number;
  daysPlanted: number;
}

const CustomGrowthTooltip: React.FC<CustomGrowthTooltipProps> = ({
  active,
  payload,
  targetDays,
  daysPlanted
}) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    const dayNum = data.dayNum;
    const stdWeight = data.stdWeight;
    const actual = data.actualWeight;
    const ai = data.aiProjected;
    const isToday = data.isCurrent;

    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        fontSize: '12px',
        minWidth: '185px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
          <strong style={{ color: '#0f172a', fontSize: '13px' }}>Ngày {dayNum} / {targetDays}</strong>
          {isToday ? (
            <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              Hôm nay
            </span>
          ) : dayNum < daysPlanted ? (
            <span style={{ fontSize: '10px', backgroundColor: '#e8f8f0', color: '#00a651', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Đã qua
            </span>
          ) : (
            <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Dự phóng AI
            </span>
          )}
        </div>

        {actual !== null && actual !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#00a651', fontWeight: 600, margin: '3px 0' }}>
            <span>Thực tế lô cây:</span>
            <span>{actual} g/cây</span>
          </div>
        )}

        {ai !== null && ai !== undefined && dayNum > daysPlanted && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#059669', fontWeight: 600, margin: '3px 0' }}>
            <span>Dự báo AI:</span>
            <span>{ai} g/cây</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#64748b', margin: '3px 0' }}>
          <span>Chuẩn giống:</span>
          <span>{stdWeight} g/cây</span>
        </div>
      </div>
    );
  }
  return null;
};

export const AIPredictorView: React.FC<AIPredictorViewProps> = ({
  batches,
  selectedBatch,
  reservoirs = [],
  cultivars = []
}) => {
  const activeBatches = batches.filter(b => b.status === 'active');

  // Selected Batch State
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    selectedBatch ? selectedBatch.id : (activeBatches[0]?.id || '')
  );

  const currentBatch = batches.find(b => b.id === selectedBatchId) || activeBatches[0];
  const currentCultivar = cultivars.find(c => c.id === currentBatch?.cultivarId);
  const currentReservoir = reservoirs.find(r => r.id === currentBatch?.reservoirId);

  // Simulation Mode: 'live' (Thực tế) vs 'simulate' (Thử nghiệm)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simEc, setSimEc] = useState<number>(1.72);
  const [simDaysOffset, setSimDaysOffset] = useState<number>(0);

  // Modal & Toast States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute live parameters from batch & reservoir
  const liveData = useMemo(() => {
    if (!currentBatch) {
      return { age: 26, leaves: 16, height: 15.2, ec: 1.72, ph: 5.85, temp: 22.4, plants: 600, sampleWeight: 142.5 };
    }
    const seedTime = new Date(currentBatch.seedDate).getTime();
    const expTime = new Date(currentBatch.expectedHarvestDate).getTime();
    const obsTime = currentBatch.lastObservation ? new Date(currentBatch.lastObservation.date).getTime() : 0;
    const nowTime = new Date().getTime();
    
    // In mock timeline where system date > harvest date, anchor around last observation (+2 days)
    let rawAge: number;
    if (nowTime > expTime && obsTime > seedTime) {
      rawAge = Math.round((obsTime - seedTime) / (1000 * 3600 * 24)) + 2;
    } else {
      rawAge = Math.round((nowTime - seedTime) / (1000 * 3600 * 24));
    }

    const targetCycle = currentCultivar?.targetCycleDays || 35;
    const age = Math.min(Math.max(1, rawAge), targetCycle - 1);
    
    const leaves = currentBatch.lastObservation?.avgLeafCount || Math.max(4, Math.round(age * 0.6));
    const height = currentBatch.lastObservation?.avgHeightCm || Math.max(4, Math.round(age * 0.55));
    const sampleWeight = currentBatch.lastObservation?.sampleWeightG;
    const res = reservoirs.find(r => r.id === currentBatch.reservoirId);
    const ec = res ? res.currentEc : 1.72;
    const ph = res ? res.currentPh : 5.85;
    const temp = res ? res.currentWaterTemp : 22.4;
    const plants = currentBatch.currentQuantity;

    return { age, leaves, height, ec, ph, temp, plants, sampleWeight };
  }, [currentBatch, currentCultivar, reservoirs]);

  // Sync state when batch changes
  useEffect(() => {
    setSimEc(liveData.ec);
    setSimDaysOffset(0);
    setIsSimulating(false);
  }, [selectedBatchId, liveData]);

  // Cycle calculations
  const targetDays = currentCultivar?.targetCycleDays || 35;
  const standardWeightG = currentCultivar?.expectedWeightG || 190;
  const daysPlanted = liveData.age;
  const daysLeft = Math.max(0, targetDays - daysPlanted + simDaysOffset);

  const plannedHarvestDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + daysLeft);
    return d;
  }, [daysLeft]);

  // Estimated/measured plant weight today (e.g. 142.5g)
  const currentPlantWeightG = useMemo(() => {
    if (liveData.sampleWeight) return liveData.sampleWeight;
    const inflection = targetDays * 0.66;
    const gFactor = 1 / (1 + Math.exp(-0.20 * (daysPlanted - inflection)));
    return Math.round(standardWeightG * 1.05 * gFactor * 10) / 10;
  }, [liveData.sampleWeight, targetDays, daysPlanted, standardWeightG]);

  // Run AI Yield Prediction
  const prediction = useMemo(() => {
    if (!currentBatch) return null;
    const effectiveAge = Math.min(targetDays + 5, daysPlanted + (isSimulating ? simDaysOffset : 0));
    const effectiveEc = isSimulating ? simEc : liveData.ec;

    return predictLettuceYield({
      batchId: currentBatch.id,
      batchCode: currentBatch.batchCode,
      cultivarName: currentBatch.cultivarName,
      targetCycleDays: targetDays,
      expectedWeightG: standardWeightG,
      plantAgeDays: effectiveAge,
      leafCount: liveData.leaves,
      plantHeightCm: liveData.height,
      avgEc: effectiveEc,
      avgPh: liveData.ph,
      avgWaterTemp: liveData.temp,
      expectedPlants: liveData.plants
    });
  }, [currentBatch, targetDays, standardWeightG, daysPlanted, isSimulating, simDaysOffset, simEc, liveData]);

  const predictedWeightG = prediction?.predictedFreshWeightG || standardWeightG;
  const totalBatchYieldKg = prediction?.totalBatchYieldKg || Math.round((predictedWeightG * liveData.plants) / 1000);
  const diffPercent = Math.round(((predictedWeightG - standardWeightG) / standardWeightG) * 100);

  // Baseline Live Yield for comparison
  const baselineYieldKg = useMemo(() => {
    if (!currentBatch) return totalBatchYieldKg;
    const base = predictLettuceYield({
      batchId: currentBatch.id,
      batchCode: currentBatch.batchCode,
      cultivarName: currentBatch.cultivarName,
      targetCycleDays: targetDays,
      expectedWeightG: standardWeightG,
      plantAgeDays: daysPlanted,
      leafCount: liveData.leaves,
      plantHeightCm: liveData.height,
      avgEc: liveData.ec,
      avgPh: liveData.ph,
      avgWaterTemp: liveData.temp,
      expectedPlants: liveData.plants
    });
    return base.totalBatchYieldKg;
  }, [currentBatch, targetDays, standardWeightG, daysPlanted, liveData]);

  const simulationYieldDiff = isSimulating ? Number((totalBatchYieldKg - baselineYieldKg).toFixed(1)) : 0;

  // Growth Curve Chart points across targetDays
  const growthCurveData = useMemo(() => {
    const inflection = targetDays * 0.66;
    const maxStdWeight = standardWeightG;

    const points = [];
    const stepDays = [1, 5, 10, 15, 20, 25, daysPlanted, 30, targetDays];
    const uniqueDays = Array.from(new Set(stepDays)).sort((a, b) => a - b);

    for (const d of uniqueDays) {
      // Standard cultivar curve (Chuẩn giống lý thuyết)
      const stdFactor = 1 / (1 + Math.exp(-0.20 * (d - inflection)));
      const stdVal = Math.max(2, Math.round(maxStdWeight * stdFactor));

      let actualVal: number | null = null;
      let aiVal: number | null = null;

      if (d < daysPlanted) {
        // Actual historical growth up to yesterday
        const curFactor = 1 / (1 + Math.exp(-0.20 * (d - inflection)));
        const ageFactor = 1 / (1 + Math.exp(-0.20 * (daysPlanted - inflection)));
        actualVal = Math.max(2, Math.round((currentPlantWeightG * (curFactor / ageFactor)) * 10) / 10);
      } else if (d === daysPlanted) {
        // Today is the intersection point: both lines connect cleanly
        actualVal = currentPlantWeightG;
        aiVal = currentPlantWeightG;
      } else {
        // Future AI projection from today to harvest
        const remainingDays = targetDays - daysPlanted;
        const progressInRemaining = (d - daysPlanted) / Math.max(1, remainingDays);
        const projected = currentPlantWeightG + (predictedWeightG - currentPlantWeightG) * Math.pow(progressInRemaining, 0.88);
        aiVal = Math.round(projected * 10) / 10;
      }

      points.push({
        day: `N.${d}`,
        dayNum: d,
        stdWeight: stdVal,
        actualWeight: actualVal,
        aiProjected: aiVal,
        isCurrent: d === daysPlanted
      });
    }
    return points;
  }, [targetDays, standardWeightG, daysPlanted, currentPlantWeightG, predictedWeightG]);

  // Overall Health Diagnostic
  const isEcOk = liveData.ec >= 1.5 && liveData.ec <= 1.85;
  const isPhOk = liveData.ph >= 5.6 && liveData.ph <= 6.2;
  const isTempOk = liveData.temp >= 19 && liveData.temp <= 24;

  if (!currentBatch) {
    return (
      <div className="farmvista-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.9rem' }}>Hiện chưa có lô cây trồng nào đang vận hành.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* ========================================================
          1. HEADER: Title, Cultivar Quick Selector & Actions
          ======================================================== */}
      {/* ========================================================
          1. HEADER: Title, Current Batch Context & Actions
          ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em', margin: 0 }}>
              Dự Báo Sản Lượng & Năng Suất AI
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#e8f8f0',
              color: '#00a651',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <Sparkles size={13} color="#00a651" />
              <span>AI Trợ Lý Nông Học</span>
            </span>
          </div>

          {/* Direct Batch Context Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
              Đang xem lô: <strong style={{ color: 'var(--text-main)' }}>{currentBatch.cultivarName} (Lô {currentBatch.batchCode})</strong>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
              Bể cấp: <strong style={{ color: 'var(--text-main)' }}>{currentReservoir?.name.split('-')[0].trim() || 'Bể Tuần Hoàn 01'}</strong>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: '#00a651', fontWeight: 700 }}>
              Ngày {daysPlanted} / {targetDays} (Còn {daysLeft} ngày đến thu hoạch)
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Leaf size={14} color="#00a651" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="farmvista-select-pill"
              style={{
                height: '38px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}
            >
              {activeBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchCode} • {b.cultivarName} ({b.currentQuantity} rọ)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="farmvista-btn-secondary"
            style={{ height: '38px', padding: '0 16px', fontSize: '0.8125rem' }}
          >
            <Download size={14} color="#00a651" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {toastMsg && (
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
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================
          2. DẢI 4 THẺ CHỈ SỐ DỰ BÁO CỐT LÕI (Không trùng lặp, trực quan 100%)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        
        {/* Thẻ 1: Khối lượng hiện tại */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a651', flexShrink: 0 }}>
            <Sprout size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Khối lượng cây hôm nay</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              ~{currentPlantWeightG} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>g / cây</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              Mẫu đo Ngày {daysPlanted} (Chuẩn {Math.round(standardWeightG * 0.71)}g)
            </div>
          </div>
        </div>

        {/* Thẻ 2: Khối lượng ngày thu hoạch */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
            <Scale size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Dự báo ngày thu hoạch</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', lineHeight: 1.1, marginTop: '2px' }}>
              {predictedWeightG} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>g / cây</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
              {diffPercent >= 0 ? `↑ +${diffPercent}%` : `↓ ${diffPercent}%`} so với chuẩn giống ({standardWeightG}g)
            </div>
          </div>
        </div>

        {/* Thẻ 3: Tổng sản lượng cả lô */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Tổng sản lượng dự kiến</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalBatchYieldKg} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
              Ước tính trên {liveData.plants} rọ cây
            </div>
          </div>
        </div>

        {/* Thẻ 4: Ngày thu hoạch dự kiến */}
        <div className="farmvista-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>Ngày thu hoạch dự kiến</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {plannedHarvestDate.toLocaleDateString('vi-VN')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#00a651" />
              <span>Còn {daysLeft} ngày (Grade A • 82% xuất khẩu)</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          3. KHU VỰC TRỌNG TÂM: BIỂU ĐỒ ĐƯỜNG CONG TĂNG TRƯỞNG & DỰ PHÓNG AI (FULL-WIDTH)
          ======================================================== */}
      <div className="farmvista-card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '0.005em' }}>
                Đường Cong Sinh Trưởng & Dự Báo Sinh Khối ({targetDays} Ngày)
              </h3>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#e8f8f0', color: '#00a651', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                {currentBatch.cultivarName} • Lô {currentBatch.batchCode}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)', marginTop: '4px', margin: '4px 0 0 0' }}>
              Đường xanh ngọc nét liền thể hiện tiến trình thực tế đến Ngày {daysPlanted}, đường nét đứt thể hiện quỹ đạo AI dự phóng đến ngày thu hoạch.
            </p>
          </div>
          <span style={{
            fontSize: '0.78rem',
            backgroundColor: '#e8f8f0',
            color: '#00a651',
            padding: '5px 14px',
            borderRadius: '999px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00a651' }} />
            Hôm nay: Ngày {daysPlanted} / {targetDays} • Còn {daysLeft} ngày nữa
          </span>
        </div>

        {/* Recharts Area Chart Full-Width */}
        <div style={{ width: '100%', height: '320px', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthCurveData} margin={{ top: 28, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a651" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00a651" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="aiProjectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                axisLine={{ stroke: '#e2e8f0' }} 
                tickLine={false} 
              />
              <YAxis 
                domain={[0, Math.ceil(Math.max(predictedWeightG, standardWeightG, 200) * 1.15 / 50) * 50]} 
                ticks={[0, 50, 100, 150, 200, 250]}
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(v) => `${v}g`}
              />
              <Tooltip content={<CustomGrowthTooltip targetDays={targetDays} daysPlanted={daysPlanted} />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                iconType="plainline"
              />
              
              {/* Đường chuẩn giống */}
              <Area 
                type="monotone" 
                dataKey="stdWeight" 
                name="Chuẩn giống lý thuyết" 
                stroke="#94a3b8" 
                strokeWidth={1.8} 
                strokeDasharray="4 4"
                fill="none"
                isAnimationActive={false}
              />

              {/* Vùng & Đường Thực tế sinh trưởng (Ngày 1 -> Hôm nay) */}
              <Area 
                type="monotone" 
                dataKey="actualWeight" 
                name="Thực tế sinh trưởng (Lô này)" 
                stroke="#00a651" 
                strokeWidth={3} 
                fill="url(#actualGrowthGrad)" 
                dot={{ r: 4, fill: '#00a651', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#00a651', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* Vùng & Đường Dự phóng AI (Hôm nay -> Thu hoạch) */}
              <Area 
                type="monotone" 
                dataKey="aiProjected" 
                name="Dự báo AI tương lai" 
                stroke="#059669" 
                strokeWidth={2.5} 
                strokeDasharray="5 4"
                fill="url(#aiProjectedGrad)" 
                dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* Mốc chỉ định HÔM NAY */}
              <ReferenceLine 
                x={`N.${daysPlanted}`} 
                stroke="#f59e0b" 
                strokeWidth={1.5}
                strokeDasharray="3 3" 
                label={{ 
                  value: `Hôm nay (N.${daysPlanted})`, 
                  fill: '#d97706', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  position: 'top',
                  offset: 6
                }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Thanh đối chiếu dưới chân biểu đồ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '14px',
          marginTop: '12px',
          fontSize: '0.8125rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00a651' }} />
            <span style={{ color: 'var(--text-subtle)' }}>Khối lượng hôm nay:</span>
            <strong style={{ color: 'var(--text-main)' }}>~{currentPlantWeightG}g</strong>
            <span style={{ fontSize: '0.75rem', color: '#00a651', fontWeight: 600 }}>(Mẫu đo N.{daysPlanted})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            <span style={{ color: 'var(--text-subtle)' }}>Mục tiêu thu hoạch:</span>
            <strong style={{ color: '#059669' }}>{predictedWeightG} g/cây</strong>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
              ({diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`} chuẩn)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} color="#d97706" />
            <span style={{ color: 'var(--text-subtle)' }}>Tiến trình chu kỳ:</span>
            <strong style={{ color: 'var(--text-main)' }}>Ngày {daysPlanted}/{targetDays}</strong>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>({Math.round((daysPlanted / targetDays) * 100)}%)</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. HÀNG 2 CỘT: KHUYẾN NGHỊ KỸ THUẬT (Trái) & GIẢ ĐỊNH (Phải)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* CỘT TRÁI: 3 VIỆC AI KHUYÊN LÀM HÔM NAY (Agronomic Actions) */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#00a651" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  3 Việc AI Khuyên Bạn Làm Hôm Nay
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#e8f8f0', color: '#00a651', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>
                Hành động thực tế
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '0 0 14px 0' }}>
              Các chỉ dẫn trực tiếp dựa trên phân tích dinh dưỡng và vi khí hậu thực tế của lô cây.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Việc 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Zap size={16} />
                </div>
                <div style={{ fontSize: '0.8125rem', lineHeight: 1.45, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ color: '#15803d' }}>Duy trì dung dịch dinh dưỡng bồn chứa:</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', padding: '1px 8px', borderRadius: '999px' }}>
                      EC {liveData.ec} mS/cm • pH {liveData.ph} ({isEcOk && isPhOk ? 'Tối ưu' : 'Cần chú ý'})
                    </span>
                  </div>
                  Bể cấp hiện tại đạt EC {liveData.ec} mS/cm rất lý tưởng cho {currentBatch.cultivarName}. Chưa cần châm thêm phân Can A & B hôm nay.
                </div>
              </div>

              {/* Việc 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Thermometer size={16} />
                </div>
                <div style={{ fontSize: '0.8125rem', lineHeight: 1.45, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ color: '#b45309' }}>Bật quạt đối lưu phòng háp lá buổi trưa:</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 8px', borderRadius: '999px' }}>
                      Nước {liveData.temp}°C ({isTempOk ? 'Mát rễ' : 'Cần hạ nhiệt'}) • Tán {liveData.height}cm
                    </span>
                  </div>
                  Thời điểm từ 11:30 - 14:00 nhiệt độ nhà màng thường tăng cao, chú ý duy trì quạt thông gió để tránh hiện tượng cháy viền lá (tipburn).
                </div>
              </div>

              {/* Việc 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Clock size={16} />
                </div>
                <div style={{ fontSize: '0.8125rem', lineHeight: 1.45, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ color: '#0369a1' }}>Kế hoạch thu hoạch sáng sớm (5:30 - 7:00):</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '1px 8px', borderRadius: '999px' }}>
                      Dự kiến: {plannedHarvestDate.toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  Thu hoạch vào lúc sáng sớm mát mẻ ngày {plannedHarvestDate.toLocaleDateString('vi-VN')} để rau ngậm đủ nước, giòn ngọt và giữ tươi lâu nhất.
                </div>
              </div>

            </div>
          </div>

          <button
            onClick={() => {
              setToastMsg('Đã xác nhận ghi nhớ các khuyến nghị kỹ thuật!');
              setTimeout(() => setToastMsg(null), 3000);
            }}
            className="farmvista-btn-secondary"
            style={{ width: '100%', height: '36px', justifyContent: 'center', marginTop: '14px', fontSize: '0.8125rem' }}
          >
            <Check size={14} color="#00a651" />
            <span>Xác Nhận Đã Nắm Rõ Kế Hoạch</span>
          </button>
        </div>

        {/* CỘT PHẢI: STUDIO THỬ NGHIỆM GIẢ ĐỊNH (WHAT-IF SIMULATION) */}
        <div className="farmvista-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={16} color="#00a651" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Thử Nghiệm Kịch Bản Giả Định
                </h3>
              </div>

              {isSimulating && (
                <button
                  onClick={() => {
                    setSimEc(liveData.ec);
                    setSimDaysOffset(0);
                    setIsSimulating(false);
                  }}
                  className="farmvista-btn-secondary"
                  style={{ height: '26px', padding: '0 8px', fontSize: '0.72rem' }}
                >
                  <RotateCcw size={11} />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '0 0 16px 0' }}>
              Thử chỉnh nồng độ phân hoặc lùi ngày cắt để xem sản lượng thay đổi ra sao:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Slider 1: EC */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Thử tăng / giảm EC dinh dưỡng:</span>
                  <strong style={{ color: '#00a651', fontSize: '0.875rem' }}>{simEc.toFixed(2)} mS/cm</strong>
                </div>
                <input 
                  type="range" 
                  min="1.30" 
                  max="2.20" 
                  step="0.05"
                  value={simEc} 
                  onChange={e => {
                    setSimEc(parseFloat(e.target.value));
                    setIsSimulating(true);
                  }}
                  style={{ width: '100%', accentColor: '#00a651', cursor: 'pointer' }}
                />
              </div>

              {/* Slider 2: Ngày thu hoạch */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Thời điểm cắt rau:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
                    {simDaysOffset === 0 ? 'Đúng hạn (Ngày 35)' : simDaysOffset > 0 ? `Lùi thêm +${simDaysOffset} ngày` : `Cắt sớm ${simDaysOffset} ngày`}
                  </strong>
                </div>
                <input 
                  type="range" 
                  min="-3" 
                  max="4" 
                  step="1"
                  value={simDaysOffset} 
                  onChange={e => {
                    setSimDaysOffset(Number(e.target.value));
                    setIsSimulating(true);
                  }}
                  style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
                />
              </div>

              {/* Hộp kết quả nhảy số tức thì */}
              <div style={{
                padding: '14px',
                backgroundColor: isSimulating ? (simulationYieldDiff >= 0 ? '#f0fdf4' : '#fffbeb') : '#f8fafc',
                border: `1px solid ${isSimulating ? (simulationYieldDiff >= 0 ? '#bbf7d0' : '#fde68a') : '#e2e8f0'}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    {isSimulating ? 'Sản lượng nếu áp dụng giả định:' : 'Hiện trạng thực tế của lô:'}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {totalBatchYieldKg} kg <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#00a651' }}>({predictedWeightG}g / cây)</span>
                  </div>
                </div>

                {isSimulating && (
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: simulationYieldDiff >= 0 ? '#15803d' : '#b45309',
                    backgroundColor: simulationYieldDiff >= 0 ? '#dcfce7' : '#fef3c7',
                    padding: '4px 10px',
                    borderRadius: '999px'
                  }}>
                    {simulationYieldDiff >= 0 ? `↑ +${simulationYieldDiff} kg` : `↓ ${simulationYieldDiff} kg`}
                  </span>
                )}
              </div>

            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center', marginTop: '12px' }}>
            {isSimulating ? '⚡ Bạn đang ở chế độ thử nghiệm kịch bản' : '✓ Thông số đang lấy chính xác từ bể dinh dưỡng'}
          </div>
        </div>

      </div>

      {/* ========================================================
          6. MODAL: Xuất Báo Cáo Tóm Tắt AI
          ======================================================== */}
      {isReportModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#00a651" />
                <span>Báo Cáo Tóm Tắt Dự Báo Năng Suất</span>
              </h3>
              <button 
                onClick={() => setIsReportModalOpen(false)} 
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
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: '8px', color: '#166534' }}>
                <strong>Lô canh tác:</strong> {currentBatch.batchCode} • {currentBatch.cultivarName} ({daysPlanted} ngày tuổi)
                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px' }}>
                  Ngày thu hoạch dự kiến: <strong>{plannedHarvestDate.toLocaleDateString('vi-VN')}</strong> (Còn {daysLeft} ngày)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Khối lượng dự kiến</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00a651' }}>{predictedWeightG} g/cây</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mục tiêu giống: {standardWeightG}g</div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Tổng sản lượng cả lô</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>{totalBatchYieldKg} kg</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quy mô: {liveData.plants} rọ cây</div>
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Các kết luận kỹ thuật chính:</strong>
                <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.78rem' }}>
                  <li>Nồng độ dinh dưỡng EC đạt {liveData.ec.toFixed(2)} mS/cm, nằm trong ngưỡng tối ưu hấp thụ của rau.</li>
                  <li>Độ pH duy trì {liveData.ph.toFixed(2)}, rễ không bị hiện tượng phong tỏa dưỡng chất.</li>
                  <li>Tỷ lệ cây đạt chuẩn Grade A ước tính 82%, sẵn sàng cho các đơn hàng siêu thị.</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => {
                  setIsReportModalOpen(false);
                  setToastMsg('Đã lưu và xuất báo cáo dự báo AI thành công!');
                  setTimeout(() => setToastMsg(null), 3000);
                }} 
                className="farmvista-btn-green"
                style={{ height: '36px', padding: '0 20px' }}
              >
                <Check size={14} />
                <span>Hoàn Tất & Lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIPredictorView;
