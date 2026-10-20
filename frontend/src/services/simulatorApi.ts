const API_BASE_URL = 'http://localhost:5000/api/v1/simulator';

export type ScenarioKey =
  | 'normal'
  | 'heatwave'
  | 'aeration_fail'
  | 'nutrient_depletion'
  | 'ph_drift'
  | 'water_leak'
  | 'sensor_offline';

export type MetricKey = 'ph' | 'ec' | 'waterTemp' | 'doLevel' | 'levelPercent';

export interface SimRange { min: number; max: number }

export interface SimHistoryPoint {
  simTime: string;
  ph: number;
  ec: number;
  waterTemp: number;
  doLevel: number;
  levelPercent: number;
  airTemp: number;
}

export interface SimBatch {
  id: string;
  code: string;
  cultivar: string;
  plants: number;
  isBatavia: boolean;
  stage: string;
  ageDays: number;
  cycleDays: number;
  daysLeft: number;
  leafCount: number;
  heightCm: number;
  weightG: number;
  targetWeightG: number;
}

export interface SimReservoir {
  id: string;
  name: string;
  scenario: ScenarioKey;
  deviceId: string;
  plants: number;
  avgAgeDays: number;
  hasBatavia: boolean;
  batches: SimBatch[];
  sensors: { code: string; type: string }[];
  targets: { ph: SimRange; ec: SimRange; waterTemp: SimRange; doMin: number; levelMin: number; source: string };
  waterUptakeLPerTick: number;
  state: {
    ph: number;
    ec: number;
    waterTemp: number;
    doLevel: number;
    volumeLiters: number;
    capacityLiters: number;
    levelPercent: number;
  };
  growth: { growthFactor: number; stressFlags: string[] };
  history: SimHistoryPoint[];
}

export interface SimPacket {
  deviceId: string;
  source?: string;
  timestamp?: string;
  readings: { sensorCode: string; value: number; metric?: string }[];
}

export interface SimEvent {
  id: number;
  realTime: string;
  simTime: string;
  type: 'system' | 'scenario' | 'intervention' | 'alert' | 'device';
  message: string;
}

export interface SimScenario {
  key: ScenarioKey;
  title: string;
  short: string;
  scope: 'farm' | 'reservoir';
  watch: MetricKey;
  cause: string;
  expected: string;
  response: string;
}

export interface SimulatorStatus {
  dataSource: 'simulator' | 'device';
  running: boolean;
  intervalMs: number;
  minutesPerTick: number;
  simTime: string;
  tickCount: number;
  startedAt: string | null;
  lastError: string | null;
  farmHeatwave: boolean;
  deviceStaleSeconds: number;
  climate: { airTemp: number; humidity: number; vpd: number; ppfd: number; dli: number; co2: number };
  batavia: {
    name: string;
    scientificName: string;
    cycleDays: number;
    expectedWeightG: number;
    ph: SimRange;
    ec: SimRange;
    waterTemp: SimRange;
    doMin: number;
    airTemp: SimRange;
    humidity: SimRange;
    dli: SimRange;
  };
  reservoirs: SimReservoir[];
  zones: { code: string; name: string; deviceId: string; sensorCode: string }[];
  lastPackets: SimPacket[];
  events: SimEvent[];
  scenarios: SimScenario[];
  speedPresets: { minutesPerTick: number; label: string }[];
}

export interface SimHeartbeat {
  dataSource: 'simulator' | 'device';
  running: boolean;
  tickCount: number;
  simTime: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('hydrosmart_token') || localStorage.getItem('hydrosmart_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call<T = SimulatorStatus>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000)
  });
  const json = await res.json().catch(() => null);
  if (res.status === 401) {
    throw new Error('Cần đăng nhập bằng tài khoản backend để điều khiển Trạm giả lập. Hãy đăng xuất rồi đăng nhập lại khi backend đang chạy.');
  }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Lỗi kết nối Trạm giả lập (${res.status})`);
  }
  return json.data as T;
}

export const simulatorApi = {
  getStatus: () => call('/status'),
  getHeartbeat: () => call<SimHeartbeat>('/heartbeat'),
  start: (minutesPerTick?: number) => call('/start', 'POST', { minutesPerTick }),
  stop: () => call('/stop', 'POST'),
  step: () => call('/step', 'POST'),
  reset: () => call('/reset', 'POST'),
  setSpeed: (minutesPerTick: number) => call('/speed', 'POST', { minutesPerTick }),
  setScenario: (reservoirId: string, scenario: ScenarioKey) => call('/scenario', 'POST', { reservoirId, scenario }),
  grow: (days = 1, batchId?: string) => call('/grow', 'POST', { days, batchId })
};
