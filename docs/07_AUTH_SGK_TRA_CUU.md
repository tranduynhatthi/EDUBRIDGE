# EDUBRIDGE 1.6 – Sửa đăng ký email và dùng 3 công cụ mới

## 1. BẮT BUỘC sửa Supabase để không còn chuyển về localhost
1. Vercel → EDUBRIDGE → Settings → Domains: lấy đúng domain Production *ổn định* (không phải URL hash của một deployment).
2. Supabase → Authentication → URL Configuration:
  - Site URL: https://TEN-MIEN-PRODUCTION
  - Redirect URLs: https://TEN-MIEN-PRODUCTION/auth/confirm, https://TEN-MIEN-PRODUCTION/login
  - Nếu đang kiểm thử bằng URL deployment Vercel, thêm https://*-tranduynhatthy-9353.vercel.app/** làm wildcard preview; nên chuyển người dùng sang domain ổn định.
3. Supabase → Authentication → Email Templates: tránh hardcode 'http://localhost:3000' trong mẫu. Nếu dùng template tự viết, dùng {{ .ConfirmationURL }} hoặc đúng {{ .RedirectTo }} ở nơi cần chuyển tiếp theo tài liệu Supabase.
4. Lưu, đăng ký email *mới*, kiểm tra email xác nhận phải dẫn về domain được phép /auth/confirm hoặc /login. Với tài khoản đã email_confirmed_at khác null chỉ việc đăng nhập; không đăng ký lại.
5. Nếu email link cũ chứa redirect_to=localhost, tạo yêu cầu xác nhận mới hoặc dùng email mới sau khi đã sửa.

## 2. Tạo bài từ nội dung giáo viên cung cấp
- Từ menu Tạo bài, chọn 'Tự đưa nội dung SGK'; nhập tên bài, lớp và văn bản ít nhất 250 ký tự.
- Có thể mở TXT/MD hoặc PDF chỉ gồm 1–10 trang, <=10MB. PDF được gửi Gemini đọc thành bản nháp để giáo viên chỉnh sửa, không tự công bố vào kho chung.
- Nhấn Tạo bài, hậu kiểm slide, lời giảng, thuật ngữ, công thức và đáp án trước khi dùng. Chỉ gửi tài liệu có quyền sử dụng.

## 3. Từ điển và luyện nói
- Từ điển: nhập từ tiếng Việt hoặc Anh; dừng gõ sẽ tự tra qua Gemini, có định nghĩa/ví dụ/giọng đọc trình duyệt.
- Luyện nói: nhập câu Việt/Anh bất kỳ; dừng gõ để Gemini đưa câu tiếng Anh; bấm Nghe mẫu và Đọc thử, cấp quyền micro. Điểm chỉ là mức khớp transcript, không phải đánh giá chuẩn ngữ âm.
- Cần tài khoản đăng nhập có vai trò teacher/admin; API Gemini có quota/chi phí theo số lần gọi.

## Giới hạn nghiệm thu
GitHub CI kiểm tra cú pháp/build/mock; xác nhận email thực tế cần sửa Site URL Supabase trên dashboard. Gemini trả kết quả thật cần khóa/quota hợp lệ. Không coi mã nguồn đã xong là vận hành E2E hoàn chỉnh.
