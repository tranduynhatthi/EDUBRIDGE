# EDUBRIDGE 1.9.2 – Bản khung miễn phí API khi Gemini 429

Nút **Tạo bản khung KHÔNG dùng AI** ở màn hình Chọn bài giúp tạo 8 slide khung và 5 mục câu hỏi chờ soạn từ học liệu đang được chọn. Không gọi Gemini, không dịch nguồn, không bịa kiến thức hoặc đáp án.

Giáo viên có thể xem trích đoạn nguồn trên slide, chỉnh sửa script, bố cục và 5 câu hỏi ở trang bài. Bài lưu dưới dạng **draft** với nhãn `offline-template`, cảnh báo hậu kiểm. Không thể đánh dấu đã rà soát khi còn dấu `[CHƯA_SOẠN]`. Không thể giao bài nếu chưa đánh dấu reviewed.

Lỗi `GEMINI_QUOTA_LIMIT` là phản hồi HTTP 429 từ Google, có thể liên quan RPM, TPM, RPD hoặc hạn mức tài khoản. Xem Google AI Studio → Dashboard → Usage và Rate limits/Billing của đúng Google project; không tạo nhiều API keys trong cùng project để lách quota.

Lô nhập nhanh 25 bài SGK vẫn paused; chức năng offline chỉ dùng truy cập Supabase. Các template không thay thế bài giảng EMI/CLIL do Gemini tạo và không tự động đánh giá chất lượng kiến thức.
