"""
train_models.py
Huấn luyện 2 mô hình Machine Learning từ dữ liệu thực tế Cleaned_Data_Batches_Final.csv:
1. Mô hình Dự báo Năng suất (RandomForestRegressor)
2. Mô hình Phát hiện Bất thường Môi trường (IsolationForest)
Xuất mô hình ra tệp joblib (.pkl) và metadata phục vụ API.
"""

import os
import sys
import json

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

YIELD_FEATURES = [
    'Plant_Age_Days',
    'Avg_pH',
    'Avg_EC',
    'Avg_Water_Temp',
    'Avg_Air_Temp',
    'Avg_Humidity',
    'Cumulative_Nutrient_AB_ml',
    'Cumulative_Acid_ml',
    'Days_Since_Last_Dosing'
]

ANOMALY_FEATURES = [
    'Avg_pH',
    'Avg_EC',
    'Avg_Water_Temp'
]

TARGET = 'Target_Shoot_Weight_g'

def train_and_save():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'Cleaned_Data_Batches_Final.csv')
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu: {csv_path}")

    print(f"📖 Nạp dữ liệu từ: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"Tổng số dòng: {len(df)}")

    # 1. Tiền xử lý & Tính Plant_Age_Days theo từng Batch_ID
    df['Date'] = pd.to_datetime(df['Date'])
    df['Plant_Age_Days'] = df.groupby('Batch_ID')['Date'].transform(lambda x: (x - x.min()).dt.days + 1)

    # 2. Huấn luyện Mô hình 1: Dự báo Năng suất (Random Forest Regressor)
    print("\n🌲 Huấn luyện Mô hình 1: Yield Prediction (RandomForestRegressor)...")
    df_model = df.dropna(subset=YIELD_FEATURES + [TARGET])
    X = df_model[YIELD_FEATURES]
    y = df_model[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)

    y_pred = rf_model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"  • R² Score : {r2:.4f}")
    print(f"  • MAE      : {mae:.2f} g")
    print(f"  • RMSE     : {rmse:.2f} g")

    feature_importances = [
        {
            'feature': feat,
            'importance_percent': round(float(imp * 100), 2)
        }
        for feat, imp in sorted(zip(YIELD_FEATURES, rf_model.feature_importances_), key=lambda x: x[1], reverse=True)
    ]

    # 3. Huấn luyện Mô hình 2: Phát hiện Bất thường (Isolation Forest)
    print("\n🛡️ Huấn luyện Mô hình 2: Anomaly Detection (IsolationForest)...")
    iso_data = df[ANOMALY_FEATURES].dropna()
    iso_model = IsolationForest(contamination=0.05, random_state=42)
    iso_model.fit(iso_data)
    print("  • Đã huấn luyện IsolationForest với contamination=0.05")

    # 4. Xuất mô hình & Metadata
    rf_path = os.path.join(script_dir, 'rf_yield_model.pkl')
    iso_path = os.path.join(script_dir, 'iso_anomaly_model.pkl')
    meta_path = os.path.join(script_dir, 'models_metadata.json')

    joblib.dump(rf_model, rf_path)
    joblib.dump(iso_model, iso_path)

    metadata = {
        'yield_model': {
            'algorithm': 'RandomForestRegressor(n_estimators=100)',
            'features': YIELD_FEATURES,
            'target': TARGET,
            'metrics': {
                'r2_score': round(float(r2), 4),
                'mae_g': round(float(mae), 2),
                'rmse_g': round(float(rmse), 2)
            },
            'top_features': feature_importances
        },
        'anomaly_model': {
            'algorithm': 'IsolationForest(contamination=0.05)',
            'features': ANOMALY_FEATURES,
            'contamination': 0.05
        },
        'dataset_info': {
            'filename': 'Cleaned_Data_Batches_Final.csv',
            'total_records': len(df),
            'batches': list(df['Batch_ID'].unique())
        }
    }

    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Đã lưu mô hình năng suất: {rf_path}")
    print(f"💾 Đã lưu mô hình bất thường: {iso_path}")
    print(f"📄 Đã lưu metadata: {meta_path}")

    return rf_model, iso_model, metadata

if __name__ == '__main__':
    train_and_save()
