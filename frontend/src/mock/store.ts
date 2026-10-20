import type { CropBatch, Reservoir, Cultivar, NutrientFormula, Alert, HarvestRecord, Channel, SolutionDrainEvent, GrowthStage, FarmZone, Sensor } from '../types/farm';
import { 
  INITIAL_BATCHES, 
  INITIAL_RESERVOIRS, 
  INITIAL_CULTIVARS, 
  INITIAL_FORMULAS, 
  INITIAL_SENSOR_HISTORY, 
  INITIAL_SENSORS,
  INITIAL_ALERTS, 
  INITIAL_HARVESTS,
  INITIAL_CHANNELS,
  INITIAL_DRAIN_EVENTS,
  INITIAL_ZONES
} from './initialData';

const STORAGE_KEYS = {
  BATCHES: 'hydrosmart_batches',
  RESERVOIRS: 'hydrosmart_reservoirs',
  CULTIVARS: 'hydrosmart_cultivars',
  FORMULAS: 'hydrosmart_formulas',
  SENSORS: 'hydrosmart_sensors',
  SENSORS_LIST: 'hydrosmart_sensors_list',
  ALERTS: 'hydrosmart_alerts',
  HARVESTS: 'hydrosmart_harvests',
  CHANNELS: 'hydrosmart_channels',
  DRAIN_EVENTS: 'hydrosmart_drain_events',
  ZONES: 'hydrosmart_zones',
  VERSION: 'hydrosmart_store_version'
};

const CURRENT_STORE_VERSION = '2026-10-20-clean-v2';

// Tự động xóa toàn bộ dữ liệu mock cũ bị lưu kẹt trong localStorage của trình duyệt
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedVer = window.localStorage.getItem(STORAGE_KEYS.VERSION);
    if (savedVer !== CURRENT_STORE_VERSION) {
      Object.values(STORAGE_KEYS).forEach(k => {
        if (k !== STORAGE_KEYS.VERSION) window.localStorage.removeItem(k);
      });
      window.localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_STORE_VERSION);
    }
  }
} catch {
  // ignore storage errors
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save to localStorage [${key}]`, err);
  }
}

export const farmStore = {
  // Farm Zones (Sơ đồ thực địa NFT A1, A2, B2, D1, C1, E1)
  getZones: (): FarmZone[] => {
    return getStorage<FarmZone[]>(STORAGE_KEYS.ZONES, INITIAL_ZONES);
  },

  getZoneById: (idOrCode: string): FarmZone | undefined => {
    const zones = farmStore.getZones();
    return zones.find(z => z.id === idOrCode || z.code === idOrCode);
  },

  updateZone: (idOrCode: string, updates: Partial<FarmZone>): FarmZone[] => {
    const list = farmStore.getZones();
    const updated = list.map(z => (z.id === idOrCode || z.code === idOrCode) ? { ...z, ...updates } : z);
    setStorage(STORAGE_KEYS.ZONES, updated);
    return updated;
  },

  // Cultivars
  getCultivars: (): Cultivar[] => {
    return getStorage<Cultivar[]>(STORAGE_KEYS.CULTIVARS, INITIAL_CULTIVARS);
  },

  // Reservoirs
  getReservoirs: (): Reservoir[] => {
    const raw = getStorage<Reservoir[]>(STORAGE_KEYS.RESERVOIRS, INITIAL_RESERVOIRS);
    return raw.map(r => {
      let cleanName = r.name;
      if (r.id === 'res-01') cleanName = 'Bể Tuần Hoàn 01 - Giàn NFT Tầng 1';
      if (r.id === 'res-02') cleanName = 'Bể Tuần Hoàn 02 - Giàn NFT Tầng 2';
      return {
        ...r,
        systemType: 'NFT' as const,
        name: cleanName
      };
    });
  },
  
  updateReservoir: (id: string, updates: Partial<Reservoir>): Reservoir[] => {
    const list = farmStore.getReservoirs();
    const updated = list.map(r => r.id === id ? { ...r, ...updates } : r);
    setStorage(STORAGE_KEYS.RESERVOIRS, updated);
    return updated;
  },

  applyDosing: (reservoirId: string, targetEc: number, doseMl: number): void => {
    const list = farmStore.getReservoirs();
    const res = list.find(r => r.id === reservoirId);
    const addedLiters = (doseMl * 2) / 1000; // Stock A + Stock B in Liters
    const newVol = res ? Math.min(res.capacityLiters, res.currentVolumeLiters + addedLiters) : 0;
    
    farmStore.updateReservoir(reservoirId, {
      currentEc: targetEc,
      currentVolumeLiters: newVol > 0 ? parseFloat(newVol.toFixed(1)) : undefined,
      lastTopUpDate: new Date().toISOString().split('T')[0]
    });

    // Auto-resolve any open EC low alert on this reservoir per FRS sequence diagram
    const alerts = farmStore.getAlerts();
    alerts.forEach(a => {
      if (a.reservoirId === reservoirId && a.metric === 'EC' && a.title.includes('loãng') && (a.status === 'open' || a.status === 'acknowledged')) {
        farmStore.resolveAlert(a.id, 'Hệ thống tự động', `Đã châm ${doseMl}ml Can A & B. EC bồn đã đạt ${targetEc} mS/cm.`);
      }
    });
  },

  // Sensors
  getSensors: (): Sensor[] => {
    return getStorage<Sensor[]>(STORAGE_KEYS.SENSORS_LIST, INITIAL_SENSORS);
  },

  updateSensor: (idOrCode: string, updates: Partial<Sensor>): Sensor[] => {
    const list = farmStore.getSensors();
    const updated = list.map(s => (s.id === idOrCode || s.code === idOrCode) ? { ...s, ...updates } : s);
    setStorage(STORAGE_KEYS.SENSORS_LIST, updated);
    return updated;
  },

  addMeasurementRecord: (data: { reservoirId: string; ph: number; ec: number; waterTemp: number; doLevel?: number; waterLevelPercent?: number }): void => {
    farmStore.updateReservoir(data.reservoirId, {
      currentPh: data.ph,
      currentEc: data.ec,
      currentWaterTemp: data.waterTemp,
      ...(data.doLevel !== undefined ? { currentDo: data.doLevel } : {}),
      ...(data.waterLevelPercent !== undefined ? { currentWaterLevelPercent: data.waterLevelPercent } : {})
    });

    // Update IoT sensors for this reservoir
    const sensorsList = farmStore.getSensors();
    sensorsList.forEach(s => {
      if (s.reservoirId === data.reservoirId) {
        if (s.sensorType === 'ph') farmStore.updateSensor(s.id, { lastReading: data.ph });
        if (s.sensorType === 'ec') farmStore.updateSensor(s.id, { lastReading: data.ec });
        if (s.sensorType === 'water_temp') farmStore.updateSensor(s.id, { lastReading: data.waterTemp });
        if (s.sensorType === 'do' && data.doLevel !== undefined) farmStore.updateSensor(s.id, { lastReading: data.doLevel });
        if (s.sensorType === 'water_level' && data.waterLevelPercent !== undefined) farmStore.updateSensor(s.id, { lastReading: data.waterLevelPercent });
      }
    });

    // Also add to sensor history for graphs
    const sensors = farmStore.getSensorHistory();
    const now = new Date();
    const dayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    sensors.push({
      day: dayStr,
      time: timeStr,
      ph: data.ph,
      ec: data.ec,
      waterTemp: data.waterTemp,
      airTemp: 26.5,
      humidity: 68,
      vpd: 1.15
    });
    setStorage(STORAGE_KEYS.SENSORS, sensors.slice(-20)); // Keep recent 20 readings

    // Auto-resolve pH alerts if back to normal range [5.5, 6.5]
    const existingAlerts = farmStore.getAlerts();
    if (data.ph >= 5.5 && data.ph <= 6.5) {
      existingAlerts.forEach(a => {
        if (a.reservoirId === data.reservoirId && a.metric === 'pH' && !a.resolved) {
          farmStore.resolveAlert(a.id, 'Hệ thống tự động', `Chỉ số pH đã ổn định trở lại (${data.ph} pH).`);
        }
      });
    }

    // Auto-resolve EC alerts if back to normal range [1.4, 2.0]
    if (data.ec >= 1.4 && data.ec <= 2.0) {
      existingAlerts.forEach(a => {
        if (a.reservoirId === data.reservoirId && a.metric === 'EC' && !a.resolved) {
          farmStore.resolveAlert(a.id, 'Hệ thống tự động', `Độ dẫn điện EC đã phục hồi ngưỡng tối ưu (${data.ec} mS/cm).`);
        }
      });
    }

    // Auto-resolve Water Temp alerts if <= 24.0°C
    if (data.waterTemp <= 24.0) {
      existingAlerts.forEach(a => {
        if (a.reservoirId === data.reservoirId && (a.metric === 'Temp' || a.metric === 'WaterTemp') && !a.resolved) {
          farmStore.resolveAlert(a.id, 'Hệ thống tự động', `Nhiệt độ dung dịch đã hạ nhiệt an toàn (${data.waterTemp}°C).`);
        }
      });
    }

    // Quantitative Alert Engine Check:
    // 1. pH Evaluation
    if (data.ph < 4.8 || data.ph > 7.5) {
      farmStore.addAlert({
        severity: 'emergency',
        metric: 'pH',
        title: `NGUY CẤP: pH bồn dinh dưỡng lệch nghiêm trọng (${data.ph})`,
        message: `Độ pH đo được ${data.ph} rơi vào ngưỡng phá hủy tế bào rễ và tê liệt hấp thu ion đa lượng. Cây có nguy cơ héo rũ tức thì.`,
        reservoirId: data.reservoirId,
        thresholdValue: data.ph < 4.8 ? 5.5 : 6.5,
        actualValue: data.ph,
        unit: 'pH',
        suggestedAction: data.ph < 4.8 ? 'Châm khẩn cấp dung dịch kiềm pH Up (KOH) loãng.' : 'Châm khẩn cấp dung dịch pH Down (H3PO4 10%) và sục khí mạnh.'
      });
    } else if (data.ph < 5.5 || data.ph > 6.5) {
      farmStore.addAlert({
        severity: data.ph < 5.2 || data.ph > 7.0 ? 'critical' : 'warning',
        metric: 'pH',
        title: `pH ${data.ph < 5.5 ? 'quá thấp' : 'quá cao'} (${data.ph}) tại Bể`,
        message: `Độ pH đo được ${data.ph} lệch khỏi khoảng tối ưu (5.5 - 6.2) cho rau xà lách. Ảnh hưởng khả năng hòa tan dinh dưỡng.`,
        reservoirId: data.reservoirId,
        thresholdValue: data.ph < 5.5 ? 5.5 : 6.5,
        actualValue: data.ph,
        unit: 'pH',
        suggestedAction: data.ph < 5.5 ? 'Bổ sung dung dịch kiềm pH Up (KOH) từ từ.' : 'Bổ sung pH Down (H3PO4/HNO3) loãng và khuấy đều.'
      });
    }

    // 2. EC Evaluation
    if (data.ec > 2.6 || data.ec < 0.8) {
      farmStore.addAlert({
        severity: 'emergency',
        metric: 'EC',
        title: `NGUY CẤP: Nồng độ dẫn điện EC nguy hiểm (${data.ec} mS/cm)`,
        message: data.ec > 2.6
          ? `Nồng độ muối cực cao gây cháy chóp lá cấp tính và ngộ độc muối toàn bộ rễ giàn NFT.`
          : `Nồng độ dinh dưỡng tụt kiệt về mức nước trắng, cây bắt đầu tự hủy diệp lục để tồn tại.`,
        reservoirId: data.reservoirId,
        thresholdValue: data.ec > 2.6 ? 2.0 : 1.4,
        actualValue: data.ec,
        unit: 'mS/cm',
        suggestedAction: data.ec > 2.6
          ? 'Xả bớt 30% dung dịch và bù nước sạch mát ngay lập tức.'
          : 'Châm gấp dinh dưỡng Can A & B theo định lượng để đưa EC về mức chuẩn.'
      });
    } else if (data.ec > 2.0) {
      farmStore.addAlert({
        severity: 'warning',
        metric: 'EC',
        title: `EC cao bất thường (${data.ec} mS/cm)`,
        message: `Tổng lượng ion hòa tan cao, cây có nguy cơ ngộ độc phân hoặc cháy chóp lá (tipburn).`,
        reservoirId: data.reservoirId,
        thresholdValue: 2.0,
        actualValue: data.ec,
        unit: 'mS/cm',
        suggestedAction: 'Bổ sung nước sạch vào bể để pha loãng dung dịch về ngưỡng 1.6 - 1.8 mS/cm.'
      });
    } else if (data.ec < 1.3) {
      farmStore.addAlert({
        severity: data.ec < 1.0 ? 'critical' : 'warning',
        metric: 'EC',
        title: `EC quá loãng (${data.ec} mS/cm) tại Bể`,
        message: `Nồng độ dinh dưỡng tụt sâu dưới ngưỡng khuyến nghị (1.5 - 1.8 mS/cm). Cây có nguy cơ suy dinh dưỡng và chậm lớn.`,
        reservoirId: data.reservoirId,
        thresholdValue: 1.4,
        actualValue: data.ec,
        unit: 'mS/cm',
        suggestedAction: 'Châm thêm dung dịch Stock A và Stock B theo định lượng để đưa EC về mức tối ưu.'
      });
    }

    // 3. Water Temperature Evaluation
    if (data.waterTemp >= 28.0) {
      farmStore.addAlert({
        severity: 'emergency',
        metric: 'Temp',
        title: `NGUY CẤP: Nhiệt độ nước bồn đạt mức báo động (${data.waterTemp}°C)`,
        message: `Nhiệt độ nước vượt 28°C dẫn tới cạn kiệt oxy hòa tan và bùng phát thối rễ Pythium hủy hoại mùa vụ trong 24h.`,
        reservoirId: data.reservoirId,
        thresholdValue: 24.0,
        actualValue: data.waterTemp,
        unit: '°C',
        suggestedAction: 'Khởi động máy làm lạnh Chiller hoặc bơm làm mát khẩn cấp, bật sục khí tối đa.'
      });
    } else if (data.waterTemp > 24.5) {
      farmStore.addAlert({
        severity: 'critical',
        metric: 'Temp',
        title: `Nhiệt độ nước bồn tăng cao (${data.waterTemp}°C) - Rủi ro nấm rễ`,
        message: `Nhiệt độ nước vượt ngưỡng 24.5°C làm oxy hòa tan tụt mạnh, rễ ngạt thở và nấm rễ Pythium bùng phát nhanh.`,
        reservoirId: data.reservoirId,
        thresholdValue: 24.0,
        actualValue: data.waterTemp,
        unit: '°C',
        suggestedAction: 'Bật quạt giải nhiệt khẩn cấp, sục khí oxy mạnh và bổ sung nước sạch mát hạ nhiệt bồn.'
      });
    }

    // 4. Water Level Evaluation
    if (data.waterLevelPercent !== undefined && data.waterLevelPercent < 20) {
      farmStore.addAlert({
        severity: data.waterLevelPercent < 10 ? 'emergency' : 'critical',
        metric: 'WaterLevel',
        title: `Mực nước bồn dinh dưỡng quá thấp (${data.waterLevelPercent}%)`,
        message: `Mực nước bể giảm dưới ngưỡng an toàn, nguy cơ bơm hút cạn làm cháy máy bơm tuần hoàn NFT.`,
        reservoirId: data.reservoirId,
        thresholdValue: 20.0,
        actualValue: data.waterLevelPercent,
        unit: '%',
        suggestedAction: 'Bơm bổ sung nước sạch vào bể chứa ngay lập tức.'
      });
    }
  },

  // Batches
  getBatches: (): CropBatch[] => {
    const raw = getStorage<CropBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    return raw.map(b => ({
      ...b,
      systemType: 'NFT' as const,
      reservoirName: b.reservoirId === 'res-01' ? 'Bể Tuần Hoàn 01 (NFT)' : 'Bể Tuần Hoàn 02 (NFT)'
    }));
  },

  addBatch: (newBatch: Omit<CropBatch, 'id' | 'status'>): CropBatch => {
    const list = farmStore.getBatches();
    const batch: CropBatch = {
      ...newBatch,
      id: `batch-${Date.now()}`,
      status: 'active'
    };
    const updated = [batch, ...list];
    setStorage(STORAGE_KEYS.BATCHES, updated);
    return batch;
  },

  updateBatch: (id: string, updates: Partial<CropBatch>): CropBatch[] => {
    const list = farmStore.getBatches();
    const updated = list.map(b => b.id === id ? { ...b, ...updates } : b);
    setStorage(STORAGE_KEYS.BATCHES, updated);
    return updated;
  },

  addBatchObservation: (batchId: string, obs: { date?: string; avgLeafCount: number; avgHeightCm: number; sampleWeightG: number; notes?: string }): CropBatch[] => {
    const obsDate = obs.date || new Date().toISOString().split('T')[0];
    return farmStore.updateBatch(batchId, {
      lastObservation: {
        date: obsDate,
        avgLeafCount: obs.avgLeafCount,
        avgHeightCm: obs.avgHeightCm,
        sampleWeightG: obs.sampleWeightG,
        notes: obs.notes
      }
    });
  },

  advanceBatchStage: (batchId: string, newStage: GrowthStage): CropBatch[] => {
    return farmStore.updateBatch(batchId, {
      currentStage: newStage
    });
  },

  updateBatchStatus: (batchId: string, status: 'active' | 'harvested' | 'failed', actualHarvestDate?: string): CropBatch[] => {
    return farmStore.updateBatch(batchId, {
      status,
      actualHarvestDate: status === 'harvested' ? (actualHarvestDate || new Date().toISOString().split('T')[0]) : undefined
    });
  },

  deleteBatch: (id: string): CropBatch[] => {
    const list = farmStore.getBatches();
    const updated = list.filter(b => b.id !== id);
    setStorage(STORAGE_KEYS.BATCHES, updated);
    return updated;
  },

  // Formulas
  getFormulas: (): NutrientFormula[] => {
    const raw = getStorage<NutrientFormula[]>(STORAGE_KEYS.FORMULAS, INITIAL_FORMULAS);
    // Auto-migrate if stored formulas have old structure or missing chemical items
    if (!raw || raw.length === 0 || !raw[0]?.stockAItems || raw.some(f => f.notes?.includes('Deep Water Culture'))) {
      setStorage(STORAGE_KEYS.FORMULAS, INITIAL_FORMULAS);
      return INITIAL_FORMULAS;
    }
    return raw;
  },

  // Sensor History
  getSensorHistory: () => {
    return getStorage(STORAGE_KEYS.SENSORS, INITIAL_SENSOR_HISTORY);
  },

  // Alerts
  getAlerts: (): Alert[] => {
    return getStorage<Alert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  },

  addAlert: (alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved' | 'status'>): Alert => {
    const list = farmStore.getAlerts();
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // De-duplicate if unresolved alert exists for same reservoir & metric
    const existingIndex = list.findIndex(
      a => !a.resolved && a.metric === alertData.metric && a.reservoirId === alertData.reservoirId
    );
    if (existingIndex !== -1) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...alertData,
        timestamp: timeStr
      };
      setStorage(STORAGE_KEYS.ALERTS, list);
      return list[existingIndex];
    }

    const newAlert: Alert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      timestamp: timeStr,
      resolved: false,
      status: 'open',
      assignedTo: 'Kỹ sư Nông nghiệp'
    };
    const updated = [newAlert, ...list];
    setStorage(STORAGE_KEYS.ALERTS, updated);
    return newAlert;
  },

  acknowledgeAlert: (id: string, acknowledgedBy: string): Alert[] => {
    const list = farmStore.getAlerts();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = list.map(a => a.id === id ? {
      ...a,
      status: 'acknowledged' as const,
      acknowledgedBy,
      acknowledgedAt: `${now.toISOString().split('T')[0]} ${timeStr}`
    } : a);
    setStorage(STORAGE_KEYS.ALERTS, updated);
    return updated;
  },

  resolveAlert: (id: string, resolvedBy?: string, resolutionNote?: string): Alert[] => {
    const list = farmStore.getAlerts();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = list.map(a => a.id === id ? {
      ...a,
      resolved: true,
      status: 'resolved' as const,
      resolvedBy: resolvedBy || 'Lê Thị Kỹ Sư Nông Học',
      resolvedAt: timeStr,
      resolutionNote: resolutionNote || ''
    } : a);
    setStorage(STORAGE_KEYS.ALERTS, updated);
    return updated;
  },

  // Channels
  getChannels: (): Channel[] => {
    return getStorage<Channel[]>(STORAGE_KEYS.CHANNELS, INITIAL_CHANNELS);
  },

  getChannelsByReservoir: (reservoirId: string): Channel[] => {
    return farmStore.getChannels().filter(c => c.reservoirId === reservoirId);
  },

  // Solution Drain Events
  getDrainEvents: (): SolutionDrainEvent[] => {
    return getStorage<SolutionDrainEvent[]>(STORAGE_KEYS.DRAIN_EVENTS, INITIAL_DRAIN_EVENTS);
  },

  addDrainEvent: (eventData: Omit<SolutionDrainEvent, 'id'>): SolutionDrainEvent => {
    const list = farmStore.getDrainEvents();
    const newEvent: SolutionDrainEvent = {
      ...eventData,
      id: `drain-${Date.now()}`
    };
    const updated = [newEvent, ...list];
    setStorage(STORAGE_KEYS.DRAIN_EVENTS, updated);
    // Reset reservoir volume after drain
    farmStore.updateReservoir(eventData.reservoirId, {
      currentVolumeLiters: 0,
      lastReplacementDate: eventData.drainDate
    });
    return newEvent;
  },

  // Harvests
  getHarvests: (): HarvestRecord[] => {
    return getStorage<HarvestRecord[]>(STORAGE_KEYS.HARVESTS, INITIAL_HARVESTS);
  },

  recordHarvest: (harvestData: Omit<HarvestRecord, 'id' | 'differencePercent' | 'lossPercentage'>): HarvestRecord => {
    const list = farmStore.getHarvests();
    const diff = ((harvestData.avgWeightG - harvestData.aiPredictedWeightG) / harvestData.aiPredictedWeightG) * 100;
    const loss = (harvestData.rejectedWeightKg / (harvestData.totalWeightKg + harvestData.rejectedWeightKg)) * 100;

    const newRecord: HarvestRecord = {
      ...harvestData,
      id: `harv-${Date.now()}`,
      differencePercent: parseFloat(diff.toFixed(2)),
      lossPercentage: parseFloat(loss.toFixed(1))
    };

    const updated = [newRecord, ...list];
    setStorage(STORAGE_KEYS.HARVESTS, updated);

    // Update batch status to harvested and stage to harvest
    farmStore.updateBatch(harvestData.batchId, {
      status: 'harvested',
      currentStage: 'harvest',
      actualHarvestDate: harvestData.harvestDate
    });

    // Update zone status to completed
    const allBatches = farmStore.getBatches();
    const targetBatch = allBatches.find(b => b.id === harvestData.batchId);
    if (targetBatch?.zoneId) {
      farmStore.updateZone(targetBatch.zoneId, { status: 'completed' });
    }
    if (targetBatch?.zoneCode) {
      farmStore.updateZone(targetBatch.zoneCode, { status: 'completed' });
    }

    // Auto-resolve open alerts for this batch
    const alerts = farmStore.getAlerts();
    alerts.forEach(a => {
      if (a.batchId === harvestData.batchId && (a.status === 'open' || a.status === 'acknowledged')) {
        farmStore.resolveAlert(a.id, harvestData.operatorName || 'Quản lý thu hoạch', 'Lô cây trồng đã hoàn thành thu hoạch thành công.');
      }
    });

    return newRecord;
  },

  resetAllData: () => {
    Object.values(STORAGE_KEYS).forEach(k => {
      if (k !== STORAGE_KEYS.VERSION) localStorage.removeItem(k);
    });
  }
};
