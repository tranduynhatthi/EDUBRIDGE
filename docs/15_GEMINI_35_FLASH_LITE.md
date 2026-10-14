# EDUBRIDGE 1.10 – Gemini Flash-Lite mặc định

- **Tiêu chuẩn:** Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`) cho bài giảng, từ điển và luyện nói.
- **Chuyên sâu:** Gemini 3.8 Flash (`gemini-3.8-flash`) cho PDF/OCR và bài giảng chỉ khi giáo viên chọn “Chuyên sâu”. Không tự động chuyển model khi hết quota.
- Do Vercel connector hiện trả 403 khi đọc/sửa Environment Variables, mã chạy server lựa chọn model Tiêu chuẩn theo `selectGeminiModel('standard')`, **không** kế thừa biến cũ `GEMINI_MODEL` có thể vẫn đặt thành 3.8 trên Vercel. Model PDF tôn trọng `GEMINI_VISION_MODEL` nếu có, nếu không dùng 3.8.
- Khi khôi phục quyền Vercel, vào Settings → Environment Variables để đồng bộ giá trị hiển thị: GEMINI_MODEL=gemini-3.5-flash-lite, GEMINI_VISION_MODEL=gemini-3.8-flash. Không cần đổi API key.
- Không có lượt gọi Gemini trong kiểm thử tự động. Mở trang không gọi API. Nhấn Tạo bài, đọc PDF hoặc tra cứu mới tiêu quota của model tương ứng.
- Build/READY chỉ chứng minh website triển khai, chưa chứng minh model còn hạn mức và tạo bài thực tế thành công. Hậu kiểm nội dung trước khi sử dụng với học sinh.
