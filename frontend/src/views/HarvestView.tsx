import React, { useState } from 'react';
import { 
  Plus, 
  Download
} from 'lucide-react';
import type { HarvestRecord, CropBatch, Reservoir } from '../types/farm';

import { predictLettuceYield } from '../services/aiPredictor';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Standardized Page Toolbar */}
      <div className="page-toolbar">
        <div style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
          Tổng hợp số liệu sản lượng thực tế và đối chiếu độ lệch với dự báo ban đầu
        </div>

        <div className="toolbar-group">
          <button 
            onClick={handleExportAITrainingData}
            className="btn btn-secondary"
            title="Xuất tập dữ liệu đối chứng Ground Truth để tái huấn luyện mô hình Machine Learning"
            style={{ height: '36px', boxSizing: 'border-box' }}
          >
            <Download size={15} color="var(--primary-700)" />
            <span>Xuất Dataset Huấn Luyện AI</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ height: '36px', boxSizing: 'border-box' }}
          >
            <Download size={15} />
            <span>Xuất file CSV</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ height: '36px', boxSizing: 'border-box' }}
          >
            <Plus size={15} />
            <span>Ghi nhận thu hoạch</span>
          </button>
        </div>
      </div>

      {/* Standardized KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Tổng sản lượng đã thu</div>
            <div className="kpi-value">
              {totalHarvestKg} <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-muted)' }}>kg</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Độ lệch TB so với AI dự báo</div>
            <div className="kpi-value" style={{ color: 'var(--primary-700)' }}>
              ±{avgErrorPercent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Độ chính xác {parseFloat(avgErrorPercent) < 5 ? 'xuất sắc (< ±5%)' : 'chấp nhận được'}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Tỷ lệ rau loại 1 (Grade A)</div>
            <div className="kpi-value" style={{ color: 'var(--primary-700)' }}>
              {gradeAPercent}% <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-muted)' }}>({gradeACount}/{harvests.length} đợt)</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Tiêu chuẩn xuất bán siêu thị
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Số đợt thu hoạch</div>
            <div className="kpi-value">
              {harvests.length} <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-muted)' }}>đợt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Harvest Data Table */}
      <div className="clean-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              Lịch sử thu hoạch & so sánh năng suất
            </h3>
            <p className="card-subtitle">
              Ghi nhận cân nặng thực tế để làm dữ liệu chuẩn (Ground Truth) đánh giá hiệu quả canh tác
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Giống xà lách</th>
                <th>Ngày thu</th>
                <th>Số cây</th>
                <th>Tổng sản lượng</th>
                <th>TB (g/cây)</th>
                <th>Dự báo ban đầu</th>
                <th>Chênh lệch</th>
                <th>Hao hụt</th>
                <th>Phân hạng</th>
              </tr>
            </thead>
            <tbody>
              {harvests.map(h => (
                <tr key={h.id}>
                  <td><span className="mono" style={{ fontWeight: 600 }}>{h.batchCode}</span></td>
                  <td style={{ fontWeight: 500 }}>{h.cultivarName}</td>
                  <td>{h.harvestDate}</td>
                  <td>{h.harvestedPlants.toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{h.totalWeightKg} kg</td>
                  <td style={{ fontWeight: 600 }}>{h.avgWeightG} g</td>
                  <td style={{ color: 'var(--text-subtle)' }}>{h.aiPredictedWeightG} g</td>
                  <td>
                    <span className={`badge ${Math.abs(h.differencePercent) <= 5 ? 'badge-success' : 'badge-warning'}`}>
                      {h.differencePercent > 0 ? `+${h.differencePercent}%` : `${h.differencePercent}%`}
                    </span>
                  </td>
                  <td>{h.lossPercentage}%</td>
                  <td>
                    <span className="badge badge-neutral">
                      Hạng {h.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Harvest Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Ghi nhận thu hoạch đợt mới
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '1.25rem' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleHarvestSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Chọn lô thu hoạch</label>
                    <select 
                      className="form-select"
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

                  <div className="form-group">
                    <label className="form-label">Ngày thu hoạch</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={harvestDate} 
                      onChange={e => setHarvestDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số cây thực thu</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={harvestedPlants} 
                      onChange={e => setHarvestedPlants(Number(e.target.value))} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tổng khối lượng đạt chuẩn (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input" 
                      value={totalWeightKg} 
                      onChange={e => setTotalWeightKg(Number(e.target.value))} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Khối lượng loại bỏ / giập hỏng (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input" 
                      value={rejectedWeightKg} 
                      onChange={e => setRejectedWeightKg(Number(e.target.value))} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phân loại chất lượng</label>
                    <select 
                      className="form-select"
                      value={grade}
                      onChange={e => setGrade(e.target.value as 'A' | 'B' | 'C')}
                    >
                      <option value="A">Hạng A (Chuẩn bán lẻ siêu thị)</option>
                      <option value="B">Hạng B (Bán sỉ nhà hàng)</option>
                      <option value="C">Hạng C (Chế biến)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="Màu sắc lá, độ giòn..." 
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Lưu thu hoạch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
