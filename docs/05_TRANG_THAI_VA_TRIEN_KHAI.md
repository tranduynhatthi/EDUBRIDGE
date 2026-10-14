# EDUBRIDGE MVP 1.5 (Gemini) – Hướng dẫn triển khai và nghiệm thu

## Chức năng có mã nguồn
Quản trị viên nhập SGK Vật lí 12 một lần và tạo danh mục 25 bài. Bài học chỉ được chọn sau khi nguồn được đọc từ PDF ảnh, hậu kiểm và duyệt. Giáo viên tạo giáo án song ngữ EMI/CLIL, sửa slide/lời giảng/quiz, lưu bài, xuất PowerPoint (Teacher Script trong Speaker Notes), giao mã 8 ký tự. Học sinh đăng nhập học và làm quiz; giáo viên xem kết quả. Bổ sung từ điển từ các bài đã lưu và luyện câu giao tiếp tiếng Anh trên trình duyệt.

**Không tuyên bố đã vận hành hoàn chỉnh:** Kiểm tra tĩnh/contract chỉ là điều kiện cần. Phải xác nhận npm build, tích hợp Supabase/Gemini và kiểm thử đầu cuối trên Internet.

## Cấu hình chạy thật
1. Tạo Supabase project. SQL Editor chạy chính xác theo thứ tự: 01_schema.sql, 02_textbook_library.sql, 03_seed_scanned_pdf.sql, 04_bai1_student_cycle.sql.
2. Tạo tài khoản giáo viên rồi cấp quyền admin qua SQL Editor theo README. Admin nhập PDF SGK 126 trang vào Supabase Storage private. Không commit sách lên GitHub.
3. Hosting Next.js Node 22+ (Railway hoặc Vercel). Root directory = /, build = npm run build, Railway start = npm run start.
4. Thiết lập các Environment Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, GEMINI_API_KEY, GEMINI_MODEL, GEMINI_VISION_MODEL. Tuyệt đối không lưu API key trong GitHub. API Google Gemini có thanh toán và quyền model độc lập với ChatGPT.
5. Cập nhật Supabase Authentication → URL Configuration: Site URL và Redirect URLs dùng domain hosting.
6. Railway Trial có thể chặn tạo thêm dịch vụ: "Free plan resource provision limit exceeded". Không xóa dự án khác để né giới hạn. Có thể thử Vercel Hobby cho mục đích cá nhân phi thương mại theo điều khoản sử dụng của Vercel.

## Nghiệm thu bắt buộc trước khi dùng thật
- npm install, npm run check:syntax, npm run test:contracts, npm run test:catalog, npm run test:mvp, npm run typecheck, npm run build đều chạy thành công.
- Admin nhập đúng sách, bấm tạo 25 bài, đọc PDF 7–10 (Bài 1), đối chiếu chính xác công thức/ký hiệu/hình và duyệt.
- Giáo viên chọn Bài 1 → tạo AI → chỉnh sửa quiz → lưu → xuất PPTX có speaker notes → giao mã.
- Học sinh đăng nhập đúng vai trò, làm quiz; trước nộp không có đáp án; sau nộp thấy điểm và giải thích; giáo viên xem điểm đã lưu.
- Kiểm tra chế độ di động, quyền admin/teacher/student, đăng nhập lại, mã sai, nộp lặp, mạng chậm, chi phí API, quyền sử dụng SGK và dữ liệu cá nhân.

Công cụ luyện nói chỉ báo độ khớp lời nhận diện, không phải phép đo chất lượng phát âm.

## Gemini API
Hướng dẫn chuẩn tại `docs/06_GEMINI_API.md`. Kiểm thử cấu trúc request Gemini: `npm run test:gemini`. Không giả định đã kiểm thử gọi Gemini thực khi chưa có API key hợp lệ.
