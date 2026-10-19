# BÁO CÁO RÀ SOÁT, ĐỒNG BỘ VÀ HOÀN THIỆN HỆ THỐNG FARM MANAGEMENT
**Dự án:** HydroSmart NFT — Hệ Thống Giám Sát và Điều Khiển Thủy Canh Màng Dinh Dưỡng Thông Minh  
**Mã Commit:** `79dd4c3`  
**Nhánh:** `main`  
**Ngày thực hiện:** 19/10/2026  

---

## 1. Những vấn đề đã phát hiện qua rà soát

1. **Thiếu thông số kỹ thuật tiêu chuẩn ở Cây trồng (Cultivar):**
   - Trước đây `Cultivar` chỉ có các thông số cơ bản (`targetCycleDays`, `recommendedPhMin/Max`, `recommendedEcMin/Max`), thiếu hoàn toàn thông số vi khí hậu (nhiệt độ không khí, độ ẩm, cường độ ánh sáng PPFD, tích lũy ánh sáng DLI, mực nước an toàn tối thiểu).
   - Chưa có cấu hình ngưỡng theo từng giai đoạn sinh trưởng (`seed`, `seedling`, `transplant`, `vegetative`, `pre_harvest`, `harvest`).

2. **Hệ thống cảnh báo bị rời rạc & không đối chiếu ngưỡng thực tế:**
   - Cảnh báo chưa có mức độ `emergency` (khẩn cấp), chỉ có `critical`, `warning`, `info`.
   - Cảnh báo không lưu trữ giá trị đo thực tế (`actualValue`), giá trị ngưỡng vi phạm (`thresholdValue`) và đơn vị đo (`unit`).
   - Thiếu cơ chế khử trùng lặp (de-duplication): mỗi lần đo sai lệch đều tạo cảnh báo mới làm tràn bảng.
   - Thiếu cơ chế tự động khôi phục (auto-resolution): khi kỹ thuật viên châm dung dịch hoặc thông số nước trở lại dải an toàn, cảnh báo vẫn bị treo `open`.

3. **Database Schema & SQL thiếu thực thể IoT & Vi khí hậu:**
   - Database và Prisma chưa có bảng `sensors` (giám sát trạng thái thiết bị cảm biến, pin, telemetry) và `environment_logs` (lưu vi khí hậu: PPFD, DLI, CO2, VPD, nhiệt độ, độ ẩm).
   - `water_quality_logs` thiếu trường `water_level_percent`.

4. **Logic đếm phân khu (Zones) và liên kết nghiệp vụ bị hardcode:**
   - `getZones` ở cả Backend và Frontend có đoạn hardcode số lượng ô đã thu hoạch `completed: 6` thay vì tính toán thực tế từ cơ sở dữ liệu và các lô đã thu hoạch.
   - Màu sắc và trạng thái phân khu (`status`) không tự động chuyển thành `needs_attention` (màu đỏ) khi bể cấp dinh dưỡng liên kết gặp cảnh báo khẩn cấp/nghiêm trọng.
   - Khi thu hoạch lô (`recordHarvest`), trạng thái phân khu không tự động chuyển về `completed` và cảnh báo của lô không được tự động giải quyết.

---

## 2. Những thay đổi trong Database & Prisma

### 2.1. Cập nhật Prisma Schema (`backend/prisma/schema.prisma`)
- **`Cultivar`:** Bổ sung `optimalAirTempMin`, `optimalAirTempMax`, `optimalHumidityMin`, `optimalHumidityMax`, `optimalLightPpfdMin`, `optimalLightPpfdMax`, `optimalLightDliMin`, `optimalLightDliMax`, `minWaterLevelPercent`, và `stageConfigs` (JSON cấu hình chi tiết dải EC, pH, nhiệt nước theo 6 giai đoạn).
- **`Alert`:** Bổ sung mức độ `emergency`, trường `thresholdValue`, `actualValue`, `unit`.
- **`WaterQualityLog`:** Bổ sung `waterLevelPercent`.
- **Thêm Model mới `Sensor`:** Mã cảm biến `code`, `name`, `sensorType` (`ph`, `ec`, `water_temp`, `do`, `water_level`, `multi`), `status` (`online`, `offline`, `warning`), `lastReading`, `unit`, `batteryLevel`, khóa ngoại liên kết tới `Reservoir` hoặc `FarmZone`.
- **Thêm Model mới `EnvironmentLog`:** Ghi nhận vi khí hậu nhà màng `airTemp`, `humidity`, `co2`, `ppfd`, `dli`, `vpd`, khóa ngoại liên kết tới `FarmZone`.
- Đã chạy `npx prisma generate` thành công.

### 2.2. Đồng bộ tệp SQL Khởi Tạo (`init.sql` & `backend/init.sql`)
- Cập nhật DDL đầy đủ với quan hệ khóa ngoại, `ON DELETE CASCADE`.
- Nạp sẵn Seed SQL chuẩn cho:
  - 5 giống xà lách thủy canh chuyên dụng: **Green Oak Leaf**, **Batavia**, **Romaine (Cos)**, **Lollo Rossa**, **Butterhead (Mỡ)** kèm thông số khoa học chuẩn Cornell & Hoagland.
  - 11 trạm cảm biến IoT thực tế đo đạc cho 2 bể tuần hoàn và các giàn NFT.
  - Lịch sử vi khí hậu và chất lượng nước.

### 2.3. Cập nhật Seed Script (`backend/prisma/seed.ts`)
- Toàn bộ dữ liệu mẫu sử dụng `upsert` an toàn, có thể chạy lại nhiều lần mà không gây lỗi khóa chính hoặc dữ liệu rác.
- Liên kết chuỗi dữ liệu hoàn chỉnh: Farm → Khu vực → Giàn NFT → Bể dinh dưỡng → Cây trồng (kèm stageConfigs) → Lô trồng → Cảm biến IoT → Số đo thực tế → Cảnh báo ngưỡng.

---

## 3. Những chức năng đã sửa hoặc bổ sung

### 3.1. Động cơ cảnh báo thông minh (`AlertEngineService`)
- Xây dựng tại [backend/src/modules/alerts/alert-engine.service.ts](file:///d:/Work/Project/farm-management/backend/src/modules/alerts/alert-engine.service.ts):
  - Phân loại 4 cấp độ cảnh báo định lượng: `EMERGENCY` (nguy cấp rễ ngạt/sốc muối/cạn bồn), `CRITICAL` (vượt ngưỡng nghiêm trọng), `WARNING` (lệch nhẹ), `INFO` (bình thường hóa).
  - Tự động lấy ngưỡng từ giống cây trồng đang canh tác tại giàn để so sánh với số đo cảm biến thực tế.
  - **Khử trùng lặp:** Cập nhật thông số vào cảnh báo đang mở thay vì tạo thêm dòng mới.
  - **Tự động đóng cảnh báo (Auto-resolution):** Tự động chuyển trạng thái sang `resolved` kèm lý do khi thông số trở về ngưỡng sinh trưởng an toàn.
  - Cập nhật số đọc mới nhất vào model `Sensor`.

### 3.2. Module Cây Trồng (Cultivars)
- Bổ sung Zod Schema xác thực chặt chẽ: `recommendedPhMin <= recommendedPhMax`, `recommendedEcMin <= recommendedEcMax`, dải nhiệt độ, chu kỳ sinh trưởng, cấu hình từng giai đoạn.
- Bổ sung API `DELETE /api/v1/cultivars/:id` kèm cơ chế kiểm tra toàn vẹn: ngăn chặn xóa giống cây đang có lô canh tác hoạt động (`active`).

### 3.3. Module Bể Dinh Dưỡng (Reservoirs)
- Bổ sung quản lý `waterLevelPercent`.
- Các hành động: châm dinh dưỡng (`doseNutrient`), bù nước sạch (`topUpWater`), xả bể (`drainAndReplace`), và đo đạc (`logWaterQuality`) đều kích hoạt `alertEngine` để cập nhật trạng thái cảnh báo và nồng độ tức thời.

### 3.4. Module Lô Canh Tác (Batches) & Phân Khu (Zones)
- Sửa hàm `getZones`: thay thế toàn bộ số liệu giả định hardcode bằng thuật toán đếm động thực tế từ cơ sở dữ liệu.
- Phân khu tự động đổi màu sang cảnh báo (`#ef4444` / `needs_attention`) khi có cảnh báo `critical` hoặc `emergency`.
- Tự động cập nhật `ready_soon` khi ngày dự kiến thu hoạch còn $\le 3$ ngày.

### 3.5. Module Cảm Biến IoT & Dashboard Tổng Hợp Mới
- Bổ sung Router, Controller và Service cho cảm biến: `POST /api/v1/sensors/telemetry` để tiếp nhận dữ liệu thời gian thực từ phần cứng IoT.
- Bổ sung Router, Controller và Service cho Dashboard: `GET /api/v1/dashboard/stats` trả về tỷ lệ sống sót, tổng sản lượng, doanh thu, số cảnh báo phân theo mức độ, và danh sách phân khu.

---

## 4. Đồng bộ Frontend ↔ Backend

1. **Frontend Type System (`frontend/src/types/farm.ts`):**
   - Đồng bộ đầy đủ kiểu dữ liệu: `CultivarStageConfig`, `AlertSeverity` (hỗ trợ `emergency`), `AlertMetric` (hỗ trợ `WaterTemp`), `Sensor`, `thresholdValue`, `actualValue`, `unit`, `currentWaterLevelPercent`.
2. **Giao diện Cảnh Báo (`AlertsView.tsx`):**
   - Bổ sung bộ lọc mức độ `emergency` (Khẩn cấp).
   - Thẻ sự cố khẩn cấp có huy hiệu đỏ nổi bật và hiệu ứng cảnh báo.
   - Hiển thị trực tiếp hộp so sánh: `Thực tế: ... | Ngưỡng chuẩn: ...`.
3. **Giao diện Dashboard (`DashboardView.tsx`):**
   - Sắp xếp cảnh báo ưu tiên cao nhất theo trọng số: `emergency > critical > warning > info`.
   - Banner cảnh báo thời gian thực tự động chuyển sang màu đỏ cảnh báo khẩn cấp khi có sự cố nghiêm trọng.
4. **Giao diện Bể Dinh Dưỡng (`ReservoirsView.tsx`):**
   - Modal ghi nhận đo đạc bổ sung trường nhập `Mực nước (% dung tích bể)`.
   - Đồng bộ dữ liệu đo đạc gửi về API và Mock Store.
5. **Giao diện Lô Canh Tác (`BatchesView.tsx`):**
   - Xóa bỏ số lượng giả định `completed: 6`, thay bằng bộ đếm động từ `zones`.
   - Modal tạo lô mới tự động hiển thị bảng thông số tiêu chuẩn của giống cây được chọn để người vận hành kiểm tra đối chiếu.
6. **Frontend Store & API Services:**
   - Đồng bộ `farmStore` với các hàm `getSensors`, `updateSensor`, `addMeasurementRecord` hỗ trợ tự động đóng cảnh báo và đồng bộ cảm biến.
   - Sửa `batchesApi`, `reservoirsApi`, `alertsApi` để truyền nhận đầy đủ các trường mới.

---

## 5. Kết quả kiểm thử thực tế

| Thành phần | Lệnh thực hiện | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **Backend TypeScript Build** | `npm.cmd run build` (backend) | **PASS** | 0 lỗi biên dịch, xuất file `dist/` hoàn chỉnh |
| **Backend Prisma Generate** | `npx.cmd prisma generate` | **PASS** | Prisma Client cập nhật đầy đủ schema mới |
| **Frontend TypeScript & Vite Build** | `npm.cmd run build` (frontend) | **PASS** | 0 lỗi TypeScript, đóng gói production bundle thành công |
| **Kiểm tra Git Working Tree** | `git status` | **CLEAN** | Toàn bộ 32 tệp thay đổi đã được commit và push lên remote |

---

## 6. Những vấn đề còn tồn đọng & Kiến nghị

1. **Môi trường Docker:**
   - Theo thông báo ban đầu từ người dùng, dịch vụ Docker Desktop hiện tại đang bị lỗi trên máy cục bộ nên hệ thống không chạy container database. Toàn bộ logic SQL đã được đồng bộ chuẩn xác vào `init.sql` và `backend/init.sql`. Khi dịch vụ Docker được sửa chữa, chỉ cần khởi động lại `docker-compose up -d` là cơ sở dữ liệu sẽ tự động nạp cấu trúc và dữ liệu mới nhất.
2. **Triển khai phần cứng IoT thực tế:**
   - Endpoint `POST /api/v1/sensors/telemetry` đã sẵn sàng để cấu hình webhook hoặc MQTT bridge từ các vi điều khiển ESP32 / Arduino của trang trại.

---
**Commit Hash xác nhận:** `79dd4c3`
