# KỊCH BẢN QUAY VIDEO DEMO & KIỂM THỬ TỪNG PHẦN (HYDROSMART)
## Hướng Dẫn Báo Cáo / Nộp Video Giảng Viên Chi Tiết & Toàn Diện

> **Cấu trúc kịch bản theo đúng yêu cầu:**
> 1. **GIAI ĐOẠN 1 (Review Tổng Quan Từng Tab):** Đi qua lần lượt toàn bộ 7 tab trên thanh điều hướng. Review bao quát, chi tiết vừa đủ các thành phần hiển thị quan trọng trên mỗi tab (thẻ chỉ số KPI, bảng biểu, biểu đồ trực quan, sơ đồ thực địa, các nút nghiệp vụ) để người xem nắm rõ từng màn hình có gì và dùng để làm gì.
> 2. **GIAI ĐOẠN 2 (Thực Hành Test Các Chức Năng Chính):** Quay cận cảnh thao tác bấm nút, nhập dữ liệu, tạo sự cố thực địa, kiểm chứng phản ứng tự động của hệ thống, xử lý cảnh báo, châm phân cân bằng và chạy mô hình AI.
> 3. **GIAI ĐOẠN 3 (Tổng Kết & Khả Năng Triển Khai Thực Tế):** Giới thiệu tính sẵn sàng kết nối thiết bị phần cứng thật ESP32 và lời cảm ơn kết thúc.
>
> **Thời lượng đề xuất:** 7 – 9 phút (Được module hóa thành **11 Clip ngắn độc lập**, quay xong clip nào lưu riêng file clip đó, ghép lại hoặc gửi từng phần).  
> **Tài khoản đăng nhập demo:** `admin@hydrosmart.farm` | Mật khẩu: `HydroSmart123@`

---

## MỤC LỤC CÁC PHẦN QUAY (CLIPS)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1: REVIEW TỔNG QUAN TỪNG TAB CỦA HỆ THỐNG (0:00 - 4:10)                       │
│   Clip 1: Đăng nhập & Review Tab Bảng Điều Khiển (Dashboard)                  (~55s)   │
│   Clip 2: Review Tab Quản Lý Lô Trồng (Batches Management)                    (~45s)   │
│   Clip 3: Review Tab Bể Nước & Dinh Dưỡng (Reservoirs & Nutrients)            (~45s)   │
│   Clip 4: Review Tab Dự Báo Năng Suất AI (Machine Learning Forecast)          (~45s)   │
│   Clip 5: Review Tab Cảnh Báo Sinh Hóa & Tab Nhật Ký Thu Hoạch                (~45s)   │
│   Clip 6: Review Tab Trạm Giả Lập IoT (IoT Telemetry Simulator)               (~45s)   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 2: THỰC HÀNH TEST TRỰC TIẾP CÁC CHỨC NĂNG CHÍNH (4:10 - 7:30)                │
│   Clip 7: Test Chức năng 1 – Kích hoạt sự cố trên Trạm giả lập IoT            (~50s)   │
│   Clip 8: Test Chức năng 2 – Quy trình tiếp nhận & xử lý Cảnh báo thực địa    (~50s)   │
│   Clip 9: Test Chức năng 3 – Can thiệp Bể nước & Dosing Calculator            (~50s)   │
│   Clip 10: Test Chức năng 4 – Chạy AI Năng suất Batavia & Kiểm thử biên       (~50s)   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 3: TỔNG KẾT & KHẢ NĂNG KẾT NỐI PHẦN CỨNG THẬT (7:30 - 8:15)                  │
│   Clip 11: Kết thúc – Sẵn sàng tích hợp mạch ESP32 thật & Lời cảm ơn          (~45s)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# GIAI ĐOẠN 1: REVIEW TỔNG QUAN TỪNG TAB CỦA HỆ THỐNG

---

### 🎬 CLIP 1: ĐĂNG NHẬP & REVIEW TAB BẢNG ĐIỀU KHIỂN (DASHBOARD) (0:00 – 0:55)

* **Chuẩn bị màn hình:** Mở sẵn trang Đăng nhập `http://localhost:3000/login`.
* **Thao tác khi quay:**
  1. Nhập email `admin@hydrosmart.farm`, mật khẩu `HydroSmart123@`, bấm **Đăng nhập**.
  2. Màn hình Dashboard (`/dashboard`) mở ra:
     - **Thanh Header trên cùng:** Rê chuột qua Huy hiệu thời tiết thực tế *(TP. HCM 27°C, Nắng nhẹ)*, trạng thái *Cảm biến trực tuyến 100%*, chuông cảnh báo đỏ có số đếm `(2)`, và nút *"+ Xuất Báo Cáo"*.
     - **Banner Cảnh Báo Khẩn:** Chỉ vào dải banner màu đỏ cảnh báo *Sự cố pH quá cao 6.76 tại Lô LET-2026-003 Giàn B2* cùng nút *"Xử lý ngay"*.
     - **4 Thẻ KPI Trung Tâm:** Lướt qua 4 thẻ:
       * *Cây Đang Trồng*: `2.522` cây (4 lô máng NFT, tỷ lệ sống đạt `98.9%`).
       * *Sản Lượng Đã Thu*: `168.5 kg` (Đạt chuẩn thương phẩm `98.0%`).
       * *Doanh Thu Xuất Bán*: `7.58 tr ₫` (Giá bán TB 45k/kg, phân hạng A Loại 1).
       * *Tình Trạng Kỹ Thuật*: `2 Lưu ý` (2/2 Bể tuần hoàn đang bơm tốt).
     - **Khung Giàn Máng Canh Tác NFT (Bên trái):**
       * Chỉ vào thanh bộ lọc nhanh: *Tất cả (6), Đang trồng (3), Sắp thu (1), Xong (1)*.
       * Rê chuột qua 6 ô giàn máng: Giàn **A1**, **A2** xanh tốt; Giàn **B2** viền đỏ cảnh báo *"Cần bảo trì"*; Giàn **C1** đang sinh trưởng; Giàn **D1** đã thu hoạch; Giàn **E1** chưa gieo.
       * Chỉ vào số liệu trên mỗi giàn: tỷ lệ sống sót *(ví dụ 642/650 rọ)*, bể cấp nước, thanh tiến độ sinh khối % và 2 nút thao tác nhanh *"Dự báo AI"* & *"Thu hoạch"*.
     - **Khung Bể Dinh Dưỡng & Biểu Đồ (Bên phải):**
       * Thẻ Bể Dinh Dưỡng: Bấm chuyển đổi giữa 2 tab **Bể 01 (Tầng 1)** và **Bể 02 (Tầng 2)**, chỉ vào 4 ô chỉ số thời gian thực: *pH 5.94, EC 1.75 mS/cm, Nhiệt nước 22°C mát rễ, Oxy DO 7.6 mg/L*, thanh mực nước bể *538L / 600L (90%)*, và nút *"Châm Stock A & B"*.
       * Biểu đồ diện tích màu xanh lá: *Sản Lượng Thu Hoạch (kg) Năm 2026* thể hiện xu hướng tăng trưởng sản lượng qua các tháng.
     - **Bảng Dưới Cùng:** Cuộn nhẹ chuột xuống bảng *"Lô Cây Trồng Đang Sinh Trưởng"*: bao quát các cột Mã lô & Giống, Vị trí máng & Bồn cấp dinh dưỡng, Số cây sống sót, Tuổi cây và Số ngày còn lại đến hạn thu hoạch.

#### 🎙️ Lời thoại Clip 1 (Đọc lồng tiếng):
> *"Kính chào thầy/cô! Em xin phép được giới thiệu và báo cáo kiểm thử đề tài **HydroSmart** – Nền tảng quản trị trang trại thủy canh NFT công nghiệp tích hợp IoT và Trí tuệ nhân tạo.*
> 
> *Đầu tiên, sau khi đăng nhập tài khoản kỹ sư quản trị, chúng ta bước vào **Tab Bảng Điều Khiển (Dashboard)**. Đây là trung tâm giám sát vận hành thời gian thực của cả trang trại:*
> * *Phía trên cùng là thanh thông tin tích hợp thời tiết thực tế TP.HCM và tình trạng kết nối cảm biến.*
> * *Hệ thống ngay lập tức làm nổi bật banner cảnh báo sự cố sinh hóa khẩn cấp nếu có chỉ số vượt ngưỡng cho phép.*
> * *Hàng chỉ số điều hành tổng thể gồm 4 thẻ KPI: Tổng số cây đang trồng thực tế hơn 2.500 cây với tỷ lệ sống sót đạt gần 99%, sản lượng đã xuất bán 168.5 kg đạt chuẩn loại 1, doanh thu lũy kế và tình trạng kỹ thuật của 2 trạm bồn.*
> * *Ở khu vực trung tâm, bên trái là **Sơ đồ 6 phân khu giàn máng NFT** hiển thị rõ ràng mã giống, tỷ lệ rọ sống sót trên từng giàn, tiến trình tích lũy sinh khối và các nút thao tác nhanh; trong đó Giàn B2 được hệ thống khoanh vùng cảnh báo đỏ để kỹ sư lưu ý.*
> * *Bên phải là **Trạm bồn dinh dưỡng tuần hoàn** với 4 chỉ số vàng pH, EC, nhiệt độ, oxy hòa tan, mực nước trong bồn cùng biểu đồ sản lượng thu hoạch qua các tháng.*
> * *Và phía dưới cùng là bảng chi tiết theo dõi từng lô xà lách đang sinh trưởng kèm số ngày đếm ngược đến kỳ thu hoạch."*

---

### 🎬 CLIP 2: REVIEW TAB QUẢN LÝ LÔ TRỒNG (0:55 – 1:40)

* **Chuẩn bị màn hình:** Click vào menu **Quản lý lô trồng** (`/batches`).
* **Thao tác khi quay:**
  1. Chỉ chuột vào **4 Thẻ KPI đỉnh trang:**
     - *Tổng lô canh tác*: 4 lô đang trồng.
     - *Đang lưu chuyển*: 4 lô kết nối tuần hoàn qua 2 bể cấp dinh dưỡng.
     - *Tổng số rọ cây*: 2.522 rọ NFT đạt chuẩn.
     - *Sắp thu hoạch*: 1 lô đã bước vào giai đoạn cuộn bắp sẵn sàng thu hoạch.
  2. Chỉ vào **Thanh công cụ lọc:**
     - Các tab trạng thái: *Tất cả (4), Đang trồng (4), Sắp thu (1), Đã thu hoạch (0), Thất bại (0)*.
     - Ô tìm kiếm lô trồng, các bộ lọc theo giống cây, theo bồn cấp nước, và nút chuyển chế độ *"Bảng chỉ tiêu / Thẻ chi tiết"*.
  3. Lướt qua **Bảng Danh Sách Lô Trồng:**
     - Chỉ vào 4 dòng dữ liệu: Mã lô (`LET-2026-004`, `001`, `002`, `003`), Tên giống (Lollo Rossa, Green Oak, Batavia, Romaine).
     - Chỉ vào cột *Bể Dinh Dưỡng Cấp (NFT)*, cột *Số Cây / Sống Sót* (như 642/650 rọ - 99%), ngày chuyển máng và **Huy hiệu giai đoạn sinh dưỡng** (*Cây con, Sinh dưỡng, Tích lũy sinh khối*).
     - Cột *Tiến độ chu kỳ %* và *Hạn thu hoạch dự kiến*.
  4. Cuộn xuống phần **Sơ đồ thực địa & Biểu đồ tiến độ (Bên dưới):**
     - **Bên trái - Field Layout (SVG Map):** Bản đồ bố trí mặt bằng nhà màng với các khối giàn màu sắc trực quan (A1 xanh lá 500m², A2 600m², B2 cam 300m², C1 tím 800m², D1 400m², E1 100m²).
     - **Bên phải - Biểu đồ cột sinh thái:** So sánh tiến độ tích lũy sinh khối của từng lô (25%, 65%, 44%, 83%).
     - **Dưới cùng - Thẻ phân khu A1:** Click vào ô A1 trên bản đồ, bảng chi tiết phân khu hiện lên thông số diện tích, sức chứa rọ, lô canh tác hiện hữu và nút bấm nhanh dự báo AI.

#### 🎙️ Lời thoại Clip 2 (Đọc lồng tiếng):
> *"Tiếp theo là **Tab Quản Lý Lô Trồng**: Đây là phân hệ quản trị toàn diện vòng đời sinh học của từng lứa cây từ khi ươm hạt đến lúc thu hoạch.*
> 
> *Phía trên cùng là 4 chỉ số thống kê quy mô: toàn trại hiện có 4 lô đang canh tác tuần hoàn với hơn 2.500 rọ cây, trong đó có 1 lô sắp đến ngày thu hoạch.*
> *Hệ thống cung cấp thanh công cụ lọc mạnh mẽ theo trạng thái, theo giống xà lách và theo từng bồn cấp dinh dưỡng.*
> *Bảng theo dõi trung tâm hiển thị tường minh mọi thông số kỹ thuật: mã định danh lô, liên kết bồn cấp nước, tỷ lệ rọ sống sót thực tế, ngày chuyển từ vườn ươm lên máng NFT, huy hiệu giai đoạn sinh trưởng chuẩn nông học và thanh tiến trình phần trăm chu kỳ.*
> *Đặc biệt, phía dưới là **Bản đồ thực địa Field Layout bằng đồ họa vector tương tác**: giúp người quản lý có cái nhìn trực quan về vị trí từng ô giàn máng trong nhà màng, diện tích mét vuông và mức độ khẩn cấp ngoài giàn. Đi kèm là biểu đồ cột đối soát tiến độ sinh khối giữa các lô cây trồng."*

---

### 🎬 CLIP 3: REVIEW TAB BỂ NƯỚC & DINH DƯỠNG (1:40 – 2:25)

* **Chuẩn bị màn hình:** Click vào menu **Bể nước & Dinh dưỡng** (`/reservoirs`).
* **Thao tác khi quay:**
  1. Rê chuột qua **4 Thẻ KPI đỉnh trang:**
     - *Tổng Thể Tích Nước*: `1.455.8 / 1.600 L` (đạt 91% dung tích trữ).
     - *EC Trung Bình*: `1.79 mS/cm` (chuẩn 1.5 - 1.9 mS/cm, ổn định).
     - *pH Trung Bình*: `6.35 pH` (đang có xu hướng kiềm nhẹ, cần theo dõi).
     - *Bơm & Sục Khí*: `4/4 ON` (100% thiết bị cơ điện hoạt động bình thường).
  2. Chỉ chuột so sánh **2 Khung Thẻ Bể Nước Tuần Hoàn:**
     - **Bể Tuần Hoàn 01 (Tầng 1 - Khu A & E, 1.137 rọ):**
       * Dung tích: 538L / 600L (90%). Máy bơm: Chạy, Máy sục khí: Bật.
       * 4 thông số chất lượng nước: *pH 5.94 (Tối ưu), EC 1.75 mS/cm (Chuẩn), Nhiệt độ 22.0°C (Mát rễ), Oxy DO 7.6 mg/L (Bão hòa)*.
       * Danh sách 3 lô đang nhận nước từ bể này: Lollo Rossa, Green Oak, Batavia.
     - **Bể Tuần Hoàn 02 (Tầng 2 - Khu B, C, D, 785 rọ):**
       * Chỉ vào ô **pH 6.76 màu cam cảnh báo**: đây chính là nguồn gốc gây ra cảnh báo trên giàn B2 ở Dashboard.
       * Lô đang cấp nước: Romaine (Cos).
     - Chỉ vào các nút nghiệp vụ trên đầu mỗi bể: `+ Bù nước`, `Xả bể`, `Quét AI`, `+ Ghi số đo`.
  3. Cuộn xuống phần chân trang:
     - **Bên trái - Biểu đồ biến thiên 7 ngày:** Đường biểu diễn EC (xanh lá) và pH (xanh dương) giúp theo dõi độ ổn định của dung dịch.
     - **Bên phải - Bảng Công Thức Hoagland & Resh Chuẩn (1:100 Stock):** Chỉ rõ thành phần Can A (Canxi Nitrat, Sắt Chelate) và Can B (Magie Sulfat, MKP) được phân lập nghiêm ngặt để chống kết tủa.

#### 🎙️ Lời thoại Clip 3 (Đọc lồng tiếng):
> *"Tab thứ ba là **Bể Nước & Dinh Dưỡng** – trái tim của hệ thống thủy canh hồi lưu.*
> 
> *Phía trên là các chỉ số tổng hợp dung tích nước, nồng độ khoáng tổng EC trung bình, độ pH và trạng thái trực tuyến 100% của hệ thống bơm sục khí.*
> *Trang trại được chia làm 2 trạm bồn độc lập:*
> * *Bể 01 phụ trách Tầng 1 gồm các giàn khu A và E: các chỉ số đo pH 5.94 và EC 1.75 hoàn toàn đạt chuẩn tối ưu, rễ cây mát và oxy dồi dào.*
> * *Bể 02 phụ trách Tầng 2: hệ thống đang làm nổi bật chỉ số pH 6.76 bị kiềm hóa, giúp kỹ sư phát hiện ngay nguyên nhân tại sao lô xà lách Romaine trên giàn B2 bị báo động.*
> *Trên mỗi bể đều trang bị đầy đủ công cụ bù nước, xả rửa đường ống, quét bất thường bằng AI và ghi chép số đo.*
> *Phía dưới màn hình, hệ thống cung cấp **biểu đồ biến thiên 7 ngày** để phân tích độ trôi pH và suy giảm khoáng chất; cùng **bảng công thức dinh dưỡng Hoagland chuẩn hóa**: phân tách nghiêm ngặt Can A và Can B theo nguyên lý hóa học để ngăn ngừa kết tủa canxi sunfat làm hỏng rễ cây."*

---

### 🎬 CLIP 4: REVIEW TAB DỰ BÁO NĂNG SUẤT AI (2:25 – 3:10)

* **Chuẩn bị màn hình:** Click vào menu **Dự báo năng suất AI** (`/forecast`).
* **Thao tác khi quay:**
  1. Chỉ vào **Thanh điều hướng đỉnh trang:**
     - Huy hiệu *"Độ tin cậy 91%"* của mô hình Machine Learning.
     - Ô dropdown chọn lô canh tác: đang chọn lô `LET-2026-002 - Batavia Lettuce (495 rọ)`.
     - Nút *"Xuất Báo Cáo"*.
  2. Chỉ vào **4 Thẻ Kết Quả Dự Báo AI:**
     - *Khối Lượng Cây Hôm Nay*: `~35.8 g / cây` (Mẫu đo Ngày tuổi 16).
     - *Dự Báo Ngày Thu Hoạch*: `415.4 g / cây` (Chuẩn thương phẩm vượt mức cam kết).
     - *Tổng Sản Lượng Dự Kiến*: `205.6 kg` (Cho toàn bộ 495 rọ của lô mẻ này).
     - *Ngày Thu Hoạch Dự Kiến*: `9/11/2026` (Còn 20 ngày nữa trong chu kỳ 36 ngày).
  3. Rê chuột phân tích **Biểu Đồ Đường Cong Sinh Trưởng & Dự Báo Sinh Khối (36 Ngày):**
     - Chỉ vào *Đường xanh ngọc nét liền*: Dữ liệu thực tế tích lũy từ Ngày 1 đến Ngày 16.
     - Chỉ vào *Điểm mốc Hôm nay (Ngày 16 - 35.8g)*.
     - Chỉ vào *Đường nét đứt*: Quỹ đạo AI dự phóng sinh khối tăng tốc đến ngày thu hoạch thứ 36.
     - Chỉ vào *Đường xám nhạt*: Đường chuẩn lý thuyết của giống Batavia để so sánh đối chuẩn.
  4. Cuộn chuột xuống 2 khung phân tích bên dưới:
     - **Bên trái - "3 Việc AI Khuyên Bạn Làm Hôm Nay":** 3 chỉ dẫn nông học thực tế: (1) Duy trì EC 1.75 và pH 5.94; (2) Bật quạt đối lưu chống cháy viền lá trưa nắng; (3) Lên kế hoạch cắt rọ sáng sớm 5:30 - 7:00 ngày 9/11/2026 để rau giòn ngọt và giữ nước.
     - **Bên phải - "Thử Nghiệm Kịch Bản Giả Định" (What-If Simulation):** Chỉ vào 3 thanh trượt điều chỉnh nồng độ EC, thời điểm cắt rọ, số rọ cây thu hoạch và con số sản lượng dự kiến phản hồi tức thì.

#### 🎙️ Lời thoại Clip 4 (Đọc lồng tiếng):
> *"Đây là một trong những phân hệ giá trị nhất của đề tài: **Tab Dự Báo Năng Suất Bằng Trí Tuệ Nhân Tạo (AI)**.*
> 
> *Mô hình Machine Learning đạt độ tin cậy trên 91% nhờ phân tích tổng hòa các yếu tố nhiệt độ nước, độ dẫn điện EC, độ pH và ánh sáng tích lũy.*
> *Khi chọn lô nghiên cứu Batavia Lettuce:*
> * *Hệ thống đưa ra 4 thông số dự phóng then chốt: trọng lượng thực tế hôm nay đạt 35.8 gam, dự báo khi thu hoạch đạt trên 415 gam mỗi cây, tổng sản lượng dự kiến toàn mẻ đạt 205.6 kg và chỉ định ngày thu hoạch chuẩn xác vào ngày 9/11/2026.*
> * *Biểu đồ trung tâm trực quan hóa **Đường cong sinh trưởng sinh khối 36 ngày**: phân tách rành mạch giữa dữ liệu thực tế đã tích lũy bằng nét liền và quỹ đạo dự phóng tương lai của thuật toán bằng nét đứt.*
> * *Đặc biệt, hệ thống cung cấp tính năng **Trợ lý nông học AI** đưa ra 3 khuyến nghị hành động cụ thể trong ngày về bồn dinh dưỡng, quạt thông gió và khung giờ thu hoạch tối ưu; kết hợp cùng bộ công cụ **Mô phỏng kịch bản What-If** cho phép kỹ sư kéo thanh trượt để giả định sự thay đổi dinh dưỡng và ngày cắt rọ."*

---

### 🎬 CLIP 5: REVIEW TAB CẢNH BÁO SINH HÓA & TAB NHẬT KÝ THU HOẠCH (3:10 – 3:55)

* **Chuẩn bị màn hình:** Đang ở trang Dự báo AI.
* **Thao tác khi quay:**
  1. Click vào menu **Cảnh báo sinh hóa** (`/alerts`):
     - Chỉ vào **4 Thẻ phân loại mức độ:** *Chưa Xử Lý (Open - Đỏ)*, *Đang Tiếp Nhận (Cam)*, *Nghiêm Trọng (Hồng/Đỏ)*, *Đã Khắc Phục (Xanh lá)*.
     - Chỉ vào thanh công cụ lọc đa tầng: lọc theo trạng thái, ô tìm kiếm sự cố, dropdown lọc theo mức độ nguy hiểm *(Khẩn cấp, Nghiêm trọng, Cảnh báo)* và lọc theo từng loại cảm biến *(pH, EC, Nhiệt độ, DO, Mực nước)*.
     - Lướt qua bảng sự cố: Chỉ vào dòng cảnh báo pH kiềm 6.76, cột số đo so với ngưỡng chuẩn, và cột thao tác tiếp nhận/giải quyết.
  2. Click tiếp vào menu **Nhật ký thu hoạch** (`/harvest`):
     - Chỉ vào **4 Thẻ KPI sản lượng:** *Tổng Sản Lượng Thực Thu (168.5 kg)*, *Độ Lệch Trung Bình vs AI (±2.09% - độ chính xác rất cao)*, *Tỷ Lệ Rau Đạt Chuẩn Loại 1 (100% Hạng A siêu thị)*, *Tổng Đợt Thu Hoạch (1 đợt)*.
     - Chỉ vào **Bảng Lịch Sử Thu Hoạch & Đối Chiếu Năng Suất:** Rê chuột qua dòng lô đã thu hoạch `LET-2025-009-HIST (Romaine)`: đối soát trực tiếp giữa Khối lượng thực tế `224.6 g/cây` với Dự báo của AI `220 g/cây`, độ sai lệch chỉ `+2.09%` và tỷ lệ hao hụt cực thấp chỉ `2%`.
     - Chỉ vào các nút tiện ích: *"Xuất Dữ Liệu AI"*, *"Xuất CSV"* phục vụ kiểm toán nông nghiệp.

#### 🎙️ Lời thoại Clip 5 (Đọc lồng tiếng):
> *"Tiếp theo là hai tab quản lý chất lượng và kết quả đầu ra của trang trại:*
> 
> * [Click sang tab Cảnh báo] *Đầu tiên là **Tab Cảnh Báo Sinh Hóa**: Đây là trung tâm kiểm soát an toàn vận hành 24/7. Mọi sự cố về nồng độ khoáng, trôi pH hay cạn nước đều được phân loại nghiêm ngặt thành 4 mức độ với quy trình xử lý khép kín: từ Chưa tiếp nhận, Đang xử lý cho đến Đã giải quyết triệt để.*
> 
> * [Click sang tab Thu hoạch] *Tiếp theo là **Tab Nhật Ký Thu Hoạch**: Nơi ghi nhận kết quả sản xuất thực tế xuất bán cho đối tác. Trang này cung cấp 4 chỉ số chất lượng then chốt với 100% rau đạt tiêu chuẩn loại 1.*
> *Điểm nổi bật nhất ở bảng lịch sử là tính năng **đối chiếu sai số giữa thực tế và mô hình AI**: như thầy/cô thấy, sản lượng thực thu đạt 224.6 gam so với AI dự báo 220 gam, độ sai lệch chỉ 2.09%, khẳng định tính chính xác và giá trị ứng dụng cao của mô hình học máy vào thực tế."*

---

### 🎬 CLIP 6: REVIEW TAB TRẠM GIẢ LẬP IoT (3:55 – 4:40)

* **Chuẩn bị màn hình:** Click vào menu **Trạm giả lập IoT** (`/simulator`).
* **Thao tác khi quay:**
  1. Chỉ chuột vào **Thanh trạng thái đầu trang:**
     - Huy hiệu xanh: *"Đang tự động gửi số đo"* (chu kỳ 2 giây/lần).
     - 3 nút điều khiển: *Tạm Dừng / Bật Tự Động*, và nút *Đưa Về Bình Thường*.
  2. Chỉ chuột vào **PHẦN 1: Bảng 5 Thẻ Số Đo Cảm Biến Thời Gian Thực:**
     - Nút chọn xem giữa các bể tuần hoàn.
     - 5 thẻ cảm biến: *Độ pH nước (FlaskConical), Dinh dưỡng EC (Zap), Nhiệt độ nước (Thermometer), Oxy trong nước DO (Wind), Mực nước bể (Droplets)*.
     - Chỉ vào nhãn trạng thái `✓ Tốt` màu xanh và dòng dải ngưỡng an toàn khoa học bên dưới mỗi thẻ.
     - Chỉ vào thanh đánh giá: *Sức khỏe & Tốc độ lớn của cây trồng (Growth Factor %)* phản ứng tức thời theo chất lượng nước.
  3. Cuộn xuống **PHẦN 2: Khung Kịch Bản Thử Nghiệm Sự Cố Ngoài Thực Địa:**
     - Lướt qua 6 nút bấm sự cố: *Nắng nóng nhà màng, Hỏng máy sục khí, Cạn kiệt dinh dưỡng, pH trôi kiềm, Rò rỉ nước bể, Mất kết nối cảm biến*.
     - Chỉ vào dòng hiện tượng và hướng xử lý được tóm tắt ngay trên từng nút.
  4. Cuộn xuống **PHẦN 3: Giả Lập Cây Trồng Lớn Lên Theo Ngày:**
     - Chỉ vào 2 nút bấm: `+1 Ngày tuổi` và `+3 Ngày tuổi (Tua nhanh)`.
     - Khung tiến trình tăng trưởng của các lô theo ngày tuổi, số lá, chiều cao và trọng lượng mẫu.
  5. Cuộn xuống chân trang: Chỉ vào phần đối sánh cấu trúc gói tin JSON với vi điều khiển ESP32 thật.

#### 🎙️ Lời thoại Clip 6 (Đọc lồng tiếng):
> *"Tab cuối cùng trong chuỗi giao diện là **Trạm Giả Lập IoT** – công cụ cốt lõi phục vụ kiểm thử và mô phỏng thực địa.*
> 
> *Giao diện được thiết kế khoa học với 3 phân khu rõ ràng:*
> * *Phần 1 hiển thị trực quan **5 đồng hồ đo cảm biến thời gian thực**: pH, EC, nhiệt độ, oxy hòa tan DO và mực nước, kèm chỉ số sức khỏe sinh thái của cây trồng.*
> * *Phần 2 là **Hệ thống kịch bản thử nghiệm sự cố**: gồm 6 tình huống rủi ro thực tế như nắng nóng làm nước ấm, hỏng máy sục khí rễ thiếu oxy, hay cảm biến mất kết nối.*
> * *Phần 3 là **Công cụ mô phỏng chu kỳ sinh trưởng**: cho phép kỹ sư tua nhanh thời gian cây lớn lên theo ngày để kiểm chứng phản ứng của thuật toán dự báo.*
> 
> *Sau khi đã đi qua toàn diện từng tab giao diện, ngay sau đây em xin phép bước vào **Giai đoạn 2: Trực tiếp kiểm thử và vận hành các chức năng quan trọng nhất** của hệ thống."*

---

# GIAI ĐOẠN 2: THỰC HÀNH TEST TRỰC TIẾP CÁC CHỨC NĂNG CHÍNH

---

### 🎬 CLIP 7: TEST CHỨC NĂNG 1 — KÍCH HOẠT SỰ CỐ TRÊN TRẠM GIẢ LẬP IoT (4:40 – 5:30)

* **Chuẩn bị màn hình:** Đang ở trang **Trạm giả lập IoT** (`/simulator`). Trước khi bấm quay, bấm nút *"Đưa Về Bình Thường"* để 5 chỉ số cảm biến về màu xanh an toàn.
* **Thao tác test khi quay:**
  1. Chỉ chuột vào nhịp chạy mô phỏng: số đo đang cập nhật đều đặn mỗi 2 giây.
  2. Cuộn xuống Phần 2, bấm vào nút **"Hỏng máy sục khí"** (Icon cây quạt gió).
  3. **Dừng chuột 2 giây để kiểm chứng sự thay đổi trực quan:**
     - Thẻ **Oxy trong nước (DO)** ở Phần 1 lập tức tụt dốc từ 7.6 mg/L xuống **3.8 mg/L và đổi sang MÀU ĐỎ RỰC (⚠ Vượt ngưỡng)**.
     - Thanh sức khỏe cây trồng bên dưới tụt giảm tăng trưởng và báo cờ cảnh báo rễ thiếu khí thở.
     - Ngay dưới nút kịch bản xuất hiện hộp thông báo màu đỏ: *Hệ thống đã phát hiện sự cố "Hỏng máy sục khí" và Rule Engine tự động tạo Cảnh báo khẩn cấp*.
     - Chuông thông báo đỏ trên thanh Header nhảy thêm số đếm.
  4. Cuộn xuống Phần 3, bấm vào nút xanh **"+1 Ngày tuổi"** $\rightarrow$ Toast xanh xuất hiện báo cây đã tăng tuổi và sinh khối theo điều kiện môi trường.

#### 🎙️ Lời thoại Clip 7 (Đọc lồng tiếng):
> *"Em xin bắt đầu bài test đầu tiên: **Kiểm thử khả năng xử lý luồng dữ liệu IoT và kích hoạt cảnh báo tự động**.*
> 
> *Hiện tại trạm đo đang hoạt động bình thường, 5 chỉ số đều ở mức xanh an toàn.*
> *Bây giờ, em sẽ **thực hiện kiểm thử phản ứng của hệ thống khi gặp sự cố đột xuất ngoài trang trại**: Em bấm kích hoạt tình huống **'Hỏng máy sục khí'**.*
> 
> * [Bấm nút - Dừng chuột 2 giây] *Thầy/cô thấy ngay: chỉ số oxy hòa tan DO lập tức tụt giảm xuống mức nguy hiểm 3.8 mg/L, thẻ cảm biến đổi sang màu đỏ rực cảnh báo vượt ngưỡng. Sức khỏe cây bị kìm hãm ngay lập tức.*
> *Hệ thống Rule Engine tại backend đã tự động nhận diện vi phạm ngưỡng an toàn sinh hóa, kích hoạt còi báo động đỏ trên thanh Header và đưa ra phác đồ kỹ thuật mà không cần sự can thiệp thủ công nào.*
> 
> *Đồng thời, em test tiếp tính năng mô phỏng sinh thái bằng nút **'+1 Ngày tuổi'**: hệ thống ngay lập tức tính toán lượng sinh khối tăng thêm của cây trồng tương ứng với chất lượng nước thực tế."*

---

### 🎬 CLIP 8: TEST CHỨC NĂNG 2 — TIẾP NHẬN & XỬ LÝ CẢNH BÁO THỰC ĐỊA (5:30 – 6:25)

* **Chuẩn bị màn hình:** Đang ở trang Trạm giả lập (vừa tạo sự cố DO, chuông đỏ trên Header đang sáng).
* **Thao tác test khi quay:**
  1. Bấm vào nút đỏ **"Xem ở trang Cảnh báo"** (hoặc menu **Cảnh báo sinh hóa** `/alerts`).
  2. Trong bảng danh sách, thấy ngay dòng sự cố *Oxy hòa tan DO xuống thấp (3.8 mg/L)* đang ở trạng thái **Chưa xử lý (Màu đỏ)**.
  3. Bấm vào nút **"Tiếp nhận" (Acknowledge)**:
     - Dòng cảnh báo lập tức chuyển sang **Màu cam ("Đang xử lý")**.
     - Nhấn mạnh: Thao tác bấm "Tiếp nhận" diễn ra ngay trước khi ra bể để giữ ca trực, ngăn ngừa rủi ro nhiều kỹ sư cùng can thiệp trùng lặp.
  4. Click vào dòng cảnh báo để mở rộng chi tiết: Chỉ vào ô *Phác đồ xử lý kỹ thuật*: *"Kiểm tra van khí, bật máy sục dự phòng, hạ nhiệt độ bồn"*.
  5. Bấm vào nút **"Giải quyết sự cố" (Resolve)**:
     - Hộp thoại ghi chú kiểm toán hiện lên.
     - Nhập nội dung: *"Đã bật máy sục khí dự phòng số 2, đo lại DO hồi phục đạt 7.2 mg/L"*.
     - Bấm **Xác nhận giải quyết**.
  6. **Kiểm chứng kết quả:** Dòng cảnh báo chuyển ngay sang **Màu xanh lá ("Đã giải quyết")**, số đếm màu đỏ trên chuông Header tự động biến mất.

#### 🎙️ Lời thoại Clip 8 (Đọc lồng tiếng):
> *"Sau khi sự cố phát sinh, em xin thực hiện bài test thứ hai: **Quy trình tiếp nhận và xử lý cảnh báo khép kín theo tiêu chuẩn VietGAP**.*
> 
> *Khi chuyển sang trang Cảnh báo sinh hóa, sự cố oxy DO tụt xuống 3.8 mg/L đang báo động đỏ:*
> * *Bước 1: Kỹ sư bấm ngay **'Tiếp nhận'**. Trạng thái lập tức chuyển sang màu cam 'Đang xử lý' kèm tên kỹ sư phụ trách. Thao tác này cực kỳ quan trọng để thực hiện ngay trước khi ra bể, giúp cả trang trại biết sự cố đã có người tiếp quản, tránh tình trạng hai người cùng ra can thiệp trùng lặp.*
> * *Bước 2: Mở chi tiết cảnh báo, hệ thống cung cấp sẵn phác đồ kỹ thuật chuẩn: 'Kiểm tra van khí, bật máy sục dự phòng'. Kỹ sư ra thực địa can thiệp cơ học để cứu rễ cây ngay lập tức vì phần mềm không thể tự sửa thiết bị.*
> * *Bước 3: Mặc dù hệ thống có cơ chế Auto-Resolution tự động đóng cảnh báo khi cảm biến đo nước tốt trở lại, kỹ sư vẫn chủ động bấm **'Giải quyết sự cố'** trên phần mềm để ghi lại nhật ký nguyên nhân: 'Đã bật máy sục khí dự phòng số 2, đo lại DO đạt 7.2 mg/L' rồi bấm Xác nhận.*
> 
> *Thẻ cảnh báo đổi sang màu xanh an toàn, chuông báo động biến mất. Việc vừa xử lý ngoài thực tế để cứu cây, vừa xác nhận trên phần mềm giúp khép kín vòng lặp kiểm soát, lưu vết kiểm toán minh bạch cho hồ sơ VietGAP và giúp mô hình AI cập nhật dữ liệu sạch phục vụ dự báo năng suất."*

---

### 🎬 CLIP 9: TEST CHỨC NĂNG 3 — CAN THIỆP BỂ NƯỚC & DOSING CALCULATOR (6:20 – 7:10)

* **Chuẩn bị màn hình:** Click vào menu **Bể nước & Dinh dưỡng** (`/reservoirs`).
* **Thao tác test khi quay:**
  1. Nhìn vào thẻ **Bể Tuần Hoàn 01**, cuộn mắt xuống khung **"Bù Dinh Dưỡng Tuần Hoàn"** (ngay dưới 4 ô đo pH, EC, Nhiệt nước, DO).
  2. **Thao tác điều chỉnh nồng độ EC mục tiêu:**
     - Chỉ vào chỉ số hiện tại: `EC = 1.70 mS/cm` (Đang hiển thị "Nồng độ EC đạt chuẩn. Chưa cần châm thêm").
     - Tại ô **Mục tiêu: [-] [ 1.70 ] [+] mS**, bấm nút **`+`** liên tiếp (hoặc click vào ô gõ trực tiếp `1.90`) để nâng EC mục tiêu lên **`1.90 mS`**.
  3. **Quan sát kết quả tính toán tự động:**
     - Khung máy tính châm phân Dosing Calculator lập tức hiện ra 2 chai phân mẹ:
       * **Can A (Canxi/Sắt)**: **`105 ml`**
       * **Can B (Lân/Khoáng)**: **`105 ml`**
     - Đồng thời xuất hiện nút bấm màu xanh lá: **"Châm 105ml Can A & B"**.
  4. Bấm nút **"Châm 105ml Can A & B"** $\rightarrow$ Banner thông báo xanh hiện lên: *"Đã châm 105ml Can A & B vào Bể Tuần Hoàn 01. Nồng độ EC đạt 1.9 mS/cm"*, đồng thời ô số đo EC trên thẻ bể cập nhật lên `1.90 mS/cm`.
  5. Bấm vào nút **"Quét AI"** (Icon chiếc khiên xanh dương ở góc trên bên phải thẻ Bể 01) $\rightarrow$ Banner xanh xuất hiện ngay bên dưới dung tích nước: *Mô hình Isolation Forest xác nhận bể nước hoàn toàn an toàn (Score: 0.12 - 0.25)*.

#### 🎙️ Lời thoại Clip 9 (Đọc lồng tiếng):
> *"Bài test thứ ba là **Công cụ tính toán châm phân Dosing Calculator và Quét bất thường bằng Machine Learning**.*
> 
> *Trong thủy canh tuần hoàn, nồng độ EC đại diện cho tổng lượng ion khoáng hòa tan. Khi cây lớn lên và hấp thụ dinh dưỡng, nồng độ EC sẽ hao hụt dần:*
> * *Trên thẻ Bể Tuần Hoàn 01, tại khung 'Bù Dinh Dưỡng Tuần Hoàn', nồng độ hiện tại đang là 1.70 mS/cm.*
> * *Em bấm tăng mục tiêu lên 1.90 mS/cm để thúc đẩy sinh khối cho giàn xà lách.*
> * *Ngay lập tức, thuật toán cân bằng vi lượng tự động tính toán chính xác lượng dung dịch mẹ đậm đặc cần bổ sung: đúng 105 ml Can A và 105 ml Can B.*
> * *Nguyên lý nông học ở đây là hai bình dinh dưỡng mẹ bắt buộc phải tách rời: Bình A chứa Canxi và Bình B chứa Sunfat, Photphat. Chỉ khi châm vào bể nước tuần hoàn lớn thì hai chất này mới được hòa tan loãng, tránh tuyệt đối hiện tượng kết tủa canxi sunfat gây nghẹt rễ.*
> * *Em bấm 'Châm 105ml Can A & B'... Thông số EC của Bể 01 lập tức được cập nhật lên 1.90 mS/cm.*
> 
> *Đồng thời, em test tiếp tính năng **Quét bất thường AI**: Em bấm nút 'Quét AI' trên thẻ bể. Mô hình Isolation Forest rà soát dữ liệu đa biến pH, EC, nhiệt độ và xác nhận toàn bộ chỉ số đều an toàn, không có dị biệt số đo."*

---

### 🎬 CLIP 10: TEST CHỨC NĂNG 4 — CHẠY AI DỰ BÁO NĂNG SUẤT & KIỂM THỬ BIÊN (7:10 – 8:00)

* **Chuẩn bị màn hình:** Click vào menu **Dự báo năng suất AI** (`/forecast`).
* **Thao tác test khi quay:**
  1. Tại ô chọn lô, chọn lô **LET-2026-002 (Xà lách Batavia Lettuce)**.
  2. Chỉ chuột vào các kết quả tính toán của AI:
     - Trọng lượng cây dự báo: **`415.4 g / cây`**.
     - Tổng sản lượng mẻ: **`205.6 kg`** (cho 495 rọ).
     - Ngày thu hoạch chuẩn xác: **`9/11/2026`**.
     - Cuộn xuống khung Khuyến nghị AI và thanh trượt What-If: kéo nhẹ thanh trượt EC để thấy con số sản lượng thay đổi linh hoạt.
  3. **Thao tác Kiểm Thử Biên (Boundary / Negative Test để chứng minh tính trung thực khoa học):**
     - Click vào dropdown chọn lô, đổi sang chọn lô giống **Romaine (Cos)** hoặc **Green Oak Leaf**.
     - **Chỉ chuột vào thông báo của hệ thống:** *"Mô hình AI hiện chỉ được huấn luyện và tối ưu hóa chuyên sâu cho giống Xà lách Batavia. Các giống cây khác đang trong quá trình tích lũy tập dữ liệu"*.

#### 🎙️ Lời thoại Clip 10 (Đọc lồng tiếng):
> *"Bài test thứ tư là **Mô hình Trí Tuệ Nhân Tạo Dự Báo Năng Suất và Kiểm Thử Biên Dữ Liệu**.*
> 
> *Trước hết, em kiểm thử trên đối tượng nghiên cứu chính: Lô **LET-2026-002 - giống Xà lách Batavia**:*
> * *Thuật toán Machine Learning phân tích chuỗi dữ liệu vi khí hậu và dự báo chính xác: cây đạt trọng lượng thương phẩm 415.4 gam, tổng sản lượng mẻ đạt 205.6 kg và chỉ định ngày thu hoạch tối ưu vào ngày 9/11/2026.*
> * *Mô hình đạt tính giải thích được (Explainability) khi chỉ dẫn kỹ sư cách điều chỉnh dinh dưỡng và nhiệt độ qua các công cụ trực quan.*
> 
> *Đặc biệt, để chứng minh **tính trung thực và chuẩn mực khoa học của đề tài**, em xin thực hiện một bài **Kiểm Thử Biên (Negative Test)**:*
> * *Khi em chuyển sang chọn lô giống Romaine hoặc Green Oak...*
> * *Hệ thống không hề tự ý sinh số liệu giả mạo, mà hiển thị thông báo tường minh: mô hình hiện chỉ được tối ưu hóa cho phạm vi giống Batavia theo đúng đề cương nghiên cứu, các giống khác sẽ tiếp tục được mở rộng khi có đủ tập dữ liệu kiểm chứng. Điều này khẳng định độ tin cậy và sự nghiêm túc trong nghiên cứu khoa học của nhóm."*

---

# GIAI ĐOẠN 3: TỔNG KẾT & KẾT THÚC

---

### 🎬 CLIP 11: TỔNG KẾT & KHẢ NĂNG KẾT NỐI PHẦN CỨNG THẬT ESP32 (8:00 – 8:45)

* **Chuẩn bị màn hình:** Quay trở lại menu **Trạm giả lập IoT** (`/simulator`), cuộn xuống chân trang tại mục **Phần 3: Hướng tích hợp thiết bị thật**.
* **Thao tác khi quay:**
  1. Rê chuột qua bảng so sánh 2 gói tin JSON đặt song song:
     - Bên trái: Gói tin từ Trạm Giả Lập phần mềm.
     - Bên phải: Gói tin chuẩn gửi từ vi điều khiển phần cứng ESP32 thật qua giao thức HTTP REST/MQTT.
     - Nhấn mạnh sự đồng nhất 100% về cấu trúc (`deviceId`, `source: sensor`, mảng `readings` gồm mã cảm biến và giá trị đo).
  2. Chỉ chuột vào danh mục linh kiện phần cứng công nghiệp: Vi điều khiển ESP32, bộ cảm biến pH, EC, DO chuẩn DFRobot.
  3. Bấm quay trở về trang **Bảng Điều Khiển (Dashboard)** làm khung hình kết thúc bài thuyết trình.

#### 🎙️ Lời thoại Clip 11 (Đọc lồng tiếng):
> *"Để kết thúc buổi báo cáo, em xin khẳng định **tính sẵn sàng triển khai phần cứng thực tế của dự án HydroSmart**.*
> 
> *Nhóm em đã xây dựng hoàn chỉnh mã nguồn firmware C++ cho vi điều khiển ESP32 trong thư mục `hardware`. Như thầy/cô quan sát trên màn hình: định dạng gói tin JSON giữa trạm giả lập và thiết bị vật lý là hoàn toàn tương thích và đồng nhất 100%.*
> *Khi trang trại lắp đặt các cảm biến thật của DFRobot ngoài nhà màng, chúng em chỉ cần chuyển đổi một cờ cấu hình sang `DATA_SOURCE=device` là toàn bộ hệ thống Backend, Rule Engine và Dashboard tiếp nhận dữ liệu thật tức thì mà không cần chỉnh sửa bất kỳ dòng mã nguồn nào.*
> 
> *Trên đây là toàn bộ phần review tổng quan các phân hệ chức năng và kiểm thử trực tiếp các kịch bản vận hành cốt lõi của hệ thống HydroSmart. Em xin chân thành cảm ơn quý Thầy/Cô đã dành thời gian theo dõi và đánh giá!"*

---

## 💡 BẢNG TỔNG HỢP MẸO QUAY VIDEO CHUYÊN NGHIỆP:

| STT | Clip | Màn hình cần mở | Điểm cốt lõi cần làm nổi bật | Thời lượng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Clip 1 | `/login` $\rightarrow$ `/dashboard` | Đăng nhập $\rightarrow$ 4 KPI $\rightarrow$ 6 Giàn máng NFT $\rightarrow$ 2 Bể tuần hoàn $\rightarrow$ Bảng lô trồng | ~55s |
| **2** | Clip 2 | `/batches` | 4 KPI $\rightarrow$ Bảng lô trồng $\rightarrow$ Sơ đồ SVG Field Layout $\rightarrow$ Biểu đồ cột tiến độ | ~45s |
| **3** | Clip 3 | `/reservoirs` | 4 KPI $\rightarrow$ Thẻ Bể 01 (tốt) vs Bể 02 (kiềm pH 6.76) $\rightarrow$ Xu hướng 7 ngày $\rightarrow$ Công thức Hoagland Can A/B | ~45s |
| **4** | Clip 4 | `/forecast` | Thẻ dự báo AI Batavia (415g/cây) $\rightarrow$ Đường cong sinh thái 36 ngày $\rightarrow$ Khuyến nghị AI $\rightarrow$ What-If sliders | ~45s |
| **5** | Clip 5 | `/alerts` $\rightarrow$ `/harvest` | Cảnh báo phân tầng 4 mức $\rightarrow$ Nhật ký thu hoạch $\rightarrow$ Đối chiếu sai số AI chỉ ±2.09% | ~45s |
| **6** | Clip 6 | `/simulator` | 5 đồng hồ đo thời gian thực $\rightarrow$ 6 nút sự cố $\rightarrow$ Giả lập cây lớn $\rightarrow$ Kiến trúc ESP32 | ~45s |
| **7** | Clip 7 | `/simulator` | Bấm "Hỏng máy sục khí" $\rightarrow$ DO tụt đỏ 3.8 mg/L $\rightarrow$ Còi chuông đỏ nổ $\rightarrow$ Tua cây lớn | ~50s |
| **8** | Clip 8 | `/alerts` | Bấm "Tiếp nhận" (chuyển Cam) $\rightarrow$ Bấm "Giải quyết" nhập ghi chú kiểm toán $\rightarrow$ Chuyển Xanh lá | ~50s |
| **9** | Clip 9 | `/reservoirs` | Khung Bù Dinh Dưỡng: tăng EC 1.90 $\rightarrow$ Tự tính 105ml Can A/B $\rightarrow$ Bấm "Châm 105ml Can A & B" $\rightarrow$ Bấm "Quét AI" | ~50s |
| **10**| Clip 10| `/forecast` | Chạy AI Batavia $\rightarrow$ Kiểm thử biên chọn Romaine $\rightarrow$ Chặn phạm vi nghiên cứu Batavia chuẩn khoa học | ~50s |
| **11**| Clip 11| `/simulator` $\rightarrow$ `/dashboard` | Đối sánh gói tin JSON ESP32 $\rightarrow$ Sẵn sàng cắm cảm biến thật $\rightarrow$ Về Dashboard chào kết | ~45s |

> [!TIP]
> **Cách quay nhẹ nhàng nhất:**
> - Bật phím tắt Windows: `Win + Alt + R` để quay từng clip độc lập.
> - Quay xong clip nào, bạn xem lại nếu ưng ý thì chuyển sang clip tiếp theo.
> - Sau khi có đủ 11 clip ngắn, bạn có thể ghép lại bằng bất kỳ phần mềm cắt ghép nào (như CapCut PC, Clipchamp có sẵn trên Windows 11) hoặc nộp theo thư mục từng phần đều rất chỉn chu và được đánh giá cao!
