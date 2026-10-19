import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { BatchesView } from './views/BatchesView';
import { ReservoirsView } from './views/ReservoirsView';
import { AIPredictorView } from './views/AIPredictorView';
import { AlertsView } from './views/AlertsView';
import { HarvestView } from './views/HarvestView';
import { RecordHarvestModal } from './components/RecordHarvestModal';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ProfileView } from './views/ProfileView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { farmStore } from './mock/store';
import { batchesApi } from './services/batchesApi';
import { reservoirsApi } from './services/reservoirsApi';
import { alertsApi } from './services/alertsApi';
import { harvestsApi } from './services/harvestsApi';
import { cultivarsApi } from './services/cultivarsApi';
import { zonesApi } from './services/zonesApi';
import type { 
  CropBatch, 
  GrowthStage, 
  BatchStatus, 
  Cultivar, 
  Reservoir, 
  NutrientFormula, 
  Alert, 
  HarvestRecord, 
  FarmZone, 
  SolutionDrainEvent 
} from './types/farm';
import { useToast } from './components/Toast';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // State populated directly from PostgreSQL via Backend API
  const [batches, setBatches] = useState<CropBatch[]>([]);
  const [reservoirs, setReservoirs] = useState<Reservoir[]>([]);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [formulas, setFormulas] = useState<NutrientFormula[]>([]);
  const [sensorHistory, setSensorHistory] = useState(() => farmStore.getSensorHistory());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [zones, setZones] = useState<FarmZone[]>([]);
  const [channels, setChannels] = useState(() => farmStore.getChannels());
  const [drainEvents, setDrainEvents] = useState<SolutionDrainEvent[]>([]);

  // Batch targeted for AI simulation
  const [selectedBatchForAI, setSelectedBatchForAI] = useState<CropBatch | null>(null);
  // Batch targeted for direct Harvest recording
  const [selectedBatchForHarvest, setSelectedBatchForHarvest] = useState<CropBatch | null>(null);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);

  // Sync state whenever actions happen (fetches from Backend API with automatic local fallback)
  const refreshState = async () => {
    try {
      const [
        batchesRes,
        reservoirsRes,
        alertsRes,
        harvestsRes,
        cultivarsRes,
        zonesRes,
        formulasRes,
        drainEventsRes
      ] = await Promise.allSettled([
        batchesApi.getBatches(),
        reservoirsApi.getReservoirs(),
        alertsApi.getAlerts(),
        harvestsApi.getHarvests(),
        cultivarsApi.getCultivars(),
        zonesApi.getZones(),
        reservoirsApi.getFormulas(),
        reservoirsApi.getDrainEvents()
      ]);

      if (batchesRes.status === 'fulfilled' && batchesRes.value && batchesRes.value.length > 0) {
        setBatches(batchesRes.value);
      } else if (batchesRes.status === 'fulfilled' && batchesRes.value) {
        setBatches(batchesRes.value);
      } else {
        setBatches(farmStore.getBatches());
      }

      if (reservoirsRes.status === 'fulfilled' && reservoirsRes.value && reservoirsRes.value.length > 0) {
        setReservoirs(reservoirsRes.value);
      } else {
        setReservoirs(farmStore.getReservoirs());
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value) {
        setAlerts(alertsRes.value);
      } else {
        setAlerts(farmStore.getAlerts());
      }

      if (harvestsRes.status === 'fulfilled' && harvestsRes.value) {
        setHarvests(harvestsRes.value);
      } else {
        setHarvests(farmStore.getHarvests());
      }

      if (cultivarsRes.status === 'fulfilled' && cultivarsRes.value && cultivarsRes.value.length > 0) {
        setCultivars(cultivarsRes.value);
      } else {
        setCultivars(farmStore.getCultivars());
      }

      if (zonesRes.status === 'fulfilled' && zonesRes.value && zonesRes.value.length > 0) {
        setZones(zonesRes.value);
      } else {
        setZones(farmStore.getZones());
      }

      if (formulasRes.status === 'fulfilled' && formulasRes.value && formulasRes.value.length > 0) {
        setFormulas(formulasRes.value);
      } else {
        setFormulas(farmStore.getFormulas());
      }

      if (drainEventsRes.status === 'fulfilled' && drainEventsRes.value && drainEventsRes.value.length > 0) {
        setDrainEvents(drainEventsRes.value);
      } else {
        setDrainEvents(farmStore.getDrainEvents());
      }
    } catch {
      setBatches(farmStore.getBatches());
      setReservoirs(farmStore.getReservoirs());
      setAlerts(farmStore.getAlerts());
      setHarvests(farmStore.getHarvests());
      setCultivars(farmStore.getCultivars());
      setZones(farmStore.getZones());
      setFormulas(farmStore.getFormulas());
      setDrainEvents(farmStore.getDrainEvents());
    }

    setSensorHistory(farmStore.getSensorHistory());
    setChannels(farmStore.getChannels());
  };

  // Sync with backend on initial load
  useEffect(() => {
    refreshState();
  }, []);

  const handleAddBatch = async (data: any) => {
    await batchesApi.createBatch(data);
    refreshState();
    showToast('Tạo lô thành công', `Đã thêm lô ${data.batchCode || ''} vào giàn canh tác`, 'success');
  };

  const handleDeleteBatch = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lô trồng này?')) {
      await batchesApi.deleteBatch(id);
      refreshState();
      showToast('Đã xóa lô', 'Lô trồng đã được loại bỏ khỏi hệ thống', 'info');
    }
  };

  const handleAddMeasurement = async (data: any) => {
    const engineerName = user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await reservoirsApi.logWaterQuality(data.reservoirId, {
      ...data,
      recordedBy: engineerName
    });
    refreshState();
    showToast('Đã ghi nhận số đo', `pH ${data.ph} | EC ${data.ec} mS/cm | ${data.waterTemp}°C`, 'success');
  };

  const handleUpdateVolume = async (resId: string, addedLiters: number) => {
    const engineerName = user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await reservoirsApi.topUpWater(resId, {
      waterLitersAdded: addedLiters,
      operator: engineerName
    });
    refreshState();
    showToast('Châm nước thành công', `Đã châm thêm ${addedLiters}L nước sạch vào bể`, 'info');
  };

  const handleApplyDosing = async (reservoirId: string, targetEc: number, doseMl: number) => {
    const engineerName = user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await reservoirsApi.doseNutrient(reservoirId, {
      amountStockAMl: doseMl,
      amountStockBMl: doseMl,
      targetEc,
      operator: engineerName
    });
    refreshState();
    showToast('Châm dinh dưỡng thành công', `Đã châm ${doseMl}ml Stock A & B. EC bồn đạt ${targetEc} mS/cm.`, 'success');
  };

  const handleAddObservation = async (batchId: string, obs: any) => {
    await batchesApi.addObservation(batchId, obs);
    refreshState();
    showToast('Đã lưu đo đạc sinh trưởng', `${obs.avgLeafCount} lá | ${obs.avgHeightCm} cm | mẫu ${obs.sampleWeightG}g`, 'success');
  };

  const handleAdvanceStage = async (batchId: string, newStage: GrowthStage) => {
    await batchesApi.advanceStage(batchId, newStage);
    refreshState();
    const stageNames: Record<string, string> = {
      seed: 'Hạt giống',
      germination: 'Nảy mầm',
      seedling: 'Cây con',
      transplant: 'Chuyển máng',
      vegetative: 'Sinh dưỡng',
      pre_harvest: 'Tích lũy sinh khối',
      harvest: 'Sẵn sàng thu hoạch'
    };
    showToast('Chuyển giai đoạn', `Lô đã chuyển sang: ${stageNames[newStage] || newStage}`, 'info');
  };

  const handleUpdateBatchStatus = async (batchId: string, status: BatchStatus) => {
    await batchesApi.updateStatus(batchId, status);
    refreshState();
    const statusNames: Record<string, string> = {
      active: 'Đang trồng',
      harvested: 'Đã thu hoạch',
      failed: 'Hư hỏng / Thất bại'
    };
    showToast('Cập nhật trạng thái', `Lô đã chuyển sang: ${statusNames[status] || status}`, 'info');
  };

  const handleResolveAlert = async (id: string, by?: string, note?: string, metricVal?: number) => {
    const engineer = by || user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await alertsApi.resolveAlert(id, engineer, note);

    // Smart Sync: Cập nhật ngay chỉ số bể nếu có số đo mới (từ ô input trực tiếp hoặc từ ghi chú)
    const targetAlert = alerts.find(a => a.id === id);
    if (targetAlert?.reservoirId) {
      let resolvedValue = metricVal;

      // Nếu không nhập ô số đo riêng, quét từ ghi chú (hỗ trợ mọi định dạng: "5.8", "đo mới 5.8", "về 5.80", "5.8 pH", v.v.)
      if (resolvedValue === undefined && note) {
        if (targetAlert.metric === 'pH') {
          // Bắt các số thập phân từ 4.5 đến 8.5 ở bất kỳ đâu trong ghi chú
          const matches = note.match(/\b([4-8](?:[.,]\d{1,2})?)\b/g);
          if (matches && matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
              const val = parseFloat(matches[i].replace(',', '.'));
              if (val >= 4.5 && val <= 8.5) {
                resolvedValue = val;
                break;
              }
            }
          }
        } else if (targetAlert.metric === 'EC') {
          // Bắt số EC từ 0.8 đến 3.5
          const matches = note.match(/\b([0-3](?:[.,]\d{1,2})?)\b/g);
          if (matches && matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
              const val = parseFloat(matches[i].replace(',', '.'));
              if (val >= 0.8 && val <= 3.5) {
                resolvedValue = val;
                break;
              }
            }
          }
        } else if (targetAlert.metric === 'Temp' || targetAlert.metric === 'WaterTemp') {
          // Bắt số nhiệt độ nước từ 15 đến 35°C
          const matches = note.match(/\b([1-3]\d(?:[.,]\d{1,2})?)\b/g);
          if (matches && matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
              const val = parseFloat(matches[i].replace(',', '.'));
              if (val >= 15 && val <= 35) {
                resolvedValue = val;
                break;
              }
            }
          }
        } else if (targetAlert.metric === 'DO') {
          // Bắt số Oxy DO từ 4 đến 12 mg/L
          const matches = note.match(/\b([4-9]|1[0-2](?:[.,]\d{1,2})?)\b/g);
          if (matches && matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
              const val = parseFloat(matches[i].replace(',', '.'));
              if (val >= 4 && val <= 12) {
                resolvedValue = val;
                break;
              }
            }
          }
        } else if (targetAlert.metric === 'WaterLevel') {
          // Bắt số mực nước từ 10 đến 100%
          const matches = note.match(/\b([1-9]\d|100)\b/g);
          if (matches && matches.length > 0) {
            resolvedValue = parseFloat(matches[matches.length - 1]);
          }
        }
      }

      if (resolvedValue !== undefined) {
        const res = reservoirs.find(r => r.id === targetAlert.reservoirId);
        if (res) {
          await reservoirsApi.logWaterQuality(targetAlert.reservoirId, {
            ph: targetAlert.metric === 'pH' ? resolvedValue : res.currentPh,
            ec: targetAlert.metric === 'EC' ? resolvedValue : res.currentEc,
            waterTemp: (targetAlert.metric === 'Temp' || targetAlert.metric === 'WaterTemp') ? resolvedValue : res.currentWaterTemp,
            doLevel: targetAlert.metric === 'DO' ? resolvedValue : (res.currentDo ?? 6.8),
            waterLevelPercent: targetAlert.metric === 'WaterLevel' ? resolvedValue : (res.currentWaterLevelPercent ?? 90),
            recordedBy: engineer
          });
        }
      }
    }

    refreshState();
    showToast('Đã giải quyết sự cố', 'Cảnh báo đã được đóng và chỉ số bể đã đồng bộ thành công', 'success');
  };

  const handleAcknowledgeAlert = async (id: string, by?: string) => {
    const engineer = by || user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await alertsApi.acknowledgeAlert(id, engineer);
    refreshState();
    showToast('Đã tiếp nhận sự cố', 'Trạng thái chuyển sang Đang theo dõi', 'info');
  };

  const handleDrainReservoir = async (event: any) => {
    const engineerName = user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await reservoirsApi.drainReservoir(event.reservoirId, {
      reason: event.reason,
      operator: event.operator || engineerName,
      notes: event.notes
    });
    refreshState();
    showToast('Xả bể thành công', 'Đã ghi nhận sự kiện xả bể và thay dung dịch mới', 'success');
  };

  const handleOpenHarvestModal = (batch?: CropBatch | null) => {
    setSelectedBatchForHarvest(batch || null);
    setIsHarvestModalOpen(true);
  };

  const handleCloseHarvestModal = () => {
    setIsHarvestModalOpen(false);
    setSelectedBatchForHarvest(null);
  };

  const handleRecordHarvest = async (data: any) => {
    const engineerName = user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
    await harvestsApi.recordHarvest({
      ...data,
      operatorName: data.operatorName || engineerName
    });
    handleCloseHarvestModal();
    refreshState();
    showToast('Thu hoạch hoàn tất', `Ghi nhận ${data.totalWeightKg}kg thành phẩm cho lô ${data.batchCode}`, 'success');
    navigate('/harvest');
  };

  const handleResetData = () => {
    farmStore.resetAllData();
    refreshState();
    window.location.reload();
  };

  const handleSelectBatchForAI = (batch: CropBatch) => {
    setSelectedBatchForAI(batch);
    navigate('/forecast');
  };

  const handleSelectBatchForHarvest = (batch: CropBatch) => {
    // Open harvest modal in-place without navigating away prematurely
    setSelectedBatchForHarvest(batch);
    setIsHarvestModalOpen(true);
  };

  const handleNavigateTab = (tab: string) => {
    navigate('/' + tab);
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'open' || a.status === 'acknowledged').length;

  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterView />}
      />

      {/* Protected Dashboard Application Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-container">
              {/* Sidebar with Route Links */}
              <Sidebar
                unreadAlertCount={unreadAlertsCount}
                onResetData={handleResetData}
              />

              {/* Main Area */}
              <div className="app-main">
                <Header unreadAlertCount={unreadAlertsCount} />

                <main className="content-body">
                  <Routes>
                    <Route path="" element={<Navigate to="/dashboard" replace />} />
                    <Route
                      path="dashboard"
                      element={
                        <DashboardView
                          batches={batches}
                          reservoirs={reservoirs}
                          sensorHistory={sensorHistory}
                          alerts={alerts}
                          harvests={harvests}
                          onNavigateTab={handleNavigateTab}
                          onSelectBatchForAI={handleSelectBatchForAI}
                          onSelectBatchForHarvest={handleSelectBatchForHarvest}
                        />
                      }
                    />
                    <Route
                      path="batches"
                      element={
                        <BatchesView
                          batches={batches}
                          cultivars={cultivars}
                          reservoirs={reservoirs}
                          zones={zones}
                          onAddBatch={handleAddBatch}
                          onDeleteBatch={handleDeleteBatch}
                          onSelectBatchForAI={handleSelectBatchForAI}
                          onSelectBatchForHarvest={handleSelectBatchForHarvest}
                          onAddObservation={handleAddObservation}
                          onAdvanceStage={handleAdvanceStage}
                          onUpdateStatus={handleUpdateBatchStatus}
                        />
                      }
                    />
                    <Route
                      path="reservoirs"
                      element={
                        <ReservoirsView
                          reservoirs={reservoirs}
                          formulas={formulas}
                          channels={channels}
                          batches={batches}
                          drainEvents={drainEvents}
                          onAddMeasurement={handleAddMeasurement}
                          onUpdateVolume={handleUpdateVolume}
                          onDrainReservoir={handleDrainReservoir}
                          onApplyDosing={handleApplyDosing}
                        />
                      }
                    />
                    <Route
                      path="forecast"
                      element={
                        <AIPredictorView
                          batches={batches}
                          selectedBatch={selectedBatchForAI}
                          reservoirs={reservoirs}
                          cultivars={cultivars}
                        />
                      }
                    />
                    <Route
                      path="alerts"
                      element={
                        <AlertsView
                          alerts={alerts}
                          onAcknowledgeAlert={handleAcknowledgeAlert}
                          onResolveAlert={handleResolveAlert}
                        />
                      }
                    />
                    <Route
                      path="harvest"
                      element={
                        <HarvestView
                          harvests={harvests}
                          batches={batches}
                          reservoirs={reservoirs}
                          onOpenRecordHarvest={() => handleOpenHarvestModal(null)}
                          onRecordHarvest={handleRecordHarvest}
                        />
                      }
                    />
                    <Route
                      path="profile"
                      element={<ProfileView />}
                    />
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>

              {/* Shared In-Place Harvest Recording Modal */}
              <RecordHarvestModal
                isOpen={isHarvestModalOpen}
                onClose={handleCloseHarvestModal}
                targetBatch={selectedBatchForHarvest}
                batches={batches}
                reservoirs={reservoirs}
                onSubmit={handleRecordHarvest}
              />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
