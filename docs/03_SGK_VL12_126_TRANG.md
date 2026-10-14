# Tích hợp SGK Vật lí 12 bản PDF ảnh quét

Nguồn: `SGK Vật lí 12-mau.pdf`, 126 trang PDF, Kết nối tri thức với cuộc sống, NXB Giáo dục Việt Nam. Trang PDF = trang sách in + 1, xác định từ mục lục và trang đầu mỗi bài. Tệp không có text layer để `unpdf` tự trích chữ: ví dụ trang PDF 5 và 7 có 0 ký tự khi đọc text trực tiếp. Do đó **không dùng `/api/admin/lessons` kiểu text extraction** cho bản PDF này.

## Trạng thái quản trị

`textbooks` lưu metadata và private storage_path. `textbook_lessons` lưu 25 dòng nháp rỗng (source_text='') và thông tin trang. Người quản trị lần lượt gọi `analyze-pdf` để cắt PDF theo bài bằng `pdf-lib` rồi gửi PDF cắt tới model có vision. Model tạo ghi chú nguồn để đọc sửa. `is_published` vẫn false cho đến khi quản trị viên xác nhận.

## Những điểm cần hậu kiểm

1. Chỉ số và đơn vị nhiệt độ, nhiệt lượng, nhiệt dung, nhiệt nóng chảy, nhiệt hóa hơi.
2. Phân biệt bảng số liệu, đồ thị thí nghiệm và giải thích lý thuyết.
3. Dấu, số mũ, kí hiệu toán học của định luật Boyle, Charles và phương trình trạng thái khí.
4. Quy tắc nắm tay, định hướng từ trường, vectơ và dấu của suất điện động cảm ứng.
5. Chỉ số trên dưới trong kí hiệu hạt nhân, phản ứng, độ phóng xạ và năng lượng liên kết.
6. Tránh để AI đưa vào kiến thức ngoài trang SGK mà không có nguồn. Khi nguồn thiếu dữ kiện cần cảnh báo, không tự điền.

## Về API và chi phí

Dùng Responses API với `input_file` PDF high detail để cho phép model xử lý cả hình ảnh trang PDF. Mỗi lần chỉ cắt số trang của **một bài** (2 đến 10 trang). Điều này có chi phí, cần giám sát. Không OCR lặp nhiều lần để tái tạo nguồn khi đã duyệt; AI tạo bài giảng sau đó dùng `source_text` đã lưu, không gửi PDF tới API ở mỗi lượt giáo viên.

## Chỉ tiêu bản prototype

- Hành động admin: upload file 1 lần → import index 25 mục 1 lần.
- Hành động admin cho bài mẫu: bấm AI đọc → hậu kiểm nguồn → duyệt.
- Hành động teacher: đăng nhập → chọn 1 bài → tạo bài → chỉnh sửa → xuất PPTX.
- Chưa tích hợp giọng nói, LMS học sinh hoặc ngân hàng bài tập chẩn đoán.
