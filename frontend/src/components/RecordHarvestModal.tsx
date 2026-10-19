import React, { useState, useEffect } from 'react';
import { X, Scale } from 'lucide-react';
import type { CropBatch, Reservoir, HarvestRecord } from '../types/farm';
import { predictLettuceYield } from '../services/aiPredictor';
import '../views/HarvestView.css';

interface RecordHarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBatch?: CropBatch | null;
  batches: CropBatch[];
  reservoirs?: Reservoir[];
  onSubmit: (data: Omit<HarvestRecord, 'id' | 'differencePercent' | 'lossPercentage'>) => void | Promise<void>;
}

export const RecordHarvestModal: React.FC<RecordHarvestModalProps> = ({
  isOpen,
  onClose,
  targetBatch,
  batches,
  reservoirs = [],
  onSubmit
}) => {
  const readyBatches = batches.filter(b => b.status === 'active');

  const getBatchDefaults = (b?: CropBatch) => {
    if (!b) return { plants: 500, weightKg: 95 };
    const plants = b.currentQuantity || b.plantQuantity || 500;
    const weightKg = Math.round((plants * 0.19) * 10) / 10;
    return { plants, weightKg };
  };

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [harvestedPlants, setHarvestedPlants] = useState(500);
  const [totalWeightKg, setTotalWeightKg] = useState(95);
  const [rejectedWeightKg, setRejectedWeightKg] = useState(3.0);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [notes, setNotes] = useState('');

  // Synchronize initial batch when modal opens or targetBatch changes
  useEffect(() => {
    if (!isOpen) return;

    const batchToSelect = (targetBatch && targetBatch.status === 'active')
      ? targetBatch
      : (readyBatches.find(b => b.id === selectedBatchId) || readyBatches[0]);

    if (batchToSelect) {
      setSelectedBatchId(batchToSelect.id);
      const { plants, weightKg } = getBatchDefaults(batchToSelect);
      setHarvestedPlants(plants);
      setTotalWeightKg(weightKg);
    } else {
      setSelectedBatchId('');
    }

    setHarvestDate(new Date().toISOString().split('T')[0]);
    setRejectedWeightKg(3.0);
    setGrade('A');
    setNotes('');
  }, [isOpen, targetBatch]);

  if (!isOpen) return null;

  const selectedBatch = readyBatches.find(b => b.id === selectedBatchId) || 
    (targetBatch && targetBatch.status === 'active' ? targetBatch : readyBatches[0]);

  const handleBatchSelect = (newId: string) => {
    setSelectedBatchId(newId);
    const b = readyBatches.find(item => item.id === newId);
    if (b) {
      const { plants, weightKg } = getBatchDefaults(b);
      setHarvestedPlants(plants);
      setTotalWeightKg(weightKg);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const avgWeightG = Math.round(((Number(totalWeightKg) * 1000) / Number(harvestedPlants)) * 10) / 10;

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

    onSubmit({
      batchId: selectedBatch.id,
      batchCode: selectedBatch.batchCode,
      cultivarName: selectedBatch.cultivarName,
      harvestDate,
      harvestedPlants: Number(harvestedPlants),
      totalWeightKg: Number(totalWeightKg),
      avgWeightG,
      rejectedWeightKg: Number(rejectedWeightKg),
      aiPredictedWeightG: predResult.predictedFreshWeightG,
      grade,
      notes
    });
  };

  return (
    <div className="harvest-modal-overlay" onClick={onClose}>
      <div className="harvest-modal-content" onClick={e => e.stopPropagation()}>
        <div className="harvest-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="#00a651" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Ghi Nhận Thu Hoạch Đợt Mới
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="harvest-modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Chọn lô thu hoạch
                </label>
                <select 
                  className="farmvista-select-pill"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                  value={selectedBatch?.id || ''}
                  onChange={e => handleBatchSelect(e.target.value)}
                  required
                >
                  {readyBatches.length === 0 ? (
                    <option value="" disabled>Không có lô nào đang trồng để thu hoạch</option>
                  ) : (
                    readyBatches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.batchCode} - {b.cultivarName} ({b.currentQuantity || b.plantQuantity} cây)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedBatch && (
                <div style={{
                  gridColumn: 'span 2',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#166534',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Giống: <strong>{selectedBatch.cultivarName}</strong> • {selectedBatch.reservoirName || 'Bể tuần hoàn'}</span>
                  <span style={{ fontWeight: 700, color: '#00a651' }}>{selectedBatch.currentQuantity || selectedBatch.plantQuantity} rọ khả dụng</span>
                </div>
              )}

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
              onClick={onClose} 
              className="farmvista-btn-secondary"
              style={{ height: '36px', fontSize: '0.8125rem', padding: '0 14px' }}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={!selectedBatch}
              className="farmvista-btn-green"
              style={{ 
                height: '36px', 
                fontSize: '0.8125rem', 
                padding: '0 16px',
                opacity: !selectedBatch ? 0.6 : 1,
                cursor: !selectedBatch ? 'not-allowed' : 'pointer'
              }}
            >
              Lưu Thu Hoạch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
