// TypeScript type definitions for Smart Hydroponic Farm Management System
// Based on specification in readme.md

export type SystemType = 'NFT';

export type GrowthStage = 
  | 'seed'
  | 'germination'
  | 'seedling'
  | 'transplant'
  | 'vegetative'
  | 'pre_harvest'
  | 'harvest';

export type BatchStatus = 'active' | 'harvested' | 'failed';

export type AlertSeverity = 'emergency' | 'critical' | 'warning' | 'info';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'escalated';

export type AlertMetric = 'pH' | 'EC' | 'DO' | 'Temp' | 'WaterTemp' | 'WaterLevel' | 'AirTemp' | 'Humidity' | 'Light' | 'Nutrient' | 'System';

export interface CultivarStageConfig {
  stage: GrowthStage;
  days: number;
  phMin: number;
  phMax: number;
  ecMin: number;
  ecMax: number;
  waterTempMin?: number;
  waterTempMax?: number;
  lightDli?: number;
  notes?: string;
}

export interface Cultivar {
  id: string;
  cropName: string;
  name: string;
  scientificName: string;
  description: string;
  targetCycleDays: number;
  expectedWeightG: number;
  recommendedPhMin: number;
  recommendedPhMax: number;
  recommendedEcMin: number;
  recommendedEcMax: number;
  optimalWaterTempMin: number;
  optimalWaterTempMax: number;
  minWaterLevelPercent?: number;
  optimalAirTempMin?: number;
  optimalAirTempMax?: number;
  optimalHumidityMin?: number;
  optimalHumidityMax?: number;
  optimalLightPpfdMin?: number;
  optimalLightPpfdMax?: number;
  optimalLightDliMin?: number;
  optimalLightDliMax?: number;
  stageConfigs?: {
    stages: CultivarStageConfig[];
  };
}

export type ZoneStatus = 'growing' | 'ready_soon' | 'completed' | 'needs_attention' | 'empty';

export interface FarmZone {
  id: string;
  code: string; // 'A1', 'A2', 'B2', 'D1', 'C1', 'E1'
  name: string;
  greenhouse: string;
  areaM2: number;
  slotCapacity: number;
  color: string;
  status: ZoneStatus;
  currentBatchId?: string;
  currentBatchCode?: string;
  cultivarName?: string;
  cropName?: string;
  plantQuantity?: number;
  currentQuantity?: number;
  currentStage?: GrowthStage;
  expectedHarvestDate?: string;
  seedDate?: string;
  daysRemaining?: number;
  biomassProgress?: number;
  reservoirId?: string;
  reservoirName?: string;
  ph?: number;
  ec?: number;
  waterTemp?: number;
}

export interface ZoneLegendCounts {
  growing: number;
  ready_soon: number;
  completed: number;
  needs_attention: number;
}

export interface CropBatch {
  id: string;
  batchCode: string;
  cultivarId: string;
  cultivarName: string;
  cropName: string;
  systemType: SystemType;
  reservoirId: string;
  reservoirName: string;
  zoneId?: string;
  zoneCode?: string;
  zoneName?: string;
  plantQuantity: number;
  currentQuantity: number;
  seedDate: string;
  transplantDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  currentStage: GrowthStage;
  status: BatchStatus;
  densityPlantsPerM2: number;
  notes?: string;
  lastObservation?: {
    date: string;
    avgLeafCount: number;
    avgHeightCm: number;
    sampleWeightG: number;
    notes?: string;
  };
}

export interface CropObservation {
  id: string;
  batchId: string;
  date: string;
  avgLeafCount: number;
  avgHeightCm: number;
  sampleWeightG: number;
  notes?: string;
}

export interface Reservoir {
  id: string;
  name: string;
  systemType: SystemType;
  capacityLiters: number;
  currentVolumeLiters: number;
  currentPh: number;
  currentEc: number; // mS/cm
  currentWaterTemp: number; // °C
  currentDo?: number; // mg/L
  currentWaterLevelPercent?: number; // %
  formulaName: string;
  lastTopUpDate: string;
  lastReplacementDate?: string;
  pumpStatus: 'running' | 'idle' | 'warning';
  aerationStatus: 'active' | 'inactive';
  waterLogs?: Array<{
    id?: string;
    ph: number;
    ec: number;
    waterTemp: number;
    doLevel?: number;
    waterLevelPercent?: number;
    createdAt?: string;
    recordedBy?: string;
  }>;
}

export interface ChemicalItem {
  name: string;
  chemicalFormula: string;
  gramsPer10LStock: number;
  primaryNutrients: string;
  grade?: string;
}

export interface NutrientFormula {
  id: string;
  name: string;
  applicableCrop: string;
  systemType?: string;
  scientificStandard: string;
  targetEc: number;
  targetPh: number;
  stockADetails: string;
  stockBDetails: string;
  stockAItems?: ChemicalItem[];
  stockBItems?: ChemicalItem[];
  targetPpm?: {
    n: number;
    p: number;
    k: number;
    ca: number;
    mg: number;
    s: number;
    fe: number;
  };
  dosingRatio: string;
  chemicalIncompatibilityReason: string;
  notes: string;
}

export interface WaterQualityRecord {
  id: string;
  reservoirId: string;
  timestamp: string;
  ph: number;
  ec: number;
  waterTemp: number;
  doLevel?: number;
  waterLevelPercent?: number;
  recordedBy: string;
  source: 'manual' | 'sensor';
}

export interface EnvironmentRecord {
  id: string;
  timestamp: string;
  airTemp: number; // °C
  humidity: number; // %
  co2?: number; // ppm
  ppfd?: number; // µmol/m²/s
  dli?: number; // mol/m²/day
  vpd: number; // kPa
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: AlertMetric;
  title: string;
  message: string;
  reservoirId?: string;
  batchId?: string;
  zoneId?: string;
  thresholdValue?: number;
  actualValue?: number;
  unit?: string;
  /** @deprecated use status instead */
  resolved: boolean;
  suggestedAction: string;
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  escalatedTo?: string;
  escalatedAt?: string;
  resolutionNote?: string;
}

export interface Sensor {
  id: string;
  code: string;
  name: string;
  sensorType: string;
  status: 'online' | 'offline' | 'warning' | 'error' | 'calibrating';
  reservoirId?: string;
  zoneId?: string;
  lastReading?: number;
  unit?: string;
  lastSeenAt?: string;
  batteryLevel?: number;
}

export interface Channel {
  id: string;
  name: string;
  reservoirId: string;
  batchId?: string;
  slotCount: number;
  activePlants: number;
  status: 'active' | 'empty' | 'maintenance';
  notes?: string;
}

export interface SolutionDrainEvent {
  id: string;
  reservoirId: string;
  batchId?: string;
  drainDate: string;
  volumeDrainedLiters: number;
  finalPh: number;
  finalEc: number;
  finalDo: number;
  reason: 'end_of_batch' | 'scheduled_replacement' | 'contamination' | 'other';
  operator: string;
  notes?: string;
}

export interface FeatureContribution {
  feature: string;
  importance: number; // Percentage 0 - 100
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface AIPredictionResult {
  batchId?: string;
  batchCode?: string;
  cultivarName: string;
  plantAgeDays: number;
  leafCount: number;
  plantHeightCm: number;
  avgEc: number;
  avgPh: number;
  avgWaterTemp: number;
  predictedFreshWeightG: number;
  expectedHarvestablePlants: number;
  totalBatchYieldKg: number;
  confidenceR2: number;
  riskScore: 'low' | 'moderate' | 'high';
  featureContributions: FeatureContribution[];
  recommendations: string[];
}

export interface HarvestRecord {
  id: string;
  batchId: string;
  batchCode: string;
  cultivarName: string;
  harvestDate: string;
  harvestedPlants: number;
  totalWeightKg: number;
  avgWeightG: number;
  rejectedWeightKg: number;
  lossPercentage: number;
  aiPredictedWeightG: number;
  differencePercent: number;
  grade: 'A' | 'B' | 'C';
  unitPriceVnd?: number;
  totalRevenueVnd?: number;
  operatorName?: string;
  notes?: string;
}
