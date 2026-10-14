# KIẾN TRÚC MODULE THƯ VIỆN SGK – EDUBRIDGE 1.1

## Sơ đồ luồng dữ liệu

Quản trị viên (admin)
  → tải **PDF SGK** vào Supabase Storage `edubridge-textbooks` (PRIVATE)
  → API `POST /api/admin/books` đọc số trang, lưu `textbooks`
  → chọn sách + trang đầu/cuối + tên bài
  → `POST /api/admin/lessons` lấy chữ trang được chọn, lưu `textbook_lessons` với `is_published=false`
  → admin đọc/sửa bản trích và bấm duyệt bằng `PATCH /api/admin/lessons/{id}`
  → `is_published=true`

Giáo viên (teacher)
  → đăng nhập → `/builder` (không có upload)
  → danh sách `textbooks` (active) + `textbook_lessons` (published)
  → chọn lớp → bộ sách → bài → cấp độ A2/B1/B2
  → `POST /api/ai/lesson` chỉ gửi `textbookLessonId,languageLevel,teacherNotes`
  → **MÁY CHỦ** tự đọc `source_text` được duyệt từ Supabase theo id
  → OpenAI API tạo nội dung JSON theo `LessonResultSchema`
  → lưu bảng `lessons` với `textbook_lesson_id` và `teacher_id`
  → giáo viên xem/sửa, tải PowerPoint.

## Bảng dữ liệu

- `profiles(id,full_name,role)`: `teacher`, `student`, `admin`. Chỉ SQL Editor của Supabase có thể cấp quyền admin.
- `textbooks(id,title,subject,grade,book_series,publisher,original_filename,storage_path,page_count,is_active,created_by)`: metadata sách. PDF nhị phân không nằm trong database; file nằm ở Supabase Storage private bucket.
- `textbook_lessons(id,textbook_id,sort_order,chapter,title,start_page,end_page,source_text,extraction_note,is_published,reviewed_by,reviewed_at)`: nội dung từng bài, duyệt trước khi chia sẻ cho giáo viên.
- `lessons(id,teacher_id,textbook_lesson_id,title,grade,source_text,generated_content,status,...)`: bài giảng cá nhân và bản chụp nội dung nguồn tại thời điểm tạo, thuận tiện tái kiểm chứng về sau.

## Thiết kế bảo mật

- Mọi API ghi kho SGK sử dụng `requireAdmin` để xác minh JWT + vai trò DB, **không tin vai trò tự khai trong request**.
- RLS: chỉ admin mới thêm/sửa thư viện, teacher chỉ đọc metadata sách active và bài published.
- Storage policies: chỉ admin được xem/nhập/xóa PDF trong `edubridge-textbooks`; bucket luôn `public=false`.
- API tạo bài không chấp nhận `sourceText` do giáo viên gửi. Client chỉ có quyền gửi `textbookLessonId`; server mới lấy nguồn từ cơ sở dữ liệu.
- RLS `lessons`: mỗi giáo viên chỉ thao tác với bài giảng do mình tạo.
- OpenAI API key chỉ có ở server.

## Các giới hạn cần ghi nhận

- Vùng trang là số trang thực trong PDF. Mỗi trang chỉ lấy phần text trong PDF; hình và biểu thức có thể bị thiếu, đảo thứ tự hoặc sai chỉ số. Đây là lý do cần **hậu kiểm của quản trị viên** và chỉ xuất bản sau khi duyệt.
- PDF scan cần bản văn chữ riêng có kiểm chứng; app **không tích hợp OCR tự động**.
- Trích xuất tối đa 25 trang/lần, text 250–30.000 ký tự, tệp tối đa 30 MB.
- Chưa có trình nhập mục lục tự động, chưa nhúng hình gốc vào PowerPoint, chưa xử lí quyền sử dụng nội dung SGK đối với bên thứ ba.
- Trước khi triển khai cho trường khác, kiểm tra quy định bản quyền SGK, điều khoản API và bảo vệ dữ liệu học sinh.
