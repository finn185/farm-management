/**
 * SimulatorView - Giao diện Trạm Giả Lập IoT tối giản, dễ hiểu ngay trong 5 giây
 *
 * Chỉ gồm 3 phần rõ ràng:
 *   Phần 1: Bảng số đo trực tiếp của bể nước (5 chỉ số to, rõ: Tốt / Có sự cố)
 *   Phần 2: Nút bấm thử gây sự cố (bấm 1 nút → thấy ngay số đổi sang đỏ → hệ thống tự báo động)
 *   Phần 3: Giải thích ngắn gọn cách gắn thiết bị thật (ESP32) khi ra thực tế
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Radio, Cpu, Wifi, WifiOff,
  Sun, Thermometer, Droplets, Wind, Zap, FlaskConical,
  CheckCircle2, AlertTriangle, ArrowRight, Bell, ChevronDown, ChevronUp, Copy, Sprout, CloudSun
} from 'lucide-react';
import { simulatorApi } from '../services/simulatorApi';
import type { SimulatorStatus, SimReservoir, ScenarioKey, MetricKey } from '../services/simulatorApi';
import { useToast } from '../components/Toast';
import './SimulatorView.css';

interface SimulatorViewProps {
  onDataChanged?: () => void;
}

const METRICS: {
  key: MetricKey;
  label: string;
  meaning: string;
  unit: string;
  icon: React.ElementType;
  digits: number;
  color: string;
}[] = [
  { key: 'ph', label: 'Độ pH nước', meaning: 'Độ chua / kiềm của nước', unit: 'pH', icon: FlaskConical, digits: 2, color: '#7c3aed' },
  { key: 'ec', label: 'Dinh dưỡng (EC)', meaning: 'Lượng phân khoáng trong nước', unit: 'mS/cm', icon: Zap, digits: 2, color: '#00a651' },
  { key: 'waterTemp', label: 'Nhiệt độ nước', meaning: 'Nước mát giúp rễ không bị thối', unit: '°C', icon: Thermometer, digits: 1, color: '#ea580c' },
  { key: 'doLevel', label: 'Oxy trong nước', meaning: 'Oxy cho rễ cây thở (DO)', unit: 'mg/L', icon: Wind, digits: 1, color: '#0284c7' },
  { key: 'levelPercent', label: 'Mực nước bể', meaning: 'Lượng nước còn trong bồn', unit: '%', icon: Droplets, digits: 0, color: '#2563eb' }
];

const SCENARIO_ICONS: Record<ScenarioKey, React.ElementType> = {
  normal: CheckCircle2,
  heatwave: Sun,
  aeration_fail: Wind,
  nutrient_depletion: Zap,
  ph_drift: FlaskConical,
  water_leak: Droplets,
  sensor_offline: WifiOff
};

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  seed: { label: 'Hạt giống', color: '#475569', bg: '#f1f5f9' },
  germination: { label: 'Nảy mầm', color: '#0284c7', bg: '#e0f2fe' },
  seedling: { label: '1. Cây con', color: '#059669', bg: '#d1fae5' },
  transplant: { label: 'Chuyển máng', color: '#059669', bg: '#d1fae5' },
  vegetative: { label: '2. Sinh dưỡng (Lớn nhanh)', color: '#15803d', bg: '#dcfce7' },
  pre_harvest: { label: '3. Tích sinh khối (Sắp thu)', color: '#b45309', bg: '#fef3c7' },
  harvest: { label: '4. Sẵn sàng thu hoạch!', color: '#00a651', bg: '#dcfce7' }
};

const fmt = (v: number | undefined | null, d = 1) =>
  v === undefined || v === null || Number.isNaN(v) ? '--' : v.toFixed(d);

function metricRange(r: SimReservoir, key: MetricKey): { min: number; max: number } {
  switch (key) {
    case 'ph': return r.targets.ph;
    case 'ec': return r.targets.ec;
    case 'waterTemp': return r.targets.waterTemp;
    case 'doLevel': return { min: r.targets.doMin, max: 12 };
    case 'levelPercent': return { min: r.targets.levelMin, max: 100 };
  }
}

function metricValue(r: SimReservoir, key: MetricKey): number {
  return key === 'levelPercent' ? r.state.levelPercent : r.state[key];
}

function safeRangeText(key: MetricKey, range: { min: number; max: number }, unit: string) {
  if (key === 'doLevel') return `An toàn: từ ${range.min} ${unit} trở lên`;
  if (key === 'levelPercent') return `An toàn: từ ${range.min}% trở lên`;
  return `An toàn: ${range.min} – ${range.max} ${unit}`;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onDataChanged }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [showTechDetail, setShowTechDetail] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      const s = await simulatorApi.getStatus();
      setStatus(s);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Không kết nối được tới máy chủ Backend');
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, status?.running ? 2000 : 4500);
    return () => window.clearInterval(id);
  }, [load, status?.running]);

  useEffect(() => {
    if (!status || status.reservoirs.length === 0) return;
    if (!status.reservoirs.some(r => r.id === selectedResId)) {
      const preferred = status.reservoirs.find(r => r.hasBatavia) || status.reservoirs[0];
      setSelectedResId(preferred.id);
    }
  }, [status, selectedResId]);

  const act = async (fn: () => Promise<SimulatorStatus>, okTitle?: string, okMsg?: string) => {
    setBusy(true);
    try {
      const s = await fn();
      setStatus(s);
      onDataChanged?.();
      if (okTitle) showToast(okTitle, okMsg || '', 'success');
    } catch (e: any) {
      showToast('Trạm giả lập', e?.message || 'Thao tác thất bại', 'danger');
    } finally {
      setBusy(false);
    }
  };

  const res = useMemo(
    () => status?.reservoirs.find(r => r.id === selectedResId) || status?.reservoirs[0] || null,
    [status, selectedResId]
  );

  if (!status) {
    return (
      <div className="sim-simple-page">
        <div className="sim-box sim-center-box">
          <Radio size={32} color="#00a651" />
          <h2>Trạm Giả Lập Cảm Biến</h2>
          <p>{error ? error : 'Đang kết nối tới hệ thống...'}</p>
          {error && (
            <button className="sim-big-btn sim-btn-green" onClick={load}>
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  const isDeviceMode = status.dataSource === 'device';
  const activeScenarioKey: ScenarioKey =
    res && res.scenario !== 'normal' ? res.scenario : status.farmHeatwave ? 'heatwave' : 'normal';
  const activeScenarioDef = status.scenarios.find(s => s.key === activeScenarioKey);
  const incidentList = status.scenarios.filter(s => s.key !== 'normal');

  const simPacket = status.lastPackets.find(p => res && p.deviceId === res.deviceId) || status.lastPackets[0];
  const espPacket = {
    deviceId: 'ESP32-BE-01',
    source: 'sensor',
    readings: [
      { sensorCode: 'SEN-PH-01', value: res ? res.state.ph : 5.95 },
      { sensorCode: 'SEN-EC-01', value: res ? res.state.ec : 1.75 },
      { sensorCode: 'SEN-TEMP-01', value: res ? res.state.waterTemp : 21.8 },
      { sensorCode: 'SEN-DO-01', value: res ? res.state.doLevel : 7.6 },
      { sensorCode: 'SEN-LVL-01', value: res ? res.state.levelPercent : 88 }
    ]
  };

  const psCommand = `$body = '{"deviceId":"ESP32-TEST","source":"sensor","readings":[{"sensorCode":"SEN-PH-01","value":5.10}]}'
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/v1/sensors/telemetry/batch" -ContentType "application/json" -Body $body`;

  return (
    <div className="sim-simple-page">
      {/* =====================================================================
          1. HEADER: Đồng bộ với toàn bộ các trang khác
          ===================================================================== */}
      <div className="sim-header">
        <div className="sim-header-left">
          <div>
            <h1 className="sim-title">
              <Radio size={22} color="#00a651" />
              Trạm Giả Lập IoT
            </h1>
            <div className="sim-subtitle">
              Mô phỏng tín hiệu cảm biến pH, EC, nhiệt độ nước và thử nghiệm kịch bản sự cố tự động
            </div>
          </div>
        </div>

        <div className="sim-header-actions">
          <span className={`sim-status-pill ${status.running ? 'is-on' : 'is-off'}`}>
            <span className="dot" />
            {status.running ? 'Đang tự động gửi số đo' : 'Đang tạm dừng'}
          </span>

          {status.running ? (
            <button
              className="farmvista-btn-secondary"
              style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px', color: '#b45309', borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
              disabled={busy}
              onClick={() => act(simulatorApi.stop, 'Đã tạm dừng gửi dữ liệu')}
            >
              <Pause size={14} />
              <span>Tạm Dừng</span>
            </button>
          ) : (
            <button
              className="farmvista-btn-green"
              style={{ height: '34px', fontSize: '0.78rem', padding: '0 14px' }}
              disabled={busy || isDeviceMode}
              onClick={() => act(() => simulatorApi.start(status.minutesPerTick), 'Đã bật giả lập', 'Hệ thống đang tự động cập nhật số đo mỗi 2 giây')}
            >
              <Play size={14} />
              <span>Bật Tự Động</span>
            </button>
          )}

          <button
            className="farmvista-btn-secondary"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
            disabled={busy || isDeviceMode}
            onClick={() => act(simulatorApi.reset, 'Đã đưa về bình thường', 'Tất cả chỉ số đã về mức tốt')}
          >
            <RotateCcw size={14} color="#00a651" />
            <span>Đưa Về Bình Thường</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          PHẦN 1: SỐ ĐO HIỆN TẠI CỦA BỂ NƯỚC
          ===================================================================== */}
      {res && (
        <div className="sim-box">
          <div className="sim-section-header">
            <div>
              <span className="sim-step-badge">PHẦN 1</span>
              <h2>Số đo hiện tại trong bể nước</h2>
            </div>

            {/* Chọn bể nếu có nhiều bể */}
            <div className="sim-tank-switch">
              <span>Chọn bể:</span>
              {status.reservoirs.map(r => (
                <button
                  key={r.id}
                  className={`sim-tank-btn ${r.id === res.id ? 'active' : ''}`}
                  onClick={() => setSelectedResId(r.id)}
                >
                  {r.name.split('-')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="sim-5-cards">
            {METRICS.map(m => {
              const range = metricRange(res, m.key);
              const val = metricValue(res, m.key);
              const isOffline = res.scenario === 'sensor_offline' && m.key === 'ph';
              const isOk = !isOffline && val >= range.min && val <= range.max;
              const Icon = m.icon;

              return (
                <div
                  key={m.key}
                  className={`sim-sensor-card ${isOffline ? 'card-offline' : isOk ? 'card-ok' : 'card-error'}`}
                >
                  <div className="sim-sensor-top">
                    <span className="sim-sensor-name">
                      <Icon size={17} color={m.color} /> {m.label}
                    </span>
                    <span className={`sim-sensor-status ${isOffline ? 'st-offline' : isOk ? 'st-ok' : 'st-error'}`}>
                      {isOffline ? 'Mất kết nối' : isOk ? '✓ Tốt' : '⚠ Vượt ngưỡng'}
                    </span>
                  </div>

                  <div className="sim-sensor-value">
                    {isOffline ? 'Không có tín hiệu' : `${fmt(val, m.digits)} ${m.unit}`}
                  </div>

                  <div className="sim-sensor-meaning">{m.meaning}</div>
                  <div className="sim-sensor-safe">{safeRangeText(m.key, range, m.unit)}</div>
                </div>
              );
            })}
          </div>

          {/* Tác động trực tiếp của nước lên sức khỏe cây trồng */}
          <div className={`sim-plant-health-bar ${res.growth.growthFactor >= 0.85 ? 'health-good' : 'health-stress'}`}>
            <div className="sim-plant-health-left">
              <div className="sim-plant-score">
                <Sprout size={18} />
                <span>Sức khỏe & Tốc độ lớn của cây: <strong>{Math.round(res.growth.growthFactor * 100)}%</strong></span>
              </div>
              <div className="sim-plant-detail">
                {res.growth.stressFlags.length === 0 ? (
                  <span>
                    ✓ Nước đạt chuẩn — <strong>{res.plants.toLocaleString('vi-VN')} cây</strong> (~{fmt(res.avgAgeDays, 0)} ngày tuổi) đang phát triển tối đa, dự kiến thu hoạch đạt ~{status.batavia.expectedWeightG}g/cây.
                  </span>
                ) : (
                  <span>
                    ⚠ Cây đang bị kìm hãm sinh trưởng do: <strong>{res.growth.stressFlags.join(' • ')}</strong> (Nếu kéo dài sẽ làm giảm trọng lượng thu hoạch).
                  </span>
                )}
              </div>
            </div>
            <button className="sim-tank-btn" onClick={() => navigate('/forecast')}>
              <CloudSun size={15} /> Xem AI Dự báo năng suất <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHẦN 2: BẤM THỬ GÂY SỰ CỐ ĐỂ XEM HỆ THỐNG BÁO ĐỘNG
          ===================================================================== */}
      {res && (
        <div className="sim-box">
          <div className="sim-section-header">
            <div>
              <span className="sim-step-badge badge-amber">PHẦN 2 • DÙNG KHI DEMO VỚI CÔ</span>
              <h2>Bấm thử 1 sự cố để xem hệ thống tự động cảnh báo</h2>
            </div>

            {activeScenarioKey !== 'normal' && (
              <button
                className="sim-big-btn sim-btn-green"
                disabled={busy || isDeviceMode}
                onClick={() => act(() => simulatorApi.setScenario(res.id, 'normal'), 'Đã khắc phục sự cố', 'Các chỉ số đã trở lại mức an toàn')}
              >
                <CheckCircle2 size={17} /> Tắt sự cố (Khôi phục bình thường)
              </button>
            )}
          </div>

          <p className="sim-helper-text">
            Khi bạn bấm vào một nút sự cố bên dưới, chỉ số tương ứng ở <strong>Phần 1</strong> sẽ lập tức chuyển sang <strong>màu đỏ (Vượt ngưỡng)</strong> và hệ thống tự tạo cảnh báo.
          </p>

          <div className="sim-incident-grid">
            {incidentList.map(sc => {
              const Icon = SCENARIO_ICONS[sc.key] || AlertTriangle;
              const isActive = sc.key === activeScenarioKey || (sc.key === 'heatwave' && status.farmHeatwave);

              return (
                <button
                  key={sc.key}
                  disabled={busy || isDeviceMode}
                  className={`sim-incident-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() =>
                    act(
                      () => simulatorApi.setScenario(res.id, sc.key),
                      `Đã bật sự cố: ${sc.title}`,
                      sc.expected
                    )
                  }
                >
                  <div className="sim-incident-btn-top">
                    <span className="sim-incident-icon"><Icon size={20} /></span>
                    <strong>{sc.title}</strong>
                    {isActive && <span className="sim-running-pill">Đang xảy ra</span>}
                  </div>
                  <div className="sim-incident-effect">👉 Hiện tượng: {sc.short}</div>
                  <div className="sim-incident-fix">🛠 Cách xử lý: {sc.response}</div>
                </button>
              );
            })}
          </div>

          {/* Kết quả phản ứng ngay bên dưới */}
          {activeScenarioKey !== 'normal' && activeScenarioDef ? (
            <div className="sim-result-alert">
              <div className="sim-result-left">
                <AlertTriangle size={22} color="#dc2626" />
                <div>
                  <strong>Hệ thống đã phát hiện sự cố "{activeScenarioDef.title}" và tự động tạo Cảnh báo!</strong>
                  <p>
                    Nguyên nhân: {activeScenarioDef.cause} → Đề xuất: <b>{activeScenarioDef.response}</b>
                  </p>
                </div>
              </div>
              <button className="sim-big-btn sim-btn-red-outline" onClick={() => navigate('/alerts')}>
                <Bell size={16} /> Xem ở trang Cảnh báo <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="sim-result-ok">
              <CheckCircle2 size={20} color="#00a651" />
              <span>Hiện tại bể nước đang vận hành bình thường, không có sự cố nào.</span>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PHẦN 3: GIẢ LẬP CÂY TRỒNG LỚN LÊN THEO TỪNG NGÀY
          ===================================================================== */}
      {res && (
        <div className="sim-box">
          <div className="sim-section-header">
            <div>
              <span className="sim-step-badge">PHẦN 3 • GIẢ LẬP CÂY LỚN LÊN</span>
              <h2>Tua nhanh quá trình cây trồng phát triển theo ngày</h2>
            </div>

            <div className="sim-grow-actions">
              <button
                className="sim-big-btn sim-btn-green"
                disabled={busy || isDeviceMode}
                onClick={() =>
                  act(
                    () => simulatorApi.grow(1),
                    '🌱 Cây đã lớn thêm 1 ngày!',
                    `Tốc độ tăng trưởng đạt ${Math.round(res.growth.growthFactor * 100)}% theo chất lượng nước hiện tại.`
                  )
                }
              >
                <Sprout size={17} /> +1 Ngày tuổi
              </button>
              <button
                className="sim-big-btn sim-btn-outline"
                disabled={busy || isDeviceMode}
                onClick={() =>
                  act(
                    () => simulatorApi.grow(3),
                    '🌱 Đã tua nhanh +3 ngày!',
                    'Số lá, chiều cao, cân nặng và dự báo AI đã được cập nhật.'
                  )
                }
              >
                +3 Ngày tuổi (Tua nhanh)
              </button>
            </div>
          </div>

          <p className="sim-helper-text">
            Mỗi lần bấm <strong>"+1 Ngày tuổi"</strong>, cây sẽ tăng thêm <strong>số lá, chiều cao, trọng lượng (gam)</strong> và tự chuyển giai đoạn (Cây con → Sinh dưỡng → Tích sinh khối → Sẵn sàng thu hoạch).
            Đặc biệt: nếu nước đang bị sự cố ở Phần 2, <strong>cây sẽ lớn chậm lại</strong>!
          </p>

          <div className="sim-batch-growth-grid">
            {status.reservoirs.flatMap(r =>
              r.batches.map(b => {
                const st = STAGE_LABELS[b.stage] || { label: b.stage, color: '#15803d', bg: '#dcfce7' };
                const pct = Math.min(100, Math.round((b.ageDays / Math.max(1, b.cycleDays)) * 100));
                const weightPct = Math.min(100, Math.round((b.weightG / Math.max(1, b.targetWeightG)) * 100));

                return (
                  <div key={b.id} className={`sim-batch-card ${b.isBatavia ? 'is-batavia' : ''}`}>
                    <div className="sim-batch-top">
                      <div>
                        <div className="sim-batch-code">
                          <strong>{b.code}</strong>
                          {b.isBatavia && <span className="sim-ai-badge">✨ Hỗ trợ AI Dự báo</span>}
                        </div>
                        <div className="sim-batch-cultivar">
                          {b.cultivar} • {b.plants.toLocaleString('vi-VN')} cây ({r.name.split('-')[0].trim()})
                        </div>
                      </div>
                      <span className="sim-stage-pill" style={{ color: st.color, backgroundColor: st.bg }}>
                        {st.label}
                      </span>
                    </div>

                    {/* Thanh tiến trình tuổi cây */}
                    <div className="sim-progress-row">
                      <div className="sim-progress-labels">
                        <span>Tuổi cây: <strong>{b.ageDays} / {b.cycleDays} ngày</strong></span>
                        <span>{b.daysLeft > 0 ? `Còn ${b.daysLeft} ngày thu hoạch` : 'Đã đến ngày thu hoạch!'}</span>
                      </div>
                      <div className="sim-progress-track">
                        <div className="sim-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* 3 chỉ số sinh trưởng của cây */}
                    <div className="sim-bio-metrics">
                      <div className="sim-bio-item">
                        <span>Số lá thật</span>
                        <strong>{fmt(b.leafCount, 1)} lá</strong>
                      </div>
                      <div className="sim-bio-item">
                        <span>Chiều cao cây</span>
                        <strong>{fmt(b.heightCm, 1)} cm</strong>
                      </div>
                      <div className="sim-bio-item highlight">
                        <span>Trọng lượng 1 cây</span>
                        <strong>{fmt(b.weightG, 1)}g / {b.targetWeightG}g ({weightPct}%)</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="sim-batch-links">
            <button className="sim-tank-btn" onClick={() => navigate('/batches')}>
              Xem chi tiết ở trang Lô cây trồng <ArrowRight size={14} />
            </button>
            <button className="sim-tank-btn" onClick={() => navigate('/forecast')}>
              <CloudSun size={15} /> Xem AI Dự báo năng suất thay đổi <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHẦN 4: GIẢI THÍCH VỚI GIẢNG VIÊN: KHI RA THỰC TẾ THÌ LÀM SAO?
          ===================================================================== */}
      <div className="sim-box">
        <div className="sim-section-header">
          <div>
            <span className="sim-step-badge badge-blue">PHẦN 4 • GIẢI THÍCH VỚI GIẢNG VIÊN</span>
            <h2>Khi ứng dụng thực tế thì thay đổi như thế nào?</h2>
          </div>
        </div>

        {/* Sơ đồ 1 dòng cực dễ hiểu */}
        <div className="sim-easy-flow">
          <div className="sim-flow-card sim-flow-replace">
            <div className="sim-flow-tag">CHỈ THAY PHẦN NÀY</div>
            <div className="sim-flow-pair">
              <div className="sim-flow-item">
                <Cpu size={20} color="#00a651" />
                <div>
                  <strong>Hiện tại (Demo)</strong>
                  <span>Bộ giả lập trên web gửi số đo</span>
                </div>
              </div>
              <div className="sim-flow-vs">đổi thành</div>
              <div className="sim-flow-item">
                <Wifi size={20} color="#0284c7" />
                <div>
                  <strong>Thực tế (Ngoài vườn)</strong>
                  <span>Mạch ESP32 + 5 cảm biến thật gửi số đo qua Wi-Fi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sim-flow-arrow">
            <span>Gửi cùng 1 mẫu dữ liệu</span>
            <ArrowRight size={24} />
          </div>

          <div className="sim-flow-card sim-flow-keep">
            <div className="sim-flow-tag tag-keep">GIỮ NGUYÊN 100% (KHÔNG SỬA CODE)</div>
            <div className="sim-keep-items">
              <div>✓ Cổng nhận dữ liệu (API)</div>
              <div>✓ Cơ sở dữ liệu (PostgreSQL)</div>
              <div>✓ Tự động Cảnh báo</div>
              <div>✓ Trang Dashboard & Dự báo AI</div>
            </div>
          </div>
        </div>

        {/* 3 việc cần làm ngoài thực tế */}
        <div className="sim-3-steps">
          <div className="sim-step-item">
            <div className="sim-step-circle">1</div>
            <div>
              <strong>Mua bộ cảm biến cắm vào mạch ESP32 (~5,6 triệu/bể)</strong>
              <p>Gồm: Cảm biến pH, cảm biến dinh dưỡng EC, đầu dò nhiệt độ nước DS18B20, cảm biến Oxy (DO) và cảm biến siêu âm đo mực nước.</p>
            </div>
          </div>

          <div className="sim-step-item">
            <div className="sim-step-circle">2</div>
            <div>
              <strong>Nạp code đã viết sẵn trong thư mục dự án</strong>
              <p>Code cho mạch ESP32 đã có sẵn tại <code>hardware/esp32_hydro_node/esp32_hydro_node.ino</code>. Chỉ cần điền tên Wi-Fi và địa chỉ máy chủ.</p>
            </div>
          </div>

          <div className="sim-step-item">
            <div className="sim-step-circle">3</div>
            <div>
              <strong>Đổi 1 dòng cấu hình để tắt giả lập, nhận số đo thật</strong>
              <p>Trong file <code>backend/.env</code>, đổi <code>DATA_SOURCE=simulator</code> thành <code>DATA_SOURCE=device</code> là xong.</p>
            </div>
          </div>
        </div>

        {/* Nút bấm xem thêm chi tiết kỹ thuật (ẩn mặc định cho đỡ rối) */}
        <div className="sim-more-toggle">
          <button className="sim-big-btn sim-btn-outline" onClick={() => setShowTechDetail(v => !v)}>
            {showTechDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showTechDetail ? 'Ẩn chi tiết kỹ thuật (Gói tin JSON & Lệnh test)' : 'Xem chi tiết kỹ thuật (Gói tin JSON & Lệnh test cho giảng viên xem thêm)'}
          </button>
        </div>

        {showTechDetail && (
          <div className="sim-tech-drawer">
            <div className="sim-tech-grid">
              <div>
                <h4>1. Gói tin Bộ giả lập đang gửi lên Server:</h4>
                <pre className="sim-code-block">{JSON.stringify(simPacket || espPacket, null, 2)}</pre>
              </div>
              <div>
                <h4>2. Gói tin Mạch ESP32 thật sẽ gửi lên Server (Giống hệt):</h4>
                <pre className="sim-code-block">{JSON.stringify(espPacket, null, 2)}</pre>
              </div>
            </div>

            <div className="sim-ps-box">
              <div className="sim-ps-header">
                <h4>3. Thử nghiệm: Giả làm mạch ESP32 bên ngoài bắn dữ liệu vào hệ thống (chạy trong PowerShell):</h4>
                <button
                  className="sim-tank-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(psCommand);
                    showToast('Đã sao chép', 'Mở PowerShell, dán lệnh và nhấn Enter', 'info');
                  }}
                >
                  <Copy size={14} /> Sao chép lệnh
                </button>
              </div>
              <pre className="sim-code-block">{psCommand}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulatorView;
