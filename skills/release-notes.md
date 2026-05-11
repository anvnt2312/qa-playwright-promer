# Release Notes Skill — Tóm tắt kết quả test cho team/sếp

## Mô tả
Skill này tạo bản tóm tắt kết quả test sau mỗi sprint hoặc release — ngắn gọn, dễ hiểu cho cả người không biết kỹ thuật. Bao gồm: số test pass/fail, bug tìm được, đề xuất go/no-go.

## Khi nào dùng
- Sau khi chạy xong toàn bộ test của một sprint
- Khi sếp hoặc PM hỏi "test xong chưa? có vấn đề gì không?"
- Trước mỗi release để team review
- Cuối mỗi tuần báo cáo tiến độ QA

---

## Template Release Notes

```markdown
# Test Report — [Tên Feature / Sprint / Release]
**Ngày báo cáo:** YYYY-MM-DD
**Tester:** [Tên]
**Môi trường:** https://app.promer.ai
**Phiên bản:** [Build number / commit hash nếu có]

---

## Tóm tắt kết quả / Executive Summary

| Chỉ số            | Số lượng |
|---|---|
| Tổng test         | XX       |
| ✅ Pass            | XX       |
| ❌ Fail            | XX       |
| ⚠️ Skip            | XX       |
| Tỉ lệ pass        | XX%      |

**Đề xuất:** ✅ GO / ❌ NO-GO / ⚠️ GO with conditions

> **Lý do:** [1-2 câu giải thích quyết định]

---

## Kết quả theo tính năng / Results by Feature

| Tính năng   | Pass | Fail | Skip | Ghi chú                      |
|---|---|---|---|---|
| Login       | 15   | 2    | 0    | 2 lỗi ở edge case            |
| Dashboard   | 12   | 0    | 1    | Skip: tính năng chưa deploy  |
| Form        | 10   | 1    | 0    | 1 lỗi validation số âm       |
| Search      | 8    | 0    | 2    | Skip: debounce test flaky    |
| **Tổng**    | **45** | **3** | **3** |                            |

---

## Bug tìm được / Bugs Found

| ID      | Tên bug                         | Severity | Status   | Assigned |
|---|---|---|---|---|
| BUG-001 | Trang login load > 3 giây       | Medium   | Open     | Dev team |
| BUG-002 | [Tên bug mới]                   | High     | Open     | [Dev]    |
| BUG-003 | [Tên bug mới]                   | Low      | Open     | [Dev]    |

**Tổng bug mới:** X (Critical: 0, High: X, Medium: X, Low: X)

---

## Test nào đang FAIL và lý do

### ❌ BUG-001 — Trang login load chậm
- **Test:** `[PERF] EC-1.7 — Trang login load dưới 3000ms`
- **Kết quả thực tế:** 3.6–4.2 giây
- **Expected:** < 3000ms
- **Tác động:** Trải nghiệm người dùng bị ảnh hưởng khi mạng chậm
- **Đề xuất:** Tối ưu bundle size, enable CDN, lazy load ảnh

### ⚠️ Test bị SKIP và lý do
- `[EDGE] EC-4.6 — Debounce test` → Flaky (kết quả không ổn định), cần fix

---

## Test coverage / Độ phủ test

| Loại test   | Số lượng | Ghi chú                              |
|---|---|---|
| Happy case  | XX       | Luồng chính — tất cả pass            |
| Negative    | XX       | Trường hợp lỗi — X fail              |
| Edge case   | XX       | Biên/ngoại lệ — X skip               |
| UI/Visual   | XX       | Giao diện — screenshot comparison    |
| Performance | XX       | Đo load time — X fail (known issue)  |
| Security    | XX       | SQL injection, XSS — all pass        |

---

## Rủi ro còn lại / Remaining Risks

1. **[Cao]** BUG-001 chưa fix — ảnh hưởng performance trên mạng chậm
2. **[Thấp]** Chưa test cross-browser trên Firefox và Safari

---

## Đề xuất trước khi release

- [ ] Fix BUG-002 (High) trước khi go-live
- [ ] BUG-001 (Medium) có thể ship nhưng cần theo dõi
- [ ] Cần retest BUG-002 sau khi dev fix
- [ ] Thêm monitoring load time sau release

---

## Xem báo cáo chi tiết

```bash
npx playwright show-report  # Mở HTML report với đầy đủ log và screenshot
```

**File báo cáo:** `reports/html-report/index.html`
```

---

## Ví dụ đã điền — Sprint 1 Login Feature

```markdown
# Test Report — Login / Authentication
**Ngày:** 2026-05-07 | **Tester:** QA Team | **Env:** https://app.promer.ai

## Tóm tắt
| Pass | Fail | Skip | Tỉ lệ  |
|---|---|---|---|
| 15   | 2    | 0    | 88%    |

**Đề xuất:** ⚠️ GO with conditions
> Login hoạt động đúng ở luồng chính. 2 lỗi: (1) load chậm [Medium], (2) email có space không được trim [Low]. Có thể release nhưng cần fix BUG-001 trong sprint tiếp.

## Bug tìm được
| ID      | Mô tả                        | Severity |
|---|---|---|
| BUG-001 | Trang login load 3.6–4.2s    | Medium   |
| BUG-002 | Email " user@test.com " không trim space → login thất bại | Low |
```

---

## Lệnh lấy số liệu từ Playwright

```bash
# Xem summary ngay trong terminal
npx playwright test tests/specs/ --reporter=list

# Xuất JSON để tự động đọc số liệu
npx playwright test tests/specs/ --reporter=json > reports/test-results.json

# Đếm nhanh số test pass/fail từ kết quả gần nhất
cat test-results/.last-run.json
```

---

## Template email gửi team (ngắn gọn)

```
Subject: [QA Report] Login Feature — Sprint 1 — 88% Pass

Hi team,

Kết quả test Login / Authentication:
• ✅ 15/17 test PASS (88%)  
• ❌ 2 fail: BUG-001 (load chậm), BUG-002 (email không trim)
• Đề xuất: GO with conditions — có thể release, fix 2 bug trong sprint tiếp

Chi tiết: reports/html-report/index.html

QA Team
```
