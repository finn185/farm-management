import type { Reservoir, NutrientFormula, SolutionDrainEvent } from '../types/farm';
import { farmStore } from '../mock/store';
import { API_V1_URL } from '../config/api';

const API_BASE_URL = `${API_V1_URL}/reservoirs`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_token') || localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const reservoirsApi = {
  async getReservoirs(): Promise<Reservoir[]> {
    try {
      const res = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }
    return farmStore.getReservoirs();
  },

  async getReservoirById(id: string): Promise<Reservoir | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }
    const list = farmStore.getReservoirs();
    return list.find(r => r.id === id) || null;
  },

  async doseNutrient(id: string, data: {
    amountStockAMl: number;
    amountStockBMl: number;
    targetEc?: number;
    notes?: string;
    operator?: string;
  }): Promise<Reservoir | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}/dose`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Also sync to local store
          farmStore.applyDosing(id, json.data.currentEc, (data.amountStockAMl + data.amountStockBMl) / 2);
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    // Local fallback
    const list = farmStore.getReservoirs();
    const current = list.find(r => r.id === id);
    const targetEc = data.targetEc ?? (current ? current.currentEc + 0.2 : 1.7);
    farmStore.applyDosing(id, targetEc, (data.amountStockAMl + data.amountStockBMl) / 2);
    return farmStore.getReservoirs().find(r => r.id === id) || null;
  },

  async topUpWater(id: string, data: {
    waterLitersAdded: number;
    notes?: string;
    operator?: string;
  }): Promise<Reservoir | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}/top-up`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          farmStore.updateReservoir(id, {
            currentVolumeLiters: json.data.currentVolumeLiters,
            currentEc: json.data.currentEc,
            lastTopUpDate: json.data.lastTopUpDate
          });
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    const current = farmStore.getReservoirs().find(r => r.id === id);
    if (current) {
      const newVol = Math.min(current.capacityLiters, current.currentVolumeLiters + data.waterLitersAdded);
      const dilution = current.currentVolumeLiters / newVol;
      const newEc = Number((current.currentEc * dilution).toFixed(2));
      farmStore.updateReservoir(id, {
        currentVolumeLiters: newVol,
        currentEc: newEc,
        lastTopUpDate: new Date().toISOString().split('T')[0]
      });
    }
    return farmStore.getReservoirs().find(r => r.id === id) || null;
  },

  async drainReservoir(id: string, data: {
    reason: 'scheduled_replacement' | 'end_of_batch' | 'salt_accumulation' | 'contamination' | 'maintenance' | 'other';
    operator: string;
    notes?: string;
    refillWithFormula?: string;
  }): Promise<Reservoir | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}/drain`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    // Local fallback
    const r = farmStore.getReservoirs().find(item => item.id === id);
    if (r) {
      farmStore.addDrainEvent({
        reservoirId: id,
        drainDate: new Date().toISOString().split('T')[0],
        volumeDrainedLiters: r.currentVolumeLiters,
        finalPh: r.currentPh,
        finalEc: r.currentEc,
        finalDo: 6.5,
        reason: data.reason === 'maintenance' || data.reason === 'salt_accumulation' ? 'other' : data.reason,
        operator: data.operator,
        notes: data.notes
      });
    }
    return farmStore.getReservoirs().find(item => item.id === id) || null;
  },

  async logWaterQuality(id: string, data: {
    ph: number;
    ec: number;
    waterTemp: number;
    doLevel?: number;
    waterLevelPercent?: number;
    recordedBy?: string;
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}/logs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          farmStore.addMeasurementRecord({
            reservoirId: id,
            ph: data.ph,
            ec: data.ec,
            waterTemp: data.waterTemp,
            doLevel: data.doLevel,
            waterLevelPercent: data.waterLevelPercent
          });
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    farmStore.addMeasurementRecord({
      reservoirId: id,
      ph: data.ph,
      ec: data.ec,
      waterTemp: data.waterTemp,
      doLevel: data.doLevel,
      waterLevelPercent: data.waterLevelPercent
    });
    return null;
  },

  async getFormulas(): Promise<NutrientFormula[]> {
    const localFormulas = farmStore.getFormulas();
    try {
      const res = await fetch(`${API_BASE_URL}/formulas`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map((f: any, idx: number) => {
            const fallback = localFormulas.find(init => init.id === f.id || init.name === f.name) || localFormulas[idx] || localFormulas[0];
            return {
              ...fallback,
              ...f,
              stockAItems: Array.isArray(f.stockAItems) && f.stockAItems.length > 0 ? f.stockAItems : fallback?.stockAItems,
              stockBItems: Array.isArray(f.stockBItems) && f.stockBItems.length > 0 ? f.stockBItems : fallback?.stockBItems,
              targetPpm: f.targetPpm || fallback?.targetPpm
            };
          });
        }
      }
    } catch {
      // Offline fallback
    }
    return localFormulas;
  },

  async getDrainEvents(): Promise<SolutionDrainEvent[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/drain-events`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }
    return farmStore.getDrainEvents();
  }
};
