# EDUBRIDGE 1.7.3 – Sửa lỗi đọc PDF trong chế độ Giáo viên tự nhập SGK

Cấu hình /api/ai/source-pdf giờ hỗ trợ PDF 1–10 trang dưới 4 MiB, kiểm tra trước tệp và số trang, trích xuất PDF ảnh thành ghi chú từ Gemini. Khi bản ghi chú dưới 250 ký tự sẽ thử đọc bổ sung hai nhóm trang; nếu có nội dung ngắn vẫn hiển thị để giáo viên bổ sung, thay vì bỏ trắng.

**Mã lỗi dễ hiểu**: FILE_UPLOAD_FAILED (gửi tệp thất bại), UPLOAD_TOO_LARGE, BAD_PDF_SIGNATURE, PDF_PARSE_FAILED, PDF_PAGE_RANGE, GEMINI_* (API/model/hạn mức/timeout), GEMINI_NOTES_STRUCTURE, PDF_NO_CONTENT.

Không gửi PDF cả cuốn vào chế độ giáo viên. Dùng Quản trị SGK cho sách đầy đủ có quyền sử dụng. PDF tải lên được gửi đến Google Gemini; không đưa tài liệu có nội dung bí mật, chỉ dùng SGK có quyền khai thác.

Không tuyên bố đã đọc được PDF thực từ tài khoản người dùng chỉ vì GitHub Actions build thành công: cần thử trên website sau triển khai, quan sát mã lỗi nếu có và hậu kiểm từng công thức/đáp án.
