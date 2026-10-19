import React, { useState } from 'react';
import { 
  Plus, 
  Download,
  Scale,
  Sparkles,
  Award,
  Layers,
  X
} from 'lucide-react';
import type { HarvestRecord, CropBatch, Reservoir } from '../types/farm';
import { predictLettuceYield } from '../services/aiPredictor';
import './HarvestView.css';

interface HarvestViewProps {
  harvests: HarvestRecord[];
  batches: CropBatch[];
  reservoirs?: Reservoir[];
  onRecordHarvest: (data: Omit<HarvestRecord, 'id' | 'differencePercent' | 'lossPercentage'>) => void;
}

export const HarvestView: React.FC<HarvestViewProps> = ({
  harvests,
  batches,
  reservoirs = [],
  onRecordHarvest
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Eligible batches for harvest (active)
  const readyBatches = batches.filter(b => b.status === 'active');

  // Form state
  const [selectedBatchId, setSelectedBatchId] = useState(readyBatches[0]?.id || '');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [harvestedPlants, setHarvestedPlants] = useState(600);
  const [totalWeightKg, setTotalWeightKg] = useState(115.5);
  const [rejectedWeightKg, setRejectedWeightKg] = useState(3.5);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [notes, setNotes] = useState('');

  const selectedBatch = batches.find(b => b.id === selectedBatchId) || readyBatches[0];

  const handleHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const avgWeightG = Math.round(((Number(totalWeightKg) * 1000) / Number(harvestedPlants)) * 10) / 10;
    
    // Compute genuine AI model prediction using actual reservoir parameters of this batch
    const seedTime = new Date(selectedBatch.seedDate).getTime();
    const hDate = new Date(harvestDate).getTime();
    const ageDays = Math.max(1, Math.round((hDate - seedTime) / (1000 * 3600 * 24)));
    const batchRes = reservoirs.find(r => r.id === selectedBatch.reservoirId);
    
    const predResult = predictLettuceYield({
      batchId: selectedBatch.id,
      batchCode: selectedBatch.batchCode,
      cultivarName: selectedBatch.cultivarName,
      plantAgeDays: ageDays,
      leafCount: selectedBatch.lastObservation?.avgLeafCount || Math.max(16, Math.round(ageDays * 0.6)),
      plantHeightCm: selectedBatch.lastObservation?.avgHeightCm || Math.max(16, Math.round(ageDays * 0.55)),
      avgEc: batchRes ? batchRes.currentEc : 1.72,
      avgPh: batchRes ? batchRes.currentPh : 5.85,
      avgWaterTemp: batchRes ? batchRes.currentWaterTemp : 22.4,
      expectedPlants: Number(harvestedPlants)
    });
    const aiPredG = predResult.predictedFreshWeightG;

    onRecordHarvest({
      batchId: selectedBatch.id,
      batchCode: selectedBatch.batchCode,
      cultivarName: selectedBatch.cultivarName,
      harvestDate,
      harvestedPlants: Number(harvestedPlants),
      totalWeightKg: Number(totalWeightKg),
      avgWeightG,
      rejectedWeightKg: Number(rejectedWeightKg),
      aiPredictedWeightG: aiPredG,
      grade,
      notes
    });

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Mã Lô', 'Giống Xà Lách', 'Ngày Thu Hoạch', 'Số Cây', 'Tổng KG', 'Khối Lượng TB (g/cây)', 'Dự Báo (g/cây)', 'Sai Lệch (%)', 'Hao Hụt (%)', 'Hạng'];
    const rows = harvests.map(h => [
      h.batchCode,
      h.cultivarName,
      h.harvestDate,
      h.harvestedPlants,
      h.totalWeightKg,
      h.avgWeightG,
      h.aiPredictedWeightG,
      `${h.differencePercent}%`,
      `${h.lossPercentage}%`,
      h.grade
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nhat_ky_thu_hoach_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAITrainingData = () => {
    const headers = ['batch_code', 'cultivar', 'harvest_date', 'harvested_plants', 'total_weight_kg', 'actual_fresh_weight_g', 'ai_predicted_weight_g', 'difference_percent', 'loss_percent', 'grade'];
    const rows = harvests.map(h => [
      h.batchCode,
      h.cultivarName,
      h.harvestDate,
      h.harvestedPlants,
      h.totalWeightKg,
      h.avgWeightG,
      h.aiPredictedWeightG,
      h.differencePercent,
      h.lossPercentage,
      h.grade
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_ground_truth_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const avgErrorPercent = harvests.length > 0
    ? (harvests.reduce((acc, h) => acc + Math.abs(h.differencePercent), 0) / harvests.length).toFixed(2)
    : '0.00';

  const totalHarvestKg = harvests.reduce((acc, h) => acc + h.totalWeightKg, 0).toFixed(1);

  const gradeACount = harvests.filter(h => h.grade === 'A').length;
  const gradeAPercent = harvests.length > 0 ? Math.round((gradeACount / harvests.length) * 100) : 0;

  return (
    <div className="harvest-container">
      {/* ========================================================
          1. HEADER: Synchronized Top Bar
          ======================================================== */}
      <div className="harvest-header">
        <div className="harvest-header-left">
          <div>
            <h1 className="harvest-title">
              <Scale size={22} color="#00a651" />
              Lịch Sử Thu Hoạch & Ground Truth AI
            </h1>
            <div className="harvest-subtitle">
              Ghi nhận năng suất thực tế, đối chiếu sai số mô hình AI và xuất tập dữ liệu huấn luyện
            </div>
          </div>
        </div>

        <div className="harvest-header-actions">
          <span className="harvest-status-pill">
            <span className="dot" />
            {harvests.length} đợt đã thu hoạch
          </span>

          <button 
            onClick={handleExportAITrainingData}
            className="farmvista-btn-secondary"
            title="Xuất tập dữ liệu đối chứng Ground Truth để tái huấn luyện mô hình Machine Learning"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
          >
            <Sparkles size={14} color="#00a651" />
            <span>Dataset AI</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="farmvista-btn-secondary"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
          >
            <Download size={14} />
            <span>Xuất CSV</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="farmvista-btn-green"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 14px' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Ghi Nhận Thu Hoạch</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. KPI CARDS: 4 Standardized Metric Cards
          ======================================================== */}
      <div className="harvest-kpis">
        {/* Metric 1: Tổng sản lượng */}
        <div className="harvest-kpi-card">
          <div className="harvest-kpi-top">
            <span className="harvest-kpi-label">Tổng Sản Lượng Thực Thu</span>
            <div className="harvest-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <Scale size={17} />
            </div>
          </div>
          <div className="harvest-kpi-val" style={{ color: '#00a651' }}>
            {totalHarvestKg} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>kg</span>
          </div>
          <div className="harvest-kpi-meta">
            <span>Toàn bộ các vụ</span>
            <span className="harvest-kpi-badge green">
              Năng suất cao
            </span>
          </div>
        </div>

        {/* Metric 2: Độ lệch trung bình so với AI */}
        <div className="harvest-kpi-card">
          <div className="harvest-kpi-top">
            <span className="harvest-kpi-label">Độ Lệch TB vs Dự Báo AI</span>
            <div className="harvest-kpi-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Sparkles size={17} />
            </div>
          </div>
          <div className="harvest-kpi-val" style={{ color: '#0284c7' }}>
            ±{avgErrorPercent}%
          </div>
          <div className="harvest-kpi-meta">
            <span>Sai số thuật toán</span>
            <span className={`harvest-kpi-badge ${parseFloat(avgErrorPercent) <= 5 ? 'green' : 'amber'}`}>
              {parseFloat(avgErrorPercent) <= 5 ? 'Chính xác cao (<5%)' : 'Chấp nhận được'}
            </span>
          </div>
        </div>

        {/* Metric 3: Tỷ lệ loại A */}
        <div className="harvest-kpi-card">
          <div className="harvest-kpi-top">
            <span className="harvest-kpi-label">Rau Đạt Chuẩn Loại 1 (A)</span>
            <div className="harvest-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <Award size={17} />
            </div>
          </div>
          <div className="harvest-kpi-val">
            {gradeAPercent}% <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>({gradeACount}/{harvests.length} đợt)</span>
          </div>
          <div className="harvest-kpi-meta">
            <span>Tiêu chuẩn bán siêu thị</span>
            <span className="harvest-kpi-badge green">
              Đạt chứng nhận
            </span>
          </div>
        </div>

        {/* Metric 4: Số đợt thu hoạch */}
        <div className="harvest-kpi-card">
          <div className="harvest-kpi-top">
            <span className="harvest-kpi-label">Tổng Đợt Thu Hoạch</span>
            <div className="harvest-kpi-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <Layers size={17} />
            </div>
          </div>
          <div className="harvest-kpi-val">
            {harvests.length} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>đợt</span>
          </div>
          <div className="harvest-kpi-meta">
            <span>Lô hoàn tất chu kỳ</span>
            <span className="harvest-kpi-badge blue">
              100% kiểm định
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CLEAN DATA TABLE: Lịch sử & Đối chiếu Ground Truth
          ======================================================== */}
      <div className="harvest-card">
        <div className="harvest-card-header">
          <div>
            <h3 className="harvest-card-title">Lịch Sử Thu Hoạch & Đối Chiếu Năng Suất</h3>
            <div className="harvest-card-subtitle">
              Số liệu đối chứng Ground Truth phục vụ kiểm định độ chính xác thuật toán vi khí hậu
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="harvest-table">
            <thead>
              <tr>
                <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Mã Lô Trồng</th>
                <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Giống Xà Lách</th>
                <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Ngày Thu</th>
                <th style={{ minWidth: '90px', whiteSpace: 'nowrap' }}>Số Cây</th>
                <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Tổng Sản Lượng</th>
                <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>KL Thực Tế</th>
                <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>AI Dự Báo</th>
                <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Sai Lệch</th>
                <th style={{ minWidth: '90px', whiteSpace: 'nowrap' }}>Hao Hụt</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Phân Hạng</th>
              </tr>
            </thead>
            <tbody>
              {harvests.map(h => (
                <tr key={h.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="harvest-code-badge">{h.batchCode}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {h.cultivarName}
                  </td>
                  <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                    {h.harvestDate}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {h.harvestedPlants.toLocaleString()} rọ
                  </td>
                  <td style={{ fontWeight: 700, color: '#00a651', whiteSpace: 'nowrap' }}>
                    {h.totalWeightKg} kg
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {h.avgWeightG} g/cây
                  </td>
                  <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                    {h.aiPredictedWeightG} g/cây
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span 
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: Math.abs(h.differencePercent) <= 5 ? '#ecfdf5' : '#fffbeb',
                        color: Math.abs(h.differencePercent) <= 5 ? '#16a34a' : '#b45309',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {h.differencePercent > 0 ? `+${h.differencePercent}%` : `${h.differencePercent}%`}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                    {h.lossPercentage}%
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span className={`harvest-grade-pill grade-${h.grade}`}>
                      Hạng {h.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          4. RECORD HARVEST MODAL: Clean Pop-up
          ======================================================== */}
      {isModalOpen && (
        <div className="harvest-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="harvest-modal-content" onClick={e => e.stopPropagation()}>
            <div className="harvest-modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Ghi Nhận Thu Hoạch Đợt Mới
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHarvestSubmit}>
              <div className="harvest-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Chọn lô thu hoạch
                    </label>
                    <select 
                      className="farmvista-select-pill"
                      style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                      value={selectedBatchId}
                      onChange={e => setSelectedBatchId(e.target.value)}
                    >
                      {readyBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchCode} - {b.cultivarName} ({b.currentQuantity} cây)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Ngày thu hoạch
                    </label>
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                      value={harvestDate} 
                      onChange={e => setHarvestDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Số cây thực thu
                    </label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                      value={harvestedPlants} 
                      onChange={e => setHarvestedPlants(Number(e.target.value))} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Tổng khối lượng đạt (kg)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                      value={totalWeightKg} 
                      onChange={e => setTotalWeightKg(Number(e.target.value))} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Khối lượng giập/hỏng (kg)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                      value={rejectedWeightKg} 
                      onChange={e => setRejectedWeightKg(Number(e.target.value))} 
                      required 
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Phân loại chất lượng
                    </label>
                    <select 
                      className="farmvista-select-pill"
                      style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                      value={grade}
                      onChange={e => setGrade(e.target.value as 'A' | 'B' | 'C')}
                    >
                      <option value="A">Hạng A (Chuẩn xuất bán lẻ siêu thị)</option>
                      <option value="B">Hạng B (Bán sỉ nhà hàng, đóng gói túi)</option>
                      <option value="C">Hạng C (Chế biến nước ép / salad sơ chế)</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Ghi chú thêm
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="Màu sắc bẹ lá, độ cuộn, vị giòn ngọt..." 
                    />
                  </div>
                </div>
              </div>

              <div className="harvest-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="farmvista-btn-secondary"
                  style={{ height: '36px', fontSize: '0.8125rem', padding: '0 14px' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="farmvista-btn-green"
                  style={{ height: '36px', fontSize: '0.8125rem', padding: '0 16px' }}
                >
                  Lưu Thu Hoạch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
