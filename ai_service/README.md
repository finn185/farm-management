# HydroSmart AI Engine & Decision Support Service
> Hệ thống Trí Tuệ Nhân Tạo Dự Báo Năng Suất (Yield Prediction) & Giám Sát Bất Thường (Anomaly Detection) cho Trang Trại Thủy Canh Thông Minh NFT.

---

## 📌 Tổng Quan Hệ Thống

Module AI được phát triển dựa trên dữ liệu canh tác thực nghiệm chuỗi thời gian (`Cleaned_Data_Batches_Final.csv`) gồm 2 mô hình học máy:

1. **Mô hình Dự báo Năng suất (Yield Prediction - `RandomForestRegressor`)**:
   - Đặc trưng đầu vào (9 chỉ số): `Plant_Age_Days`, `Avg_pH`, `Avg_EC`, `Avg_Water_Temp`, `Avg_Air_Temp`, `Avg_Humidity`, `Cumulative_Nutrient_AB_ml`, `Cumulative_Acid_ml`, `Days_Since_Last_Dosing`.
   - Mục tiêu: Dự báo sinh khối tươi $g/\text{cây}$ và tổng sản lượng $kg/\text{lô}$ thu hoạch.
   - Độ chính xác: $R^2 \approx 0.9670$, $\text{MAE} \approx 3.25\text{g}$, $\text{RMSE} \approx 6.92\text{g}$.

2. **Mô hình Giám sát Bất thường Môi trường (Anomaly Detection - `IsolationForest`)**:
   - Đặc trưng giám sát (3 chỉ số): `Avg_pH`, `Avg_EC`, `Avg_Water_Temp`.
   - Cấu hình: `contamination = 0.05`.
   - Mục tiêu: Phát hiện sớm rủi ro môi trường (sốc pH, ngộ độc phân bón cháy rễ, nhiệt độ nước nóng gây nấm Pythium).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Cài đặt thư viện Python:
```bash
cd ai_service
pip install -r requirements.txt
```

### 2. Huấn luyện mô hình từ dữ liệu thực tế:
```bash
python train_models.py
```
Sau khi chạy, script sẽ tự động tạo:
- `rf_yield_model.pkl`: Mô hình Random Forest dự báo năng suất ($R^2 = 0.9670$).
- `iso_anomaly_model.pkl`: Mô hình Isolation Forest phát hiện bất thường bồn dinh dưỡng.
- `models_metadata.json`: Thống kê độ chính xác, tỷ trọng đặc trưng và cấu hình.

### 3. Khởi chạy FastAPI Server:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
Tài liệu Swagger UI tự động: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 📡 Danh Sách API Endpoints

### 1. AI Microservice (FastAPI - Cổng 8000)

| Phương thức | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/` | Kiểm tra trạng thái máy chủ AI và thông tin 2 mô hình đã nạp. |
| `POST` | `/api/v1/predict` | Dự báo năng suất xà lách ($g/\text{cây}$, $kg/\text{lô}$), $R^2$, XAI phân rã đặc trưng 100%. |
| `POST` | `/api/v1/detect-anomaly` | Quét phát hiện bất thường môi trường bồn (pH, EC, nhiệt độ nước). |

#### Ví dụ Payload `POST /api/v1/detect-anomaly`:
```json
{
  "reservoirName": "Bể dinh dưỡng NFT-01",
  "avgPh": 4.0,
  "avgEc": 3.2,
  "avgWaterTemp": 28.0
}
```
Phản hồi:
```json
{
  "isAnomaly": true,
  "status": "ANOMALY",
  "anomalyScore": -0.1984,
  "severity": "critical",
  "riskFactors": [
    "Độ pH (4.0) quá thấp - nguy cơ sốc rễ và ngộ độc acid",
    "Nồng độ EC (3.2 mS/cm) quá cao - áp suất thẩm thấu lớn, rủi ro cháy chóp lá non (tipburn)",
    "Nhiệt độ nước (28.0°C) quá nóng - nguy cơ bùng phát nấm Pythium thối rễ và giảm DO"
  ],
  "suggestedAction": "🚨 Cần xử lý khẩn cấp: Kiểm tra ngay hệ thống cấp nước, máy bơm và bộ châm phân tự động để khôi phục chỉ số an toàn."
}
```

---

### 2. Backend Gateway (Node.js Express - Cổng 5000)

Backend Node.js đóng vai trò API Gateway & Orchestrator, tự động truy vấn dữ liệu từ PostgreSQL rồi gửi sang AI Service:

| Phương thức | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ai/health` | Kiểm tra kết nối từ Backend Node.js sang AI Service. |
| `POST` | `/api/v1/ai/batches/:id/predict` | Tự động lấy tuổi cây, giống, bồn chứa từ DB và tính dự báo năng suất. |
| `POST` | `/api/v1/ai/reservoirs/:id/detect-anomaly` | Quét bất thường bồn chứa và **tự động tạo bản ghi Alert** vào database nếu có sự cố (AC-05: không tạo trùng). |
| `POST` | `/api/v1/ai/detect-anomaly` | Quét bất thường trực tiếp với bộ 3 thông số pH, EC, nhiệt độ. |
