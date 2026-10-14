# Bài 1 – Quy trình khép kín

**SGK:** Vật lí 12, Kết nối tri thức, trang in 6–9, trang PDF 7–10.

1. Chạy SQL 01 → 02 → 03 → **04_bai1_student_cycle.sql**.
2. Tạo tài khoản quản trị, cấp role `admin` từ SQL Editor, nhập SGK và seed 25 bài như README.
3. Mở Bài 1 → AI đọc PDF 7–10 → so sánh với `sample-data/bai1_nguon_da_doi_chieu_can_hau_kiem.txt` → **sửa trực tiếp ghi chú nguồn** và duyệt công bố. Không dán tài liệu mẫu mà không kiểm tra nguồn.
4. Giáo viên đăng nhập → lớp 12 → chọn Bài 1 → mức A2/B1/B2 → AI soạn bài → sửa slide và Teacher Script, kiểm tra quiz, bấm **Lưu chỉnh sửa** (status reviewed).
5. Bấm **Xuất PowerPoint**, mở PPTX và hậu kiểm font, ký hiệu, hình minh họa; hình trong PDF chưa được tự đưa vào slide.
6. Bấm **Giao bài cho học sinh** → nhận mã 8 ký tự. Mỗi lần bấm tạo một mã/lần giao; nội dung là bản chụp tại thời điểm giao, sửa bản gốc không thay đổi bài đã giao.
7. Học sinh đăng ký ở `/login`, chọn vai trò Học sinh. Đăng nhập → `/student` → nhập mã 8 ký tự → xem từ vựng, slide, nghe giọng đọc trình duyệt → làm quiz → nộp, xem đáp án.
8. Giáo viên mở `/assignments` để xem điểm, ngày nộp và mã học sinh ẩn bớt. Một học sinh chỉ nộp một lần cho mỗi mã.

**Ranh giới tính năng:** Chấm quiz thực hiện ở Supabase RPC, đáp án không được gửi trong payload bài học cho học sinh trước khi nộp. TTS chỉ đọc giọng máy, **không chấm phát âm**. Chưa có khảo sát trước/sau, số hóa hình minh họa tự động, phân lớp nhiều trường, hay giới hạn API theo người dùng.

**Cần kiểm thử trên tài khoản thật:** đăng nhập, RLS, upload sách, OpenAI API, xuất PPTX, mã giao bài, 2 tài khoản học sinh. Đã có mã và dữ liệu kiểm chứng tĩnh; không tuyên bố đã chạy thật.
