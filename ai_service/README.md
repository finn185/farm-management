# HydroSmart AI Yield Prediction Service
> Mô hình Machine Learning dự báo năng suất sinh khối xà lách thủy canh NFT & Explainable AI (XAI)

## 📌 Tổng Quan
Module này cung cấp toàn bộ quy trình AI:
1. **Dữ liệu**: Tạo và nạp dữ liệu canh tác xà lách thủy canh hiệu chuẩn nông học (Frontiers 2022 & điều kiện thực tế tại Việt Nam).
2. **Huấn luyện**: Mô hình **XGBoost Regressor** và **Random Forest** với cross-validation đạt $R^2 \ge 0.92$.
3. **Giải thích (XAI)**: Phân rã đóng góp đặc trưng (Feature Contributions) chuẩn hóa 100%.
4. **API**: Cung cấp REST API qua FastAPI kết nối trực tiếp với Frontend React.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Cài đặt thư viện Python:
```bash
cd ai_service
pip install -r requirements.txt
```

### 2. Huấn luyện mô hình:
```bash
python train_model.py
```
Sau khi chạy xong, script sẽ sinh ra 2 tệp:
- `lettuce_yield_xgb.pkl`: Mô hình XGBoost đã huấn luyện.
- `model_metadata.json`: Thống kê độ chính xác ($R^2$, RMSE, MAE) và bảng đóng góp đặc trưng.

### 3. Khởi chạy API Server:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation tự động tại: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 📡 REST API Endpoints

### 1. `GET /`
Kiểm tra trạng thái service và metadata mô hình.

### 2. `POST /api/v1/predict`
Dự báo khối lượng tươi ($g/\text{cây}$), sản lượng ($kg$), $R^2$ score, mức độ rủi ro và các yếu tố tác động.
Body JSON:
```json
{
  "batchCode": "LET-2026-001",
  "cultivarName": "Green Oakleaf",
  "targetCycleDays": 35,
  "plantAgeDays": 28,
  "leafCount": 16,
  "plantHeightCm": 15.0,
  "avgEc": 1.72,
  "avgPh": 5.85,
  "avgWaterTemp": 22.4,
  "expectedPlants": 500
}
```
