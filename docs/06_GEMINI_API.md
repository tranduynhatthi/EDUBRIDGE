# EDUBRIDGE 1.5 – Chuyển sang Google Gemini API

## Tình trạng
- Hai API AI đã dùng Gemini qua REST trên máy chủ Next.js, không gửi API key cho trình duyệt.
- Đọc PDF SGK dạng ảnh: Gemini nhận `inlineData` PDF từ các trang đã cắt, tạo bản nháp để quản trị viên hậu kiểm.
- Tạo giáo án EMI/CLIL: Gemini nhận nguồn đã duyệt, tạo bài dạy JSON và được kiểm tra bằng Zod trước khi lưu.
- Không cần sửa database Supabase; 6 bảng và SQL RLS hiện vẫn được dùng.
- Chưa kiểm thử với khóa Gemini thật; chạy `npm run test:gemini` chỉ là kiểm thử giả lập, không phải xác nhận quota hay chất lượng model.

## Tạo Gemini API key
1. Đăng nhập https://aistudio.google.com/apikey bằng tài khoản Google.
2. Chọn Create API key và dự án Google Cloud phù hợp. Quyền truy cập model và phí phụ thuộc dự án/tài khoản.
3. Không dán key vào GitHub, mã nguồn, ảnh chụp màn hình hay hội thoại.

## Thêm các biến tại Vercel
- Trang: https://vercel.com/tranduynhatthy-9353/edubridge/settings/environment-variables
- `NEXT_PUBLIC_SUPABASE_URL=https://rliaepxtcnjpgeagxmxi.supabase.co` (biến công khai)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key từ Supabase (biến công khai)
- `GEMINI_API_KEY`: API key Google AI Studio (**secret**, chọn Encrypted/Sensitive nếu có)
- `GEMINI_MODEL=gemini-3.8-flash`
- `GEMINI_VISION_MODEL=gemini-3.8-flash`
- Đặt Production (và Preview nếu cần). Vercel → Deployments → Redeploy sau khi lưu.
- Nếu model không được cấp quyền/không còn tồn tại, kiểm tra danh mục model AI Studio và cập nhật biến, không sửa mã nguồn.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_VISION_MODEL` không còn dùng trong EDUBRIDGE 1.5.

## Kiểm thử Bài 1
1. Mở website Vercel, đăng ký giáo viên qua Supabase và xác nhận email theo cấu hình Auth.
2. Cấp admin thủ công theo hướng dẫn README; không tự cấp admin qua giao diện.
3. Admin tải đúng PDF SGK 126 trang có quyền sử dụng, tạo 25 mục, chọn Bài 1 PDF trang 7–10.
4. Bấm AI đọc PDF, kiểm tra dữ liệu nguồn, duyệt sau khi đối chiếu công thức/hình/số liệu.
5. Giáo viên chọn Bài 1, tạo bài bằng Gemini, sửa quiz, lưu, xuất PPTX và giao mã.
6. Học sinh đăng nhập, nhập mã, học và làm quiz; kiểm tra kết quả và phân quyền giáo viên.

## Bảo mật, phí và giới hạn
- Các đoạn PDF của bài đang đọc sẽ được gửi tới dịch vụ Gemini API. Kiểm tra giấy phép SGK và chính sách dữ liệu trước khi gửi.
- Gemini API có giới hạn số lần gọi/tokens và giá theo dự án Google; không nhầm gói ChatGPT với Google AI API.
- Hạn mức Hosting Vercel theo gói; việc cắt PDF và đọc ảnh có thể tốn thời gian, tùy giới hạn function của gói.
- JSON hợp lệ không đảm bảo đúng kiến thức Vật lí; mọi công thức, thuật ngữ, đơn vị, đáp án đều cần giáo viên hậu kiểm.
