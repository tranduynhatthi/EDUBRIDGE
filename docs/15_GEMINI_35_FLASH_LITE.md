# EDUBRIDGE 1.10 – Gemini Flash-Lite mặc định

- **Tiêu chuẩn:** Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`) cho bài giảng, từ điển và luyện nói.
- **Chuyên sâu:** Gemini 3.8 Flash (`gemini-3.8-flash`) cho PDF/OCR và bài giảng chỉ khi giáo viên chọn “Chuyên sâu”. Không tự động chuyển model khi hết quota.
- **Đã đồng bộ Production trên Vercel:** `GEMINI_MODEL=gemini-3.5-flash-lite` và `GEMINI_VISION_MODEL=gemini-3.8-flash` qua kết nối dự án trực tiếp. Không thay đổi `GEMINI_API_KEY`.
- Mã server chọn model Tiêu chuẩn theo `selectGeminiModel('standard')`, không phụ thuộc biến legacy `GEMINI_MODEL`; chọn Chuyên sâu chỉ dùng 3.8, còn PDF đọc cấu hình `GEMINI_VISION_MODEL` khi có (Production hiện là 3.8).
- Không có lượt gọi Gemini trong kiểm thử tự động. Mở trang không gọi API. Nhấn Tạo bài, đọc PDF hoặc tra cứu mới tiêu quota của model tương ứng.
- Build/READY chỉ chứng minh website triển khai, chưa chứng minh model còn hạn mức và tạo bài thực tế thành công. Hậu kiểm nội dung trước khi sử dụng với học sinh.
