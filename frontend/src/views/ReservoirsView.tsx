import React, { useState } from 'react';
import { 
  Plus, 
  Droplet,
  CheckCircle2,
  Layers,
  History,
  FlaskConical,
  X
} from 'lucide-react';
import type { Reservoir, NutrientFormula, Channel, SolutionDrainEvent, CropBatch } from '../types/farm';

interface ReservoirsViewProps {
  reservoirs: Reservoir[];
  formulas: NutrientFormula[];
  channels: Channel[];
  batches: CropBatch[];
  drainEvents: SolutionDrainEvent[];
  onAddMeasurement: (data: { reservoirId: string; ph: number; ec: number; waterTemp: number; doLevel?: number }) => void;
  onUpdateVolume: (reservoirId: string, addedLiters: number) => void;
  onDrainReservoir: (event: Omit<SolutionDrainEvent, 'id'>) => void;
  onApplyDosing?: (reservoirId: string, targetEc: number, doseMl: number) => void;
}

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
  // Modal states
  const [activeModalResId, setActiveModalResId] = useState<string>(reservoirs[0]?.id || '');
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

  // Success message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const activeModalRes = reservoirs.find(r => r.id === activeModalResId) || reservoirs[0];
  const [formPh, setFormPh] = useState(5.85);
  const [formEc, setFormEc] = useState(1.72);
  const [formTemp, setFormTemp] = useState(22.4);
  const [topUpLiters, setTopUpLiters] = useState(50);
  const [drainReason, setDrainReason] = useState<SolutionDrainEvent['reason']>('end_of_batch');
  const [drainOperator, setDrainOperator] = useState('Kỹ thuật viên');
  const [drainNotes, setDrainNotes] = useState('');

  const openLogModal = (res: Reservoir) => {
    setActiveModalResId(res.id);
    setFormPh(res.currentPh);
    setFormEc(res.currentEc);
    setFormTemp(res.currentWaterTemp);
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
      waterTemp: parseFloat(String(formTemp))
    });
    setIsLogModalOpen(false);
    showNotice(`Đã lưu kết quả đo mới cho ${activeModalRes?.name.split('-')[0].trim() || 'bể'}`);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVolume(activeModalResId, Number(topUpLiters));
    setIsTopUpModalOpen(false);
    showNotice(`Đã bù ${topUpLiters}L nước sạch vào ${activeModalRes?.name.split('-')[0].trim() || 'bể'}`);
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
    showNotice(`Đã xả nước thành công cho ${activeModalRes.name.split('-')[0].trim()}`);
  };

  const showNotice = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleApplyDosingForTank = (res: Reservoir, targetEc: number, doseMl: number) => {
    if (onApplyDosing && doseMl > 0) {
      onApplyDosing(res.id, targetEc, doseMl);
      const shortName = res.name.split('-')[0].trim();
      showNotice(`Đã châm ${doseMl}ml Can A và Can B vào ${shortName}. Nồng độ EC đã đạt ${targetEc} mS/cm.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Header Toolbar: Tinh gọn, không dài dòng */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Quản lý Bể Dinh Dưỡng
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Hệ thống hồi lưu NFT • {reservoirs.length} bồn nước đang hoạt động
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsFormulaModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            <FlaskConical size={14} color="var(--primary-600)" />
            <span>Công thức pha kho</span>
          </button>

          <button
            onClick={() => setIsDrainHistoryModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            <History size={14} />
            <span>Nhật ký xả nước ({drainEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Success notification banner */}
      {successMsg && (
        <div style={{
          backgroundColor: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--primary-900)',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} color="var(--primary-600)" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Side-by-Side Tank Cards: Trực quan, xem được cả 2 bể ngay mà không cần cuộn trang */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '18px'
      }}>
        {reservoirs.map((res, index) => {
          const shortName = res.name.split('-')[0].trim();
          const subTitle = res.name.split('-')[1]?.trim() || `Hệ thống ${index + 1}`;
          const fillPercent = Math.round((res.currentVolumeLiters / res.capacityLiters) * 100);
          
          // Target EC for this tank
          const currentTargetEc = targetEcs[res.id] ?? (res.currentEc < 1.7 ? 1.75 : res.currentEc);
          const ecDeficit = Math.max(0, parseFloat((currentTargetEc - res.currentEc).toFixed(2)));
          const doseMl = Math.round((ecDeficit / 0.10) * 10 * (res.currentVolumeLiters / 100));

          // Tank channels
          const resChans = channels.filter(c => c.reservoirId === res.id);
          const totalActivePlants = resChans.reduce((sum, c) => sum + c.activePlants, 0);

          // Status badges
          const isPhOk = res.currentPh >= 5.6 && res.currentPh <= 6.2;
          const isEcOk = res.currentEc >= 1.5 && res.currentEc <= 1.85;
          const isTempOk = res.currentWaterTemp >= 19 && res.currentWaterTemp <= 24;

          return (
            <div 
              key={res.id} 
              className="clean-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              
              {/* Header bể & Nút đo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      width: '9px', 
                      height: '9px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary-500)',
                      boxShadow: '0 0 0 3px var(--primary-100)'
                    }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {shortName}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '2px', marginLeft: '17px' }}>
                    {subTitle}
                  </div>
                </div>

                <button
                  onClick={() => openLogModal(res)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.78rem', height: '30px', padding: '0 10px' }}
                >
                  <Plus size={14} />
                  <span>Ghi số đo</span>
                </button>
              </div>

              {/* Mực nước & Nút thao tác nhanh */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplet size={15} color="var(--info)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Mực nước: {res.currentVolumeLiters} / {res.capacityLiters} Lít
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      ({fillPercent}%)
                    </span>
                  </div>

                  {/* 2 Nút thao tác nước */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openTopUpModal(res)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', height: '26px', padding: '0 8px' }}
                    >
                      + Bù nước
                    </button>
                    <button
                      onClick={() => openDrainModal(res)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', height: '26px', padding: '0 8px', color: 'var(--danger-text)' }}
                    >
                      Xả bể
                    </button>
                  </div>
                </div>

                {/* Thanh tiến trình mực nước */}
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${fillPercent}%`,
                    backgroundColor: fillPercent > 50 ? 'var(--info)' : 'var(--warning)',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Thiết bị bơm & sục khí */}
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>
                    Bơm: <strong style={{ color: res.pumpStatus === 'running' ? 'var(--primary-700)' : 'var(--text-muted)' }}>
                      {res.pumpStatus === 'running' ? '● Đang chạy' : '○ Dừng'}
                    </strong>
                  </span>
                  <span>
                    Sục khí: <strong style={{ color: res.aerationStatus === 'active' ? 'var(--primary-700)' : 'var(--text-muted)' }}>
                      {res.aerationStatus === 'active' ? '● Đang bật' : '○ Tắt'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 3 Chỉ số đo (pH, EC, Nhiệt độ) — Hiển thị song song gọn gàng */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                
                {/* pH */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Độ pH</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
                    {res.currentPh.toFixed(2)}
                  </div>
                  <span className={`badge ${isPhOk ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                    {isPhOk ? 'Chuẩn' : 'Cần chỉnh'}
                  </span>
                </div>

                {/* EC */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>EC (Phân)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-700)', margin: '2px 0' }}>
                    {res.currentEc.toFixed(2)}
                  </div>
                  <span className={`badge ${isEcOk ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                    {isEcOk ? 'Chuẩn' : res.currentEc < 1.5 ? 'Thiếu phân' : 'Đậm phân'}
                  </span>
                </div>

                {/* Nhiệt độ */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Nhiệt độ</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
                    {res.currentWaterTemp.toFixed(1)}°
                  </div>
                  <span className={`badge ${isTempOk ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                    {isTempOk ? 'Mát' : 'Hơi ấm'}
                  </span>
                </div>

              </div>

              {/* Hộp Châm phân (Dosing) — Cực kỳ trực quan, bấm 1 nút là xong */}
              <div style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Bù dinh dưỡng (Châm phân)
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Mục tiêu:</span>
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
                      style={{
                        width: '56px',
                        height: '24px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        color: 'var(--primary-700)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>mS/cm</span>
                  </div>
                </div>

                {/* Kết quả lượng phân cần rót */}
                {ecDeficit > 0 ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Can A (Canxi/Sắt)</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                          {doseMl} ml
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Can B (Lân/Khoáng)</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0369a1' }}>
                          {doseMl} ml
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyDosingForTank(res, currentTargetEc, doseMl)}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '34px', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Xác nhận đã châm {doseMl}ml Can A & B</span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--primary-800)',
                    backgroundColor: 'var(--primary-50)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle2 size={14} color="var(--primary-600)" />
                    <span>Dinh dưỡng đang đủ ({res.currentEc} mS/cm). Chưa cần châm thêm.</span>
                  </div>
                )}
              </div>

              {/* Danh sách máng trồng đang dùng nước bể này */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <Layers size={14} color="var(--text-subtle)" />
                    <span>Máng đang cấp nước ({resChans.length} máng)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {totalActivePlants} cây
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
                          padding: '6px 10px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{ch.name}</strong>
                          {batch ? (
                            <span style={{ color: 'var(--text-muted)' }}>
                              {batch.cultivarName.split(' ')[0]} ({batch.batchCode})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-disabled)' }}>Máng trống</span>
                          )}
                        </div>

                        <span style={{ fontWeight: 600, color: ch.activePlants > 0 ? 'var(--primary-700)' : 'var(--text-muted)' }}>
                          {ch.activePlants} / {ch.slotCount} cây
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

      {/* Modal 1: Ghi nhận số đo mới */}
      {isLogModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Ghi số đo: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button onClick={() => setIsLogModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Độ pH (Chuẩn: 5.6 - 6.2)</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="4.0"
                    max="9.0"
                    className="form-input" 
                    value={formPh} 
                    onChange={e => setFormPh(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Nồng độ EC (Chuẩn: 1.5 - 1.8 mS/cm)</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0.5"
                    max="3.5"
                    className="form-input" 
                    value={formEc} 
                    onChange={e => setFormEc(parseFloat(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Nhiệt độ nước (°C - Chuẩn: 20 - 24°C)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="15.0"
                    max="35.0"
                    className="form-input" 
                    value={formTemp} 
                    onChange={e => setFormTemp(parseFloat(e.target.value))} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu số đo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bù nước sạch */}
      {isTopUpModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTopUpModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Bù nước: {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button onClick={() => setIsTopUpModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Số lít nước châm thêm (Lít)</label>
                  <input 
                    type="number" 
                    min="10"
                    max="500"
                    className="form-input" 
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
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      +{amt} Lít
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsTopUpModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Xác nhận bù nước
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Xả bể */}
      {isDrainModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDrainModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger-text)' }}>
                Xác nhận xả nước {activeModalRes?.name.split('-')[0].trim()}
              </h3>
              <button onClick={() => setIsDrainModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDrainSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Thao tác này sẽ ghi nhận xả toàn bộ <strong>{activeModalRes?.currentVolumeLiters}L</strong> nước hiện tại.
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Lý do xả nước</label>
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

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Người thực hiện</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={drainOperator} 
                    onChange={e => setDrainOperator(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Ghi chú</label>
                  <input 
                    type="text"
                    className="form-input" 
                    value={drainNotes} 
                    onChange={e => setDrainNotes(e.target.value)} 
                    placeholder="Ví dụ: Vệ sinh bể trước khi bơm nước mới."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsDrainModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-danger">
                  Xác nhận xả bể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Lịch sử xả nước */}
      {isDrainHistoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDrainHistoryModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} />
                <span>Nhật ký xả & thay nước</span>
              </h3>
              <button onClick={() => setIsDrainHistoryModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drainEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
                  Chưa có lần xả nước nào được ghi nhận.
                </div>
              ) : (
                drainEvents.map(ev => {
                  const res = reservoirs.find(r => r.id === ev.reservoirId);
                  return (
                    <div key={ev.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong>{res?.name.split('-')[0].trim() || 'Bể'} • Xả {ev.volumeDrainedLiters} Lít</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{ev.drainDate}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <span>pH: {ev.finalPh}</span>
                        <span>EC: {ev.finalEc} mS/cm</span>
                        <span>Người làm: {ev.operator}</span>
                      </div>
                      {ev.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                          Ghi chú: {ev.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsDrainHistoryModalOpen(false)} className="btn btn-secondary">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Công thức pha can 10L mẹ ở kho */}
      {isFormulaModalOpen && defaultFormula && (
        <div className="modal-overlay" onClick={() => setIsFormulaModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={16} color="var(--primary-600)" />
                <span>Công thức pha can 10L tại kho</span>
              </h3>
              <button onClick={() => setIsFormulaModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem' }}>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Định lượng hóa chất khi hòa tan can 10 Lít đậm đặc (tỷ lệ pha 1:100 vào bể).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Can A */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                  <strong style={{ color: 'var(--primary-700)', display: 'block', marginBottom: '6px' }}>Can A (10 Lít)</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {defaultFormula.stockAItems?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{it.name}</span>
                        <strong>{it.gramsPer10LStock}g</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Can B */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                  <strong style={{ color: '#0369a1', display: 'block', marginBottom: '6px' }}>Can B (10 Lít)</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {defaultFormula.stockBItems?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{it.name}</span>
                        <strong>{it.gramsPer10LStock}g</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsFormulaModalOpen(false)} className="btn btn-secondary">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
