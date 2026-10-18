import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { BatchesView } from './views/BatchesView';
import { ReservoirsView } from './views/ReservoirsView';
import { AIPredictorView } from './views/AIPredictorView';
import { AlertsView } from './views/AlertsView';
import { HarvestView } from './views/HarvestView';
import { farmStore } from './mock/store';
import type { CropBatch } from './types/farm';
import { useToast } from './components/Toast';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  // Sync state whenever actions happen
  const refreshState = () => {
    setBatches(farmStore.getBatches());
    setReservoirs(farmStore.getReservoirs());
    setSensorHistory(farmStore.getSensorHistory());
    setAlerts(farmStore.getAlerts());
    setHarvests(farmStore.getHarvests());
    setChannels(farmStore.getChannels());
    setDrainEvents(farmStore.getDrainEvents());
  };

  const handleAddBatch = (data: any) => {
    farmStore.addBatch(data);
    refreshState();
    showToast('Tạo lô thành công', `Đã thêm lô ${data.batchCode || ''} vào máng canh tác`, 'success');
  };

  const handleDeleteBatch = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lô trồng này?')) {
      farmStore.deleteBatch(id);
      refreshState();
      showToast('Đã xóa lô', 'Lô trồng đã được loại bỏ khỏi danh sách', 'info');
    }
  };

  const handleAddMeasurement = (data: any) => {
    farmStore.addMeasurementRecord(data);
    refreshState();
    showToast('Đã ghi nhận số đo', `pH ${data.ph} | EC ${data.ec} mS/cm | ${data.waterTemp}°C`, 'success');
  };

  const handleUpdateVolume = (resId: string, addedLiters: number) => {
    const res = reservoirs.find(r => r.id === resId);
    if (!res) return;
    const newVol = Math.min(res.capacityLiters, res.currentVolumeLiters + addedLiters);
    const newEc = Math.max(1.2, parseFloat((res.currentEc * (res.currentVolumeLiters / newVol)).toFixed(2)));
    farmStore.updateReservoir(resId, {
      currentVolumeLiters: newVol,
      currentEc: newEc,
      lastTopUpDate: new Date().toISOString().split('T')[0]
    });
    refreshState();
    showToast('Châm nước thành công', `Đã châm thêm ${addedLiters}L nước sạch vào bể`, 'info');
  };

  const handleApplyDosing = (reservoirId: string, targetEc: number, doseMl: number) => {
    farmStore.applyDosing(reservoirId, targetEc, doseMl);
    refreshState();
    showToast('Châm dinh dưỡng thành công', `Đã châm ${doseMl}ml Can A & B. EC bồn đạt ${targetEc} mS/cm.`, 'success');
  };

  const handleAddObservation = (batchId: string, obs: any) => {
    farmStore.addBatchObservation(batchId, obs);
    refreshState();
    showToast('Đã lưu đo đạc sinh trưởng', `${obs.avgLeafCount} lá | ${obs.avgHeightCm} cm | mẫu ${obs.sampleWeightG}g`, 'success');
  };

  const handleAdvanceStage = (batchId: string, newStage: any) => {
    farmStore.advanceBatchStage(batchId, newStage);
    refreshState();
    const stageNames: Record<string, string> = {
      seedling: 'Cây con',
      vegetative: 'Sinh dưỡng',
      pre_harvest: 'Sắp thu hoạch',
      harvested: 'Đã thu hoạch'
    };
    showToast('Chuyển giai đoạn', `Lô đã chuyển sang: ${stageNames[newStage] || newStage}`, 'info');
  };

  const handleResolveAlert = (id: string, by?: string, note?: string) => {
    farmStore.resolveAlert(id, by, note);
    refreshState();
  };

  const handleAcknowledgeAlert = (id: string, by: string) => {
    farmStore.acknowledgeAlert(id, by);
    refreshState();
  };

  const handleDrainReservoir = (event: any) => {
    farmStore.addDrainEvent(event);
    refreshState();
    showToast('Xả bể thành công', 'Đã ghi nhận sự kiện xả bể và thay dung dịch mới', 'success');
  };

  const handleRecordHarvest = (data: any) => {
    farmStore.recordHarvest(data);
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
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
              path="/batches"
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
                />
              }
            />
            <Route
              path="/reservoirs"
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
              path="/forecast"
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
              path="/alerts"
              element={
                <AlertsView
                  alerts={alerts}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onResolveAlert={handleResolveAlert}
                />
              }
            />
            <Route
              path="/harvest"
              element={
                <HarvestView
                  harvests={harvests}
                  batches={batches}
                  reservoirs={reservoirs}
                  onRecordHarvest={handleRecordHarvest}
                />
              }
            />
            {/* Catch-all redirect to /dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
