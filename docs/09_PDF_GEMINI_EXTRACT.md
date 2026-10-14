# EDUBRIDGE 1.7.2 – PDF ảnh quét và kiểm chứng Gemini

### Lỗi trước đây
`INVALID_EXTRACTED_NOTES` xuất hiện khi nguồn Gemini dưới 300 ký tự, trên 24.000 ký tự, cảnh báo vượt 10 mục hoặc mỗi cảnh báo vượt 200 ký tự. API bỏ toàn bộ phản hồi dù Gemini kết nối thành công.

### Quy trình mới
- AI đọc chính xác các trang PDF của một bài theo chỉ số PDF, tạo ghi chú nguồn với số trang gốc.
- Nếu phản hồi đầu tiên quá ngắn (dưới 250 ký tự), AI chia hai nhóm trang và đọc lại song song để tăng khả năng nhận diện. Lần gọi bổ sung có thể tăng chi phí/quota.
- Không thêm kiến thức để đạt giới hạn ký tự. Không tự xóa cảnh báo Gemini.
- Nếu còn nội dung ngắn/không hợp lệ, trả bản nháp chỉ trên giao diện để người phụ trách sửa; không lưu vào database và không tự duyệt.
- Nếu đủ điều kiện, lưu thành bản nháp riêng và yêu cầu hậu kiểm công thức, hình, đơn vị, đáp án.
- Các lỗi về API key, model, quota và timeout có mã riêng. Nút kiểm tra kết nối Gemini chỉ kiểm tra gọi văn bản đơn giản, không đảm bảo mô hình đã đọc PDF chuẩn.

### Cách kiểm chứng Bài 25
Vào Quản trị SGK → Bài 25 → Kiểm tra kết nối Gemini → AI đọc PDF bài này. Nếu hiển thị nguồn, đối chiếu PDF trang 120–123. Nếu báo lỗi, gửi mã lỗi và số ký tự, không chia sẻ khóa API.

### Giới hạn
Đây là bản sửa kỹ thuật đã qua kiểm tra mã nguồn; chất lượng trích xuất thực tế vẫn phải được người phụ trách đối chiếu trên tài liệu có quyền sử dụng.
