# Changelog — Cập nhật trực quan hóa Frontend

## Ngày: 11/09/2026

### Đã hoàn thành 3 cải tiến chính

---

## 1️⃣ Alert Lifecycle — Vòng đời cảnh báo đầy đủ

### Trước đây
- Alert chỉ có 2 trạng thái: `resolved: true/false`
- Không biết ai xử lý, khi nào tiếp nhận, khi nào giải quyết
- Chỉ có nút "Đánh dấu đã xử lý" đơn giản

### Bây giờ
```typescript
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'escalated';

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;           // ← MỚI
  metric: AlertMetric;
  title: string;
  message: string;
  reservoirId?: string;
  batchId?: string;
  resolved: boolean;              // deprecated, giữ để backward compat
  suggestedAction: string;
  assignedTo?: string;            // ← MỚI: Người được giao xử lý
  acknowledgedBy?: string;        // ← MỚI: Người tiếp nhận
  acknowledgedAt?: string;        // ← MỚI: Thời điểm tiếp nhận
  resolvedBy?: string;            // ← MỚI: Người giải quyết
  resolvedAt?: string;
  escalatedTo?: string;           // ← MỚI: Người được leo thang
  escalatedAt?: string;           // ← MỚI
  resolutionNote?: string;        // ← MỚI: Ghi chú hành động đã làm
}
```

### UI mới trong AlertsView.tsx

#### 1. Summary KPI Cards
```
┌────────────────┬─────────────────┬──────────────────┐
│ Chưa xử lý: 1  │ Đã tiếp nhận: 1 │ Đã giải quyết: 1 │
└────────────────┴─────────────────┴──────────────────┘
```

#### 2. Alert card với lifecycle timeline
```
🔴 pH | [OPEN] Chưa xử lý
pH quá thấp (5.2) tại Bể 01

Cách xử lý: Bổ sung dung dịch kiềm pH Up...
👤 Phụ trách: Kỹ sư Nông nghiệp

Timeline:
  ●────────○────────○
  Tạo    Tiếp nhận  Giải quyết
  10:15

[Tiếp nhận xử lý] [Đánh dấu đã giải quyết]
```

#### 3. Resolution flow với ghi chú
Khi click "Đánh dấu đã giải quyết":
- Hiện input box để nhập ghi chú hành động
- Lưu người giải quyết + thời gian + ghi chú
- Hiển thị trong lịch sử: "Đã bật thêm máy sục khí dự phòng và châm 50L nước mát. DO trở về 6.8 mg/L sau 45 phút."

---

## 2️⃣ Reservoir ↔ Channel ↔ Batch — Quan hệ rõ ràng

### Vấn đề trước đây
```typescript
// Batch có field:
reservoirId: 'res-01'  // ← Gắn cứng 1-1, không linh hoạt
```

❌ Không mô tả được:
- 1 bể nuôi nhiều lô (nhiều máng)
- 1 lô lớn trải trên nhiều máng của nhiều bể
- Máng nào đang trống, máng nào đang trồng

### Giải pháp: Thêm entity Channel

```typescript
export interface Channel {
  id: string;
  name: string;
  reservoirId: string;      // Máng này nối với bể nào
  batchId?: string;         // Máng này đang trồng lô nào (nullable nếu trống)
  slotCount: number;        // Số vị trí trồng
  activePlants: number;     // Số cây đang trên máng
  status: 'active' | 'empty' | 'maintenance';
  notes?: string;
}
```

Quan hệ:
```
Reservoir 01
  ├── Máng A1  →  Batch LET-001  (162 cây / 100 slot)
  ├── Máng A2  →  Batch LET-001  (160 cây / 100 slot)
  ├── Máng A3  →  Batch LET-001  (160 cây / 100 slot)
  ├── Máng A4  →  Batch LET-001  (160 cây / 100 slot)
  ├── Máng A5  →  Batch LET-002  (248 cây / 100 slot)
  └── Máng A6  →  Batch LET-002  (247 cây / 100 slot)
```

### UI mới trong ReservoirsView.tsx

#### Tab "Máng trồng (Channel)"
```
┌─ Máng trồng của Bể Tuần Hoàn 01 ─────────────────────┐
│  6 máng đang hoạt động                                │
│                                                       │
│ Máng   │ Lô cây      │ Giống       │ Slot │ Cây │ % │
│────────┼─────────────┼─────────────┼──────┼─────┼───│
│ A1     │ LET-2026-001│ Green Oak   │ 100  │ 162 │██│
│ A2     │ LET-2026-001│ Green Oak   │ 100  │ 160 │██│
│ ...                                                   │
│ A6     │ LET-2026-002│ Batavia     │ 100  │ 247 │██│
│                                                       │
│ 📊 Tổng: 600 slot · 1,377 cây · 2 lô đang dùng bể   │
└───────────────────────────────────────────────────────┘
```

---

## 3️⃣ Solution Drain Event — Luồng thay dung dịch

### Vấn đề trước đây
- Không ghi nhận sự kiện xả bể khi kết thúc lô
- Không lưu lý do xả, người thực hiện, trạng thái bể cuối
- Không có truy xuất nguồn gốc

### Giải pháp: Thêm SolutionDrainEvent

```typescript
export interface SolutionDrainEvent {
  id: string;
  reservoirId: string;
  batchId?: string;               // Lô vừa kết thúc
  drainDate: string;
  volumeDrainedLiters: number;
  finalPh: number;                // pH cuối trước khi xả
  finalEc: number;                // EC cuối
  finalDo: number;                // DO cuối
  reason: 'end_of_batch' | 'scheduled_replacement' | 'contamination' | 'other';
  operator: string;               // Người thực hiện
  notes?: string;                 // Trạng thái bể, vệ sinh, ...
}
```

### UI mới trong ReservoirsView.tsx

#### 1. Nút "Xả bể / Thay dung dịch" trong toolbar
```
[Châm thêm nước sạch]  [🗑️ Xả bể / Thay dung dịch]  [+ Ghi nhận số đo mới]
```

#### 2. Modal xả bể
```
┌─ Xả bể và thay dung dịch — Bể Tuần Hoàn 01 ──────────┐
│                                                        │
│ ⚠️  Thao tác này sẽ xả toàn bộ 540L dung dịch hiện    │
│     tại. Đảm bảo đã ghi nhận số đo cuối cùng.         │
│                                                        │
│ ┌─ Số đo cuối cùng ─────────────────────────────┐    │
│ │ pH cuối: 5.85  │ EC cuối: 1.72  │ DO: 6.75    │    │
│ └─────────────────────────────────────────────────┘    │
│                                                        │
│ Lý do xả bể: [Kết thúc lô trồng ▾]                   │
│                                                        │
│ Người thực hiện: [Kỹ sư Nông nghiệp        ]          │
│                                                        │
│ Ghi chú:                                              │
│ ┌──────────────────────────────────────────────┐     │
│ │ Bể sạch, không có cặn. Vệ sinh bằng H2O2    │     │
│ │ 0.5% sau đó xả lại bằng nước sạch.          │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│                         [Hủy]  [Xác nhận xả bể]       │
└────────────────────────────────────────────────────────┘
```

#### 3. Tab "Lịch sử xả bể"
```
┌─ Lịch sử xả bể — Bể Tuần Hoàn 01 ────────────────────┐
│                                                        │
│ ┌ [Kết thúc lô] Xả 580L — 2026-08-15 ──────────┐    │
│ │ pH cuối: 6.1  EC cuối: 1.45  DO cuối: 6.2     │    │
│ │ Thực hiện: Kỹ sư Nguyễn                       │    │
│ │ Bể sạch, không có cặn. Vệ sinh bằng H2O2...   │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ ┌ [Thay định kỳ] Xả 950L — 2026-08-21 ─────────┐    │
│ │ pH cuối: 6.3  EC cuối: 1.38  DO cuối: 5.9     │    │
│ │ Thực hiện: Kỹ sư Trần                         │    │
│ │ Phát hiện cặn trắng nhẹ đáy bể, đã vệ sinh... │    │
│ └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Files đã thay đổi

### Backend (Mock Data & Store)
- `frontend/src/types/farm.ts` — Thêm `AlertStatus`, `Channel`, `SolutionDrainEvent`
- `frontend/src/mock/initialData.ts` — Thêm `INITIAL_CHANNELS`, `INITIAL_DRAIN_EVENTS`, cập nhật `INITIAL_ALERTS`
- `frontend/src/mock/store.ts` — Thêm `acknowledgeAlert()`, `getChannels()`, `getDrainEvents()`, `addDrainEvent()`

### Frontend Views
- `frontend/src/views/AlertsView.tsx` — Viết lại hoàn toàn với lifecycle UI
- `frontend/src/views/ReservoirsView.tsx` — Thêm 3 tabs: Dosing / Channels / History + modal xả bể
- `frontend/src/App.tsx` — Kết nối handlers mới

### Documentation
- `OVERVIEW.md` — Thêm section 10A, 10B, 21A với giải thích chi tiết

---

## 🎯 Demo flow đầy đủ

### Alert Lifecycle
1. Hệ thống tự động tạo alert khi pH < 5.5 → status = **OPEN**, giao cho "Kỹ sư Nông nghiệp"
2. Kỹ sư vào màn Alerts, click **"Tiếp nhận xử lý"** → status = **ACKNOWLEDGED**, lưu thời gian
3. Kỹ sư xử lý xong (châm pH Up), click **"Đánh dấu đã giải quyết"**
4. Nhập ghi chú: "Đã châm 50ml pH Up. pH trở về 5.8 sau 15 phút"
5. Status = **RESOLVED**, hiển thị timeline đầy đủ với 3 bước

### Reservoir → Channel → Batch
1. Vào `/reservoirs`, chọn Bể 01
2. Tab **"Máng trồng"** hiển thị 6 máng:
   - Máng A1-A4: Đang trồng lô LET-2026-001 (Green Oak)
   - Máng A5-A6: Đang trồng lô LET-2026-002 (Batavia)
3. Nhìn ngay thấy: **2 lô đang dùng chung 1 bể**, mỗi lô chiếm bao nhiêu máng

### Xả bể khi kết thúc lô
1. Lô LET-2026-003 thu hoạch xong
2. Vào `/reservoirs`, chọn Bể 02, click **"Xả bể / Thay dung dịch"**
3. Chọn lý do: "Kết thúc lô trồng"
4. Điền ghi chú vệ sinh
5. Xác nhận → Sự kiện được lưu vào tab **"Lịch sử xả bể"**
6. Bể volume reset về 0, sẵn sàng pha lại cho lô mới

---

## ✨ Lợi ích

### Về mặt khoa học
- Phản ánh đúng thực tế vận hành trang trại: 1 bể → nhiều máng → nhiều lô
- Truy xuất nguồn gốc: Biết lô nào dùng dung dịch pha ngày nào, xả khi nào
- Phù hợp với OVERVIEW section 10A, 10B, 21A

### Về mặt trực quan
- UI rõ ràng, dễ hiểu hơn với tab phân chia rõ ràng
- Alert lifecycle giống hệ thống ticketing chuyên nghiệp (Jira, ServiceNow)
- Dữ liệu có tính truy xuất cao — audit trail đầy đủ

### Về mặt demo
- Thể hiện được độ phức tạp của hệ thống quản lý thực tế
- Không còn là CRUD đơn giản, mà là workflow có vòng đời
- Hội đồng sẽ thấy "hệ thống này nghĩ kỹ về quy trình thực tế"

---

## 🚀 Tiếp theo có thể làm

- [ ] Thêm màn quản lý Channel (CRUD máng)
- [ ] Tự động gợi ý leo thang alert nếu không xử lý trong X phút
- [ ] Biểu đồ thống kê: Số lần xả bể / tháng, trung bình pH/EC cuối mỗi lần xả
- [ ] Export Excel: Lịch sử alert lifecycle, Lịch sử xả bể
- [ ] Notification push khi có alert mới (WebSocket / SSE)

---

**Kết luận:** Frontend giờ đã trực quan hóa đúng với kiến trúc đã mô tả trong OVERVIEW.md. Người dùng có thể thấy và tương tác với vòng đời cảnh báo, cấu trúc máng-bể-lô, và luồng thay dung dịch một cách rõ ràng.
