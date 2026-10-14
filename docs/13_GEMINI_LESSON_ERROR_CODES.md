# EDUBRIDGE 1.9.1 – Chẩn đoán lỗi Tạo bài dạy với Gemini

Sửa API `/api/ai/lesson` và trang Chọn bài. Giảm độ dài bắt buộc trong 8 slide (3 bullet/slide, teacherScript ≤65 từ) và tăng maxOutputTokens lên 18.000, mức suy luận low được giữ nguyên. Không làm thêm một lần gọi Gemini tự động hoặc gọi Gemini trong kiểm thử.

Mã lỗi mới hiện ngay trên giao diện: GEMINI_QUOTA_LIMIT, GEMINI_OUTPUT_TRUNCATED, GEMINI_INVALID_JSON, GEMINI_TIMEOUT, GEMINI_KEY_OR_PERMISSION, GEMINI_MODEL_NOT_FOUND, GEMINI_BAD_REQUEST, LESSON_SCHEMA_INVALID (ghi đường dẫn trường dữ liệu thiếu), LESSON_QUALITY_CHECK_FAILED và LESSON_SAVE_FAILED (Supabase).

Lỗi mất kết nối hoặc HTML từ Vercel (không có JSON) được hiển thị với HTTP status, không còn trông giống lỗi nội dung Gemini.

Đã từng kiểm tra nút Gemini health kết nối được trong Admin; điều này không chứng minh Gemini tạo bài đầy đủ thành công. Cần kiểm chứng trực tiếp trên tài khoản giáo viên qua website. Không chia sẻ khóa API, hãy gửi mã lỗi nếu có.

Không phát sinh xử lý OCR hàng loạt: batch SGK vẫn tạm dừng. Việc người dùng nhấn Tạo bài có thể tiêu quota/billing Gemini cho một lần yêu cầu.
