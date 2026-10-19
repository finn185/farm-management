# QUY TRÌNH VẬN HÀNH CHUẨN (SOP): XỬ LÝ SỰ CỐ pH BỂ 02 VƯỢT NGƯỠNG KIỀM
**Dự án:** HydroSmart — Smart Hydroponic Farm Management System with AI Yield Prediction  
**Mã sự cố đối chiếu:** `alt-02` (Hệ thống Alert Engine)  
**Khu vực ảnh hưởng:** Bể Tuần Hoàn 02 (Tầng 2) • Lô xà lách Romaine `LET-2026-003` (Giàn NFT B2)  
**Mức độ nghiêm trọng:** 🔴 **Nghiêm trọng (Critical)**  
**Ngày ban hành:** 19/10/2026  

---

## 1. THÔNG TIN SỰ CỐ & CẢNH BÁO HỆ THỐNG

| Thuộc tính | Chi tiết ghi nhận từ hệ thống |
|---|---|
| **Tiêu đề cảnh báo** | `pH bể 02 vượt ngưỡng kiềm` |
| **Thông báo chi tiết** | `pH đo được 6.75 cao hơn ngưỡng tối ưu (5.5 - 6.0) cho giống Romaine lô LET-2026-003 giàn B2.` |
| **Giá trị đo thực tế (`actualValue`)** | **`6.75 pH`** |
| **Ngưỡng chuẩn tối ưu (`thresholdValue`)** | **`5.50 - 6.00 pH`** (Ngưỡng cảnh báo trần: `6.50 pH`) |
| **Chỉ số vi phạm (`metric`)** | `pH` |
| **Người được phân công (`assignedTo`)** | Kỹ sư Nông nghiệp / Quản lý Trang trại |

---

## 2. PHÂN TÍCH BẢN CHẤT NÔNG HỌC & NGUY CƠ CANH TÁC

### 2.1. Cơ chế hóa lý trong dung dịch thủy canh
* Giống xà lách **Romaine (*Lactuca sativa* L. var. *longifolia*)** sinh trưởng tối ưu nhất ở dải pH **5.5 – 6.0**.
* Khi pH tăng vọt lên **6.75** (chuyển sang môi trường kiềm hóa nhẹ đến trung tính):
  1. **Khóa hấp thu vi lượng:** Ion Sắt chelate ($Fe\text{-EDTA}$) và các ion vi lượng tự do ($Mn^{2+}, Zn^{2+}, Cu^{2+}$) bị kết tủa thành các hydroxide không tan $\left(Fe(OH)_3, Zn(OH)_2\right)$, rễ cây hoàn toàn không thể hấp thụ.
  2. **Suy giảm hấp thu Phốt pho:** Dạng ion $H_2PO_4^-$ chuyển hóa thành $HPO_4^{2-}$ có tốc độ hấp thụ qua màng tế bào rễ chậm hơn đáng kể.
  3. **Biểu hiện lâm sàng:** Sau 24 – 48 giờ phơi nhiễm pH cao, lá non ở ngọn bắt đầu xuất hiện triệu chứng **úa vàng gân lá (*iron chlorosis*)**, mô lá mỏng yếu, giảm hiệu suất quang hợp.
  4. **Tác động đến AI Dự báo Năng suất:** Năng suất sinh khối tươi ($g/\text{cây}$) tại ngày thu hoạch sẽ sụt giảm từ 15% – 25% nếu không can thiệp kịp thời trong vòng 6 giờ kể từ khi kích hoạt cảnh báo.

---

## 3. QUY TRÌNH CAN THIỆP THỰC ĐỊA (FIELD SOP)

Kỹ sư nông học tại nhà màng thực hiện can thiệp theo 4 bước an toàn nghiêm ngặt:

```
[Bước 1: Chuẩn bị hóa chất] ──► [Bước 2: Pha loãng an toàn] ──► [Bước 3: Châm dung dịch] ──► [Bước 4: Kiểm tra ổn định]
```

### Bước 1: Chuẩn bị hóa chất điều chỉnh
* Sử dụng dung dịch **pH Down** chuẩn chuyên dụng cho nông nghiệp thủy canh:
  * Khuyến nghị: Axit Phosphoric ($H_3PO_4$ nồng độ thực phẩm 10%) hoặc Axit Nitric ($HNO_3$ 10% loãng).
  * Định lượng cho Bể 02 (thể tích bồn hiện tại $\approx 500\text{ L}$): **Khoảng $150\text{ ml}$ dung dịch $H_3PO_4$ 10%** để hạ $0.95\text{ đơn vị pH}$ (đưa từ $6.75$ về $\approx 5.8$).

### Bước 2: Pha loãng an toàn (Chống sốc pH rễ)
* ⚠️ **CẢNH BÁO AN TOÀN NÔNG HỌC:** Tuyệt đối không đổ trực tiếp $150\text{ ml}$ axit đậm đặc vào bể chứa vì sẽ gây biến thiên pH cục bộ cực đoan, làm "cháy" đầu lông hút của rễ cây khi nước chảy qua giàn NFT.
* **Thao tác chuẩn:** Rót $150\text{ ml}$ pH Down vào một xô chứa **$5 - 10\text{ L}$ nước sạch**, khuấy đều để phân tán nồng độ.

### Bước 3: Châm dung dịch vào bể tuần hoàn
* Đổ từ từ xô dung dịch đã pha loãng vào bồn Bể 02 ngay tại **vị trí cửa hút của máy bơm tuần hoàn**.
* Dòng chảy bơm tuần hoàn sẽ nhanh chóng hòa trộn axit đều khắp toàn bộ thể tích bồn nước và các máng trồng.

### Bước 4: Chạy tuần hoàn & Đo đạc kiểm chứng
* Bật máy sục khí oxy và giữ máy bơm tuần hoàn chạy liên tục trong **$15 - 20\text{ phút}$**.
* Dùng bút đo pH đã hiệu chuẩn lấy mẫu nước tại bể và cuối máng NFT giàn B2:
  * **Chỉ số mục tiêu:** **$5.60 - 5.80\text{ pH}$** $\rightarrow$ Can thiệp thành công.
  * Nếu pH $> 6.2$: Châm bổ sung thêm $30 - 50\text{ ml}$ pH Down pha loãng.
  * Nếu lỡ châm quá tay pH $< 5.3$: Châm bù dung dịch kiềm nhẹ **pH Up** ($KOH$ 10%) để cân bằng lại.

---

## 4. QUY TRÌNH THAO TÁC TRÊN PHẦN MỀM HYDROSMART

Kỹ sư có thể hoàn tất quy trình trên giao diện Web theo một trong hai cách dưới đây:

### 🟢 Cách 1: Quy trình tự động qua "Ghi nhận số đo Bể" (`/reservoirs`) — *Khuyên dùng*

Hệ thống HydroSmart tích hợp cơ chế tự động khôi phục (**Auto-Resolution Engine**):

1. **Truy cập nhanh:** Trên thanh cảnh báo đỏ ở trang chủ Dashboard, bấm nút màu xanh **"Xử lý ngay →"** (hệ thống sẽ tự động điều hướng sang màn hình *Quản lý Bể & Dinh dưỡng*).
2. **Chọn bồn xử lý:** Chọn tab **"Bể Tuần Hoàn 02"**.
3. **Mở form đo đạc:** Bấm nút **"Ghi nhận số đo"** (hoặc biểu tượng cây đo chất lượng nước).
4. **Nhập thông số thực tế sau can thiệp:**
   * **Độ pH:** `5.80` *(nằm trong dải tối ưu 5.50 - 6.00)*
   * **Độ dẫn điện EC:** `1.70` mS/cm
   * **Nhiệt độ nước:** `22.5` °C
   * **Mực nước bể:** `90` %
   * **Người thực hiện:** `Kỹ sư Nông nghiệp`
5. **Lưu dữ liệu:** Bấm nút **"Lưu số đo"**.
6. **Kết quả:**
   * Backend / Mock Store kích hoạt `AlertEngineService`.
   * Phát hiện chỉ số pH đã về dải an toàn, hệ thống **tự động đóng (auto-resolve)** cảnh báo `alt-02` với lý do: *"Chỉ số pH đã ổn định trở lại (5.8 pH)"*.
   * Dải banner đỏ trên Dashboard biến mất, trả lại trạng thái an toàn xanh.

---

### 🟡 Cách 2: Quy trình quản lý sự cố tại "Trung tâm Cảnh báo" (`/alerts`)

Phục vụ lưu trữ hồ sơ ca trực và bàn giao công việc:

1. **Truy cập:** Trên thanh cảnh báo đỏ ở Dashboard, bấm nút **"Xem (2)"** (hoặc chọn menu **Cảnh báo** bên thanh điều hướng).
2. **Tìm sự cố:** Xác định thẻ sự cố có tiêu đề **"pH bể 02 vượt ngưỡng kiềm"**.
3. **Bước 1 — Tiếp nhận sự cố (`Acknowledge`):**
   * Bấm nút **"Tiếp nhận"**.
   * Hệ thống cập nhật trạng thái sang **Đang xử lý** (màu vàng), hiển thị tên kỹ sư nhận ca và thời điểm tiếp nhận.
4. **Bước 2 — Giải quyết sự cố (`Resolve`):**
   * Bấm nút **"Xử lý"** ngay tại hàng sự cố.
   * Hệ thống tự động ghi nhận danh tính kỹ sư đang đăng nhập (ví dụ: `Lê Thị Kỹ Sư Nông Học`).
   * **Nhập số đo mới:** Hệ thống cung cấp sẵn ô nhập số đo sau xử lý (ví dụ: `Số đo pH mới: 5.80`).
   * **Nhập nội dung ghi chú can thiệp:**
     > *"Đã pha loãng 150ml axit Phosphoric, ghi nhận số đo mới 5.8"*
   * Bấm **"Lưu kết quả"**.
5. **Kết quả:**
   * Trạng thái cảnh báo chuyển sang **Đã xong (`resolved`)** với huy hiệu xanh lá.
   * Danh tính kỹ sư phụ trách được lưu chính xác theo tài khoản đăng nhập (ví dụ: `Lê Thị Kỹ Sư Nông Học`).
   * **Đồng bộ tự động 2 chiều:** Số đo mới (`5.80 pH`) được tự động cập nhật ngay lập tức vào **Bể Tuần Hoàn 02** và ghi nhận vào lịch sử đo chất lượng nước mà kỹ sư không cần phải qua trang Bể để nhập lại lần hai.
   * Bản ghi được lưu trữ đầy đủ phục vụ truy xuất nhật ký VietGAP và báo cáo kỹ thuật.

---

## 5. BẢNG ĐỐI SOÁT CÁC NGƯỠNG LÝ HÓA CHUẨN CỦA HỆ THỐNG

| Chỉ số | Dải an toàn khuyến nghị | Ngưỡng Cảnh báo (`WARNING`) | Ngưỡng Khẩn cấp (`CRITICAL` / `EMERGENCY`) | Hành động can thiệp chuẩn |
|---|:---:|:---:|:---:|---|
| **Độ pH** | **5.5 – 6.2** | $< 5.5$ hoặc $> 6.5$ | $< 4.8$ hoặc $> 7.5$ | Châm $H_3PO_4$ (hạ pH) hoặc $KOH$ (nâng pH) loãng |
| **Độ dẫn điện EC** | **1.4 – 2.0** mS/cm | $< 1.3$ hoặc $> 2.0$ | $< 0.8$ hoặc $> 2.6$ | Châm Stock A + B (nếu loãng) hoặc bù nước sạch (nếu đậm) |
| **Nhiệt độ nước** | **18.0 – 24.0** °C | $> 24.0$ °C | **$> 24.5$ °C** (Critical)<br>**$\ge 28.0$ °C** (Emergency) | Bật máy làm lạnh Chiller, che lưới giảm nhiệt, sục khí Venturi tối đa |
| **Oxy hòa tan (DO)**| **$> 6.0$** mg/L | $< 5.5$ mg/L | **$< 4.5$ mg/L** | Bật sục khí khẩn cấp, ngăn chặn ngạt rễ yếm khí |
| **Mực nước bể** | **$> 60$** % | $< 40$ % | **$< 20$ %** | Bơm nước sạch bổ sung khẩn cấp tránh cháy bơm chìm |
