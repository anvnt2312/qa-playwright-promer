# Bug Report Skill — Viết Bug Report chuẩn

## Mô tả
Skill này tạo bug report đầy đủ và chuẩn mực khi tìm thấy lỗi trong quá trình test. Bug report tốt giúp dev hiểu lỗi nhanh hơn và fix đúng chỗ.

## Khi nào dùng
- Khi một test case bị FAIL và cần báo cáo lỗi cho dev
- Khi tìm thấy lỗi lúc test thủ công
- Khi sếp hỏi "lỗi này là lỗi gì, nghiêm trọng không?"
- Sau khi chạy test để tổng hợp danh sách bug

---

## Nhiệm vụ chính

Khi tôi mô tả một lỗi tìm thấy khi chạy test, hãy tự động tạo bug report theo chuẩn dưới đây.

---

## Template Bug Report

```markdown
## [BUG-XXX] Tiêu đề ngắn gọn mô tả lỗi

### Thông tin chung / General Info
| Trường       | Giá trị                        |
|---|---|
| ID           | BUG-XXX                        |
| Severity     | Critical / High / Medium / Low |
| Priority     | P1 / P2 / P3                   |
| Feature      | Login / Dashboard / Form / Search |
| Môi trường   | https://app.promer.ai          |
| Browser      | Chrome / Firefox / Safari      |
| Ngày tìm     | YYYY-MM-DD                     |
| Tester       | [Tên]                          |

### Mô tả lỗi / Bug Description
<!-- Mô tả ngắn gọn lỗi là gì -->

### Các bước tái hiện / Steps to Reproduce
1. Bước 1...
2. Bước 2...
3. Bước 3...

### Kết quả thực tế / Actual Result
<!-- Điều gì xảy ra -->

### Kết quả mong đợi / Expected Result
<!-- Điều gì phải xảy ra -->

### Severity Guide
| Level    | Khi nào dùng                                      |
|---|---|
| Critical | App crash, data mất, không thể login               |
| High     | Chức năng chính bị vỡ, ảnh hưởng nhiều user        |
| Medium   | Chức năng phụ bị lỗi, có workaround                |
| Low      | UI sai nhỏ, typo, màu sắc, spacing                 |

### Screenshot / Video
<!-- Đính kèm file từ test-results/ hoặc playwright-report/ -->

### Test Case liên quan
<!-- Ví dụ: login.spec.js → [PERF] EC-1.7 -->

### Ghi chú thêm / Notes
<!-- Môi trường đặc biệt, frequency, workaround tạm thời -->
```

---

## Severity & Priority Matrix

| Severity \ Frequency | Thường xuyên | Đôi khi | Hiếm khi |
|---|---|---|---|
| Critical             | P1           | P1       | P2        |
| High                 | P1           | P2       | P2        |
| Medium               | P2           | P2       | P3        |
| Low                  | P3           | P3       | P3        |

---

## Ví dụ bug report đã điền

```markdown
## [BUG-001] Trang login load chậm hơn 3 giây

| Trường   | Giá trị              |
|---|---|
| ID       | BUG-001              |
| Severity | Medium               |
| Priority | P2                   |
| Feature  | Login                |
| Browser  | Chrome 124           |
| Ngày tìm | 2026-05-07           |

### Mô tả
Trang /sign-in mất 3.6–4.2 giây để load, vượt ngưỡng SLA 3 giây.

### Các bước tái hiện
1. Mở trình duyệt Chrome ở chế độ incognito
2. Truy cập https://app.promer.ai/sign-in
3. Bấm F12 → Network → đo thời gian

### Kết quả thực tế
Trang load 3.6–4.2 giây (đo bằng Playwright Date.now())

### Kết quả mong đợi
Trang load dưới 3000ms theo SLA

### Test Case liên quan
tests/specs/login.spec.js → [PERF] EC-1.7
```

---

## Lệnh tìm screenshot và video để đính kèm

```bash
# Xem tất cả screenshot từ test mới nhất
ls test-results/**/test-failed-*.png

# Mở HTML report để xem video
npx playwright show-report playwright-report/
```
