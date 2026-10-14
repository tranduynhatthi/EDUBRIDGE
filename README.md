# EDUBRIDGE MVP 1.2 – SGK Vật lí 12 (Kết nối tri thức)

**Mục tiêu:** Quản trị viên tải đúng tệp `SGK Vật lí 12-mau.pdf` (126 trang) lên hệ thống một lần, nhấn nút tạo **25 mục bài học**, sau đó AI giúp chuẩn bị bản nháp nội dung từ **trang PDF dạng ảnh**, quản trị viên hậu kiểm từng bài. Giáo viên đăng nhập chỉ việc **chọn lớp 12 → chọn bộ sách → chọn bài đã duyệt → Tạo bài dạy bằng AI**.

**Trạng thái giao hàng:** Đã viết mã nguồn và lập mục lục chính xác theo PDF người dùng cung cấp. Chưa triển khai lên máy chủ của bạn; chưa gọi OpenAI API hoặc Supabase thực tế. **25 mục đều khởi tạo dưới dạng NHÁP**, không giả định đã có bản tóm tắt chính xác và không tự công bố.

## 1. Tệp mới trong bản 1.2

- `catalog/physics12_25_bai.csv`: toàn bộ 25 bài, 4 chương, số trang in và trang PDF tương ứng. Mở được bằng Excel.
- `catalog/physics12_25_bai.json` và `src/data/physics12-ktst.json`: danh mục dùng trong WebApp; có dấu vân tay SHA-256 **đúng tệp PDF người dùng gửi** để tránh nhầm với ấn bản khác.
- `supabase/03_seed_scanned_pdf.sql`: cho phép mục bài nháp chưa có văn bản; cấm công bố bài không có nội dung.
- `src/app/api/admin/catalog-seed/route.ts`: thêm một lần 25 mục vào đúng đầu sách, không tạo lại số thứ tự đã có.
- `src/app/api/admin/lessons/[id]/analyze-pdf/route.ts`: máy chủ tải PDF riêng tư, **cắt đúng trang bài học** và chuyển đến OpenAI model có thể đọc hình ảnh PDF, tạo GHI CHÚ NGUỒN BẢN NHÁP cho người quản trị kiểm tra. Không cần OCR cài trên máy.
- `src/app/admin/library/page.tsx`: nút nhập mục lục tự động và nút đọc PDF ảnh từng bài.
- `src/app/builder/page.tsx`: mặc định lớp 12.

**Không có bản PDF sách giáo khoa trong ZIP**. Hãy dùng lại **chính file đã gửi** để nhập vào hệ thống. PDF gốc chỉ nằm trong storage Private của Supabase do bạn điều hành.

## 2. Cài từ đầu trên Windows (đúng thứ tự)

1. Cài Node.js >=22 từ https://nodejs.org/ và Visual Studio Code từ https://code.visualstudio.com/.
2. Giải nén ZIP; mở **thư mục `EDUBRIDGE_MVP_1_2_SGK12` chứa `package.json`** bằng Visual Studio Code.
3. Vào https://supabase.com/dashboard → New Project → SQL Editor, **chạy tuần tự:**
   - `supabase/01_schema.sql`
   - `supabase/02_textbook_library.sql`
   - `supabase/03_seed_scanned_pdf.sql`
4. Supabase → Project Settings → API Keys, lấy Project URL và publishable key; tạo tài khoản OpenAI API, thiết lập thanh toán/hạn mức.
5. Tạo `.env.local` bằng cách sao chép `.env.example`, rồi điền:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
OPENAI_API_KEY=sk-YOUR_KEY
OPENAI_MODEL=gpt-5.4-mini
OPENAI_VISION_MODEL=gpt-5.4-mini
```

`OPENAI_MODEL` và `OPENAI_VISION_MODEL` phải là model có thật và tài khoản API của bạn **được phép sử dụng**; model đọc PDF phải hỗ trợ vision và file input. Tên trong ví dụ là tham số tùy chỉnh; nếu API báo “model not found”, thay bằng model đã được cấp quyền. **ChatGPT Plus và OpenAI API tính phí riêng.** Không chia sẻ `.env.local`.

6. Trong VS Code → Terminal → New Terminal, chạy:

```bash
npm install
npm run test:contracts
npm run test:catalog
npm run dev
```

7. Mở http://localhost:3000 → đăng ký tài khoản giáo viên và xác nhận email (nếu Supabase yêu cầu) → đăng nhập.
8. Cấp quyền quản trị bằng **SQL Editor** (thay email cho đúng tài khoản vừa đăng ký):

```sql
update public.profiles set role='admin'
where id=(select id from auth.users where email='EMAIL_QUAN_TRI_CUA_BAN');
```

Làm mới trình duyệt. Sẽ xuất hiện mục **Quản trị SGK**.

## 3. Nhập chính tệp sách đã cung cấp – một lần

1. Menu **Quản trị SGK**.
2. Phần “Nhập một bộ SGK”: tên **Vật lí 12**; lớp **12**; bộ sách **Kết nối tri thức với cuộc sống**; nhà xuất bản **Nhà xuất bản Giáo dục Việt Nam**.
3. Bấm **Chọn PDF SGK** và tải đúng tệp `SGK Vật lí 12-mau.pdf` 126 trang, dung lượng gần 23 MB, lên Supabase (giới hạn dưới 30 MB).
4. Khi thấy thông báo tải thành công, ở **2A – Tự động nhập danh mục 25 bài**, bấm **Nhập danh mục 25 bài từ SGK đã tải**.
5. Máy chủ xác minh SHA-256 của PDF. Nếu tệp KHÔNG trùng chính xác tệp đã đối chiếu, không áp dụng danh mục để tránh trộn sai trang. Trường hợp tệp được chỉnh sửa/nén lại, cần lập mục lục mới hoặc khai báo thủ công.
6. Mở “Danh mục bài đã nhập”, sẽ thấy **Bài 1 … Bài 25**, tất cả trạng thái **Bản nháp**.

### Xử lí SGK PDF dạng ảnh quét

7. Chọn **Bài 1. Cấu trúc của chất. Sự chuyển thể** → bấm **AI đọc PDF bài này → Tạo nguồn nháp**. Máy chủ chỉ gửi các trang PDF **7–10** tương ứng trang SGK in **6–9**, không gửi cả cuốn.
8. Đợi AI phân tích PDF và tạo nguồn bản nháp tiếng Việt (tốn phí OpenAI API). Thời gian tùy model và máy chủ, có thể quá giới hạn khi dùng hosting miễn phí.
9. Trong ô nội dung, xem bản nháp, kiểm tra nguồn PDF **đối với mọi công thức, kí hiệu, hình và đơn vị**, chỉnh sửa cho chính xác. AI có thể nhận nhầm chỉ số trên, dấu hoặc biểu đồ.
10. Chỉ khi đối chiếu xong mới đánh dấu **Đã đối chiếu và hậu kiểm** → bấm **Duyệt và cho giáo viên chọn**.
11. Tiếp tục với bài tiếp theo; có thể duyệt dần, không bắt buộc duyệt đủ 25 bài trước khi giáo viên thử bài 1.

**Phân biệt:** `Danh mục (25 bài)` **không đồng nghĩa** `Nội dung nguồn đã được xử lý/được duyệt (số bài tùy tiến độ)`. Giáo viên chỉ thấy các bài `is_published = true`.

## 4. Giáo viên chỉ chọn bài (không tải file)

1. Đăng nhập tài khoản giáo viên → trang **Chọn bài học từ sách giáo khoa**.
2. Môn **Vật lí** → lớp **12** → bộ **Kết nối tri thức với cuộc sống**.
3. Chọn **Bài 1** hoặc bài khác đã được quản trị viên hậu kiểm.
4. Chọn A2 / B1 / B2; phần hướng dẫn riêng không bắt buộc.
5. Bấm **Tạo bài dạy bằng AI**. Hệ thống lấy ghi chú nguồn đã duyệt từ cơ sở dữ liệu để tạo mục tiêu, thuật ngữ, lời giảng, slide, quiz. Không yêu cầu tải PDF hoặc nhập văn bản.
6. Kiểm tra, sửa bài dạy, lưu và tải PowerPoint. Công thức, đơn vị, đáp án quiz vẫn phải được giáo viên kiểm duyệt.

## 5. Bảng phân bố trang PDF (không tính trang mở đầu chương)

| Chương | Bài | Trang in SGK | Trang PDF |
|---|---:|---:|---:|
| I. Vật lí nhiệt | 1–7 | 6–32 | 7–33 |
| II. Khí lí tưởng | 8–13 | 34–54 | 35–55 |
| III. Từ trường | 14–20 | 56–89 | 57–90 |
| IV. Vật lí hạt nhân | 21–25 | 91–122 | 92–123 |

Xem CSV để biết chính xác từng bài. PDF trang **6, 34, 56, 91** là các trang **mở đầu chương**; không gộp vào bài trong MVP này. Sách có thêm phần thuật ngữ/trang cuối nằm ngoài bài 25.

## 6. Bảo mật, bản quyền và chi phí

- Tệp PDF nằm trong bucket **Private**; chỉ admin được phép upload/read.
- Công cụ `AI đọc PDF` chỉ gọi từ API có xác thực admin; truy vấn source lesson qua Supabase RLS.
- Văn bản từ PDF có thể chứa chỉ dẫn lạ; ứng dụng coi đây là dữ liệu, không phải lệnh.
- Chỉ dùng tệp SGK mà nhóm được phép sử dụng và chỉ chia sẻ học liệu tạo ra theo phạm vi quyền được cấp. Nền tảng không cấp quyền phát hành lại nội dung hay ảnh sách cho người khác.
- Khi gọi OpenAI để đọc ảnh sách, **trang PDF bài học sẽ được gửi đến dịch vụ API**. Xác nhận chính sách xử lý dữ liệu, quyền sử dụng và phí API trước khi bật chức năng.
- Chưa tích hợp giới hạn người dùng/cost limit toàn hệ thống, chương trình giám sát thực tế, xử lí đồng thời nhiều admin, hay luồng học sinh. Không mở rộng công khai trước khi có kiểm thử bảo mật và giới hạn AI.

## 7. Thử nghiệm chấp nhận sản phẩm

- [ ] Đăng nhập teacher không thấy trang/API admin.
- [ ] Admin upload đúng PDF 126 trang; nhấn nút một lần thấy đúng **25 bài / 4 chương** (nháp).
- [ ] Nhấn lần hai không tạo thêm mục bài bị trùng.
- [ ] Admin dùng AI đọc bài 1 (trang PDF 7–10), nhận bản nháp và ghi chú cảnh báo nếu cần.
- [ ] Trước khi duyệt, teacher KHÔNG thấy bài 1.
- [ ] Sau khi admin chỉnh sửa và duyệt, teacher thấy bài 1 trong dropdown.
- [ ] Teacher chọn bài 1, AI tạo bài dạy và lưu vào Supabase.
- [ ] Xuất PowerPoint tải được, sửa được nội dung slide trong PowerPoint.
- [ ] Teacher khác không xem được bài dạy riêng của teacher thứ nhất.

## 8. Trạng thái kiểm chứng tại thời điểm giao mã

Đã đối chiếu **mục lục SGK và số trang 25 bài**, kiểm tra cấu trúc tệp bằng công cụ đọc PDF cục bộ; đã viết các endpoint, giao diện và bài kiểm tra tĩnh. **Chưa thể kiểm thử tích hợp với một Supabase/OpenAI account thật** vì không có khóa API và môi trường deployment. Nếu trong quá trình cài đặt phát sinh lỗi, hãy gửi ảnh màn hình/thông báo từ terminal để sửa theo đúng môi trường của bạn.

## Phiên bản mở rộng – hoàn chỉnh chu trình Bài 1

Xem **`docs/04_BAI1_QUY_TRINH_KHEP_KIN.md`**. Chạy tiếp `supabase/04_bai1_student_cycle.sql` sau các migration 01–03. Đã bổ sung giao diện tài khoản học sinh, giáo viên giao bài bằng mã, học/quiz/lưu điểm và bảng kết quả; giáo viên có thể chỉnh sửa đáp án quiz trước khi giao. Hai bộ nội dung tham chiếu ở `sample-data/bai1_nguon_da_doi_chieu_can_hau_kiem.txt` và `sample-data/bai1_baiday_songngu_mau.json` là **dữ liệu mẫu, không tự nạp, không phải kết quả đã chạy AI**. Cần cài npm, cấu hình API, chạy SQL và kiểm thử thật trước khi sử dụng lớp học. Nếu sách PDF quét khó nhận diện, không phê duyệt bài trước khi đối chiếu từng hình/công thức.
