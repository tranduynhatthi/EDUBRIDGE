# EDUBRIDGE 1.7 – Giao diện cam trắng & môn học CTGDPT 2018 THPT

**Đã thực hiện trong mã nguồn:**
- Cam và trắng là màu chủ đạo giao diện và PowerPoint.
- Trang Tổng quan lấy tên giáo viên từ `profiles.full_name`; có các ô môn học dẫn tới `/builder?subject=...`.
- 17 mục môn cấp THPT gồm 6 môn bắt buộc, 9 môn lựa chọn và 2 môn tự chọn theo CTGDPT 2018 đã sửa đổi. Hoạt động trải nghiệm và nội dung GD địa phương không được coi là môn trong lưới.
- Trang Chọn bài không yêu cầu chọn bộ sách; theo môn và khối lớp hệ thống hiện bài đã duyệt, giữ thông tin nguồn bên dưới.
- Giáo viên có thể tự tải PDF 1–10 trang, văn bản TXT/MD hoặc dán/chỉnh sửa kiến thức cho tất cả môn; có thể tạo lesson dùng Gemini mà không cần đợi kho sách chung.
- Admin nhập sách cho các môn khác; mục nhập danh sách 25 bài tự động vẫn dành riêng đúng SGK Vật lí 12 đã đối chiếu.
- API Gemini, DB và xuất PPTX lưu và sử dụng đúng `subject` thay vì gán cứng Vật lí.

**Cơ sở dữ liệu:** áp dụng `supabase/07_thpt_subjects.sql` để bỏ check cũ khóa môn Vật lí và chặn tên môn ngoài danh mục. Không thay đổi các hàng có sẵn.

**Chưa khẳng định đã nghiệm thu E2E đa môn:** cần kiểm thử tài khoản thật, từng môn, Gemini/quota, học liệu và PowerPoint. Nội dung từ SGK phải có quyền sử dụng và được người dạy hậu kiểm.

**Hạng mục 5 chưa đủ thông tin:** yêu cầu người dùng kết thúc ở 'chỉnh sửa lại nội dung theo các…', chưa thay đổi cơ chế sửa theo những tiêu chí chưa được cung cấp.
