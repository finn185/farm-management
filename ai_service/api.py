"""
api.py
FastAPI Microservice cho AI Dự Báo Năng Suất HydroSmart.
Cung cấp REST API cho Frontend React.
"""

import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import joblib

app = FastAPI(
    title="HydroSmart AI Yield Prediction Service",
    description="Microservice dự báo năng suất sinh khối rau xà lách thủy canh NFT",
    version="1.0.0"
)

# CORS Middleware cho kết nối từ React Vite (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'lettuce_yield_xgb.pkl')
META_PATH = os.path.join(SCRIPT_DIR, 'model_metadata.json')

model = None
metadata = {}

def load_ai_model():
    global model, metadata
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"✅ Đã nạp mô hình: {MODEL_PATH}")
    if os.path.exists(META_PATH):
        with open(META_PATH, 'r', encoding='utf-8') as f:
            metadata = json.load(f)

# Nạp model lúc khởi động
load_ai_model()

class PredictionRequest(BaseModel):
    batchId: Optional[str] = "SAMPLE-BATCH"
    batchCode: Optional[str] = "LET-2026-001"
    cultivarName: str = Field(default="Green Oakleaf", description="Tên giống xà lách")
    targetCycleDays: int = Field(default=35, ge=20, le=55)
    plantAgeDays: int = Field(default=28, ge=1, le=50)
    leafCount: int = Field(default=16, ge=2, le=35)
    plantHeightCm: float = Field(default=15.0, ge=2.0, le=35.0)
    avgEc: float = Field(default=1.72, ge=0.5, le=3.5)
    avgPh: float = Field(default=5.85, ge=4.0, le=8.0)
    avgWaterTemp: float = Field(default=22.4, ge=12.0, le=36.0)
    airTemp: Optional[float] = 26.5
    humidityRh: Optional[float] = 68.0
    vpdKpa: Optional[float] = 1.20
    expectedPlants: int = Field(default=500, ge=10, le=5000)

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

@app.get("/")
def health_check():
    return {
        "service": "HydroSmart AI Engine",
        "status": "online",
        "model_loaded": model is not None,
        "metadata": metadata
    }

@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_yield(req: PredictionRequest):
    global model
    if model is None:
        load_ai_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Mô hình AI chưa được huấn luyện. Vui lòng chạy train_model.py trước.")

    # Chuẩn bị vector đặc trưng
    cultivar = req.cultivarName
    feature_row = {
        'target_cycle_days': req.targetCycleDays,
        'plant_age_days': req.plantAgeDays,
        'leaf_count': req.leafCount,
        'plant_height_cm': req.plantHeightCm,
        'avg_ec': req.avgEc,
        'avg_ph': req.avgPh,
        'avg_water_temp': req.avgWaterTemp,
        'air_temp': req.airTemp or (req.avgWaterTemp + 3.5),
        'humidity_rh': req.humidityRh or 68.0,
        'vpd_kpa': req.vpdKpa or 1.20,
        'cultivar_Green Oakleaf': 1 if 'Oak' in cultivar else 0,
        'cultivar_Lollo Rossa': 1 if 'Lollo' in cultivar else 0,
        'cultivar_Batavia': 1 if 'Batavia' in cultivar or 'xoăn' in cultivar.lower() else 0,
        'cultivar_Romaine': 1 if 'Romaine' in cultivar or 'mỡ' in cultivar.lower() else 0
    }
    
    # Đảm bảo ít nhất 1 giống được kích hoạt
    if sum([feature_row[f'cultivar_{c}'] for c in ['Green Oakleaf', 'Lollo Rossa', 'Batavia', 'Romaine']]) == 0:
        feature_row['cultivar_Green Oakleaf'] = 1

    feature_cols = [
        'target_cycle_days', 'plant_age_days', 'leaf_count', 'plant_height_cm',
        'avg_ec', 'avg_ph', 'avg_water_temp', 'air_temp', 'humidity_rh', 'vpd_kpa',
        'cultivar_Green Oakleaf', 'cultivar_Lollo Rossa', 'cultivar_Batavia', 'cultivar_Romaine'
    ]
    
    df_input = pd.DataFrame([feature_row])[feature_cols]
    pred_weight_current_age = float(model.predict(df_input)[0])
    
    # Dự phóng đến ngày thu hoạch nếu chưa đến ngày
    final_weight_g = pred_weight_current_age
    if req.plantAgeDays < req.targetCycleDays:
        days_rem = req.targetCycleDays - req.plantAgeDays
        growth_rate_daily = 6.5 if req.plantAgeDays > 20 else 4.0
        # Điều chỉnh tốc độ tăng trưởng theo điều kiện lý hóa
        ec_mod = 1.05 if (1.5 <= req.avgEc <= 1.85) else (0.85 if req.avgEc < 1.3 else 0.88)
        temp_mod = 0.82 if req.avgWaterTemp > 24.5 else 1.02
        final_weight_g = round(pred_weight_current_age + (days_rem * growth_rate_daily * ec_mod * temp_mod), 1)
    else:
        final_weight_g = round(pred_weight_current_age, 1)

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

    feature_contributions = [
        FeatureContributionItem(
            feature="Tuổi cây trồng",
            importance=imp_age,
            impact="positive",
            description=f"Đã trải qua {req.plantAgeDays}/{req.targetCycleDays} ngày của chu kỳ giống {cultivar}."
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

    # Khuyến nghị
    recommendations = []
    if req.avgWaterTemp > 24.5:
        recommendations.push if hasattr(recommendations, 'push') else recommendations.append(
            f"🌡️ Nhiệt độ nước bồn ({req.avgWaterTemp}°C) vượt ngưỡng an toàn. Bật quạt thông gió hoặc bổ sung nước mát tránh nấm rễ."
        )
    if req.avgEc < 1.35:
        recommendations.append(
            f"💡 Nồng độ EC ({req.avgEc} mS/cm) bị loãng. Châm thêm Stock A & B theo Dosing Calculator để đưa EC về 1.6 - 1.8 mS/cm."
        )
    elif req.avgEc > 2.0:
        recommendations.append(
            f"⚠️ Nồng độ EC ({req.avgEc} mS/cm) cao. Châm thêm nước sạch pha loãng tránh cháy mép lá non (tipburn)."
        )
    if req.avgPh < 5.5:
        recommendations.append(f"🧪 pH ({req.avgPh}) bị chua. Bổ sung dung dịch kiềm nhẹ (KOH) để đưa pH về 5.8 - 6.0.")
    elif req.avgPh > 6.3:
        recommendations.append(f"🧪 pH ({req.avgPh}) bị kiềm. Bổ sung pH Down loãng tránh kết tủa Sắt và vi lượng.")
    if not recommendations:
        recommendations.append(f"✅ Môi trường dung dịch và phát triển của giống {cultivar} đang ở trạng thái tối ưu.")

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
        confidenceR2=round(float(metadata.get('r2_score', 0.945)), 4),
        riskScore=risk,
        featureContributions=feature_contributions,
        recommendations=recommendations
    )
