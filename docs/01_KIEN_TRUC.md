# EDUBRIDGE MVP 1.1 – TÀI LIỆU KIẾN TRÚC

Phiên bản này thay thế luồng giáo viên tự tải PDF/DOCX mỗi lần soạn bài bằng **thư viện SGK tập trung**. Xem tài liệu triển khai chính thức ở `README.md` và chi tiết thiết kế ở `docs/02_KHO_SGK.md`.

```mermaid
flowchart TD
    ADMIN[Quản trị nội dung] --> UP[Nhập SGK PDF một lần]
    UP --> P[(Supabase Storage PRIVATE)]
    ADMIN --> EX[Chọn số trang và trích chữ từng bài]
    P --> EX
    EX --> RV[Hậu kiểm kiến thức và duyệt bài]
    RV --> DB[(Supabase textbooks và textbook_lessons)]
    GV[Giáo viên đăng nhập] --> SEL[Chọn lớp, bộ sách, bài học]
    DB --> SEL
    SEL --> API[Next.js API server]
    API --> DB
    API --> AI[OpenAI Structured Outputs]
    AI --> OUT[Bài dạy song ngữ, từ vựng, slide, quiz]
    OUT --> LES[(Supabase lessons + RLS)]
    LES --> EDIT[Giáo viên chỉnh sửa và xuất PPTX]
```

**Bảo mật:** Quản trị viên được cấp role `admin` bằng Supabase SQL Editor; người dùng thường không thể tự nâng quyền; PDF SGK gốc không công khai; API soạn bài chỉ chấp nhận ID bài SGK đã duyệt, không nhận văn bản người dùng tự tải lên.

**Giới hạn:** Chưa tự phát hiện mục lục/chia bài từ cả quyển PDF; số trang do quản trị viên xác định, sau đó trích từng bài. Chưa có OCR tự động, LMS hay đánh giá giọng nói.
