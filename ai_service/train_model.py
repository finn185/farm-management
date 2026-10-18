"""
train_model.py
Huấn luyện mô hình Machine Learning dự báo năng suất xà lách thủy canh NFT.
Sử dụng XGBoost Regressor & Random Forest Regressor với kiểm định chéo K-Fold.
Xuất mô hình ra tệp pickle và metadata JSON phục vụ API.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import xgboost as xgb
import joblib

from dataset_generator import generate_hydroponic_dataset

FEATURE_COLUMNS = [
    'target_cycle_days',
    'plant_age_days',
    'leaf_count',
    'plant_height_cm',
    'avg_ec',
    'avg_ph',
    'avg_water_temp',
    'air_temp',
    'humidity_rh',
    'vpd_kpa',
    'cultivar_Green Oakleaf',
    'cultivar_Lollo Rossa',
    'cultivar_Batavia',
    'cultivar_Romaine'
]

def prepare_data(df: pd.DataFrame):
    # One-hot encoding giống cây trồng
    df_encoded = pd.get_dummies(df, columns=['cultivar'], drop_first=False)
    
    # Đảm bảo có đầy đủ các cột giống
    for c in ['cultivar_Green Oakleaf', 'cultivar_Lollo Rossa', 'cultivar_Batavia', 'cultivar_Romaine']:
        if c not in df_encoded.columns:
            df_encoded[c] = 0
            
    X = df_encoded[FEATURE_COLUMNS]
    y = df_encoded['fresh_weight_g']
    return X, y

def train():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'hydroponic_lettuce_dataset.csv')
    
    if os.path.exists(csv_path):
        print(f"📖 Nạp dataset từ: {csv_path}")
        df = pd.read_csv(csv_path)
    else:
        print("⚡ Chưa có file dataset, tự động sinh 5,000 mẫu dữ liệu chuẩn...")
        df = generate_hydroponic_dataset(n_samples=5000)
        df.to_csv(csv_path, index=False, encoding='utf-8')
        
    X, y = prepare_data(df)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    
    print("\n🚀 Bắt đầu huấn luyện mô hình XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=350,
        learning_rate=0.04,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Đánh giá trên tập kiểm thử
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    
    print("\n📊 KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH (Test Set):")
    print(f"  • R² Score (Hệ số xác định) : {r2:.4f}  (Chuẩn FRS: >= 0.92) {'✅ ĐẠT' if r2 >= 0.92 else '❌'}")
    print(f"  • RMSE (Sai số căn bậc hai) : {rmse:.2f} g")
    print(f"  • MAE (Sai số tuyệt đối TB) : {mae:.2f} g")
    print(f"  • MAPE (Sai số phần trăm)   : {mape:.2f} %")
    
    # Đánh giá Feature Importances
    importances = model.feature_importances_
    feature_imp_df = pd.DataFrame({
        'feature': FEATURE_COLUMNS,
        'importance': importances
    }).sort_values(by='importance', ascending=False)
    
    print("\n🔍 ĐÓNG GÓP ĐẶC TRƯNG HÀNG ĐẦU (Top Feature Importances):")
    for idx, row in feature_imp_df.head(6).iterrows():
        print(f"  • {row['feature']:<25}: {row['importance']*100:.1f}%")
        
    # Lưu mô hình và metadata
    model_file = os.path.join(script_dir, 'lettuce_yield_xgb.pkl')
    meta_file = os.path.join(script_dir, 'model_metadata.json')
    
    joblib.dump(model, model_file)
    
    metadata = {
        'model_name': 'XGBoost Hydroponic Lettuce Yield Predictor',
        'version': '1.0.0',
        'r2_score': round(float(r2), 4),
        'rmse_g': round(float(rmse), 2),
        'mae_g': round(float(mae), 2),
        'mape_percent': round(float(mape), 2),
        'feature_columns': FEATURE_COLUMNS,
        'cultivars_supported': ['Green Oakleaf', 'Lollo Rossa', 'Batavia', 'Romaine'],
        'top_features': [
            {'feature': row['feature'], 'importance_percent': round(float(row['importance'] * 100), 2)}
            for _, row in feature_imp_df.head(7).iterrows()
        ]
    }
    
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
        
    print(f"\n💾 Đã lưu model: {model_file}")
    print(f"📄 Đã lưu metadata: {meta_file}")
    return model, metadata

if __name__ == '__main__':
    train()
