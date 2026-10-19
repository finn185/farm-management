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
import type { CropBatch, GrowthStage, BatchStatus } from './types/farm';
import { useToast } from './components/Toast';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  // State from Store
  const [batches, setBatches] = useState(() => farmStore.getBatches());
  const [reservoirs, setReservoirs] = useState(() => farmStore.getReservoirs());
  const [cultivars] = useState(() => farmStore.getCultivars());
  const [formulas] = useState(() => farmStore.getFormulas());
  const [sensorHistory, setSensorHistory] = useState(() => farmStore.getSensorHistory());
  const [alerts, setAlerts] = useState(() => farmStore.getAlerts());
  const [harvests, setHarvests] = useState(() => farmStore.getHarvests());
  const [channels, setChannels] = useState(() => farmStore.getChannels());
  const [drainEvents, setDrainEvents] = useState(() => farmStore.getDrainEvents());

  // Batch targeted for AI simulation
  const [selectedBatchForAI, setSelectedBatchForAI] = useState<CropBatch | null>(null);

  // Sync state whenever actions happen (fetches from Backend API with automatic local fallback)
  const refreshState = async () => {
    try {
      const [batchesRes, reservoirsRes, alertsRes, harvestsRes] = await Promise.allSettled([
        batchesApi.getBatches(),
        reservoirsApi.getReservoirs(),
        alertsApi.getAlerts(),
        harvestsApi.getHarvests()
      ]);

      if (batchesRes.status === 'fulfilled' && batchesRes.value && batchesRes.value.length > 0) {
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
    } catch {
      setBatches(farmStore.getBatches());
      setReservoirs(farmStore.getReservoirs());
      setAlerts(farmStore.getAlerts());
      setHarvests(farmStore.getHarvests());
    }

    setSensorHistory(farmStore.getSensorHistory());
    setChannels(farmStore.getChannels());
    setDrainEvents(farmStore.getDrainEvents());
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
    await reservoirsApi.logWaterQuality(data.reservoirId, data);
    refreshState();
    showToast('Đã ghi nhận số đo', `pH ${data.ph} | EC ${data.ec} mS/cm | ${data.waterTemp}°C`, 'success');
  };

  const handleUpdateVolume = async (resId: string, addedLiters: number) => {
    await reservoirsApi.topUpWater(resId, { waterLitersAdded: addedLiters });
    refreshState();
    showToast('Châm nước thành công', `Đã châm thêm ${addedLiters}L nước sạch vào bể`, 'info');
  };

  const handleApplyDosing = async (reservoirId: string, targetEc: number, doseMl: number) => {
    await reservoirsApi.doseNutrient(reservoirId, {
      amountStockAMl: doseMl,
      amountStockBMl: doseMl,
      targetEc
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

  const handleResolveAlert = async (id: string, by?: string, note?: string) => {
    await alertsApi.resolveAlert(id, by || 'Kỹ sư Nông nghiệp', note);
    refreshState();
    showToast('Đã giải quyết sự cố', 'Cảnh báo đã được đóng thành công', 'success');
  };

  const handleAcknowledgeAlert = async (id: string, by: string) => {
    await alertsApi.acknowledgeAlert(id, by);
    refreshState();
    showToast('Đã tiếp nhận sự cố', 'Trạng thái chuyển sang Đang theo dõi', 'info');
  };

  const handleDrainReservoir = async (event: any) => {
    await reservoirsApi.drainReservoir(event.reservoirId, {
      reason: event.reason,
      operator: event.operator,
      notes: event.notes
    });
    refreshState();
    showToast('Xả bể thành công', 'Đã ghi nhận sự kiện xả bể và thay dung dịch mới', 'success');
  };

  const handleRecordHarvest = async (data: any) => {
    await harvestsApi.recordHarvest(data);
    refreshState();
    showToast('Thu hoạch hoàn tất', `Ghi nhận ${data.totalWeightKg}kg thành phẩm cho lô ${data.batchCode}`, 'success');
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
                          onNavigateTab={handleNavigateTab}
                          onSelectBatchForAI={handleSelectBatchForAI}
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
                          onAddBatch={handleAddBatch}
                          onDeleteBatch={handleDeleteBatch}
                          onSelectBatchForAI={handleSelectBatchForAI}
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
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
