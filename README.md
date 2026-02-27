<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3a1e112d-4c96-4047-8a98-8aa7daf99217

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
   - Legacy fallback is supported: `API_KEY`
3. Run the app:
   `npm run dev`

## Triển khai lên Vercel: lỗi thường gặp và cách sửa

### 1) Lỗi thiếu biến môi trường Gemini
**Triệu chứng**
- Runtime error kiểu: `GEMINI_API_KEY ... not set`

**Cách sửa**
- Vào **Vercel Project → Settings → Environment Variables**
- Thêm `GEMINI_API_KEY` cho môi trường Production (và Preview nếu cần)
- Redeploy sau khi thêm biến

---

### 2) API `/api/*` không chạy hoặc trả 404
**Nguyên nhân**
- Dự án hiện tại chạy bằng `tsx server.ts` (Express + Vite middleware) theo mô hình server dài hạn.
- Vercel mặc định ưu tiên mô hình serverless/function, nên cần tách rõ backend function.

**Cách sửa đề xuất**
- Tách backend sang `api/` (serverless function) hoặc host backend riêng (Railway/Render/Fly.io).
- Frontend vẫn deploy ở Vercel, gọi API qua biến môi trường base URL.
- Nếu backend chạy domain khác (ví dụ Railway/Render), thêm biến frontend `VITE_API_BASE_URL` trên Vercel, ví dụ:
  - `VITE_API_BASE_URL=https://your-backend-domain.com`
- Sau đó redeploy để các lệnh `POST /api/reports` không còn gọi nhầm vào domain frontend gây 404.

---

### 3) WebSocket không hoạt động ổn định
**Nguyên nhân**
- Vercel serverless không phù hợp cho kết nối WebSocket stateful lâu dài.

**Cách sửa đề xuất**
- Chuyển WebSocket sang dịch vụ realtime chuyên dụng (Pusher/Ably/Supabase Realtime) hoặc backend riêng có process dài hạn.

---

### 4) SQLite (`better-sqlite3`) không phù hợp production serverless
**Nguyên nhân**
- Serverless filesystem là ephemeral, không đảm bảo dữ liệu bền vững khi scale/restart.

**Cách sửa đề xuất**
- Dùng DB managed (PostgreSQL/MySQL, ví dụ Neon/Supabase/PlanetScale).
- Với Vercel production: tránh phụ thuộc lưu trữ file cục bộ `.db` để giữ dữ liệu.
