# QA Brain - Promer AI App

## Về tôi
- Tôi là QA/QC Tester, newbie, cần giải thích rõ ràng
- App cần test: https://app.promer.ai/
- Loại app: Web application có login

## Khi viết test, luôn cover:
1. Happy case - luồng chính hoạt động đúng
2. Negative case - nhập sai, bỏ trống, ký tự đặc biệt
3. Edge case - giới hạn ký tự, số lớn, màn hình nhỏ
4. UI/UX - hiển thị đúng, responsive, placeholder
5. Performance - trang load dưới 3 giây
6. Security cơ bản - SQL injection, XSS đơn giản

## Format tên test:
[HAPPY] Tên chức năng - Kịch bản
[NEGATIVE] Tên chức năng - Kịch bản  
[EDGE] Tên chức năng - Kịch bản
[UI] Tên chức năng - Kịch bản
[PERF] Tên chức năng - Kịch bản

## Output:
- Comment tiếng Việt giải thích từng test
- Ghi chú bug tiềm ẩn
- HTML report sau khi chạy

## Skills có sẵn (dùng bằng cách ra lệnh "Dùng skill X"):

| File skill                  | Mục đích                                        |
|---|---|
| `skills/qa-skill.md`        | Convert Gherkin .feature → Playwright spec JS   |
| `skills/bug-report.md`      | Tạo bug report chuẩn từ mô tả lỗi              |
| `skills/api-test.md`        | Viết API test với Playwright request context     |
| `skills/performance.md`     | Đo hiệu năng trang, Core Web Vitals, debounce   |
| `skills/test-plan.md`       | Viết Test Plan: scope, approach, risk, schedule |
| `skills/page-object.md`     | Tạo Page Object Model chuẩn cho Playwright      |
| `skills/data-driven.md`     | Test nhiều bộ dữ liệu với test.each() + fixtures|
| `skills/visual-test.md`     | So sánh screenshots phát hiện visual bugs       |
| `skills/release-notes.md`   | Báo cáo kết quả test cho team/sếp              |

## Cấu trúc project:

```
tests/
  specs/      ← file test đã convert từ .feature
  pages/      ← Page Objects cho từng tính năng
  fixtures/   ← Test data (email, password, mock...)
  features/   ← File BDD Gherkin (.feature)
skills/       ← Skill docs hướng dẫn Claude làm việc
reports/      ← HTML reports, perf results (output)
```
