# SMART HYDROPONIC FARM MANAGEMENT SYSTEM
## Tài liệu tổng quan đầy đủ để bắt đầu dự án

> **Tên đề tài đề xuất:**  
> **Phần mềm Quản lý Trang trại Thủy canh Thông minh tích hợp Big Data và AI dự báo năng suất**  
> **English:** *Smart Hydroponic Farm Management System with Big Data Analytics and AI-based Yield Prediction*

---

# 1. Đề tài làm gì?

Xây dựng một **phần mềm quản lý trang trại thủy canh** giúp người quản lý và kỹ sư nông nghiệp theo dõi toàn bộ quá trình:

**Cây trồng → Hệ thống thủy canh → Nước → Dinh dưỡng → Môi trường → Sinh trưởng → Thu hoạch → AI dự báo**

Hệ thống **không bắt buộc xử lý IoT real-time**. Dữ liệu có thể được:

- nhập thủ công;
- import Excel/CSV;
- lấy từ dataset lịch sử;
- hoặc mở rộng kết nối cảm biến sau này.

Phần Big Data sử dụng dữ liệu lịch sử để làm sạch, phân tích và huấn luyện Machine Learning. Model sau đó được đóng gói thành API để Web/Mobile sử dụng.

### Cây AI thí điểm

Nên chọn:

**Xà lách thủy canh (*Lactuca sativa*)**

Lý do:

- rất phổ biến trong NFT/DWC;
- chu kỳ trồng tương đối ngắn;
- có nhiều nghiên cứu và dataset;
- năng suất dễ định nghĩa bằng `g/cây`, `kg/lô`, `kg/m²`.

> Phần mềm có thể quản lý nhiều loại cây, nhưng AI ban đầu chỉ nên train cho một cây/nhóm dữ liệu đồng nhất.

---

# 2. Hai hệ thống thủy canh chính

## 2.1. NFT – Nutrient Film Technique

Dung dịch dinh dưỡng được bơm từ bể chứa qua các máng trồng thành một lớp dung dịch mỏng rồi quay trở lại bể.

Hệ thống cần quản lý:

- Reservoir – bể dung dịch
- Pump – máy bơm
- Channel – máng trồng
- Flow/tuần hoàn dung dịch
- Số vị trí trồng
- Lô cây nằm trên từng máng
- pH, EC, nhiệt độ dung dịch
- Lịch vệ sinh/bảo trì

NFT rất phù hợp với xà lách và rau ăn lá.

## 2.2. DWC – Deep Water Culture

Rễ cây tiếp xúc trực tiếp với một thể tích dung dịch dinh dưỡng lớn; thường sử dụng raft/bè nổi.

Hệ thống cần quản lý:

- Bể DWC
- Thể tích/mực nước
- Raft
- Air pump / hệ thống sục khí
- pH
- EC
- Nhiệt độ dung dịch
- Lô cây

> Với DWC, rễ cây tiếp xúc trực tiếp với dung dịch nên việc kiểm soát thể tích, pH, EC và nhiệt độ dung dịch là rất quan trọng.

---

# 3. Chất dinh dưỡng phải biết

Thực vật có **17 nguyên tố dinh dưỡng thiết yếu**.

C, H, O chủ yếu đến từ không khí và nước. Trong hệ thống thủy canh cần đặc biệt quan tâm các nguyên tố khoáng sau:

## 3.1. Đa lượng

| Ký hiệu | Tên | Vai trò tổng quát |
|---|---|---|
| N | Nitrogen | Sinh trưởng, protein, diệp lục |
| P | Phosphorus | Chuyển hóa năng lượng, ATP |
| K | Potassium | Điều hòa nước, hoạt hóa enzyme |
| Ca | Calcium | Thành tế bào, mô non |
| Mg | Magnesium | Thành phần của chlorophyll |
| S | Sulfur | Amino acid và protein |

## 3.2. Vi lượng

| Ký hiệu | Tên |
|---|---|
| Fe | Iron |
| Mn | Manganese |
| Zn | Zinc |
| B | Boron |
| Cu | Copper |
| Mo | Molybdenum |
| Cl | Chloride |
| Ni | Nickel |

### Nitrogen có thể tồn tại ở nhiều dạng

Nếu làm sâu hơn có thể lưu:

- `NO3-N` – nitrate nitrogen
- `NH4-N` – ammonium nitrogen
- `Total N`

### Lưu ý cực kỳ quan trọng

**Không được coi thủy canh chỉ có N-P-K.**

Ca, Mg, S và vi lượng cũng rất quan trọng.

---

# 4. Dung dịch dinh dưỡng

Phần mềm nên quản lý **công thức dung dịch**, không chỉ lưu một con số N-P-K.

Ví dụ các nguồn phân thường gặp:

- Calcium nitrate
- Potassium nitrate
- Monopotassium phosphate (MKP)
- Magnesium sulfate
- Potassium sulfate
- Iron chelate
- Micronutrient mix

## 4.1. Nutrient Formula

Một công thức nên có:

- tên công thức;
- cây áp dụng;
- giai đoạn áp dụng;
- thành phần;
- nồng độ/mức mục tiêu;
- ghi chú.

## 4.2. Stock A / Stock B

Dung dịch đậm đặc thường được chia thành nhiều stock để tránh các chất không tương thích kết tủa khi để ở nồng độ cao.

Phần mềm nên hỗ trợ:

- Stock A
- Stock B
- thành phần mỗi stock
- nồng độ
- ngày pha
- hạn sử dụng
- lượng đã sử dụng

> Không hard-code một công thức A/B duy nhất vì công thức phụ thuộc sản phẩm và quy trình thực tế.

---

# 5. Các chỉ số nước và dung dịch quan trọng

## 5.1. pH

pH ảnh hưởng đến khả năng hòa tan và hấp thu dinh dưỡng.

Cần lưu:

- pH hiện tại
- target min/max
- thời điểm đo
- người/thiết bị đo
- lịch sử pH

Với nhiều loại rau ăn lá trong NFT/DWC, tài liệu Virginia Tech đưa ra vùng tham khảo khoảng:

**pH 5.5 – 6.2**

Đây chỉ là **giá trị tham khảo**, không được hard-code cho mọi cây.

---

## 5.2. EC – Electrical Conductivity

Đơn vị thường dùng:

**mS/cm** hoặc **dS/m**

EC cho biết khả năng dẫn điện của dung dịch và được dùng như chỉ báo cho **tổng lượng ion hòa tan**.

Cần lưu:

- EC hiện tại
- target min/max
- thời điểm đo
- lịch sử EC

Rau ăn lá thường có thể hoạt động tốt quanh:

**EC 1.2 – 2.0 mS/cm**

theo tài liệu Virginia Tech.

### Cực kỳ quan trọng

**EC không cho biết riêng N, P, K, Ca hay Mg.**

Sai:

> EC thấp → chắc chắn thiếu Nitrogen.

Đúng:

> EC thấp → tổng nồng độ ion/dinh dưỡng hòa tan đang thấp hơn mức mục tiêu → cần kiểm tra dung dịch.

Muốn biết từng nguyên tố phải dựa vào công thức pha, lịch bổ sung, phân tích dung dịch hoặc thiết bị đo ion riêng.

---

## 5.3. Nhiệt độ dung dịch

Lưu:

- water temperature
- min/max/target
- timestamp

Nhiệt độ ảnh hưởng đến:

- hệ rễ;
- khả năng giữ oxy của nước;
- hấp thu dinh dưỡng;
- điều kiện sinh học vùng rễ.

---

# 6. Chất lượng nguồn nước

Trước khi pha dinh dưỡng phải biết chất lượng nước đầu vào.

Tối thiểu nên quản lý:

- pH
- EC
- **Alkalinity**
- Ca
- Mg
- Na
- Chloride
- Sulfate
- Boron
- Fe
- Mn

Có thể lưu theo dạng **Water Test / Laboratory Analysis**, không cần nhập mỗi ngày.

## Alkalinity

Đơn vị thường dùng:

**mg/L CaCO3**

Alkalinity là khả năng nước trung hòa acid và ảnh hưởng mạnh đến việc điều chỉnh pH.

> **Alkalinity không phải pH.**

Hai nguồn nước có cùng pH vẫn có thể cần lượng acid điều chỉnh rất khác nếu alkalinity khác nhau.

---

# 7. Môi trường không khí

Các thông số chính:

## Bắt buộc

- Air Temperature – °C
- Relative Humidity – %

## Nên có

- CO₂ – ppm
- PPFD – µmol/m²/s
- DLI – mol/m²/day
- Photoperiod – giờ chiếu sáng/ngày

## Có thể tính

### VPD – Vapor Pressure Deficit

VPD có thể tính từ:

**Nhiệt độ + Độ ẩm tương đối**

Không nhất thiết cần cảm biến VPD riêng.

### Ánh sáng

Ưu tiên **PPFD/DLI** hơn Lux nếu muốn mô tả ánh sáng phục vụ quang hợp.

Virginia Tech đưa ra DLI khoảng **17 mol/m²/day** như một giá trị tham khảo cho lettuce, nhưng vẫn phải xem giống và điều kiện cụ thể.

---

# 8. Cây trồng và giống

Không nên chỉ có:

`Crop = Lettuce`

Nên lưu:

- Crop
- Scientific name
- Cultivar / Variety
- Crop category
- Thời gian sinh trưởng dự kiến
- Khối lượng thu hoạch mục tiêu
- Điều kiện khuyến nghị

Ví dụ:

```text
Crop: Lettuce
Scientific name: Lactuca sativa
Cultivar: Green Oak
```

**Cultivar quan trọng** vì các giống cùng loài vẫn có tốc độ và đặc tính sinh trưởng khác nhau.

---

# 9. Giai đoạn sinh trưởng

Có thể chia đơn giản:

1. Seed
2. Germination
3. Seedling
4. Transplant
5. Vegetative/Growing
6. Pre-harvest
7. Harvest

Mỗi giai đoạn có thể có yêu cầu riêng:

- pH
- EC
- nhiệt độ
- độ ẩm
- ánh sáng
- công thức dinh dưỡng

Do đó nên thiết kế:

`Crop → Cultivar → Growth Stage → Requirements`

---

# 10. Crop Batch – Lô trồng

**Lô trồng là entity trung tâm của hệ thống.**

Ví dụ:

```text
Batch: LET-2026-001
Crop: Lettuce
Cultivar: Green Oak
System: NFT
Plant quantity: 500
Seed date: 01/09/2026
Expected harvest: 05/10/2026
Status: Growing
```

Cần lưu:

- mã lô
- cây
- giống
- ngày gieo
- ngày chuyển cây
- ngày dự kiến thu hoạch
- ngày thu hoạch thực tế
- số cây
- diện tích/mật độ
- hệ thống
- growth stage
- trạng thái

> MVP nên quản lý theo **batch/lô**, không cần quản lý từng cây riêng lẻ.

> **Lưu ý quan trọng:** Batch **không** lưu trực tiếp `reservoir_id`. Quan hệ giữa Batch và Reservoir được thể hiện thông qua entity trung gian **Channel (máng trồng)**. Xem chi tiết tại mục 10A.

---

# 10A. Quan hệ Reservoir ↔ Channel ↔ Batch

## Vấn đề nếu gắn trực tiếp Batch → Reservoir

Trong thực tế trang trại NFT, một bể dung dịch bơm nước lên **nhiều máng (channel)** đồng thời. Mỗi máng có thể thuộc các lô cây khác nhau (gieo ngày khác nhau, giống khác nhau). Nếu thiết kế `batch.reservoir_id` trực tiếp:

- Không thể biết bể đang phục vụ bao nhiêu lô.
- Khi đo EC/pH ở bể, không rõ dữ liệu đó áp dụng cho lô nào.
- Không thể mô tả lô lớn trải trên nhiều máng của nhiều bể khác nhau.

## Giải pháp: Thêm entity Channel (Máng trồng)

```text
Reservoir 01
    ├── Channel/Máng 01  →  Batch LET-2026-001  (máng 1)
    ├── Channel/Máng 02  →  Batch LET-2026-001  (máng 2)
    ├── Channel/Máng 03  →  Batch LET-2026-002  (máng 3)
    └── Channel/Máng 04  →  Batch LET-2026-002  (máng 4)

Reservoir 02
    ├── Channel/Máng 05  →  Batch LET-2026-001  (máng 5)
    └── Channel/Máng 06  →  (trống, chưa có lô)
```

## Quan hệ giữa các entity

```text
Reservoir  1 ──────────── nhiều  Channel
Batch      1 ──────────── nhiều  Channel
Channel    nhiều ───────── 1     Reservoir
Channel    nhiều ───────── 1     Batch (hoặc NULL nếu trống)
```

Tóm lại:

- **Reservoir** là nguồn dung dịch vật lý. Đo pH, EC, TDS và nhiệt độ nước (Water Temperature) tại đây.
- **Channel** là máng trồng vật lý. Gắn với 1 Reservoir và 1 Batch tại mỗi thời điểm.
- **Batch** là lô cây logic. Có thể trải trên nhiều Channel, nhiều Reservoir.

## Thông tin Channel cần lưu

- channel_id
- reservoir_id (bể đang cấp dung dịch)
- batch_id (lô đang trồng, nullable)
- channel_position (vị trí máng trong hệ thống)
- slot_count (số vị trí trồng)
- active_plants (số cây đang trên máng)
- status (active / empty / maintenance)
- notes

## Giả định MVP

Nếu trang trại nhỏ và chỉ có 1 bể – 1 lô tại một thời điểm, có thể đơn giản hóa thành quan hệ **1 Reservoir ↔ 1 Batch đang active**. Tuy nhiên phải ghi rõ giả định này trong tài liệu thiết kế để tránh phải refactor khi trang trại mở rộng.

---

# 10B. Luồng thay dung dịch giữa các lô

## Vòng đời dung dịch trong Reservoir

Dung dịch dinh dưỡng trong bể không dùng mãi mãi. Sau một lô hoặc sau một khoảng thời gian nhất định, bể phải được xả, vệ sinh và pha lại. Đây là **sự kiện Solution Replacement** — khác hoàn toàn với việc bổ sung thêm phân (Nutrient Dosing).

## Trạng thái Reservoir theo vòng đời lô

```text
[Bể trống / vừa vệ sinh]
        │
        ▼
[Pha dung dịch mới]  ← NutrientMixingEvent
        │
        ▼
[Đang phục vụ Batch]
        │
        ├── Bổ sung phân ←── NutrientDosingEvent
        ├── Điều chỉnh pH ← PHAdjustmentEvent
        ├── Bổ sung nước ← WaterTopUpEvent
        ├── Lấy mẫu / Lab ← SamplingEvent
        │
        ▼
[Batch kết thúc / thu hoạch]
        │
        ▼
[Xả bể]  ← SolutionDrainEvent
        │
        ▼
[Vệ sinh bể]  ← SanitationEvent
        │
        ▼
[Bể trống / sẵn sàng cho lô tiếp theo]
```

## Dữ liệu bắt buộc lưu khi thay dung dịch

### Khi xả (SolutionDrainEvent)

- reservoir_id
- batch_id đang kết thúc
- drain_date
- volume_drained (lít)
- final_pH / final_EC / final_Water_Temp (đo trước khi xả)
- reason (end_of_batch / scheduled_replacement / contamination / other)
- operator
- notes

### Khi pha lại (NutrientMixingEvent)

- reservoir_id
- batch_id sắp bắt đầu (có thể null nếu chưa gán lô)
- mix_date
- water_volume (lít)
- water_source
- nutrient_formula_id
- stock_a_volume (ml)
- stock_b_volume (ml)
- additional_inputs (các chất bổ sung khác)
- target_pH / target_EC
- final_pH / final_EC (đo sau khi pha xong)
- operator
- notes

## Tại sao quan trọng

Nếu không lưu sự kiện này, hệ thống không thể trả lời:

- Lô LET-2026-003 được bắt đầu với dung dịch pha từ ngày nào?
- Công thức pha có khác lô trước không?
- Bể đã được vệ sinh trước khi pha lại chưa?

Đây là dữ liệu truy xuất nguồn gốc quan trọng nếu sau này muốn giải thích tại sao hai lô cùng giống nhưng năng suất khác nhau.

---

# 11. Reservoir – Bể dung dịch

Nên là entity riêng.

Thông tin:

- Reservoir ID & Tên bể
- Hệ sinh thái/hệ thống cấp (NFT, DWC)
- Dung tích thiết kế (`capacityLiters`)
- Thể tích dung dịch hiện tại (`currentVolumeLiters`) & Tỷ lệ % thể tích
- Công thức dinh dưỡng đang áp dụng (`activeFormula`)
- Chỉ số hiện tại: **pH, EC, Nhiệt độ nước** (bộ 3 chỉ số thiết yếu)
- Trạng thái bơm tuần hoàn (Đang chạy / Tạm dừng)
- Lần châm nước / thay dung dịch gần nhất

Các sự kiện & tính năng vận hành:

- **Dosing Calculator & Xác nhận châm phân**: Tính toán lượng dung dịch mẹ Can A và Can B (ml) cần châm bù dựa trên chênh lệch EC mục tiêu và thể tích bể hiện tại. Hỗ trợ nút **"Xác nhận đã châm phân"** để tự động cập nhật nồng độ EC và thể tích bồn trong hệ thống.
- **Chuyển đổi công thức dinh dưỡng**: Cho phép lựa chọn linh hoạt giữa các công thức dinh dưỡng (Công thức thương mại, Cây con, v.v.), tự động render danh sách chi tiết các muối khoáng thành phần của Can A và Can B.
- **Châm nước bổ sung (Top-up)**: Ghi nhận lượng nước sạch bổ sung và tự động tính toán lại mức pha loãng EC.
- **Ghi nhận số đo chất lượng nước (Manual / Sensor)**: Ghi nhận pH, EC, Nhiệt độ nước với nguồn đo tương ứng.

---

# 12. Lịch sử pha và bổ sung dung dịch

Mỗi lần pha cần lưu:

- Thể tích nước bổ sung (L);
- Nguồn nước sử dụng;
- Công thức dinh dưỡng (`formula`);
- Lượng dung dịch Stock A (ml);
- Lượng dung dịch Stock B (ml);
- Phân/chất bổ sung khác (pH Up / pH Down);
- pH trước / sau xử lý;
- EC trước / sau xử lý;
- Người thực hiện;
- Thời gian ghi nhận.

Hệ thống cung cấp cơ chế tính toán nồng độ châm phân bù EC:
$$\text{Dose (ml per stock)} = \frac{(\text{EC}_{\text{target}} - \text{EC}_{\text{current}}) \times \text{Current Volume (L)}}{0.1} \times 10$$
Kỹ sư sau khi châm dung dịch có thể bấm nút **Xác nhận đã châm phân** để đồng bộ ngay dữ liệu vào bể chứa.

---

# 13. Theo dõi sinh trưởng

Kỹ sư lấy mẫu định kỳ trên lô cây trồng để lưu vào bản ghi **CropObservation**:

Thông số đo đạc thực tế từ chu kỳ canh tác:

- Ngày ghi nhận (`date`);
- Tuổi cây tính từ ngày gieo (`plantAgeDays`);
- Đường kính tán lá định kỳ (`headDiameter` - tính toán theo kích thước tán đo đạc thực tế $a \times b$ cm);
- Số lá thật trung bình (`avgLeafCount`);
- Số lá ban đầu lúc chuyển máng (`initialLeafCount` trích xuất từ dữ liệu Seedling);
- Chiều cao cây ban đầu (`initialHeightCm`);
- Ghi chú sinh lý (`notes` - ví dụ: rễ trắng khỏe, tán phát triển đều).

Dữ liệu `CropObservation` mới nhất được gắn trực tiếp vào lô trồng (`batch.lastObservation`) và kết hợp với dữ liệu chuỗi thời gian lý hóa tích lũy đóng vai trò là feature sinh học quan trọng cho mô hình AI dự báo năng suất.

---

# 14. Theo dõi sức khỏe cây

Có thể ghi nhận:

- Leaf color
- Root color
- Root condition
- Wilting
- Chlorosis
- Necrosis
- Tipburn
- Stunted growth
- Abnormal leaves
- Notes
- Photo

Với xà lách, **tipburn** là một rối loạn sinh lý đáng theo dõi.

---

# 15. Sâu bệnh

Module ghi nhận:

- Pest/Disease
- Ngày phát hiện
- Severity
- Số cây bị ảnh hưởng
- % bị ảnh hưởng
- Diagnosis
- Treatment
- Outcome
- Photo

Ví dụ:

- Pythium/root rot
- Aphids
- Thrips
- Downy mildew

> Chỉ được gọi là **AI Disease Prediction** khi dataset thực sự có nhãn bệnh.  
> Nếu chưa có, chỉ nên làm **Environmental/Condition Risk Warning**.

---

# 16. Vệ sinh và bảo trì

Nên có:

## Sanitation

- vệ sinh reservoir;
- vệ sinh channel;
- vệ sinh DWC tank;
- khử trùng hệ thống;
- vệ sinh dụng cụ;
- vệ sinh/filter cleaning.

## Maintenance

- pump;
- air pump;
- filter;
- lights;
- fan;
- chiller;
- sensor/meter.

Lưu:

- ngày thực hiện;
- người thực hiện;
- thiết bị/khu vực;
- nội dung;
- trạng thái;
- lần bảo trì tiếp theo.

---

# 17. Thiết bị và calibration

Các thiết bị có thể quản lý:

- pH meter
- EC meter
- Temperature sensor
- Humidity sensor
- Light meter
- Pump
- Air pump
- Lighting
- Fan
- Filter
- Chiller

## Calibration

Đặc biệt với pH/EC meter cần lưu:

- device;
- calibration date;
- calibration standard;
- result;
- operator;
- next calibration.

Dữ liệu từ thiết bị không được hiệu chuẩn có thể khiến toàn bộ lịch sử đo thiếu tin cậy.

---

# 18. Thu hoạch

Bắt buộc lưu vì đây là **ground truth cho AI**.

Mỗi bản ghi thu hoạch (`HarvestRecord`) lưu trữ:
- Ngày thu hoạch (`harvestDate`)
- Số cây thu hoạch thực tế (`harvestedPlants`)
- Tổng khối lượng tươi (`totalWeightKg`)
- Khối lượng bình quân mỗi cây (`avgWeightG`)
- Khối lượng loại bỏ / không đạt chuẩn (`rejectedWeightKg`)
- Tỷ lệ hao hụt (`lossPercentage` %)
- Phân hạng chất lượng thương phẩm (`grade`: A, B, C)
- **Dự báo AI đối chứng (`aiPredictedWeightG`)**: Giá trị khối lượng do mô hình AI dự báo tại ngày thu hoạch thực tế.
- **Độ lệch thực tế vs AI (`differencePercent` %)**: Đo lường độ chính xác của mô hình dự báo.

Các KPI cốt lõi:

- `g/plant` (trọng lượng búp tươi trung bình)
- `kg/batch` (sản lượng tổng trên lô)
- `kg/m²` (năng suất trên đơn vị diện tích)

Ví dụ:

```text
Batch: LET-2026-001
Harvested plants: 480 cây
Actual avg weight: 195 g/cây
AI predicted weight: 190 g/cây
Difference: +2.6% (rất sát với thực tế)
Total harvest: 93.6 kg
Grade: A
```

---

# 19. AI của đề tài

## AI 1 – Yield Prediction (AI chính)

### Mục tiêu

Dự báo:

**Fresh weight tại thu hoạch (g/cây)**

Sau đó hệ thống tính:

**Estimated Batch Yield = Predicted Weight × Expected Harvestable Plants**

### Cơ chế thuật toán mô phỏng (Agronomic-Calibrated Simulator)

Mô hình tích hợp nguyên lý nông học thực nghiệm (Frontiers in Plant Science 2022 & Mendeley Dataset):
1. **Đường cong sinh trưởng Sigmoidal theo giống (`Cultivar`)**:
   - Sử dụng `targetCycleDays` (chu kỳ ngày tuổi chuẩn của giống: 35-42 ngày) và `expectedWeightG` (khối lượng thương phẩm mục tiêu: 180-230g).
   - Điểm uốn sinh trưởng tối ưu được thiết lập động: $\text{inflectionDay} = \text{targetCycleDays} \times 0.66$.
2. **Hệ số điều chỉnh hình thái sinh học**:
   - Kết hợp tỷ lệ số lá thật (`leafCount`) và chiều cao cây (`plantHeightCm`) so với ngưỡng chuẩn sinh học theo độ tuổi.
3. **Hệ số phạt/thưởng môi trường dung dịch & vi khí hậu**:
   - Kiểm tra độ lệch nồng độ EC (chuẩn 1.5 - 1.85 mS/cm).
   - Kiểm tra độ pH dung dịch (chuẩn 5.6 - 6.2).
   - Kiểm tra nhiệt độ nước bồn chứa (tối ưu 19 - 23°C; phạt mạnh nếu > 24.5°C do rủi ro thối rễ).
4. **Phân tích đóng góp đặc trưng (`FeatureContribution`)**:
   - Động hóa mức độ quan trọng (%) của từng yếu tố môi trường và sinh học.
   - Chuẩn hóa tổng trọng số của tất cả các đặc trưng đạt chính xác **100%**.

### Feature sử dụng

- Thông tin giống (`cultivarName`: Batavia lettuce, `targetCycleDays`: 30-35 ngày)
- Độ tuổi cây tính theo ngày (`plantAgeDays`)
- Đường kính tán lá trung bình (`avgHeadDiameterCm` trích xuất từ lịch sử đo định kỳ)
- Đặc trưng cây con ban đầu (`initialPlantHeight`, `initialShootLength`, `initialLeafCount`)
- Nồng độ dinh dưỡng dung dịch tích lũy (`avgEc`)
- Độ pH dung dịch tích lũy (`avgPh`)
- Nhiệt độ nước bồn trung bình (`avgWaterTemp`)
- Nhiệt độ không khí trung bình (`avgAirTemp`)
- Độ ẩm không khí trung bình (`avgHumidity`)
- Lượng châm phân mẹ bổ sung (`totalNutrientAB_ml`) và lượng axit cân bằng pH (`totalAcid_ml`)
- Số lượng cây kỳ vọng (`expectedPlants`)

### Output

Ví dụ:

```text
Cultivar: Green Oak Lettuce
Plant age: 28 days
Predicted fresh weight: 192.4 g/plant
Expected harvestable plants: 480
Estimated batch yield: 92.35 kg
Confidence (R²): 0.94
Risk Score: Low
Top feature contribution: Nồng độ EC (28%), Số lá thật (26%), Nhiệt độ nước (22%), Chiều cao (14%), pH (10%)
```

### Model có thể thử nghiệm khi huấn luyện với Big Data

- Linear / Ridge Regression – baseline
- Random Forest Regressor
- XGBoost Regressor (tối ưu nhất trên bảng dữ liệu dạng tabular)
- SVR (Support Vector Regression)
- Deep Learning (MLP / LSTM nếu theo chuỗi thời gian)

Đánh giá bằng:

- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- R² Score (hệ số xác định)

---

# 20. AI 2 – Anomaly Detection / Condition Warning

Có thể dùng:

- pH
- EC
- water temperature
- air temperature
- humidity
- light
- age/growth stage

Output:

- Normal
- Warning
- High Risk
- anomaly score

Ví dụ:

```text
WARNING

- EC above target
- Water temperature high
```

---

# 21. Rule Engine và AI phải tách nhau

Không nên ép mọi cảnh báo thành Machine Learning.

## Rule Engine (Hệ luật cảnh báo ngưỡng tức thì)

Rule Engine chịu trách nhiệm bắt các sự kiện vượt ngưỡng lý hóa ngay lập tức khi phát sinh số đo:

```text
// 1. Cảnh báo tụt dinh dưỡng EC
IF EC < 1.3 mS/cm
→ WARNING [EC]: Nồng độ dinh dưỡng quá thấp. Khuyến nghị châm thêm Can A và Can B theo tỷ lệ 1:1.

// 2. Cảnh báo dư dinh dưỡng EC
IF EC > 2.0 mS/cm
→ WARNING [EC]: Nồng độ muối khoáng quá cao. Cần châm thêm nước sạch để hạ EC tránh ngộ độc rễ.

// 3. Cảnh báo pH lệch ngưỡng
IF pH < 5.5
→ WARNING [pH]: Nước bị chua. Khuyến nghị châm dung dịch pH Up (KOH).
IF pH > 6.5
→ WARNING [pH]: Nước bị kiềm hóa, cản trở hấp thu vi lượng. Khuyến nghị châm pH Down (H3PO4/HNO3).

// 4. Cảnh báo nhiệt độ nước bồn quá cao
IF Water Temperature > 24.5°C
→ CRITICAL [Temp]: Nhiệt độ nước quá ấm, tăng nguy cơ bùng phát nấm rễ Pythium và thối rễ. Cần kích hoạt quạt giải nhiệt hoặc chiller làm mát bồn.
```

**Cơ chế chống spam thông báo (Alert Deduplication)**:
- Khi một chỉ số vượt ngưỡng, hệ thống kiểm tra danh sách cảnh báo chưa xử lý (`!resolved`).
- Nếu đã tồn tại cảnh báo cho cùng một chỉ số trên cùng một bể chứa, hệ thống sẽ bỏ qua thay vì liên tục tạo thêm thông báo rác làm loãng màn hình vận hành.

## AI (Trí tuệ nhân tạo)

Dùng cho:

- **Yield Prediction**: Dự báo sản lượng tươi tại thời điểm thu hoạch dựa trên kết hợp đa chiều giữa tuổi cây, hình thái sinh học (số lá, chiều cao) và lịch sử lý hóa.
- **Anomaly Detection & Condition Warning**: Phát hiện các dạng bất thường tiềm ẩn nhiều biến số không thể quy chụp bằng luật ngưỡng đơn lẻ.
- Tự động đánh giá và tính toán tỷ lệ đóng góp đặc trưng (`featureContributions`) giúp kỹ sư nông nghiệp hiểu rõ nguyên nhân ảnh hưởng đến sinh trưởng.

Cách phân tách này giúp hệ thống vận hành minh bạch, dễ giải thích và đúng với bản chất của một **Hệ Thống Hỗ Trợ Quyết Định (Decision Support System - DSS)**.

---

# 21A. Quản lý cảnh báo – Alert Lifecycle

## Vấn đề nếu chỉ tạo cảnh báo mà không quản lý

Rule Engine sinh ra cảnh báo khi pH lệch ngưỡng. Nhưng nếu hệ thống không theo dõi cảnh báo đó được xử lý chưa, ai xử lý, xử lý bằng cách nào — thì cảnh báo chỉ là thông báo một chiều, không có giá trị vận hành.

## Vòng đời một cảnh báo

```text
[Điều kiện vi phạm ngưỡng]
        │
        ▼
[Alert tạo ra]  ←── status: OPEN
        │
        ▼
[Gửi thông báo đến người nhận]
        │
        ▼
[Người nhận xác nhận đã thấy]  ←── status: ACKNOWLEDGED
        │
        ▼
[Người nhận xử lý sự cố]
        │
        ├── [Xử lý xong, ghi lại]  ←── status: RESOLVED
        │
        └── [Không xử lý trong X phút]  ←── Escalate lên cấp trên
                │
                ▼
        [Alert leo thang]  ←── status: ESCALATED
```

## Phân loại cảnh báo theo mức độ

| Mức | Tên | Ví dụ | Cần xử lý trong |
|---|---|---|---|
| 1 | INFO | EC gần chạm ngưỡng dưới (1.3 mS/cm) | Trong ca làm việc |
| 2 | WARNING | pH lệch khỏi target (pH < 5.5 hoặc pH > 6.5) | Trong 2 giờ |
| 3 | CRITICAL | Water Temperature > 24.5°C (nguy cơ thối rễ Pythium), hoặc Bơm tuần hoàn dừng | Ngay lập tức |

## Ai nhận cảnh báo

```text
Mức INFO / WARNING
    → Agricultural Engineer của ca đang trực

Mức CRITICAL
    → Agricultural Engineer (ngay lập tức)
    → Farm Manager (đồng thời)

Nếu không ACKNOWLEDGE trong 30 phút (CRITICAL)
    → Leo thang lên Farm Manager + Admin
```

Trong MVP không cần push notification thật. Có thể hiển thị trong Alert Center trên giao diện và đánh dấu badge số lượng chưa xử lý.

## Thông tin Alert cần lưu

- alert_id
- reservoir_id hoặc batch_id (nguồn gốc)
- alert_type (pH_low / pH_high / EC_low / EC_high / water_temp_high / air_temp_high / rh_low / rh_high / pump_stopped / ...)
- severity (INFO / WARNING / CRITICAL)
- triggered_value (giá trị đo được khi kích hoạt)
- threshold_value (ngưỡng bị vi phạm)
- triggered_at (thời điểm tạo)
- status (OPEN / ACKNOWLEDGED / RESOLVED / ESCALATED)
- assigned_to (user nhận cảnh báo)
- acknowledged_by / acknowledged_at
- resolved_by / resolved_at
- resolution_action (mô tả hành động xử lý)
- escalated_to / escalated_at
- notes

## Luồng xử lý từng loại cảnh báo phổ biến

### pH thấp (pH_low)

```text
1. Kiểm tra pH meter có bị lỗi không (calibration)
2. Xác nhận đọc lại bằng thiết bị dự phòng
3. Thêm pH Up (KOH hoặc K2SiO3) theo lượng tính toán
4. Đợi 15 phút, đo lại
5. Ghi nhận lượng đã dùng vào PHAdjustmentEvent
6. Đánh dấu RESOLVED nếu pH về ngưỡng
```

### EC thấp (EC_low)

```text
1. Kiểm tra mực nước bể (có thể nước bốc hơi làm loãng dung dịch)
2. Nếu mực nước ổn: bổ sung Stock A + B theo công thức
3. Nếu mực nước thấp: bổ sung nước trước, sau đó bổ sung dinh dưỡng
4. Đo lại EC sau 20 phút
5. Ghi nhận NutrientDosingEvent hoặc WaterTopUpEvent
6. Đánh dấu RESOLVED
```

### Nhiệt độ nước bồn quá cao (Water_Temp_High) — CRITICAL

```text
1. Kiểm tra hệ thống làm mát dung dịch (quạt giải nhiệt hoặc chiller bồn)
2. Kiểm tra nhiệt độ môi trường xung quanh nhà màng
3. Che chắn nắng trực tiếp chiếu vào bồn chứa dinh dưỡng
4. Châm bổ sung nước mát sạch nếu thể tích bồn đang thấp
5. Kích hoạt bơm sục tuần hoàn phụ để hạ nhiệt dung dịch
6. Đánh dấu RESOLVED sau khi nhiệt độ nước quay về ngưỡng an toàn (< 23°C)
```

## Suppression – tránh spam cảnh báo

Nếu điều kiện vi phạm liên tục (ví dụ EC thấp kéo dài 3 tiếng), hệ thống không nên tạo hàng trăm alert giống nhau. Cần có logic:

- Mỗi loại cảnh báo chỉ tạo 1 alert OPEN tại một thời điểm cho cùng một Reservoir.
- Alert mới chỉ được tạo khi alert cũ đã RESOLVED.
- Nếu điều kiện vẫn vi phạm sau khi mark RESOLVED nhưng không có hành động thực sự thay đổi, hệ thống tạo lại với note "Recurrence".

---

# 22. Dataset đề xuất

## 22.1. Hydroponic Farming Data – Mendeley Data (2025)

Batavia lettuce được theo dõi theo chuỗi thời gian lý hóa và sinh khối thực nghiệm:

- Water quality: pH, EC, TDS, Water Temperature;
- Environmental metrics: Air Temperature, Relative Humidity, CO2;
- Dinh dưỡng & hóa chất: Lượng châm phân A+B (ml), lượng axit điều chỉnh pH (ml);
- Sinh trắc học & Năng suất: Kích thước cây con, đường kính tán lá định kỳ và khối lượng tươi khi thu hoạch (shoot weight).

*Ghi chú phạm vi (Scope Boundary):* Bộ dữ liệu gốc có đính kèm ảnh chụp camera. Tuy nhiên, để bám sát trọng tâm chuyên môn Hóa học và đảm bảo khả thi cho phiên bản MVP của đồ án, đề tài **tập trung khai thác 100% dữ liệu số dạng bảng (Numerical Tabular Sensor & Lab Data)**, loại bỏ module thị giác máy tính (Computer Vision/YOLO) khỏi phạm vi triển khai.

Link:

https://data.mendeley.com/datasets/g6cm3v3wdp/1

---

## 22.2. Hydroponic Cultivation of Bibb Lettuce in NPK-Limited Conditions – USDA Ag Data Commons (2025)

Bibb lettuce được trồng trong điều kiện giới hạn:

- Nitrogen
- Phosphorus
- Potassium

Dataset có:

- dữ liệu time-series;
- elemental analysis;
- dữ liệu vòng đời cây.

Phù hợp:

- nghiên cứu N/P/K;
- growth/nutrient analysis;
- Data Science.

Link:

https://agdatacommons.nal.usda.gov/articles/dataset/Hydroponic_Cultivation_of_Bibb_Lettuce_in_Nitrogen_Phosphorus_Potassium_NPK_-Limited_Conditions/28801286

---

## 22.3. Multi-Sensor Hydroponic Lettuce Dataset – Zenodo (2026)

Dataset xà lách thủy canh:

- 2 cultivars;
- 3 mức Nitrogen;
- nhiều mức fertigation;
- dữ liệu theo thời gian từ transplant đến harvest;
- ảnh/multisensor/phenotyping.

Dung lượng khoảng **39.1 GB**.

Phù hợp nếu muốn thể hiện rõ yếu tố **Big Data**.

Link:

https://zenodo.org/records/20759414

---

# 23. Bài báo AI tham khảo chính

## Using Machine Learning Models to Predict Hydroponically Grown Lettuce Yield

Frontiers in Plant Science, 2022.

Nghiên cứu thử:

- SVR
- XGBoost
- Random Forest
- Deep Neural Network

Target:

**Fresh lettuce yield / fresh head weight**

Các feature trong nghiên cứu bao gồm:

- leaf number;
- water consumption;
- dry weight;
- stem length;
- stem diameter.

Đây là bằng chứng khoa học trực tiếp cho chức năng AI Yield Prediction của đề tài.

Link:

https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2022.706042/full

---

# 24. Các module phần mềm

## Core – bắt buộc

1. Authentication
2. User & Role Management
3. Farm Management
4. Zone Management
5. Hydroponic System Management
6. Reservoir Management
7. Crop & Cultivar Management
8. Crop Batch Management
9. Nutrient Formula Management
10. Nutrient Mixing/Dosing History
11. Water & Environment Records
12. Crop Observation
13. Harvest Management
14. Alerts
15. AI Prediction
16. Dashboard
17. Reports

## Mở rộng

18. Equipment Management
19. Maintenance
20. Calibration
21. Sanitation
22. Pest/Disease
23. Task/Schedule
24. Cost Management
25. Traceability
26. Mobile App
27. QR Code

---

# 25. User Role

## Admin

- quản lý hệ thống;
- user;
- role/permission;
- cấu hình.

## Farm Manager

- quản lý farm;
- batch;
- kế hoạch;
- thu hoạch;
- báo cáo.

## Agricultural Engineer

- crop;
- nutrient formula;
- pH/EC/nhiệt độ nước;
- môi trường;
- quan sát cây;
- cảnh báo;
- kỹ thuật xử lý.

## Worker

- xem task;
- nhập số liệu;
- ghi nhận công việc được giao.

---

# 26. Dashboard giám sát thời gian thực

Dashboard là trung tâm điều khiển vận hành hàng ngày của trang trại, bao gồm các thành phần chuẩn hóa:

### 1. 4 Thẻ chỉ số tổng quan (KPI Metric Cards)
- **Lô đang trồng**: Số lượng lô đang trong chu kỳ canh tác thực tế (`active batches`).
- **Tổng số cây trên máng**: Tổng cộng số cây thực tế đang sinh trưởng trên các giàn/máng thủy canh.
- **Cảnh báo cần xử lý**: Số lượng cảnh báo chưa được giải quyết (`unresolved alerts`), đổi màu nổi bật khi có sự cố.
- **Sản lượng dự kiến tổng hợp**: Sản lượng dự kiến toàn trang trại ($\sim\text{kg}$), được tính toán cộng dồn **động** từ mô hình AI dự báo theo từng lô và số ngày tuổi thực tế.

### 2. Biểu đồ giám sát pH & EC theo chuỗi thời gian
- Biểu đồ đường kép (Dual Line Chart) thể hiện biến thiên pH và nồng độ EC qua các ngày đo đạc.
- Đánh dấu vùng tham chiếu an toàn chuẩn hóa cho rau xà lách (pH 5.5 - 6.2; EC 1.4 - 1.9 mS/cm).

### 3. Khung thông số bể dinh dưỡng hiện hành
- Hiển thị trực quan bộ 3 chỉ số thiết yếu: **pH, EC, Nhiệt độ nước bồn**.
- **Thể tích dung dịch hiện tại**: Số lít dung dịch hiện có trong bể và tỷ lệ % thể tích bể chứa.
- Trạng thái hoạt động của bơm tuần hoàn dinh dưỡng.
- **Chú thích nông học thông minh (Smart Agronomic Tooltips)**: Mỗi chỉ số lý hóa đều có tooltip giải thích ý nghĩa nông nghiệp thực tế, dải tối ưu và lưu ý rủi ro (ví dụ: giải thích tại sao pH cần 5.6 - 6.2 để hấp thu vi lượng, rủi ro EC < 1.3 mS/cm hoặc nhiệt độ nước > 24.5°C).

### 4. Thanh giám sát tiểu khí hậu thời gian thực (Microclimate Real-time Bar)
- Cập nhật các thông số cảm biến môi trường không khí nhà màng:
  - **Nhiệt độ phòng** (°C)
  - **Độ ẩm không khí RH** (%)
  - **Áp suất hơi thiếu hụt (VPD)** (kPa) kèm nhãn đánh giá trạng thái sinh học (Tối ưu / Quá khô / Quá ẩm) và tooltip giải thích cơ chế thoát hơi nước chống cháy ngọn lá (*tipburn*).

### 5. Danh sách lô canh tác & Bảng tin cảnh báo nhanh
- Bảng danh sách các lô đang trồng tích hợp **Thanh tiến trình ngày tuổi rút gọn (Compact Lifecycle Progress Bar)** hiển thị rõ ngày tuổi, % hoàn thành chu kỳ và số ngày đếm ngược đến kỳ thu hoạch.
- Khung hiển thị các cảnh báo mới nhất kèm hành động đề xuất khắc phục tức thời.

### 6. Trải nghiệm tương tác & Phản hồi thời gian thực (Toast Notifications)
- Mọi thao tác vận hành nghiệp vụ (xác nhận châm phân, lưu số đo sinh trưởng, chuyển tiếp giai đoạn, thu hoạch, xử lý cảnh báo) đều kích hoạt thông báo Toast nổi bật góc màn hình, tạo phản hồi thị giác tin cậy cho người vận hành.

---

# 27. Report

Xuất Excel/PDF:

- Crop Batch Report
- Nutrient Solution Report
- Water Quality Report
- Environment Report
- Growth Report
- Harvest Report
- Yield Report
- Alert Report
- Nutrient Usage Report
- Water Usage Report

---

# 28. Mobile + QR – phần mở rộng

Mỗi:

- Zone
- System
- Reservoir
- Crop Batch

có thể có QR Code.

Kỹ sư quét QR để xem nhanh:

- cây/giống;
- tuổi;
- growth stage;
- pH;
- EC;
- nhiệt độ;
- nutrient formula;
- observation gần nhất;
- ngày thu hoạch;
- AI prediction.

Có thể nhập số liệu ngay trên mobile.

---

# 29. Đơn vị phải chuẩn hóa

| Dữ liệu | Đơn vị |
|---|---|
| Temperature | °C |
| pH | không đơn vị |
| EC | mS/cm |
| Nutrient concentration | mg/L hoặc ppm |
| Alkalinity | mg/L CaCO3 |
| Water volume | L |
| Flow rate | L/min |
| PPFD | µmol/m²/s |
| DLI | mol/m²/day |
| Humidity | % |
| CO₂ | ppm |
| Plant weight | g |
| Harvest weight | kg |
| Area | m² |
| Yield | kg/m² |

> Không lưu một con số mà không biết đơn vị.

---

# 30. Các entity database quan trọng

Có thể bắt đầu ERD từ các entity:

```text
User
Role
Permission

Farm
Zone

HydroponicSystem
Channel          ← entity trung gian Reservoir ↔ Batch
Reservoir

Crop
Cultivar
GrowthStage
CropStageRequirement

CropBatch

Nutrient
Fertilizer
NutrientFormula
FormulaIngredient
StockSolution

NutrientMixingEvent
NutrientDosingEvent
WaterTopUpEvent
PHAdjustmentEvent
SolutionDrainEvent   ← mới: sự kiện xả bể khi kết thúc lô
SolutionReplacementEvent
SanitationEvent      ← mới: vệ sinh bể sau khi xả
Sampling
LaboratoryAnalysis

WaterSource
WaterAnalysis

EnvironmentRecord
WaterQualityRecord

CropObservation
PestDiseaseRecord

Harvest

Alert              ← có đầy đủ lifecycle: OPEN → ACK → RESOLVED → ESCALATED
AlertAssignment    ← ai nhận cảnh báo
AlertEscalation    ← leo thang lên ai, khi nào

Equipment
Maintenance
Calibration
Sanitation

AIPrediction
Report
```

Không nhất thiết phải implement tất cả ngay từ Sprint đầu.

---

# 31. Kiến trúc tổng thể

```text
                    BIG DATA
                       │
                       ▼
              Historical Dataset
                       │
                       ▼
               Data Cleaning / ETL
                       │
               Pandas / PySpark
                       │
                       ▼
                Machine Learning
                       │
                       ▼
                    AI API
                       │
                       ▼
┌──────────────────────────────────────────┐
│                BACKEND                   │
│                                          │
│ Farm / Crop / Batch / Nutrient / Water   │
│ Environment / Harvest / Alert / Report   │
│ AI Integration / Authentication          │
└───────────────────┬──────────────────────┘
                    │
              PostgreSQL/MySQL
                    │
            ┌───────┴───────┐
            ▼               ▼
           WEB            MOBILE
                         (optional)
```

---

# 32. Phân chia 6 thành viên

## 1 Big Data / Data Science

- dataset;
- cleaning;
- EDA;
- feature engineering;
- batch processing;
- train/test;
- model evaluation;
- AI API.

## 2 Backend

- database;
- authentication;
- authorization;
- business API;
- nutrient/environment/harvest;
- AI integration;
- report.

## 2 Frontend

- dashboard;
- CRUD screens;
- chart;
- alert UI;
- AI prediction UI;
- report UI.

## 1 thành viên còn lại

Ưu tiên:

- integration;
- testing;
- DevOps;
- documentation;

Sau khi core ổn mới làm:

- Mobile
- QR

---

# 33. MVP – những gì bắt buộc phải hoàn thành

Để tránh scope quá lớn, phiên bản chính nên ưu tiên:

### Management

- User/Role
- Farm/Zone
- NFT hoặc DWC
- Reservoir
- Crop/Cultivar
- Crop Batch

### Hydroponic Data

- pH
- EC
- Water Temperature
- Air Temperature
- Humidity
- Nutrient Formula

### Crop

- Growth Observation
- Harvest

### Intelligence

- Rule-based Alerts
- AI Yield Prediction

### Output

- Dashboard
- Chart
- Excel/PDF Report

---

# 34. Phần mở rộng nếu còn thời gian

- hỗ trợ cả NFT + DWC nếu MVP chỉ làm một loại;
- PPFD/DLI;
- CO₂/VPD;
- Water Laboratory Analysis;
- Detailed nutrient ions;
- Pest/Disease;
- AI anomaly detection;
- Equipment;
- Calibration;
- Sanitation;
- Maintenance;
- Cost;
- Traceability;
- Mobile;
- QR;
- IoT sensor integration.

---

# 35. 7 phần phải nhớ khi nói về đề tài

```text
[1] CÂY
Crop + Cultivar + Growth Stage
             ↓
[2] HỆ THỐNG
NFT / DWC + Reservoir + Channel (máng)
             ↓
[3] NƯỚC
pH + EC + Water Temperature
             ↓
[4] DINH DƯỠNG
N P K Ca Mg S + Micronutrients
+ Vòng đời dung dịch: Pha → Bổ sung → Xả → Vệ sinh → Pha lại
             ↓
[5] MÔI TRƯỜNG
Temperature + Humidity + Light
             ↓
[6] SINH TRƯỞNG & THU HOẠCH
Age + Leaf + Weight + kg/batch
             ↓
[7] AI
Yield Prediction + Warning/Anomaly
             ↓
[8] CẢNH BÁO
Rule Engine → Alert → Giao cho kỹ sư → Xử lý → Ghi nhận → Đóng
```

Nếu 8 phần này đúng thì lõi của đề tài đã đúng.

---

# 36. Những lỗi khoa học phải tránh

### Sai 1

> Thủy canh chỉ cần N-P-K.

**Sai.** Còn Ca, Mg, S và các vi lượng thiết yếu.

### Sai 2

> EC cho biết cây thiếu Nitrogen/Potassium bao nhiêu.

**Sai.** EC chỉ phản ánh tổng khả năng dẫn điện/tổng ion hòa tan.

### Sai 3

> Mọi cây dùng cùng pH và EC.

**Sai.** Target phải theo crop/cultivar/growth stage.

### Sai 4

> Có pH là đủ đánh giá nước.

**Sai.** Còn alkalinity, EC và thành phần ion nguồn nước.

### Sai 5

> AI có thể dự báo bệnh dù dataset không có nhãn bệnh.

**Sai.** Không có label bệnh thì chỉ nên cảnh báo điều kiện/rủi ro.

### Sai 6

> Model dùng feature mà dataset không có.

**Sai.** Dataset có dữ liệu gì thì model mới được sử dụng dữ liệu đó.

### Sai 7

> AI dự báo “năng suất tháng sau” cho xà lách.

Nên định nghĩa rõ hơn:

**Dự báo fresh weight tại thời điểm thu hoạch**.

---

# 37. Kết luận

Đề tài cuối cùng có thể mô tả ngắn gọn như sau:

> **Smart Hydroponic Farm Management System** là phần mềm số hóa hoạt động của trang trại thủy canh, quản lý cây trồng, hệ thống NFT/DWC, bể dung dịch, dinh dưỡng, pH, EC, điều kiện môi trường, sinh trưởng và thu hoạch. Dữ liệu lịch sử được xử lý theo hướng Batch Processing và Machine Learning để xây dựng AI dự báo năng suất xà lách tại thời điểm thu hoạch và hỗ trợ phát hiện điều kiện bất thường. Hệ thống đóng vai trò Decision Support System cho người quản lý và kỹ sư nông nghiệp.

---

# 38. Nguồn tài liệu chính

## Kiến thức thủy canh và dinh dưỡng

### Penn State Extension – Essential Nutrients

https://extension.psu.edu/hydroponics-systems-and-principles-of-plant-nutrition-essential-nutrients-function-deficiency-and-excess

### Penn State Extension – Nutrient Solution Programs and Recipes

https://extension.psu.edu/hydroponics-systems-nutrient-solution-programs-and-recipes

### Missouri Extension – Hydroponic Nutrient Solutions

https://extension.missouri.edu/publications/g6984

### Virginia Tech – NFT Systems

https://www.pubs.ext.vt.edu/SPES/spes-463/spes-463.html

### Virginia Tech – DWC Systems

https://www.pubs.ext.vt.edu/SPES/spes-464/spes-464.html

### Virginia Tech – Hydroponic Management Basics

https://www.pubs.ext.vt.edu/SPES/spes-462/spes-462.html

---

## Dataset

### Hydroponic Farming Data – Mendeley

https://data.mendeley.com/datasets/g6cm3v3wdp/1

### USDA – Bibb Lettuce NPK-Limited Dataset

https://agdatacommons.nal.usda.gov/articles/dataset/Hydroponic_Cultivation_of_Bibb_Lettuce_in_Nitrogen_Phosphorus_Potassium_NPK_-Limited_Conditions/28801286

### Zenodo – Multi-Sensor Hydroponic Lettuce

https://zenodo.org/records/20759414

---

## AI / Machine Learning

### Frontiers – Using Machine Learning Models to Predict Hydroponically Grown Lettuce Yield

https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2022.706042/full

---

# 39. Trạng thái tài liệu

Tài liệu này đủ để nhóm bắt đầu:

- hiểu domain thủy canh;
- chốt scope;
- phân tích requirement;
- thiết kế ERD/database;
- thiết kế API;
- thiết kế UI;
- chia task;
- lựa chọn dataset;
- xây pipeline Big Data;
- bắt đầu thử nghiệm model AI.

Khi bước vào implementation, nhóm vẫn cần chốt riêng:

1. **Chọn NFT hay DWC làm MVP.**
2. **Chọn cultivar xà lách cụ thể nếu dataset yêu cầu.**
3. **Dataset AI chính thức.**
4. **Feature thật sự có trong dataset.**
5. **Target AI.**
6. **Danh sách module bắt buộc của Sprint.**
7. **Tech stack cuối cùng.**
8. **ERD/API contract.**

Đó là bước thiết kế dự án, không phải phần kiến thức nền còn thiếu.
