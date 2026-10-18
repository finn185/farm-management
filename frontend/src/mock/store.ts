import type { CropBatch, Reservoir, Cultivar, NutrientFormula, Alert, HarvestRecord, Channel, SolutionDrainEvent, GrowthStage } from '../types/farm';
import { 
  INITIAL_BATCHES, 
  INITIAL_RESERVOIRS, 
  INITIAL_CULTIVARS, 
  INITIAL_FORMULAS, 
  INITIAL_SENSOR_HISTORY, 
  INITIAL_ALERTS, 
  INITIAL_HARVESTS,
  INITIAL_CHANNELS,
  INITIAL_DRAIN_EVENTS
} from './initialData';

const STORAGE_KEYS = {
  BATCHES: 'hydrosmart_batches',
  RESERVOIRS: 'hydrosmart_reservoirs',
  CULTIVARS: 'hydrosmart_cultivars',
  FORMULAS: 'hydrosmart_formulas',
  SENSORS: 'hydrosmart_sensors',
  ALERTS: 'hydrosmart_alerts',
  HARVESTS: 'hydrosmart_harvests',
  CHANNELS: 'hydrosmart_channels',
  DRAIN_EVENTS: 'hydrosmart_drain_events'
};

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

  addMeasurementRecord: (data: { reservoirId: string; ph: number; ec: number; waterTemp: number }): void => {
    farmStore.updateReservoir(data.reservoirId, {
      currentPh: data.ph,
      currentEc: data.ec,
      currentWaterTemp: data.waterTemp
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
      airTemp: 27.5,
      humidity: 65,
      vpd: 1.25
    });
    setStorage(STORAGE_KEYS.SENSORS, sensors.slice(-20)); // Keep recent 20 readings

    // Rule Engine Check: Auto-generate alert if out of bounds (FRS Compliant)
    if (data.ph < 5.5 || data.ph > 6.5) {
      farmStore.addAlert({
        severity: data.ph < 5.0 || data.ph > 6.8 ? 'critical' : 'warning',
        metric: 'pH',
        title: `pH ${data.ph < 5.5 ? 'quá thấp' : 'quá cao'} (${data.ph}) tại Bể`,
        message: `Độ pH đo được ${data.ph} lệch khỏi khoảng tối ưu (5.5 - 6.2) cho rau xà lách. Ảnh hưởng khả năng hòa tan dinh dưỡng.`,
        reservoirId: data.reservoirId,
        suggestedAction: data.ph < 5.5 ? 'Bổ sung dung dịch kiềm pH Up (KOH) từ từ.' : 'Bổ sung pH Down (H3PO4/HNO3) loãng và khuấy đều.'
      });
    }

    if (data.ec > 2.0) {
      farmStore.addAlert({
        severity: 'warning',
        metric: 'EC',
        title: `EC cao bất thường (${data.ec} mS/cm)`,
        message: `Tổng lượng ion hòa tan cao, cây có nguy cơ ngộ độc phân hoặc cháy chóp lá (tipburn).`,
        reservoirId: data.reservoirId,
        suggestedAction: 'Bổ sung nước sạch vào bể để pha loãng dung dịch về ngưỡng 1.6 - 1.8 mS/cm.'
      });
    } else if (data.ec < 1.3) {
      farmStore.addAlert({
        severity: data.ec < 1.0 ? 'critical' : 'warning',
        metric: 'EC',
        title: `EC quá loãng (${data.ec} mS/cm) tại Bể`,
        message: `Nồng độ dinh dưỡng tụt sâu dưới ngưỡng khuyến nghị (1.5 - 1.8 mS/cm). Cây có nguy cơ suy dinh dưỡng và chậm lớn.`,
        reservoirId: data.reservoirId,
        suggestedAction: 'Châm thêm dung dịch Stock A và Stock B theo định lượng để đưa EC về mức tối ưu.'
      });
    }

    if (data.waterTemp > 24.5) {
      farmStore.addAlert({
        severity: 'critical', // Critical per FRS: >24.5C causes severe hypoxia & Pythium root rot
        metric: 'Temp',
        title: `Nhiệt độ nước bồn tăng cao (${data.waterTemp}°C) - Rủi ro nấm rễ`,
        message: `Nhiệt độ nước vượt ngưỡng 24.5°C làm oxy hòa tan tụt mạnh, rễ ngạt thở và nấm rễ Pythium bùng phát nhanh.`,
        reservoirId: data.reservoirId,
        suggestedAction: 'Bật quạt giải nhiệt khẩn cấp, sục khí oxy mạnh và bổ sung nước sạch mát hạ nhiệt bồn.'
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
      resolvedBy: resolvedBy || 'Kỹ sư Nông nghiệp',
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

    return newRecord;
  },

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.RESERVOIRS);
    localStorage.removeItem(STORAGE_KEYS.CULTIVARS);
    localStorage.removeItem(STORAGE_KEYS.FORMULAS);
    localStorage.removeItem(STORAGE_KEYS.SENSORS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.HARVESTS);
    localStorage.removeItem(STORAGE_KEYS.CHANNELS);
    localStorage.removeItem(STORAGE_KEYS.DRAIN_EVENTS);
  }
};
