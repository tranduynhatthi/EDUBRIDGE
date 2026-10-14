# EDUBRIDGE 1.9 – Học liệu có sẵn ngay khi đăng nhập

## Đã tích hợp
- Supabase: bảng `edubridge_ready_lessons` có dữ liệu độc lập, biên soạn riêng cho EDUBRIDGE, không sao chép nguyên văn SGK.
- 25 bài tham khảo Vật lí 12, lấy tiêu đề bài theo danh mục đã được người dùng đưa vào; kiến thức, thuật ngữ và hoạt động là bản biên soạn gốc do EDUBRIDGE tạo.
- 16 bài KHỞI ĐẦU minh họa cho 16 môn học THPT còn lại, ở lớp 10. Đây không phải toàn bộ chương trình các môn hoặc trích xuất SGK chính thức.
- Giáo viên đăng nhập → Tổng quan → chọn môn, lớp → Học liệu có sẵn → chọn bài. Xem và sửa nguồn đã có, không cần tải PDF.
- Chỉ khi nhấn 'Tạo bài dạy với Gemini' mới phát sinh một lượt tạo bài bằng API. Tải trang / tra cứu kho không gọi Gemini.
- Kho 'SGK đã hậu kiểm' riêng biệt; bài SGK lấy từ PDF thật vẫn cần quyền sử dụng, kiểm chứng nguồn và Admin duyệt.
- Việc bổ sung kho gốc không làm thay đổi hàng đợi xử lý 25 bài đang PAUSED và không kích hoạt xử lý nền trả phí.

## Giới hạn nội dung
Các bài Physics 12 khởi đầu không phải nội dung đã đối chiếu từng trang SGK hay bản toàn văn của NXB. Phạm vi là kiến thức cốt lõi tự biên soạn, cần giáo viên thẩm định khi sử dụng.
Ở 16 môn còn lại chỉ có bài giới thiệu; muốn đầy đủ từng bài cả lớp 10–12 cần xây dựng ngân hàng nội dung được cấp phép, chuẩn hóa mục tiêu và hậu kiểm bởi người có chuyên môn.

## Cấu hình triển khai
Các migration 09 và 10 lưu trên GitHub, đã áp dụng vào Supabase EDUBRIDGE. Không yêu cầu biến môi trường mới trên Vercel.
