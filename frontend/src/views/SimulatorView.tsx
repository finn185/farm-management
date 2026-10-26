/**
 * SimulatorView - Giao diá»‡n Tráº¡m Giáº£ Láº­p IoT tá»‘i giáº£n, dá»… hiá»ƒu ngay trong 5 giÃ¢y
 *
 * Chá»‰ gá»“m 3 pháº§n rÃµ rÃ ng:
 *   Pháº§n 1: Báº£ng sá»‘ Ä‘o trá»±c tiáº¿p cá»§a bá»ƒ nÆ°á»›c (5 chá»‰ sá»‘ to, rÃµ: Tá»‘t / CÃ³ sá»± cá»‘)
 *   Pháº§n 2: NÃºt báº¥m thá»­ gÃ¢y sá»± cá»‘ (báº¥m 1 nÃºt â†’ tháº¥y ngay sá»‘ Ä‘á»•i sang Ä‘á» â†’ há»‡ thá»‘ng tá»± bÃ¡o Ä‘á»™ng)
 *   Pháº§n 3: Giáº£i thÃ­ch ngáº¯n gá»n cÃ¡ch gáº¯n thiáº¿t bá»‹ tháº­t (ESP32) khi ra thá»±c táº¿
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Radio, Cpu, Wifi, WifiOff,
  Sun, Thermometer, Droplets, Wind, Zap, FlaskConical,
  CheckCircle2, AlertTriangle, ArrowRight, Bell, ChevronDown, ChevronUp, Copy, Sprout, CloudSun
} from 'lucide-react';
import { simulatorApi } from '../services/simulatorApi';
import { API_V1_URL } from '../config/api';
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
  { key: 'ph', label: 'Äá»™ pH nÆ°á»›c', meaning: 'Äá»™ chua / kiá»m cá»§a nÆ°á»›c', unit: 'pH', icon: FlaskConical, digits: 2, color: '#7c3aed' },
  { key: 'ec', label: 'Dinh dÆ°á»¡ng (EC)', meaning: 'LÆ°á»£ng phÃ¢n khoÃ¡ng trong nÆ°á»›c', unit: 'mS/cm', icon: Zap, digits: 2, color: '#00a651' },
  { key: 'waterTemp', label: 'Nhiá»‡t Ä‘á»™ nÆ°á»›c', meaning: 'NÆ°á»›c mÃ¡t giÃºp rá»… khÃ´ng bá»‹ thá»‘i', unit: 'Â°C', icon: Thermometer, digits: 1, color: '#ea580c' },
  { key: 'doLevel', label: 'Oxy trong nÆ°á»›c', meaning: 'Oxy cho rá»… cÃ¢y thá»Ÿ (DO)', unit: 'mg/L', icon: Wind, digits: 1, color: '#0284c7' },
  { key: 'levelPercent', label: 'Má»±c nÆ°á»›c bá»ƒ', meaning: 'LÆ°á»£ng nÆ°á»›c cÃ²n trong bá»“n', unit: '%', icon: Droplets, digits: 0, color: '#2563eb' }
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
  seed: { label: 'Háº¡t giá»‘ng', color: '#475569', bg: '#f1f5f9' },
  germination: { label: 'Náº£y máº§m', color: '#0284c7', bg: '#e0f2fe' },
  seedling: { label: '1. CÃ¢y con', color: '#059669', bg: '#d1fae5' },
  transplant: { label: 'Chuyá»ƒn mÃ¡ng', color: '#059669', bg: '#d1fae5' },
  vegetative: { label: '2. Sinh dÆ°á»¡ng (Lá»›n nhanh)', color: '#15803d', bg: '#dcfce7' },
  pre_harvest: { label: '3. TÃ­ch sinh khá»‘i (Sáº¯p thu)', color: '#b45309', bg: '#fef3c7' },
  harvest: { label: '4. Sáºµn sÃ ng thu hoáº¡ch!', color: '#00a651', bg: '#dcfce7' }
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
  if (key === 'doLevel') return `An toÃ n: tá»« ${range.min} ${unit} trá»Ÿ lÃªn`;
  if (key === 'levelPercent') return `An toÃ n: tá»« ${range.min}% trá»Ÿ lÃªn`;
  return `An toÃ n: ${range.min} â€“ ${range.max} ${unit}`;
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
      setError(e?.message || 'KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c tá»›i mÃ¡y chá»§ Backend');
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
      showToast('Tráº¡m giáº£ láº­p', e?.message || 'Thao tÃ¡c tháº¥t báº¡i', 'danger');
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
          <h2>Tráº¡m Giáº£ Láº­p Cáº£m Biáº¿n</h2>
          <p>{error ? error : 'Äang káº¿t ná»‘i tá»›i há»‡ thá»‘ng...'}</p>
          {error && (
            <button className="sim-big-btn sim-btn-green" onClick={load}>
              Thá»­ láº¡i
            </button>
          )}
        </div>
      </div>
    );
  }

  const isDeviceMode = status.dataSource === 'device';
  const activeScenarioKey: ScenarioKey =
    res && res.scenario !== 'normal' ? res.scenario : (status.farmHeatwave ? 'heatwave' : 'normal');
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
Invoke-RestMethod -Method Post -Uri "${API_V1_URL}/sensors/telemetry/batch" -ContentType "application/json" -Body $body`;

  return (
    <div className="sim-simple-page">
      {/* =====================================================================
          1. HEADER: Äá»“ng bá»™ vá»›i toÃ n bá»™ cÃ¡c trang khÃ¡c
          ===================================================================== */}
      <div className="sim-header">
        <div className="sim-header-left">
          <div>
            <h1 className="sim-title">
              <Radio size={22} color="#00a651" />
              Tráº¡m Giáº£ Láº­p IoT
            </h1>
            <div className="sim-subtitle">
              MÃ´ phá»ng tÃ­n hiá»‡u cáº£m biáº¿n pH, EC, nhiá»‡t Ä‘á»™ nÆ°á»›c vÃ  thá»­ nghiá»‡m ká»‹ch báº£n sá»± cá»‘ tá»± Ä‘á»™ng
            </div>
          </div>
        </div>

        <div className="sim-header-actions">
          <span className={`sim-status-pill ${status.running ? 'is-on' : 'is-off'}`}>
            <span className="dot" />
            {status.running ? 'Äang tá»± Ä‘á»™ng gá»­i sá»‘ Ä‘o' : 'Äang táº¡m dá»«ng'}
          </span>

          {status.running ? (
            <button
              className="farmvista-btn-secondary"
              style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px', color: '#b45309', borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
              disabled={busy}
              onClick={() => act(simulatorApi.stop, 'ÄÃ£ táº¡m dá»«ng gá»­i dá»¯ liá»‡u')}
            >
              <Pause size={14} />
              <span>Táº¡m Dá»«ng</span>
            </button>
          ) : (
            <button
              className="farmvista-btn-green"
              style={{ height: '34px', fontSize: '0.78rem', padding: '0 14px' }}
              disabled={busy || isDeviceMode}
              onClick={() => act(() => simulatorApi.start(status.minutesPerTick), 'ÄÃ£ báº­t giáº£ láº­p', 'Há»‡ thá»‘ng Ä‘ang tá»± Ä‘á»™ng cáº­p nháº­t sá»‘ Ä‘o má»—i 2 giÃ¢y')}
            >
              <Play size={14} />
              <span>Báº­t Tá»± Äá»™ng</span>
            </button>
          )}

          <button
            className="farmvista-btn-secondary"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
            disabled={busy || isDeviceMode}
            onClick={() => act(simulatorApi.reset, 'ÄÃ£ Ä‘Æ°a vá» bÃ¬nh thÆ°á»ng', 'Táº¥t cáº£ chá»‰ sá»‘ Ä‘Ã£ vá» má»©c tá»‘t')}
          >
            <RotateCcw size={14} color="#00a651" />
            <span>ÄÆ°a Vá» BÃ¬nh ThÆ°á»ng</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          PHáº¦N 1: Sá» ÄO HIá»†N Táº I Cá»¦A Bá»‚ NÆ¯á»šC
          ===================================================================== */}
      {res && (
        <div className="sim-box">
          <div className="sim-section-header">
            <div>
              <span className="sim-step-badge">PHáº¦N 1</span>
              <h2>Sá»‘ Ä‘o hiá»‡n táº¡i trong bá»ƒ nÆ°á»›c</h2>
            </div>

            {/* Chá»n bá»ƒ náº¿u cÃ³ nhiá»u bá»ƒ */}
            <div className="sim-tank-switch">
              <span>Chá»n bá»ƒ:</span>
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
                      {isOffline ? 'Máº¥t káº¿t ná»‘i' : isOk ? 'âœ“ Tá»‘t' : 'âš  VÆ°á»£t ngÆ°á»¡ng'}
                    </span>
                  </div>

                  <div className="sim-sensor-value">
                    {isOffline ? 'KhÃ´ng cÃ³ tÃ­n hiá»‡u' : `${fmt(val, m.digits)} ${m.unit}`}
                  </div>

                  <div className="sim-sensor-meaning">{m.meaning}</div>
                  <div className="sim-sensor-safe">{safeRangeText(m.key, range, m.unit)}</div>
                </div>
              );
            })}
          </div>

          {/* TÃ¡c Ä‘á»™ng trá»±c tiáº¿p cá»§a nÆ°á»›c lÃªn sá»©c khá»e cÃ¢y trá»“ng */}
          <div className={`sim-plant-health-bar ${res.growth.growthFactor >= 0.85 ? 'health-good' : 'health-stress'}`}>
            <div className="sim-plant-health-left">
              <div className="sim-plant-score">
                <Sprout size={18} />
                <span>Sá»©c khá»e & Tá»‘c Ä‘á»™ lá»›n cá»§a cÃ¢y: <strong>{Math.round(res.growth.growthFactor * 100)}%</strong></span>
              </div>
              <div className="sim-plant-detail">
                {res.growth.stressFlags.length === 0 ? (
                  <span>
                    âœ“ NÆ°á»›c Ä‘áº¡t chuáº©n â€” <strong>{res.plants.toLocaleString('vi-VN')} cÃ¢y</strong> (~{fmt(res.avgAgeDays, 0)} ngÃ y tuá»•i) Ä‘ang phÃ¡t triá»ƒn tá»‘i Ä‘a, dá»± kiáº¿n thu hoáº¡ch Ä‘áº¡t ~{status.batavia.expectedWeightG}g/cÃ¢y.
                  </span>
                ) : (
                  <span>
                    âš  CÃ¢y Ä‘ang bá»‹ kÃ¬m hÃ£m sinh trÆ°á»Ÿng do: <strong>{res.growth.stressFlags.join(' â€¢ ')}</strong> (Náº¿u kÃ©o dÃ i sáº½ lÃ m giáº£m trá»ng lÆ°á»£ng thu hoáº¡ch).
                  </span>
                )}
              </div>
            </div>
            <button className="sim-tank-btn" onClick={() => navigate('/forecast')}>
              <CloudSun size={15} /> Xem AI Dá»± bÃ¡o nÄƒng suáº¥t <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHáº¦N 2: Báº¤M THá»¬ GÃ‚Y Sá»° Cá» Äá»‚ XEM Há»† THá»NG BÃO Äá»˜NG
          ===================================================================== */}
      {res && (
        <div className="sim-box">
          <div className="sim-section-header">
            <div>
              <span className="sim-step-badge badge-amber">PHáº¦N 2 â€¢ DÃ™NG KHI DEMO</span>
              <h2>Báº¥m thá»­ 1 sá»± cá»‘ Ä‘á»ƒ xem há»‡ thá»‘ng tá»± Ä‘á»™ng cáº£nh bÃ¡o</h2>
            </div>

            {res && res.scenario !== 'normal' && (
              <button
                className="sim-big-btn sim-btn-green"
                disabled={busy || isDeviceMode}
                onClick={() => act(() => simulatorApi.setScenario(res.id, 'normal'), 'ÄÃ£ kháº¯c phá»¥c sá»± cá»‘', 'CÃ¡c chá»‰ sá»‘ Ä‘Ã£ trá»Ÿ láº¡i má»©c an toÃ n')}
              >
                <CheckCircle2 size={17} /> Táº¯t sá»± cá»‘ (KhÃ´i phá»¥c bÃ¬nh thÆ°á»ng)
              </button>
            )}
          </div>

          <p className="sim-helper-text">
            Khi báº¡n báº¥m vÃ o má»™t nÃºt sá»± cá»‘ bÃªn dÆ°á»›i, chá»‰ sá»‘ tÆ°Æ¡ng á»©ng á»Ÿ <strong>Pháº§n 1</strong> sáº½ láº­p tá»©c chuyá»ƒn sang <strong>mÃ u Ä‘á» (VÆ°á»£t ngÆ°á»¡ng)</strong> vÃ  há»‡ thá»‘ng tá»± táº¡o cáº£nh bÃ¡o.
          </p>

          <div className="sim-incident-grid">
            {incidentList.map(sc => {
              const Icon = SCENARIO_ICONS[sc.key] || AlertTriangle;
              const isActive = sc.key === (res ? res.scenario : activeScenarioKey);

              return (
                <button
                  key={sc.key}
                  disabled={busy || isDeviceMode}
                  className={`sim-incident-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() =>
                    act(
                      () => simulatorApi.setScenario(res.id, sc.key),
                      `ÄÃ£ báº­t sá»± cá»‘: ${sc.title}`,
                      sc.expected
                    )
                  }
                >
                  <div className="sim-incident-btn-top">
                    <span className="sim-incident-icon"><Icon size={20} /></span>
                    <strong>{sc.title}</strong>
                    {isActive && <span className="sim-running-pill">Äang xáº£y ra</span>}
                  </div>
                  <div className="sim-incident-effect">ðŸ‘‰ Hiá»‡n tÆ°á»£ng: {sc.short}</div>
                  <div className="sim-incident-fix">ðŸ›  CÃ¡ch xá»­ lÃ½: {sc.response}</div>
                </button>
              );
            })}
          </div>

          {/* Káº¿t quáº£ pháº£n á»©ng ngay bÃªn dÆ°á»›i */}
          {activeScenarioKey !== 'normal' && activeScenarioDef ? (
            <div className="sim-result-alert">
              <div className="sim-result-left">
                <AlertTriangle size={22} color="#dc2626" />
                <div>
                  <strong>Há»‡ thá»‘ng Ä‘Ã£ phÃ¡t hiá»‡n sá»± cá»‘ "{activeScenarioDef.title}" vÃ  tá»± Ä‘á»™ng táº¡o Cáº£nh bÃ¡o!</strong>
                  <p>
                    NguyÃªn nhÃ¢n: {activeScenarioDef.cause} â†’ Äá» xuáº¥t: <b>{activeScenarioDef.response}</b>
                  </p>
                </div>
              </div>
              <button className="sim-big-btn sim-btn-red-outline" onClick={() => navigate('/alerts')}>
                <Bell size={16} /> Xem á»Ÿ trang Cáº£nh bÃ¡o <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="sim-result-ok">
              <CheckCircle2 size={20} color="#00a651" />
              <span>Hiá»‡n táº¡i bá»ƒ nÆ°á»›c Ä‘ang váº­n hÃ nh bÃ¬nh thÆ°á»ng, khÃ´ng cÃ³ sá»± cá»‘ nÃ o.</span>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PHáº¦N 3: GIáº¢ Láº¬P CÃ‚Y TRá»’NG Lá»šN LÃŠN THEO Tá»ªNG NGÃ€Y
          ===================================================================== */}
      {res && (
        <div className="sim-box">
          <div className="sim-section-header">
            <div>
              <span className="sim-step-badge">PHáº¦N 3 â€¢ GIáº¢ Láº¬P CÃ‚Y Lá»šN LÃŠN</span>
              <h2>Tua nhanh quÃ¡ trÃ¬nh cÃ¢y trá»“ng phÃ¡t triá»ƒn theo ngÃ y</h2>
            </div>

            <div className="sim-grow-actions">
              <button
                className="sim-big-btn sim-btn-green"
                disabled={busy || isDeviceMode}
                onClick={() =>
                  act(
                    () => simulatorApi.grow(1),
                    'ðŸŒ± CÃ¢y Ä‘Ã£ lá»›n thÃªm 1 ngÃ y!',
                    `Tá»‘c Ä‘á»™ tÄƒng trÆ°á»Ÿng Ä‘áº¡t ${Math.round(res.growth.growthFactor * 100)}% theo cháº¥t lÆ°á»£ng nÆ°á»›c hiá»‡n táº¡i.`
                  )
                }
              >
                <Sprout size={17} /> +1 NgÃ y tuá»•i
              </button>
              <button
                className="sim-big-btn sim-btn-outline"
                disabled={busy || isDeviceMode}
                onClick={() =>
                  act(
                    () => simulatorApi.grow(3),
                    'ðŸŒ± ÄÃ£ tua nhanh +3 ngÃ y!',
                    'Sá»‘ lÃ¡, chiá»u cao, cÃ¢n náº·ng vÃ  dá»± bÃ¡o AI Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t.'
                  )
                }
              >
                +3 NgÃ y tuá»•i (Tua nhanh)
              </button>
            </div>
          </div>

          <p className="sim-helper-text">
            Má»—i láº§n báº¥m <strong>"+1 NgÃ y tuá»•i"</strong>, cÃ¢y sáº½ tÄƒng thÃªm <strong>sá»‘ lÃ¡, chiá»u cao, trá»ng lÆ°á»£ng (gam)</strong> vÃ  tá»± chuyá»ƒn giai Ä‘oáº¡n (CÃ¢y con â†’ Sinh dÆ°á»¡ng â†’ TÃ­ch sinh khá»‘i â†’ Sáºµn sÃ ng thu hoáº¡ch).
            Äáº·c biá»‡t: náº¿u nÆ°á»›c Ä‘ang bá»‹ sá»± cá»‘ á»Ÿ Pháº§n 2, <strong>cÃ¢y sáº½ lá»›n cháº­m láº¡i</strong>!
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
                          {b.isBatavia && <span className="sim-ai-badge">âœ¨ Há»— trá»£ AI Dá»± bÃ¡o</span>}
                        </div>
                        <div className="sim-batch-cultivar">
                          {b.cultivar} â€¢ {b.plants.toLocaleString('vi-VN')} cÃ¢y ({r.name.split('-')[0].trim()})
                        </div>
                      </div>
                      <span className="sim-stage-pill" style={{ color: st.color, backgroundColor: st.bg }}>
                        {st.label}
                      </span>
                    </div>

                    {/* Thanh tiáº¿n trÃ¬nh tuá»•i cÃ¢y */}
                    <div className="sim-progress-row">
                      <div className="sim-progress-labels">
                        <span>Tuá»•i cÃ¢y: <strong>{b.ageDays} / {b.cycleDays} ngÃ y</strong></span>
                        <span>{b.daysLeft > 0 ? `CÃ²n ${b.daysLeft} ngÃ y thu hoáº¡ch` : 'ÄÃ£ Ä‘áº¿n ngÃ y thu hoáº¡ch!'}</span>
                      </div>
                      <div className="sim-progress-track">
                        <div className="sim-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* 3 chá»‰ sá»‘ sinh trÆ°á»Ÿng cá»§a cÃ¢y */}
                    <div className="sim-bio-metrics">
                      <div className="sim-bio-item">
                        <span>Sá»‘ lÃ¡ tháº­t</span>
                        <strong>{fmt(b.leafCount, 1)} lÃ¡</strong>
                      </div>
                      <div className="sim-bio-item">
                        <span>Chiá»u cao cÃ¢y</span>
                        <strong>{fmt(b.heightCm, 1)} cm</strong>
                      </div>
                      <div className="sim-bio-item highlight">
                        <span>Trá»ng lÆ°á»£ng 1 cÃ¢y</span>
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
              Xem chi tiáº¿t á»Ÿ trang LÃ´ cÃ¢y trá»“ng <ArrowRight size={14} />
            </button>
            <button className="sim-tank-btn" onClick={() => navigate('/forecast')}>
              <CloudSun size={15} /> Xem AI Dá»± bÃ¡o nÄƒng suáº¥t thay Ä‘á»•i <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHáº¦N 4: GIáº¢I THÃCH: KHI RA THá»°C Táº¾ THÃŒ LÃ€M SAO?
          ===================================================================== */}
      <div className="sim-box">
        <div className="sim-section-header">
          <div>
            <span className="sim-step-badge badge-blue">PHáº¦N 4 â€¢ GIáº¢I THÃCH</span>
            <h2>Khi á»©ng dá»¥ng thá»±c táº¿ thÃ¬ thay Ä‘á»•i nhÆ° tháº¿ nÃ o?</h2>
          </div>
        </div>

        {/* SÆ¡ Ä‘á»“ 1 dÃ²ng cá»±c dá»… hiá»ƒu */}
        <div className="sim-easy-flow">
          <div className="sim-flow-card sim-flow-replace">
            <div className="sim-flow-tag">CHá»ˆ THAY PHáº¦N NÃ€Y</div>
            <div className="sim-flow-pair">
              <div className="sim-flow-item">
                <Cpu size={20} color="#00a651" />
                <div>
                  <strong>Hiá»‡n táº¡i (Demo)</strong>
                  <span>Bá»™ giáº£ láº­p trÃªn web gá»­i sá»‘ Ä‘o</span>
                </div>
              </div>
              <div className="sim-flow-vs">Ä‘á»•i thÃ nh</div>
              <div className="sim-flow-item">
                <Wifi size={20} color="#0284c7" />
                <div>
                  <strong>Thá»±c táº¿ (NgoÃ i vÆ°á»n)</strong>
                  <span>Máº¡ch ESP32 + 5 cáº£m biáº¿n tháº­t gá»­i sá»‘ Ä‘o qua Wi-Fi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sim-flow-arrow">
            <span>Gá»­i cÃ¹ng 1 máº«u dá»¯ liá»‡u</span>
            <ArrowRight size={24} />
          </div>

          <div className="sim-flow-card sim-flow-keep">
            <div className="sim-flow-tag tag-keep">GIá»® NGUYÃŠN 100% (KHÃ”NG Sá»¬A CODE)</div>
            <div className="sim-keep-items">
              <div>âœ“ Cá»•ng nháº­n dá»¯ liá»‡u (API)</div>
              <div>âœ“ CÆ¡ sá»Ÿ dá»¯ liá»‡u (PostgreSQL)</div>
              <div>âœ“ Tá»± Ä‘á»™ng Cáº£nh bÃ¡o</div>
              <div>âœ“ Trang Dashboard & Dá»± bÃ¡o AI</div>
            </div>
          </div>
        </div>

        {/* 3 viá»‡c cáº§n lÃ m ngoÃ i thá»±c táº¿ */}
        <div className="sim-3-steps">
          <div className="sim-step-item">
            <div className="sim-step-circle">1</div>
            <div>
              <strong>Mua bá»™ cáº£m biáº¿n cáº¯m vÃ o máº¡ch ESP32 (~5,6 triá»‡u/bá»ƒ)</strong>
              <p>Gá»“m: Cáº£m biáº¿n pH, cáº£m biáº¿n dinh dÆ°á»¡ng EC, Ä‘áº§u dÃ² nhiá»‡t Ä‘á»™ nÆ°á»›c DS18B20, cáº£m biáº¿n Oxy (DO) vÃ  cáº£m biáº¿n siÃªu Ã¢m Ä‘o má»±c nÆ°á»›c.</p>
            </div>
          </div>

          <div className="sim-step-item">
            <div className="sim-step-circle">2</div>
            <div>
              <strong>Náº¡p code Ä‘Ã£ viáº¿t sáºµn trong thÆ° má»¥c dá»± Ã¡n</strong>
              <p>Code cho máº¡ch ESP32 Ä‘Ã£ cÃ³ sáºµn táº¡i <code>hardware/esp32_hydro_node/esp32_hydro_node.ino</code>. Chá»‰ cáº§n Ä‘iá»n tÃªn Wi-Fi vÃ  Ä‘á»‹a chá»‰ mÃ¡y chá»§.</p>
            </div>
          </div>

          <div className="sim-step-item">
            <div className="sim-step-circle">3</div>
            <div>
              <strong>Äá»•i 1 dÃ²ng cáº¥u hÃ¬nh Ä‘á»ƒ táº¯t giáº£ láº­p, nháº­n sá»‘ Ä‘o tháº­t</strong>
              <p>Trong file <code>backend/.env</code>, Ä‘á»•i <code>DATA_SOURCE=simulator</code> thÃ nh <code>DATA_SOURCE=device</code> lÃ  xong.</p>
            </div>
          </div>
        </div>

        {/* NÃºt báº¥m xem thÃªm chi tiáº¿t ká»¹ thuáº­t (áº©n máº·c Ä‘á»‹nh cho Ä‘á»¡ rá»‘i) */}
        <div className="sim-more-toggle">
          <button className="sim-big-btn sim-btn-outline" onClick={() => setShowTechDetail(v => !v)}>
            {showTechDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showTechDetail ? 'áº¨n chi tiáº¿t ká»¹ thuáº­t (GÃ³i tin JSON & Lá»‡nh test)' : 'Xem chi tiáº¿t ká»¹ thuáº­t (GÃ³i tin JSON & Lá»‡nh test)'}
          </button>
        </div>

        {showTechDetail && (
          <div className="sim-tech-drawer">
            <div className="sim-tech-grid">
              <div>
                <h4>1. GÃ³i tin Bá»™ giáº£ láº­p Ä‘ang gá»­i lÃªn Server:</h4>
                <pre className="sim-code-block">{JSON.stringify(simPacket || espPacket, null, 2)}</pre>
              </div>
              <div>
                <h4>2. GÃ³i tin Máº¡ch ESP32 tháº­t sáº½ gá»­i lÃªn Server (Giá»‘ng há»‡t):</h4>
                <pre className="sim-code-block">{JSON.stringify(espPacket, null, 2)}</pre>
              </div>
            </div>

            <div className="sim-ps-box">
              <div className="sim-ps-header">
                <h4>3. Thá»­ nghiá»‡m: Giáº£ lÃ m máº¡ch ESP32 bÃªn ngoÃ i báº¯n dá»¯ liá»‡u vÃ o há»‡ thá»‘ng (cháº¡y trong PowerShell):</h4>
                <button
                  className="sim-tank-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(psCommand);
                    showToast('ÄÃ£ sao chÃ©p', 'Má»Ÿ PowerShell, dÃ¡n lá»‡nh vÃ  nháº¥n Enter', 'info');
                  }}
                >
                  <Copy size={14} /> Sao chÃ©p lá»‡nh
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
