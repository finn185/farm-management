# BÁO CÁO TIỀN XỬ LÝ & TÀI LIỆU DỮ LIỆU ĐÃ CHUẨN HÓA
## Dataset: HydroSmart - NFT Batavia Lettuce Management & AI Yield Prediction

> **File dữ liệu chuẩn hóa:** `Cleaned_Data_Batches_Final.csv`  
> **Nguồn gốc:** Bộ dữ liệu thực nghiệm *HydroGrowNet of Batavia* (Mendeley Data)  
> **Cấu trúc dữ liệu:** Chuỗi thời gian theo ngày (Daily time-series) của 3 đợt canh tác (Batches)  
> **Tổng số bản ghi:** 93 dòng (tương ứng 93 ngày theo dõi của 3 vụ trồng xà lách)  
> **Số thuộc tính (Columns):** 13 cột đặc trưng (Features & Target)

---

## 1. Nguồn gốc dữ liệu thô (Raw Data)
Dữ liệu gốc bao gồm 3 tệp Excel tương ứng với 3 tháng/đợt thí nghiệm liên tiếp:
1. `EXP.1. Environmental Conditions and Plant Measurements.xlsx` (~Tháng 3/2024)
2. `EXP.2. Environmental Conditions and Plant Measurements.xlsx` (~Tháng 4/2024)
3. `EXP.3. Environmental Conditions and Plant Measurements.xlsx` (~Tháng 5 - 6/2024)

Mỗi file gốc chứa nhiều thẻ (sheets) với cấu trúc phức tạp, dữ liệu thưa, định dạng ngày tháng đa ngôn ngữ và bảng biểu xếp chồng.

---

## 2. Quy trình trích xuất & Tiền xử lý (ETL Pipeline)

Đã thực hiện quy trình chuẩn hóa gồm các bước sau:

### 2.1. Lựa chọn thẻ dữ liệu cốt lõi từ 3 file dữ liệu thô (Sheet Filtering)
* **Giữ lại các thẻ phục vụ nghiệp vụ Hóa học - Môi trường và AI:**
  * `Water quality parametersPortabl`: Dữ liệu đo đạc chỉ số dung dịch nước (`pH`, `EC`, `Water temp`). *(Lý do: Cảm biến nước ở sheet Senso bị để trống dữ liệu, sheet Portable chứa các số đo thực tế tại bồn)*.
  * `Water quality measurments Senso`: Dữ liệu chuỗi thời gian cảm biến không khí từng giờ (`Air_temp`, `Humidity - RH%`).
  * `Nutrients Water consumptions`: Nhật ký châm dung dịch phân bón gốc A+B và axit cân bằng pH.
  * `Harvest measurements`: Dữ liệu khối lượng tươi thân lá lúc thu hoạch (`shoot weight`), đóng vai trò là nhãn mục tiêu (target y).
* **Loại bỏ các thẻ không sử dụng:**
  * `Water quality parametersPortabl` (các cột lặp): Đã tính trung bình gộp.
  * `Test Taste` / `Form Responses`: Đánh giá cảm quan của con người, không phục vụ mô hình vật lý/hóa học.
  * `Seedlings measurements` & `Head diameter`: Dữ liệu đo ngắt quãng, không liên tục theo ngày.

### 2.2. Xử lý định dạng ngày tháng & giờ (Date Standardization)
* Xử lý xung đột đa ngôn ngữ: Chuẩn hóa chuỗi ngày tiếng Việt (`th3 10, 2024`), tiếng Anh (`Mar 10, 2024`) và dạng số (`5/19/2024`) về định dạng chuẩn ISO: `YYYY-MM-DD`.
* Khớp nối hai trục thời gian: Cảm biến không khí ghi nhận theo từng giờ, trong khi chỉ số nước đo định kỳ. Toàn bộ số đo trong ngày được tính trung bình (`mean()`) theo từng ngày `Date`.

### 2.3. Xử lý ô trống và nội suy (Missing Value Imputation)
* Các ngày không đo cảm biến nước được xử lý bằng thuật toán nội suy tuyến tính (`linear interpolation`) kết hợp `ffill()` và `bfill()` để đảm bảo chuỗi thời gian liền mạch phục vụ vẽ biểu đồ và huấn luyện Machine Learning.

### 2.4. Kỹ thuật tạo đặc trưng mới (Feature Engineering)
* **Bản chất nông học:** Trong hệ thống NFT, phân A+B và Axit chỉ được châm vào một số ngày cố định khi nồng độ tụt (chiếm ~7-9 ngày trong tổng số 93 ngày).
* **Tạo đặc trưng tích lũy:** Để tránh tình trạng dữ liệu quá thưa (nhiều số 0.0), nhóm đã tạo thêm:
  * `Cumulative_Nutrient_AB_ml`: Tổng lượng phân A+B đã châm tích lũy từ đầu vụ đến ngày hiện tại.
  * `Cumulative_Acid_ml`: Tổng lượng axit đã châm tích lũy từ đầu vụ đến ngày hiện tại.
  * `Days_Since_Last_Dosing`: Số ngày trôi qua kể từ lần châm phân gần nhất.

---

## 3. Từ điển dữ liệu (Data Dictionary)

Bảng mô tả chi tiết 13 cột trong tệp `Cleaned_Data_Batches_Final.csv`:

| STT | Tên cột (Column Name) | Kiểu dữ liệu | Đơn vị | Ý nghĩa & Mô tả nghiệp vụ | Ứng dụng trong hệ thống |
|---|---|---|---|---|---|
| 1 | `Batch_ID` | String | - | Định danh đợt trồng (`BATCH_1`, `BATCH_2`, `BATCH_3`) | Phân nhóm dữ liệu, lọc báo cáo |
| 2 | `Date` | Date | `YYYY-MM-DD` | Ngày ghi nhận số đo | Trục thời gian cho biểu đồ Dashboard |
| 3 | `Avg_pH` | Float | - | Độ pH trung bình trong ngày của dung dịch dinh dưỡng | Feature AI, Vẽ biểu đồ, Rule Engine cảnh báo (5.5 - 6.2) |
| 4 | `Avg_EC` | Float | mS/cm | Độ dẫn điện trung bình ngày (tổng nồng độ ion hòa tan) | Feature AI, Rule Engine cảnh báo (1.3 - 2.0 mS/cm) |
| 5 | `Avg_Water_Temp` | Float | °C | Nhiệt độ trung bình ngày của nước trong bồn chứa | Feature AI, Rule Engine cảnh báo nguy cơ nấm (> 24.5°C) |
| 6 | `Avg_Air_Temp` | Float | °C | Nhiệt độ không khí trung bình ngày trong nhà màng | Feature AI, Thanh giám sát vi khí hậu |
| 7 | `Avg_Humidity` | Float | % | Độ ẩm tương đối không khí trung bình ngày (RH) | Feature AI, Tính toán chỉ số bốc thoát hơi nước (VPD) |
| 8 | `Total_Nutrient_AB_ml` | Float | ml | Thể tích dung dịch mẹ Can A + B châm thêm trong ngày | Theo dõi nhật ký châm phân hàng ngày |
| 9 | `Cumulative_Nutrient_AB_ml` | Float | ml | Tổng lượng phân A+B tích lũy từ đầu vụ đến ngày đo | **Feature AI cốt lõi** phản ánh tổng mức dinh dưỡng cung cấp |
| 10 | `Total_Acid_ml` | Float | ml | Thể tích axit châm thêm để hạ pH trong ngày | Nhật ký điều chỉnh pH |
| 11 | `Cumulative_Acid_ml` | Float | ml | Tổng lượng axit tích lũy từ đầu vụ đến ngày đo | **Feature AI** phản ánh mức độ kiềm hóa của nguồn nước |
| 12 | `Days_Since_Last_Dosing` | Integer | Ngày | Số ngày trôi qua kể từ lần châm dinh dưỡng A+B gần nhất | Feature AI phản ánh độ suy thoái của dung dịch trong bồn |
| 13 | `Target_Shoot_Weight_g` | Float | g/cây | Khối lượng tươi phần thân lá ăn được trung bình khi thu hoạch | **Nhãn mục tiêu (target y)** cho mô hình Machine Learning |

---

## 4. Hướng dẫn sử dụng dữ liệu cho các thành viên

### 4.1. Dành cho thành viên Data Science / Machine Learning
* **Bài toán:** Hồi quy dự báo sản lượng (Regression Yield Prediction).
* **Biến mục tiêu (y):** Cột `Target_Shoot_Weight_g`.
* **Biến đặc trưng (X):** Sử dụng các cột từ cột 3 đến cột 12 (`Avg_pH`, `Avg_EC`, `Avg_Water_Temp`, `Avg_Air_Temp`, `Avg_Humidity`, `Cumulative_Nutrient_AB_ml`, `Cumulative_Acid_ml`, `Days_Since_Last_Dosing`...).
* **Thuật toán đề xuất:** Random Forest Regressor, XGBoost Regressor, Gradient Boosting.

### 4.2. Dành cho thành viên Backend API
* Tạo bảng `SensorHistory` và `DosingHistory` theo đúng các kiểu dữ liệu và đơn vị nêu trong bảng từ điển dữ liệu.
* Dùng dữ liệu này để viết các hàm mock API hoặc seed data cho cơ sở dữ liệu mẫu ban đầu.

### 4.3. Dành cho thành viên Frontend Dashboard
* Dùng cột `Date`, `Avg_pH`, `Avg_EC` để vẽ biểu đồ đường đôi (Dual Line Chart).
* Dùng cột `Total_Nutrient_AB_ml` và `Total_Acid_ml` để hiển thị trên bảng lịch sử vận hành bồn dinh dưỡng (Reservoir Logs).

## 5. Link Google Colab (Code xử lý dữ liệu):

https://colab.research.google.com/drive/1kcRn6pS20o_kp5TPtB-POqbJFyNO5s0D?usp=sharing