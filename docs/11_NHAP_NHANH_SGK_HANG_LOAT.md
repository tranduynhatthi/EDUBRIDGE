# EDUBRIDGE 1.8 – Nhập nhanh SGK hàng loạt

## Cài đặt trên Supabase
Database migration: supabase/08_bulk_import_queue.sql. Edge Function: supabase/functions/edubridge-bulk-worker/index.ts. pg_cron + pg_net chạy kiểm tra mỗi phút nhưng KHÔNG gọi Edge Function khi không có batch running.

## Quan trọng: chưa phát sinh chi phí Gemini
Tất cả lô mới đều PAUSED. Chỉ Admin có thể xác nhận phí để chuyển sang RUNNING; không tự động bắt đầu khi triển khai.

## Bước còn cần thực hiện
Supabase Dashboard → Edge Functions → Secrets → thêm GEMINI_API_KEY từ Google AI Studio. Vercel GEMINI_API_KEY không tự chuyển sang Supabase. Không đưa khóa vào GitHub hoặc chat.

## Sử dụng
Quản trị SGK → chọn sách Vật lí 12 (126 trang) → Nhập nhanh SGK hàng loạt → Chuẩn bị danh sách. Xem danh sách các bài, số lượt thử, trạng thái, tiến độ. Sau khi chủ tài khoản đồng ý chi phí, bấm Bắt đầu đọc hàng loạt (có phí) và xác nhận.
Worker xử lý từng bài một và tối đa ba lần/bài; kết quả chỉ được lưu BẢN NHÁP. Quản trị viên đối chiếu từng công thức, hình, đơn vị, dữ kiện với sách gốc; nhấn Duyệt thì giáo viên mới xem được ngay.
Admin có thể Tạm dừng, Hủy, Thử lại bài lỗi. Đóng trình duyệt không dừng được cron.

## Hạn chế
Đã kiểm tra cấu trúc code và triển khai Supabase, nhưng chưa kiểm thử gọi Gemini trên 25 bài vì chưa có sự đồng ý về phí. Worker chạy trên Supabase Free Edge giới hạn bộ nhớ/CPU/thời gian; PDF ảnh lớn có thể thất bại. Chỉ dùng SGK có quyền khai thác.
Worker Edge verify_jwt=false nhưng bắt buộc kiểm tra custom 256-bit worker token bằng RPC chỉ service_role được phép gọi; token chỉ lưu trong private schema của PostgreSQL.