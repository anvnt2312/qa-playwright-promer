# Test Plan Skill — Viết Test Plan chuẩn

## Mô tả
Skill này giúp tạo Test Plan đầy đủ cho một tính năng hoặc sprint. Test Plan là tài liệu trả lời câu hỏi: **test cái gì, ai test, test bằng cách nào, khi nào xong, rủi ro là gì**.

## Khi nào dùng
- Bắt đầu một sprint mới hoặc release mới
- Nhận yêu cầu test một tính năng lớn
- Sếp hỏi "kế hoạch test của em như thế nào?"
- Trước khi bắt đầu viết test case

---

## Template Test Plan

```markdown
# Test Plan — [Tên Tính Năng / Sprint]
**Version:** 1.0
**Ngày tạo:** YYYY-MM-DD
**Tác giả:** [Tên QA]
**Trạng thái:** Draft / In Review / Approved

---

## 1. Scope — Phạm vi test

### 1.1 Trong phạm vi (In Scope)
- [ ] Tính năng A — mô tả ngắn
- [ ] Tính năng B — mô tả ngắn

### 1.2 Ngoài phạm vi (Out of Scope)
- Tính năng X — lý do không test (chưa deploy / team khác phụ trách)
- Tính năng Y — sẽ test ở sprint sau

---

## 2. Approach — Phương pháp test

### 2.1 Loại test sẽ thực hiện
| Loại test       | Công cụ             | Ghi chú                      |
|---|---|---|
| Functional      | Playwright          | Tự động hóa happy + negative |
| API             | Playwright request  | Kiểm tra backend độc lập     |
| Visual          | Playwright snapshot | So sánh screenshot           |
| Performance     | Date.now() / Perf API | Đo load time                |
| Security cơ bản | Manual              | SQL injection, XSS            |
| Mobile          | Playwright viewport | 390×844 (iPhone 14)          |

### 2.2 Môi trường test
- **URL:** https://app.promer.ai
- **Browser:** Chrome (chính), Firefox (kiểm tra chéo)
- **OS:** macOS / Windows
- **Dữ liệu test:** Đọc từ `.env`, không hardcode

---

## 3. Resources — Nguồn lực

| Vai trò   | Tên         | Trách nhiệm                    |
|---|---|---|
| QA Lead   | [Tên]       | Review test case, approve plan |
| QA Tester | [Tên]       | Viết và chạy test              |
| Dev       | [Tên]       | Fix bug, hỗ trợ debug          |
| PM        | [Tên]       | Xác nhận acceptance criteria   |

---

## 4. Schedule — Lịch trình

| Giai đoạn         | Bắt đầu    | Kết thúc   | Output                        |
|---|---|---|---|
| Viết Test Plan    | YYYY-MM-DD | YYYY-MM-DD | File test-plan.md này         |
| Viết Test Case    | YYYY-MM-DD | YYYY-MM-DD | .feature files + spec files   |
| Chạy test lần 1   | YYYY-MM-DD | YYYY-MM-DD | HTML report lần 1             |
| Fix + Retest      | YYYY-MM-DD | YYYY-MM-DD | HTML report lần 2             |
| Sign-off          | YYYY-MM-DD | YYYY-MM-DD | Email/Slack xác nhận done     |

---

## 5. Risk — Rủi ro

| Rủi ro                              | Khả năng | Tác động | Phương án giảm thiểu              |
|---|---|---|---|
| Trang load chậm (BUG-001)           | Cao      | Trung bình | Ghi chú expected failure, skip PERF |
| Test data bị thay đổi bởi team khác | Trung bình | Cao    | Dùng account test riêng biệt      |
| API thay đổi không báo trước        | Thấp     | Cao      | Sync với dev hàng ngày            |
| Thiếu thời gian                     | Trung bình | Trung bình | Ưu tiên happy + critical negative |

---

## 6. Entry / Exit Criteria

### Entry Criteria (Điều kiện để bắt đầu test)
- [ ] Build đã deploy lên môi trường test
- [ ] Dữ liệu test đã sẵn sàng (account, seed data)
- [ ] Acceptance Criteria đã được PM confirm

### Exit Criteria (Điều kiện để kết thúc test)
- [ ] 100% test case đã chạy
- [ ] Không có bug Critical hoặc High còn mở
- [ ] HTML report đã gửi cho team
- [ ] Bug report đã được tạo cho tất cả lỗi tìm thấy

---

## 7. Deliverables — Kết quả bàn giao

| File                          | Mô tả                          |
|---|---|
| `tests/features/*.feature`    | Test case dạng Gherkin BDD     |
| `tests/specs/*.spec.js`       | Playwright test script         |
| `reports/html-report/`        | HTML report chi tiết           |
| `reports/bug-list.md`         | Danh sách bug tìm được         |
| `reports/release-notes.md`    | Tóm tắt kết quả cho team/sếp  |
```

---

## Ví dụ đã điền (Login Feature)

```markdown
# Test Plan — Login / Authentication
**Version:** 1.0
**Ngày tạo:** 2026-05-07
**Tác giả:** QA Team

## 1. Scope
**Trong phạm vi:** Login form, session management, error messages, mobile responsive
**Ngoài phạm vi:** OAuth (Google/Facebook login) — chưa implement

## 4. Schedule
| Giai đoạn      | Bắt đầu    | Kết thúc   |
|---|---|---|
| Viết test case | 2026-05-07 | 2026-05-08 |
| Chạy test      | 2026-05-09 | 2026-05-10 |
| Retest         | 2026-05-11 | 2026-05-11 |

## 5. Risk
BUG-001: Trang login load 3.6–4.2s → [PERF] test sẽ fail → đánh dấu known issue
```

---

## Lệnh sau khi có Test Plan

```bash
# Convert .feature → .spec.js (dùng skill qa-skill.md)
# Chạy toàn bộ test
npx playwright test tests/specs/

# Tạo HTML report vào reports/
npx playwright test --reporter=html --output=reports/html-report
```
