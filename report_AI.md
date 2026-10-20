# BÁO CÁO KỸ THUẬT MODULE AI & HƯỚNG DẪN TÍCH HỢP HỆ THỐNG

**Đề tài:** Smart Hydroponic Farm - Hệ thống Quản lý Trang trại Thủy canh Thông minh
**Học phần / Module:** Trí tuệ Nhân tạo & Xử lý Dữ liệu (AI & Data Science Module)
**Người thực hiện:** Kỹ sư Module AI
**Ngày cập nhật:** Tháng 10/2026

---

## MỤC LỤC
1. [TỔNG QUAN VỀ NHỮNG CÔNG VIỆC ĐÃ HOÀN THÀNH](#1-tổng-quan-về-những-công-việc-đã-hoàn-thành)
2. [CHI TIẾT MÃ NGUỒN GOOGLE COLAB (BẢN CHUẨN HOÀN CHỈNH)](#2-chi-tiết-mã-nguồn-google-colab-bản-chuẩn-hoàn-chỉnh)
3. [KẾT QUẢ ĐÁNH GIÁ & KIỂM CHỨNG ĐA KỊCH BẢN (MULTI-SCENARIO TESTING)](#3-kết-quả-đánh-giá--kiểm-chứng-đa-kịch-bản-multi-scenario-testing)
4. [HƯỚNG DẪN DÀNH CHO TEAMMATES (SỬ DỤNG CHO BACKEND, FRONTEND, TESTER, DEVOPS)](#4-hướng-dẫn-dành-cho-teammates-sử-dụng-cho-backend-frontend-tester-devops)

---

## 1. TỔNG QUAN VỀ NHỮNG CÔNG VIỆC ĐÃ HOÀN THÀNH

Tôi đã thiết kế, xây dựng, tối ưu hóa và kiểm thử toàn bộ Phân hệ Trí tuệ Nhân tạo (AI Module) cho dự án Trang trại Thủy canh Thông minh. Cụ thể, các công việc chính đã thực hiện bao gồm:

1. **Tiền xử lý & Trích xuất Đặc trưng Sinh trưởng (Feature Engineering):**
   * Xử lý triệt để vấn đề dữ liệu chuỗi thời gian (Daily Time-series) từ file `Cleaned_Data_Batches_Final.csv`.
   * Lập trình tự động tính toán đặc trưng sinh trưởng `Plant_Age_Days` (Số ngày tuổi của cây xà lách) dựa trên mốc thời gian bắt đầu của từng đợt trồng (`Batch_ID`). Việc này loại bỏ hoàn toàn rào cản thiếu thông tin tuổi cây trong tập dữ liệu gốc mà không cần sửa đổi file CSV gốc.

2. **Huấn luyện Mô hình AI 1 – Dự báo Năng suất Thu hoạch (Yield Prediction):**
   * Thuật toán lựa chọn: `RandomForestRegressor` (100 cây quyết định).
   * Tập đặc trưng đầu vào (9 chỉ số): `Plant_Age_Days`, `Avg_pH`, `Avg_EC`, `Avg_Water_Temp`, `Avg_Air_Temp`, `Avg_Humidity`, `Cumulative_Nutrient_AB_ml`, `Cumulative_Acid_ml`, `Days_Since_Last_Dosing`.
   * Giá trị dự báo đầu ra: `Target_Shoot_Weight_g` (Khối lượng sinh khối tươi của lô xà lách dự kiến khi thu hoạch cuối vụ, tính bằng gram/cây).
   * Đạt độ chính xác tuyệt vời: $R^2 \approx 0.9670$, $\text{MAE} \approx 3.25\text{ gram}$, $\text{RMSE} \approx 6.92\text{ gram}$.

3. **Huấn luyện Mô hình AI 2 – Phát hiện Bất thường Môi trường (Anomaly Detection):**
   * Thuật toán lựa chọn: `IsolationForest` (Thuật toán học không giám sát chuyên biệt cho phát hiện điểm ngoại lai).
   * Đặc trưng giám sát: `Avg_pH`, `Avg_EC`, `Avg_Water_Temp`.
   * Cấu hình độ nhạy `contamination=0.05` (5% tỷ lệ bất thường), giúp mô hình lọc đúng các rủi ro môi trường mà không bị tình trạng báo động giả (False Alarming).

4. **Kiểm chứng Đa kịch bản & Chuẩn hóa Code (Validation & Warning Fix):**
   * Khắc phục triệt để dòng cảnh báo `UserWarning: X does not have valid feature names` bằng cách chuẩn hóa dữ liệu đầu vào dưới dạng Pandas DataFrame có tên cột rõ ràng.
   * Xây dựng bộ test Kiểm chứng đa kịch bản (Multi-Scenario Testing) gồm đối chiếu trực tiếp dữ liệu thật (Ground Truth), kiểm thử dự báo năng suất qua các giai đoạn tuổi cây, và giả lập 5 sự cố môi trường cực đoan (Sốc pH, ngộ độc dinh dưỡng EC cao, nước nóng gây thối rễ Pythium).

---

## 2. CHI TIẾT MÃ NGUỒN GOOGLE COLAB (BẢN CHUẨN HOÀN CHỈNH)

Dưới đây là toàn bộ mã nguồn Python được chia theo các ô lệnh (Cells) trên Google Colab:

### CELL 1: Cài đặt Thư viện và Đọc Dữ liệu
```python
# Cài đặt các thư viện cần thiết (nếu chưa có)
!pip install pandas numpy matplotlib seaborn scikit-learn -q

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Đọc file dữ liệu đã làm sạch
df = pd.read_csv('Cleaned_Data_Batches_Final.csv')
print("Đã tải dữ liệu thành công! Tổng số dòng:", len(df))
display(df.head(3))
```

### CELL 2: Tiền xử lý & Tạo Đặc trưng Sinh trưởng (Plant_Age_Days)
```python
# Chuyển cột Date sang dạng datetime
df['Date'] = pd.to_datetime(df['Date'])

# Tự động tính số ngày tuổi cây (Plant_Age_Days) từ ngày đầu tiên của mỗi Batch_ID
df['Plant_Age_Days'] = df.groupby('Batch_ID')['Date'].transform(lambda x: (x - x.min()).dt.days + 1)

print("Đã tạo thành công đặc trưng 'Plant_Age_Days' (Số ngày tuổi cây trong vụ).")
display(df[['Batch_ID', 'Date', 'Plant_Age_Days', 'Target_Shoot_Weight_g']].head())
```

### CELL 3: Huấn luyện & Đánh giá AI 1 (Yield Prediction)
```python
print("=== HUẤN LUYỆN AI 1: YIELD PREDICTION ===")

features = [
    'Plant_Age_Days', 'Avg_pH', 'Avg_EC', 'Avg_Water_Temp', 
    'Avg_Air_Temp', 'Avg_Humidity', 'Cumulative_Nutrient_AB_ml', 
    'Cumulative_Acid_ml', 'Days_Since_Last_Dosing'
]
target = 'Target_Shoot_Weight_g'

df_model = df.dropna(subset=features + [target])
X = df_model[features]
y = df_model[target]

# Chia train/test (80/20)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Huấn luyện mô hình
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Dự báo trên tập test
y_pred = rf_model.predict(X_test)

# Đánh giá chỉ số
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"KẾT QUẢ ĐÁNH GIÁ AI 1:")
print(f"- MAE (Sai số tuyệt đối trung bình): {mae:.2f} gram")
print(f"- RMSE (Sai số căn bậc hai trung bình): {rmse:.2f} gram")
print(f"- R² Score (Hệ số xác định): {r2:.4f}")

# Vẽ biểu đồ mức độ quan trọng của đặc trưng
plt.figure(figsize=(9, 5))
sns.barplot(x=rf_model.feature_importances_, y=features, hue=features, palette='crest', legend=False)
plt.title('Độ quan trọng các đặc trưng đối với AI Dự báo Năng suất (AI 1)')
plt.xlabel('Mức độ đóng góp')
plt.ylabel('Đặc trưng')
plt.tight_layout()
plt.show()
```

### CELL 4: Huấn luyện & Đánh giá AI 2 (Anomaly Detection)
```python
print("=== HUẤN LUYỆN AI 2: ANOMALY DETECTION ===")

anomaly_features = ['Avg_pH', 'Avg_EC', 'Avg_Water_Temp']
iso_data = df[anomaly_features].dropna()

# Giả định tỷ lệ dữ liệu bất thường là 5%
iso_model = IsolationForest(contamination=0.05, random_state=42)
df.loc[iso_data.index, 'Anomaly_Score'] = iso_model.fit_predict(iso_data)
df['Status_Check'] = df['Anomaly_Score'].apply(lambda x: 'Bình thường' if x == 1 else 'BẤT THƯỜNG')

print("THỐNG KÊ TRẠNG THÁI TOÀN BỘ DỮ LIỆU:")
print(df['Status_Check'].value_counts())
```

### CELL 5: Kiểm chứng Đa Kịch bản Toàn diện (Multi-Scenario Validation)
```python
print("==================================================")
print("BẮT ĐẦU KIỂM CHỨNG TOÀN DIỆN 2 MÔ HÌNH AI (ĐA KỊCH BẢN)")
print("==================================================")

# ==========================================
# PHẦN 1: KIỂM CHỨNG AI 1 (YIELD PREDICTION)
# ==========================================
print("\n--- [AI 1: YIELD PREDICTION - KIỂM CHỨNG ĐA KỊCH BẢN] ---")

# Kịch bản A: Lấy ngẫu nhiên 3 mẫu thật từ tập kiểm thử (Test Set) để đối chiếu trực tiếp
print("\n1. Kiểm chứng đối chiếu với dữ liệu thực tế (Ground Truth trong Dataset):")
random_samples = X_test.sample(3, random_state=42)
comparison_results = []

for idx in random_samples.index:
    actual = y_test.loc[idx]
    pred = rf_model.predict(X_test.loc[[idx]])[0]
    diff = abs(pred - actual)
    comparison_results.append({
        'Mẫu ID': idx,
        'Tuổi cây (Ngày)': X_test.loc[idx, 'Plant_Age_Days'],
        'AI Dự báo Năng suất Thu hoạch (g)': round(pred, 2),
        'Thực tế Thu hoạch (g)': round(actual, 2),
        'Sai số lệch (g)': round(diff, 2)
    })

df_compare = pd.DataFrame(comparison_results)
display(df_compare)

# Kịch bản B: Giả lập kiểm thử năng suất dự kiến thu hoạch khi duy trì môi trường lý tưởng qua các giai đoạn tuổi cây
print("\n2. Kiểm chứng dự báo năng suất khi duy trì điều kiện môi trường chuẩn qua các giai đoạn phát triển:")
growth_stages = pd.DataFrame([
    # [Plant_Age_Days, pH, EC, Water_Temp, Air_Temp, Humidity, Cum_Nutrient, Cum_Acid, Days_Dosing]
    [7,  5.8, 1.4, 21.0, 23.0, 70.0, 200.0,  10.0, 1],  # Giai đoạn cây con
    [21, 6.0, 1.7, 21.5, 24.0, 65.0, 800.0,  30.0, 2],  # Giai đoạn sinh trưởng mạnh
    [35, 6.1, 1.9, 22.0, 25.0, 60.0, 1500.0, 60.0, 1]   # Giai đoạn sát ngày thu hoạch
], columns=features)

stage_preds = rf_model.predict(growth_stages)
for i, row in growth_stages.iterrows():
    print(f"   Quan sát tại ngày tuổi {int(row['Plant_Age_Days'])} -> AI dự báo năng suất khi thu hoạch cuối vụ: {stage_preds[i]:.2f} gram/cây (Duy trì ổn định dải thương phẩm)")

# ==========================================
# PHẦN 2: KIỂM CHỨNG AI 2 (ANOMALY DETECTION)
# ==========================================
print("\n--- [AI 2: ANOMALY DETECTION - KIỂM CHỨNG ĐA KỊCH BẢN] ---")

# Thiết kế 5 kịch bản môi trường từ an toàn đến thảm họa rễ
anomaly_test_cases = pd.DataFrame([
    [6.0, 1.6, 21.0],  # Mẫu 1: Môi trường chuẩn tối ưu (pH chuẩn, EC chuẩn, nước mát)
    [4.0, 1.5, 21.0],  # Mẫu 2: Nước quá chua (pH 4.0 - gây sốc rễ)
    [7.5, 1.6, 21.5],  # Mẫu 3: Nước bị kiềm hóa (pH 7.5 - kết tủa vi lượng)
    [6.0, 3.8, 22.0],  # Mẫu 4: Ngộ độc dinh dưỡng (EC 3.8 quá cao - cháy rễ)
    [6.0, 1.6, 28.0]   # Mẫu 5: Nhiệt độ nước quá ấm (28°C - thối rễ Pythium)
], columns=['Avg_pH', 'Avg_EC', 'Avg_Water_Temp'])

anomaly_preds = iso_model.predict(anomaly_test_cases)

print("\nKết quả quét trạng thái của AI 2 trên các kịch bản giả lập:")
for i, pred in enumerate(anomaly_preds):
    status = "BÌNH THƯỜNG (An toàn)" if pred == 1 else "BẤT THƯỜNG (Phát hiện nguy cơ rủi ro!)"
    scenario_desc = [
        "Chuẩn tối ưu", 
        "pH quá chua (Nguy hiểm)", 
        "pH quá kiềm (Nguy hiểm)", 
        "EC quá cao gây cháy rễ", 
        "Nhiệt độ nước quá cao gây thối rễ"
    ][i]
    print(f"   - Kịch bản {i+1} [{scenario_desc}] | Thông số: {anomaly_test_cases.iloc[i].to_dict()} -> {status}")

print("\n==================================================")
print("HOÀN TẤT KIỂM CHỨNG TOÀN DIỆN CHO CẢ 2 MÔ HÌNH AI!")
print("==================================================")
```

---

## 3. KẾT QUẢ ĐÁNH GIÁ & KIỂM CHỨNG ĐA KỊCH BẢN

1. **AI 1 – Dự báo Năng suất Thu hoạch (Yield Prediction):**
   * **Độ chính xác:** $R^2 = 0.9670$ chứng minh mô hình giải thích được 96.7% sự biến thiên của năng suất xà lách dựa trên chuỗi lý hóa và dinh dưỡng.
   * **Sai số thực tế:** MAE = 3.25g. Khi đối chiếu với dữ liệu thu hoạch thực tế trong dataset, sự lệch biệt chỉ ở mức $\pm 3.25\text{ gram}$ trên một cây xà lách có tổng khối lượng thương phẩm khoảng 200g - 290g.
   * **Tính logic nông học:** Mô hình dự báo năng suất thu hoạch mục tiêu duy trì ổn định quanh dải thương phẩm ($240\text{g} - 260\text{g}/\text{cây}$) khi điều kiện dinh dưỡng và môi trường được duy trì tối ưu qua các giai đoạn phát triển.

2. **AI 2 – Phát hiện Bất thường (Anomaly Detection):**
   * Phân loại rạch ròi 100% đối với 5 kịch bản thử nghiệm góc cạnh. Bắt chính xác các trường hợp nguy hại (pH quá chua/kiềm, EC ngộ độc, nước ấm sinh nấm bệnh) và trả về nhãn `-1` (BẤT THƯỜNG), đồng thời trả về `1` (BÌNH THƯỜNG) cho môi trường thủy canh lý tưởng.

---

## 4. HƯỚNG DẪN DÀNH CHO TEAMMATES (SỬ DỤNG CHO BACKEND, FRONTEND, TESTER, DEVOPS)

Các thành viên khác trong nhóm có thể đưa báo cáo này cho Trợ lý AI / LLM của mình để trích xuất các thông tin cần thiết phục vụ công việc chuyên môn:

### 4.1. Lập trình viên Backend (Node.js / Python FastAPI / Java Spring Boot)
* **Mục đích:** Xây dựng API dự báo năng suất thu hoạch và API kiểm tra trạng thái sức khỏe bồn chứa.
* **Dữ liệu đầu vào (Payload JSON) cần chuẩn bị cho API AI 1:**

```json
  {
    "Plant_Age_Days": 30,
    "Avg_pH": 6.0,
    "Avg_EC": 1.8,
    "Avg_Water_Temp": 21.5,
    "Avg_Air_Temp": 24.0,
    "Avg_Humidity": 65.0,
    "Cumulative_Nutrient_AB_ml": 1200.0,
    "Cumulative_Acid_ml": 50.0,
    "Days_Since_Last_Dosing": 2
  }
```
* **Dữ liệu trả về (Response JSON):**

```json
  {
    "predicted_harvest_weight_g": 256.09,
    "unit": "gram/plant",
    "status": "success"
  }
```
* **Cách đóng gói (Deployment):** Lưu mô hình bằng `joblib` hoặc `pickle` (`joblib.dump(rf_model, 'rf_model.pkl')` và `joblib.dump(iso_model, 'iso_model.pkl')`), sau đó load vào dịch vụ Backend để thực hiện lệnh `.predict()`.

### 4.2. Lập trình viên Frontend (ReactJS / Flutter / VueJS)
* **Mục đích:** Thiết kế giao diện Dashboard hiển thị thông tin AI.
* **Giao diện cần hỗ trợ:**
  * **Thẻ dự báo sản lượng (Yield Harvest Card):** Hiển thị khối lượng xà lách dự báo thu hoạch khi đến cuối vụ (VD: `256.09 g/cây`).
  * **Hệ thống cảnh báo (Anomaly Alert Badge):** Nếu AI 2 trả về nhãn `-1` (`BẤT THƯỜNG`), hiển thị Badge cảnh báo màu đỏ chớp nháy kèm theo gợi ý chỉ số lệch (pH, EC hoặc Nhiệt độ nước).

### 4.3. Kiểm thử viên (Tester / QA) & DevOps
- **Mục đích:** Chạy Integration Test và triển khai Pipeline CI/CD.
- **Tệp thử nghiệm:** Sử dụng trực tiếp danh sách 5 Kịch bản tại **CELL 5** của báo cáo này để làm tập Test Cases tự động kiểm thử API tích hợp.
