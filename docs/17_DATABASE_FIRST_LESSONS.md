# EDUBRIDGE 1.12 – Danh mục bài học cơ sở dữ liệu thống nhất

Giáo viên đăng nhập → Chọn môn → Lớp → Bài học từ Supabase. Không còn ba chế độ “Học liệu có sẵn”, “SGK đã hậu kiểm”, “Tự đưa nội dung SGK”. Giao diện không có tải PDF hoặc nhập nguyên văn SGK.

Menu bên trái bỏ “Kết quả học sinh” và “Quản trị SGK”. Các bảng, chức năng quản trị và kết quả học sinh bên trong hệ thống vẫn được giữ để không làm mất dữ liệu và không làm sai phân quyền; chỉ không xuất hiện trong menu.

Nguồn bài gồm `edubridge_ready_lessons` (học liệu EDUBRIDGE gốc, biên soạn độc lập) và `textbook_lessons` đã có `is_published=true`. Không tự công bố nguồn SGK chưa duyệt. Server nhận ID của bài có sẵn, rồi đọc văn bản theo chính ID đó từ Supabase trước khi gọi Gemini. Các lựa chọn không có dữ liệu cho biết rõ thiếu bài.

**Phạm vi hiện tại:** 25 bài tham khảo Vật lí 12; 16 bài minh họa lớp 10 cho các môn khác (chỉ 9 môn đang hiện trong danh mục 10 môn còn lại). Đây KHÔNG phải SGK toàn văn/đã thẩm định từng trang và các lớp 11, 12 của các môn khác còn thiếu. Nhập đầy đủ SGK có bản quyền, dữ liệu nguồn hợp pháp và hậu kiểm là bước khác cần được thực hiện trước khi công bố là SGK.

Không thay đổi Supabase schema, không xóa bài học, không gọi Gemini trong khi triển khai. Tạo bài với Gemini từ kho bài có sẵn vẫn là một thao tác người dùng chủ động, có thể dùng quota API.
