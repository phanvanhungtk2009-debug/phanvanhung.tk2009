# Đề xuất nhiệm vụ sau khi rà soát mã nguồn

## 1) Nhiệm vụ sửa lỗi đánh máy / đặt tên
**Vấn đề phát hiện**
- Tài liệu yêu cầu cấu hình biến môi trường `GEMINI_API_KEY`, trong khi mã thực tế lại đọc `API_KEY`.
- Đây là một dạng “typo/đặt tên không nhất quán” dễ làm người triển khai cấu hình sai ngay từ bước đầu.

**Nhiệm vụ đề xuất**
- Chuẩn hóa tên biến môi trường về **một chuẩn duy nhất** (ưu tiên `GEMINI_API_KEY` để rõ nghĩa).
- Cập nhật `services/geminiService.ts` để đọc biến đã chuẩn hóa (hoặc hỗ trợ fallback tương thích ngược trong giai đoạn chuyển đổi).
- Cập nhật README theo đúng tên biến cuối cùng.

---

## 2) Nhiệm vụ sửa lỗi logic
**Vấn đề phát hiện**
- Trong nhánh migration của `database.ts`, khi thiếu user `"quản trị viên"`, code chèn **cả** `"quantrivien"` và `"quản trị viên"`.
- Nếu CSDL đã có `"quantrivien"` nhưng chưa có `"quản trị viên"`, thao tác chèn lại `"quantrivien"` có thể vi phạm `UNIQUE` ở cột `username` và làm lỗi khởi tạo.

**Nhiệm vụ đề xuất**
- Tách kiểm tra tồn tại cho từng username và chỉ chèn user nào còn thiếu.
- Bọc phần seed/migration bằng cơ chế idempotent rõ ràng (ví dụ `INSERT OR IGNORE`) để tránh lỗi khi khởi động lại nhiều lần.

---

## 3) Nhiệm vụ sửa chú thích/sai khác tài liệu
**Vấn đề phát hiện**
- Comment ở route đăng ký ghi “New registrations are 'pending' by default…”, nhưng code thực tế gán trạng thái `'active'` ngay lập tức.
- Chú thích hiện tại dễ gây hiểu nhầm cho người bảo trì vì không phản ánh đúng hành vi runtime.

**Nhiệm vụ đề xuất**
- Cập nhật comment để phản ánh đúng hành vi hiện tại **hoặc** đổi logic code để thực sự tạo user ở trạng thái `pending` rồi thêm luồng duyệt.
- Chốt rõ quyết định nghiệp vụ trong tài liệu kỹ thuật ngắn (README hoặc docs nội bộ).

---

## 4) Nhiệm vụ cải thiện quy trình kiểm thử
**Vấn đề phát hiện**
- `package.json` mới có `lint`, `build`, `dev`, `preview`, chưa có bộ test tự động cho API/migration.
- Các lỗi hồi quy ở migration/khởi tạo DB rất dễ lọt.

**Nhiệm vụ đề xuất**
- Thêm test tự động cho các luồng quan trọng:
  - Migration idempotent cho bảng `users`.
  - Đăng ký/đăng nhập (`/api/auth/register`, `/api/auth/login`).
  - Tạo report và cập nhật trạng thái report.
- Thêm script `npm test` và chạy trong CI cùng `npm run lint` + `npm run build`.
