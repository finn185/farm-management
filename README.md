# AI Module - Smart Hydroponic Farm

Tài liệu hướng dẫn sử dụng các tệp của module AI: chuẩn bị dữ liệu, chạy notebook, xem kết quả và hiểu giới hạn hiện tại.

## Tệp trong nhánh này

- [`AI.ipynb`](./AI.ipynb): notebook tiền xử lý dữ liệu, huấn luyện và đánh giá mô hình, đồng thời kiểm tra một số kịch bản mẫu.
- [`Cleaned_Data_Batches_Final.csv`](./Cleaned_Data_Batches_Final.csv): dữ liệu đầu vào của notebook.
- [`report_AI.md`](./report_AI.md): báo cáo kỹ thuật, kết quả đánh giá và thông tin tích hợp dành cho nhóm.

## Mở notebook

Trên GitHub, chọn nhánh **AI**, sau đó mở `AI.ipynb` bằng Google Colab và tải CSV trong phần Files theo hướng dẫn bên dưới.

## Chạy notebook trên Google Colab

1. Mở [`AI.ipynb`](./AI.ipynb) bằng Google Colab.
2. Tải `Cleaned_Data_Batches_Final.csv` lên phiên làm việc Colab bằng bảng **Files**.
3. Đảm bảo CSV nằm ở thư mục làm việc hiện tại của Colab. Notebook đọc dữ liệu bằng tên file tương đối `Cleaned_Data_Batches_Final.csv`.
4. Chọn **Runtime → Run all** và chờ các ô chạy hoàn tất. Ô đầu tiên cài các thư viện cần thiết.
5. Xem kết quả dự báo, chỉ số đánh giá, biểu đồ độ quan trọng đặc trưng, thống kê bất thường và các kịch bản kiểm chứng ở những ô phía dưới.


## Notebook xử lý những gì?

1. Đọc dữ liệu CSV và chuyển `Date` sang kiểu ngày tháng.
2. Tạo `Plant_Age_Days` bằng cách tính số ngày kể từ ngày đầu tiên của từng `Batch_ID`.
3. Huấn luyện `RandomForestRegressor` để dự báo `Target_Shoot_Weight_g` từ tuổi cây, pH, EC, nhiệt độ, độ ẩm và thông tin châm dinh dưỡng.
4. Đánh giá mô hình dự báo bằng MAE, RMSE và R² trên tập kiểm thử.
5. Huấn luyện `IsolationForest` trên `Avg_pH`, `Avg_EC` và `Avg_Water_Temp` để gắn nhãn điểm bất thường.
6. Chạy các kịch bản mẫu, gồm các giai đoạn tuổi cây và một số điều kiện môi trường bất thường.

### Cách hiểu kết quả phát hiện bất thường

- `1`: mô hình xem mẫu là bình thường.
- `-1`: mô hình xem mẫu là bất thường.
- Notebook đặt `contamination=0.05`, tức mô hình giả định khoảng 5% dữ liệu đầu vào là bất thường. Đây là tham số cần được đánh giá và điều chỉnh theo dữ liệu thực tế của hệ thống.

## Dùng kết quả để tích hợp với các phần khác

- **Backend:** dùng các đặc trưng và ví dụ payload trong [`report_AI.md`](./report_AI.md) làm tham khảo khi thiết kế API.
- **Frontend:** có thể dùng giá trị dự báo theo đơn vị gram/cây và nhãn bất thường để xây dựng giao diện sau khi backend cung cấp API.
- **Tester/QA:** có thể tham khảo các kịch bản kiểm chứng trong notebook để xây dựng test tích hợp.

**Lưu ý:** notebook hiện huấn luyện mô hình trong phiên chạy và không tự xuất mô hình thành tệp. Nó cũng chưa cung cấp API phục vụ backend. Muốn tích hợp trực tiếp, nhóm cần bổ sung bước lưu/tải mô hình và dịch vụ API phù hợp.

## Lưu ý khi diễn giải kết quả

Các chỉ số và kịch bản trong báo cáo là kết quả tham khảo cho dữ liệu và cách chia tập hiện tại, không đảm bảo hiệu năng tương tự trên dữ liệu mới. Hãy chạy lại notebook để kiểm tra kết quả; trước khi triển khai thực tế, cần xác nhận chất lượng dữ liệu, cách chia tập đánh giá và ngưỡng cảnh báo với nhóm.
