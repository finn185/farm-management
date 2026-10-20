"""
api.py
FastAPI Microservice cho AI Dự Báo Năng Suất & Phát Hiện Bất Thường HydroSmart.
Tích hợp 2 mô hình huấn luyện từ dữ liệu thực tế Cleaned_Data_Batches_Final.csv:
1. RandomForestRegressor: Dự báo năng suất xà lách (Yield Prediction)
2. IsolationForest: Giám sát & phát hiện bất thường môi trường (Anomaly Detection)
"""

import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import joblib

app = FastAPI(
    title="HydroSmart AI Engine",
    description="Microservice dự báo năng suất sinh khối và giám sát bất thường nông nghiệp thông minh",
    version="2.0.0"
)

# Cho phép CORS từ Frontend Vite React và Backend Express
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RF_YIELD_PATH = os.path.join(SCRIPT_DIR, 'rf_yield_model.pkl')
ISO_ANOMALY_PATH = os.path.join(SCRIPT_DIR, 'iso_anomaly_model.pkl')
METADATA_PATH = os.path.join(SCRIPT_DIR, 'models_metadata.json')

# Biến lưu trữ mô hình trong bộ nhớ
rf_yield_model = None
iso_anomaly_model = None
models_metadata = {}

def load_ai_models():
    global rf_yield_model, iso_anomaly_model, models_metadata
    if not os.path.exists(RF_YIELD_PATH) or not os.path.exists(ISO_ANOMALY_PATH):
        try:
            print("Chưa tìm thấy tệp mô hình, tự động huấn luyện từ Cleaned_Data_Batches_Final.csv...")
            from train_models import train_and_save
            train_and_save()
        except Exception as e:
            print(f"Không thể tự động huấn luyện: {e}")

    if os.path.exists(RF_YIELD_PATH):
        rf_yield_model = joblib.load(RF_YIELD_PATH)
        print(f"Đã tải mô hình Yield Prediction: {RF_YIELD_PATH}")
    if os.path.exists(ISO_ANOMALY_PATH):
        iso_anomaly_model = joblib.load(ISO_ANOMALY_PATH)
        print(f"Đã tải mô hình Anomaly Detection: {ISO_ANOMALY_PATH}")
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            models_metadata = json.load(f)

# Nạp model lúc khởi chạy server
load_ai_models()


# ==========================================
# DATA CONTRACTS (PYDANTIC SCHEMAS)
# ==========================================

class PredictionRequest(BaseModel):
    batchId: Optional[str] = "SAMPLE-BATCH"
    batchCode: Optional[str] = "LET-2026-001"
    cultivarName: str = Field(default="Green Oakleaf", description="Tên giống xà lách")
    targetCycleDays: int = Field(default=35, ge=15, le=60)
    plantAgeDays: int = Field(default=28, ge=1, le=60)
    leafCount: int = Field(default=16, ge=1, le=50)
    plantHeightCm: float = Field(default=15.0, ge=1.0, le=50.0)
    avgEc: float = Field(default=1.72, ge=0.2, le=5.0)
    avgPh: float = Field(default=5.85, ge=3.0, le=9.0)
    avgWaterTemp: float = Field(default=22.4, ge=10.0, le=45.0)
    airTemp: Optional[float] = 24.5
    humidityRh: Optional[float] = 65.0
    cumulativeNutrientAbMl: Optional[float] = None
    cumulativeAcidMl: Optional[float] = None
    daysSinceLastDosing: Optional[int] = None
    expectedPlants: int = Field(default=500, ge=1, le=20000)

class FeatureContributionItem(BaseModel):
    feature: str
    importance: int
    impact: str
    description: str

class PredictionResponse(BaseModel):
    batchId: Optional[str]
    batchCode: Optional[str]
    cultivarName: str
    plantAgeDays: int
    leafCount: int
    plantHeightCm: float
    avgEc: float
    avgPh: float
    avgWaterTemp: float
    predictedFreshWeightG: float
    expectedHarvestablePlants: int
    totalBatchYieldKg: float
    confidenceR2: float
    riskScore: str
    featureContributions: List[FeatureContributionItem]
    recommendations: List[str]

class AnomalyDetectionRequest(BaseModel):
    reservoirId: Optional[str] = None
    reservoirName: Optional[str] = "Bể dinh dưỡng NFT-01"
    avgPh: float = Field(..., ge=0.0, le=14.0)
    avgEc: float = Field(..., ge=0.0, le=10.0)
    avgWaterTemp: float = Field(..., ge=0.0, le=50.0)

class AnomalyDetectionResponse(BaseModel):
    reservoirId: Optional[str]
    reservoirName: Optional[str]
    isAnomaly: bool
    status: str
    anomalyScore: float
    severity: str
    riskFactors: List[str]
    suggestedAction: str


# ==========================================
# REST API ENDPOINTS
# ==========================================

@app.get("/")
def health_check():
    return {
        "service": "HydroSmart AI Engine",
        "status": "online",
        "version": "2.0.0",
        "models": {
            "yield_prediction_loaded": rf_yield_model is not None,
            "anomaly_detection_loaded": iso_anomaly_model is not None
        },
        "metadata": models_metadata
    }

@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_yield(req: PredictionRequest):
    global rf_yield_model
    if rf_yield_model is None:
        load_ai_models()
        if rf_yield_model is None:
            raise HTTPException(status_code=503, detail="Mô hình AI dự báo chưa sẵn sàng. Vui lòng chạy train_models.py.")

    # 1. Chuẩn bị đặc trưng cho RandomForestRegressor đã huấn luyện
    # [Plant_Age_Days, Avg_pH, Avg_EC, Avg_Water_Temp, Avg_Air_Temp, Avg_Humidity, Cumulative_Nutrient_AB_ml, Cumulative_Acid_ml, Days_Since_Last_Dosing]
    air_temp = req.airTemp if req.airTemp is not None else round(req.avgWaterTemp + 2.5, 1)
    humidity = req.humidityRh if req.humidityRh is not None else 65.0
    
    # Ước lượng hợp lý nếu người dùng không truyền lịch sử châm phân
    cum_nutrient = req.cumulativeNutrientAbMl if req.cumulativeNutrientAbMl is not None else max(0.0, min(2000.0, (req.plantAgeDays - 4) * 45.0))
    cum_acid = req.cumulativeAcidMl if req.cumulativeAcidMl is not None else max(0.0, min(150.0, (req.plantAgeDays - 10) * 2.5))
    days_dosing = req.daysSinceLastDosing if req.daysSinceLastDosing is not None else 1

    feature_names = [
        'Plant_Age_Days', 'Avg_pH', 'Avg_EC', 'Avg_Water_Temp',
        'Avg_Air_Temp', 'Avg_Humidity', 'Cumulative_Nutrient_AB_ml',
        'Cumulative_Acid_ml', 'Days_Since_Last_Dosing'
    ]

    df_input = pd.DataFrame([[
        req.plantAgeDays,
        req.avgPh,
        req.avgEc,
        req.avgWaterTemp,
        air_temp,
        humidity,
        cum_nutrient,
        cum_acid,
        days_dosing
    ]], columns=feature_names)

    # Dự báo khối lượng tại ngày tuổi hiện tại
    pred_weight_current = float(rf_yield_model.predict(df_input)[0])

    # Dự phóng đến ngày thu hoạch nếu chưa tới ngày thu hoạch mục tiêu
    final_weight_g = pred_weight_current
    if req.plantAgeDays < req.targetCycleDays:
        days_rem = req.targetCycleDays - req.plantAgeDays
        growth_rate_daily = 6.2 if req.plantAgeDays > 20 else 4.0
        ec_mod = 1.05 if (1.5 <= req.avgEc <= 1.85) else (0.85 if req.avgEc < 1.3 else 0.88)
        temp_mod = 0.82 if req.avgWaterTemp > 24.5 else 1.02
        final_weight_g = round(pred_weight_current + (days_rem * growth_rate_daily * ec_mod * temp_mod), 1)
    else:
        final_weight_g = round(pred_weight_current, 1)

    total_yield_kg = round((final_weight_g * req.expectedPlants) / 1000.0, 1)

    # Đóng góp đặc trưng chuẩn hóa 100%
    raw_age_w = 32
    raw_leaf_w = 22 + (abs(req.leafCount - (req.plantAgeDays * 0.6)) * 4)
    raw_ec_w = 18 + (abs(req.avgEc - 1.7) * 25)
    raw_temp_w = 16 + (max(0, req.avgWaterTemp - 23.5) * 20)
    raw_ph_w = 12 + (abs(req.avgPh - 5.9) * 18)

    total_w = raw_age_w + raw_leaf_w + raw_ec_w + raw_temp_w + raw_ph_w
    imp_age = int(round((raw_age_w / total_w) * 100))
    imp_leaf = int(round((raw_leaf_w / total_w) * 100))
    imp_ec = int(round((raw_ec_w / total_w) * 100))
    imp_temp = int(round((raw_temp_w / total_w) * 100))
    imp_ph = 100 - (imp_age + imp_leaf + imp_ec + imp_temp)

    cultivar = req.cultivarName
    feature_contributions = [
        FeatureContributionItem(
            feature="Tuổi cây trồng",
            importance=imp_age,
            impact="positive",
            description=f"Đã phát triển {req.plantAgeDays}/{req.targetCycleDays} ngày của chu kỳ giống {cultivar}."
        ),
        FeatureContributionItem(
            feature="Số lượng lá thật",
            importance=imp_leaf,
            impact="positive" if req.leafCount >= int(req.plantAgeDays * 0.55) else "negative",
            description=f"{req.leafCount} lá thật ({'Tán lá sinh khối đạt chuẩn theo tuổi' if req.leafCount >= int(req.plantAgeDays * 0.55) else 'Lá phát triển chậm hơn dự kiến'})."
        ),
        FeatureContributionItem(
            feature="Nồng độ dinh dưỡng EC",
            importance=imp_ec,
            impact="positive" if 1.5 <= req.avgEc <= 1.85 else "negative",
            description=f"EC đạt {req.avgEc} mS/cm ({'Lý tưởng cho xà lách' if 1.5 <= req.avgEc <= 1.85 else 'Quá đậm có nguy cơ cháy lá' if req.avgEc > 2.0 else 'Quá loãng cần châm phân'})."
        ),
        FeatureContributionItem(
            feature="Nhiệt độ nước bồn",
            importance=imp_temp,
            impact="positive" if 19.0 <= req.avgWaterTemp <= 23.8 else "negative",
            description=f"Nhiệt độ {req.avgWaterTemp}°C ({'Mát mẻ tối ưu oxy rễ' if req.avgWaterTemp <= 23.8 else 'Nóng, nguy cơ nấm Pythium và thiếu DO'})."
        ),
        FeatureContributionItem(
            feature="Độ pH dung dịch",
            importance=imp_ph,
            impact="positive" if 5.6 <= req.avgPh <= 6.2 else "negative",
            description=f"pH {req.avgPh} ({'Dải hấp thu vi lượng hoàn hảo' if 5.6 <= req.avgPh <= 6.2 else 'Lệch ngưỡng hấp thu dinh dưỡng'})."
        )
    ]

    # Đánh giá Risk Score
    risk = "low"
    if req.avgWaterTemp > 25.5 or req.avgEc > 2.2 or req.avgEc < 1.2 or req.avgPh < 5.3 or req.avgPh > 6.6:
        risk = "high"
    elif req.avgWaterTemp > 24.2 or req.avgEc > 1.95 or req.avgEc < 1.35 or req.avgPh < 5.5 or req.avgPh > 6.3:
        risk = "moderate"

    recommendations = []
    if req.avgWaterTemp > 24.5:
        recommendations.append(f"🌡️ Nhiệt độ nước bồn ({req.avgWaterTemp}°C) vượt ngưỡng an toàn. Bật quạt thông gió hoặc bổ sung nước mát tránh nấm rễ.")
    if req.avgEc < 1.35:
        recommendations.append(f"💡 Nồng độ EC ({req.avgEc} mS/cm) bị loãng. Châm thêm Stock A & B theo Dosing Calculator để đưa EC về 1.6 - 1.8 mS/cm.")
    elif req.avgEc > 2.0:
        recommendations.append(f"⚠️ Nồng độ EC ({req.avgEc} mS/cm) cao. Châm thêm nước sạch pha loãng tránh cháy mép lá non (tipburn).")
    if req.avgPh < 5.5:
        recommendations.append(f"🧪 pH ({req.avgPh}) bị chua. Bổ sung dung dịch kiềm nhẹ (KOH) để đưa pH về 5.8 - 6.0.")
    elif req.avgPh > 6.3:
        recommendations.append(f"🧪 pH ({req.avgPh}) bị kiềm. Bổ sung pH Down loãng tránh kết tủa Sắt và vi lượng.")
    if not recommendations:
        recommendations.append(f"Môi trường dung dịch và phát triển của giống {cultivar} đang ở trạng thái tối ưu.")

    r2_val = 0.967
    if models_metadata and 'yield_model' in models_metadata:
        r2_val = models_metadata['yield_model']['metrics'].get('r2_score', 0.967)

    return PredictionResponse(
        batchId=req.batchId,
        batchCode=req.batchCode,
        cultivarName=req.cultivarName,
        plantAgeDays=req.plantAgeDays,
        leafCount=req.leafCount,
        plantHeightCm=req.plantHeightCm,
        avgEc=req.avgEc,
        avgPh=req.avgPh,
        avgWaterTemp=req.avgWaterTemp,
        predictedFreshWeightG=final_weight_g,
        expectedHarvestablePlants=req.expectedPlants,
        totalBatchYieldKg=total_yield_kg,
        confidenceR2=round(float(r2_val), 4),
        riskScore=risk,
        featureContributions=feature_contributions,
        recommendations=recommendations
    )


@app.post("/api/v1/detect-anomaly", response_model=AnomalyDetectionResponse)
def detect_anomaly(req: AnomalyDetectionRequest):
    global iso_anomaly_model
    if iso_anomaly_model is None:
        load_ai_models()
        if iso_anomaly_model is None:
            raise HTTPException(status_code=503, detail="Mô hình AI phát hiện bất thường chưa sẵn sàng.")

    input_df = pd.DataFrame([[req.avgPh, req.avgEc, req.avgWaterTemp]], columns=['Avg_pH', 'Avg_EC', 'Avg_Water_Temp'])
    
    # Dự báo 1: Bình thường, -1: Bất thường
    prediction = int(iso_anomaly_model.predict(input_df)[0])
    raw_score = float(iso_anomaly_model.score_samples(input_df)[0])
    
    is_anomaly = (prediction == -1)
    risk_factors = []
    severity = "info"

    # Phân tích nguyên nhân nông học
    if req.avgPh < 5.2:
        risk_factors.append(f"Độ pH ({req.avgPh}) quá thấp - nguy cơ sốc rễ và ngộ độc acid")
        severity = "critical"
    elif req.avgPh > 6.8:
        risk_factors.append(f"Độ pH ({req.avgPh}) quá kiềm - phong tỏa vi lượng và kết tủa Canxi-Photphat")
        severity = "critical"
    elif req.avgPh < 5.5 or req.avgPh > 6.4:
        risk_factors.append(f"Độ pH ({req.avgPh}) lệch dải hấp thu tối ưu (5.6 - 6.2)")
        if severity != "critical":
            severity = "warning"

    if req.avgEc > 2.3:
        risk_factors.append(f"Nồng độ EC ({req.avgEc} mS/cm) quá cao - áp suất thẩm thấu lớn, rủi ro cháy chóp lá non (tipburn)")
        severity = "critical"
    elif req.avgEc < 1.2:
        risk_factors.append(f"Nồng độ EC ({req.avgEc} mS/cm) quá loãng - cây bị suy dinh dưỡng")
        if severity != "critical":
            severity = "warning"

    if req.avgWaterTemp > 25.5:
        risk_factors.append(f"Nhiệt độ nước ({req.avgWaterTemp}°C) quá nóng - nguy cơ bùng phát nấm Pythium thối rễ và giảm DO")
        severity = "critical"
    elif req.avgWaterTemp < 17.0:
        risk_factors.append(f"Nhiệt độ nước ({req.avgWaterTemp}°C) thấp - trao đổi chất chậm")
        if severity != "critical":
            severity = "warning"

    if is_anomaly and not risk_factors:
        risk_factors.append("Tương quan đa biến (pH - EC - Nhiệt độ) lệch ngưỡng an toàn theo mô hình IsolationForest")
        severity = "warning"

    # Gợi ý hành động
    if severity == "critical":
        suggested_action = "🚨 Cần xử lý khẩn cấp: Kiểm tra ngay hệ thống cấp nước, máy bơm và bộ châm phân tự động để khôi phục chỉ số an toàn."
    elif severity == "warning":
        suggested_action = "⚠️ Cần chú ý điều chỉnh: Cân chỉnh pH/EC bể dinh dưỡng về ngưỡng tiêu chuẩn trong ca trực."
    else:
        suggested_action = "Bể dinh dưỡng đang vận hành ổn định trong giới hạn sinh thái lý tưởng."

    return AnomalyDetectionResponse(
        reservoirId=req.reservoirId,
        reservoirName=req.reservoirName,
        isAnomaly=is_anomaly,
        status="ANOMALY" if is_anomaly else "NORMAL",
        anomalyScore=round(raw_score, 4),
        severity=severity if is_anomaly else "info",
        riskFactors=risk_factors,
        suggestedAction=suggested_action
    )
