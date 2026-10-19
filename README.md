# HydroSmart — Hệ Thống Quản Lý Thủy Canh Thông Minh & AI Dự Báo Năng Suất
> *Smart Hydroponic Farm Management System with AI-based Yield Prediction*

Hệ thống phần mềm quản lý trang trại thủy canh hồi lưu NFT (*Nutrient Film Technique*) chuyên canh rau xà lách, tích hợp mô hình Machine Learning dự báo năng suất sinh khối và hỗ trợ kỹ sư nông nghiệp giám sát dinh dưỡng chính xác.

---

> 📖 **Tài liệu đặc tả chi tiết nghiệp vụ, công thức nông học & kiến trúc hệ thống:**  
> Vui lòng xem tại 👉 **[OVERVIEW.md](./OVERVIEW.md)**

---

## ⚡ Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### 1. Yêu cầu môi trường (Prerequisites)
- **Node.js**: Phiên bản `>= 18.0.0` (Khuyến nghị Node 20 LTS hoặc 22)
- **Trình quản lý gói**: `npm` (có sẵn khi cài Node.js) hoặc `pnpm` / `yarn`
- **Trình duyệt**: Google Chrome, Microsoft Edge, Safari, Firefox

### 2. Cài đặt và chạy ứng dụng

#### Bước 1: Mở terminal tại thư mục dự án và vào thư mục frontend:
```bash
cd frontend
```

#### Bước 2: Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

#### Bước 3: Khởi chạy máy chủ phát triển (Dev Server):
```bash
npm run dev
```
Sau khi chạy, terminal sẽ hiển thị địa chỉ truy cập cục bộ:
```text
  VITE v8.x.x  ready in ~250 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```
👉 Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

#### Bước 4: Đóng gói và chạy thử bản Production (Tùy chọn):
```bash
# Kiểm tra TypeScript và đóng gói tối ưu ra dist/
npm run build

# Chạy thử bản production vừa build
npm run preview
```

---

## 🧭 Bản Đồ Chức Năng & Đường Dẫn Trực Tiếp (Routes)

Ứng dụng hỗ trợ liên kết trực tiếp (deep-linking) tới từng phân hệ qua URL:

| Đường dẫn (Route) | Phân hệ chức năng | Mô tả ngắn gọn |
|---|---|---|
| **[`/dashboard`](http://localhost:5173/dashboard)** | **Bảng điều khiển trung tâm** | Giám sát nhanh các bồn tuần hoàn NFT, lô cây đang trồng, sự cố khẩn cấp và biểu đồ tăng trưởng. |
| **[`/reservoirs`](http://localhost:5173/reservoirs)** | **Quản lý Bể & Dinh dưỡng** | Giám sát pH, EC, nhiệt độ Bể Tuần Hoàn 01 & 02; công cụ tính toán châm phân mẹ Stock A/B và công thức pha 10L mẹ ở kho. |
| **[`/batches`](http://localhost:5173/batches)** | **Theo dõi Lô Cây trồng** | Quản lý vòng đời (Gieo hạt → Cây con → NFT Sinh trưởng → Thu hoạch), ghi nhận nhật ký đo đạc sinh trắc học và tạo lô mới. |
| **[`/forecast`](http://localhost:5173/forecast)** | **AI Dự báo Năng suất** | Dự đoán trọng lượng (g/cây) và sản lượng (kg/lô), phân tích mức độ tác động của các yếu tố (EC, pH, lá thật), chế độ thử nghiệm What-If. |
| **[`/alerts`](http://localhost:5173/alerts)** | **Trung tâm Cảnh báo** | Giám sát các sự cố nồng độ EC tụt, pH lệch ngưỡng, sốc nhiệt nước kèm quy trình xử lý từng bước. |
| **[`/harvest`](http://localhost:5173/harvest)** | **Nhật ký & So sánh Thu hoạch** | Thống kê sản lượng thực tế, đối chiếu sai số với dự báo AI và theo dõi tỷ lệ rau đạt tiêu chuẩn loại 1. |

---

## 🛠️ Công Nghệ Phát Triển (Tech Stack)

- **Frontend Core**: React 19, TypeScript, Vite
- **Routing**: React Router DOM v7 (Hỗ trợ URL deep-link cho từng màn hình)
- **Trực quan hóa dữ liệu**: Recharts (Biểu đồ tăng trưởng, phân tích tương quan)
- **Hệ thống Icon**: Lucide React
- **Thiết kế UI**: Vanilla CSS Design System theo phong cách SaaS tối giản, trực quan, thân thiện cho kỹ sư trang trại và nhà quản lý.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Repository Structure)

```text
farm-management/
├── .gitignore             # Cấu hình bỏ qua node_modules, dist, logs, env
├── README.md              # Tài liệu hướng dẫn cài đặt & khởi chạy (File này)
├── OVERVIEW.md            # Tài liệu phân tích nghiệp vụ, dinh dưỡng & kiến trúc đề tài
├── documents/             # Tài liệu FRS v1.0 & Báo cáo đối chiếu hệ thống
├── ai_service/            # Module Python Machine Learning & REST API
│   ├── Cleaned_Data_Batches_Final.csv # Dữ liệu canh tác thực tế từ các lô xà lách
│   ├── train_models.py    # Huấn luyện RandomForest (R² = 0.967) & IsolationForest Anomaly
│   ├── api.py             # FastAPI REST Server cho dự báo & phát hiện bất thường
│   └── requirements.txt   # Thư viện Python (scikit-learn, fastapi, pandas...)
└── frontend/              # Ứng dụng Web Frontend React + Vite
    ├── src/
    │   ├── components/    # Header, Sidebar, LifecycleProgressBar, Tooltips
    │   ├── mock/          # Dữ liệu mẫu khởi tạo & LocalStorage Store
    │   ├── services/      # Logic AI dự báo & kết nối API
    │   ├── styles/        # CSS Tokens & giao diện Clean SaaS
    │   ├── types/         # TypeScript types (Farm, Batch, Reservoir...)
    │   └── views/         # 6 Màn hình chức năng chính
    ├── package.json
    └── vite.config.ts
```

---

## 🤖 Bản Chất Ứng Dụng AI Trong Dự Án

1. **Dự báo trước sản lượng thu hoạch ($kg$):**  
   Nhìn nhận tình trạng cây hôm nay (ngày tuổi, số lá thật, chiều cao, nồng độ phân bón EC, pH, nhiệt độ nước) để dự báo chính xác khối lượng búp tươi ($g/\text{cây}$) và tổng sản lượng cả lô ($kg$) tại ngày thu hoạch $\rightarrow$ Kỹ sư và người quản lý chủ động ký kết hợp đồng xuất bán với siêu thị, loại bỏ rủi ro thiếu hụt hoặc dư thừa rau.

2. **Chỉ đúng nguyên nhân và khuyến nghị xử lý (Explainable AI - XAI):**  
   Khi cây sinh trưởng chậm hoặc năng suất dự báo sụt giảm, AI bóc tách tỷ trọng đóng góp của từng chỉ số (chuẩn hóa 100%) để chỉ đích danh nguyên nhân (ví dụ: do sốc nhiệt nước bồn $>24.5^\circ\text{C}$, hay do lệch pH khóa chất) $\rightarrow$ Ngăn ngừa tình trạng kỹ sư đoán mò đổ thêm phân bón làm ngộ độc rễ và chết giàn rau.