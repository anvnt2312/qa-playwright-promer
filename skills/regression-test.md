# Skill — Regression Test

## Nhiệm vụ chính

Khi tôi yêu cầu chạy regression test (hoặc "test hồi quy"), hãy:

1. Xác định phạm vi: toàn bộ hay chỉ một module bị ảnh hưởng
2. Ưu tiên chạy **smoke test** trước (HAPPY cases) → nếu pass mới chạy full suite
3. So sánh kết quả với lần chạy trước để phát hiện **regression mới**
4. Báo cáo rõ: test nào **mới fail** (regression), test nào **vẫn fail** (known bug), test nào **pass trở lại** (đã fix)
5. Cập nhật `reports/bug-reports.md` nếu có bug mới hoặc bug cũ được fix

---

## Khi nào cần chạy Regression Test?

| Trigger | Phạm vi đề xuất |
|---|---|
| Sau mỗi deploy lên staging/prod | Full regression suite |
| Dev fix một bug cụ thể | Module liên quan + smoke toàn app |
| Thêm tính năng mới | Tính năng mới + tính năng liền kề |
| Thay đổi UI/CSS lớn | Toàn bộ `[UI]` tests + `[HAPPY]` của mỗi module |
| Thay đổi API/backend | Toàn bộ `[NEGATIVE]` + `[EDGE]` + `[SECURITY]` |
| Hotfix gấp trước release | Smoke test (chỉ `[HAPPY]`) |

---

## Phân loại test suite

### 1. Smoke Test — chạy trước tiên (~5 phút)
Chỉ HAPPY cases, đảm bảo luồng chính không vỡ.

```bash
npx playwright test --grep "\[HAPPY\]" --project=chromium
```

### 2. Sanity Test — sau khi smoke pass (~15 phút)
HAPPY + NEGATIVE, kiểm tra core logic.

```bash
npx playwright test --grep "\[HAPPY\]|\[NEGATIVE\]" --project=chromium
```

### 3. Full Regression — chạy định kỳ hoặc trước release (~30-60 phút)
Toàn bộ test cases, cả 2 browser.

```bash
npx playwright test --reporter=html
```

### 4. Targeted Regression — sau khi fix một bug cụ thể
Chỉ chạy module liên quan.

```bash
# Sau khi fix bug login
npx playwright test tests/specs/login.spec.js --reporter=html

# Sau khi fix bug dashboard
npx playwright test tests/specs/dashboard.spec.js --reporter=html

# Chạy theo tag cụ thể
npx playwright test --grep "\[PERF\]"
npx playwright test --grep "\[SECURITY\]"
```

---

## Quy trình Regression khi nhận build mới

```
Bước 1 — Smoke Test
  └─ npx playwright test --grep "[HAPPY]" --project=chromium
  └─ Nếu FAIL → báo ngay cho dev, DỪNG, không cần chạy tiếp
  └─ Nếu PASS → tiếp tục

Bước 2 — Sanity Test
  └─ npx playwright test --grep "[HAPPY]|[NEGATIVE]" --project=chromium
  └─ Xem kết quả, ghi nhận fail mới

Bước 3 — Full Regression (nếu thời gian cho phép)
  └─ npx playwright test --reporter=html
  └─ So sánh với lần chạy trước

Bước 4 — Báo cáo
  └─ Phân loại: Regression mới / Known bug / Fixed bug
  └─ Cập nhật reports/bug-reports.md
  └─ Gửi kết quả cho team
```

---

## Phân tích kết quả Regression

Sau khi chạy xong, phân loại từng test fail theo 3 nhóm:

### 🔴 Regression mới (NEW FAIL)
> Test trước đây PASS, lần này FAIL → dev vừa break tính năng này

```
Cần làm:
- Tạo bug report mới trong reports/bug-reports.md
- Tag bug với ngày phát hiện và build number
- Assign cho dev để fix ngay
```

### 🟡 Known bug (STILL FAIL)
> Test đã fail từ lần trước, vẫn fail → bug chưa được fix

```
Cần làm:
- Cập nhật "Ngày xác nhận lại" trong bug report
- Không cần tạo bug mới
- Nhắc nhở dev nếu bug P1/P2 quá lâu chưa fix
```

### 🟢 Fixed (WAS FAIL → NOW PASS)
> Test trước FAIL, lần này PASS → dev đã fix được

```
Cần làm:
- Đổi Status trong bug-reports.md: Open → Fixed
- Ghi ngày fix và build number
- Giữ test trong suite để phòng regression
```

---

## Template báo cáo kết quả nhanh

```markdown
## Regression Run — [Ngày] — Build [số]

**Tổng:** X passed · Y failed · Z skipped

### 🔴 Regression mới (cần tạo bug)
- [ ] [EDGE] EC-X.X — Tên test — Mô tả lỗi ngắn

### 🟡 Known bugs (đã có trong bug-reports.md)
- BUG-01: PERF load > 3s — vẫn fail
- BUG-02: Email space — vẫn fail

### 🟢 Đã fix kể từ lần trước
- BUG-XX: Tên bug — pass lại từ build này

### ⚠️ Flaky (fail rồi pass retry)
- [TEST] Tên test — cần tăng timeout hoặc xem lại stability
```

---

## Known bugs hiện tại (app.promer.ai)

Danh sách bugs đang Open — các test này **dự kiến sẽ FAIL**:

| Bug | Test | Trạng thái |
|---|---|---|
| BUG-01 | `[PERF]` Login load > 3s | Open — P2 |
| BUG-02 | `[EDGE] EC-1.1` Email có space | Open — P2 |
| BUG-03 | `[EDGE] EC-1.6` User enumeration | Open — P1 |
| BUG-04 | `[NEGATIVE] EC-2.2` Không redirect sau logout | Open — P2 |
| BUG-05 | `[NEGATIVE] EC-2.4` App vỡ khi API 500 | Open — P1 |

> Nếu các test này PASS trong lần chạy tiếp theo → bugs đã được fix, cập nhật `reports/bug-reports.md`.

---

## Checklist trước khi chạy Regression

- [ ] File `.env` có đủ `TEST_EMAIL` và `TEST_PASSWORD`
- [ ] App đang chạy đúng môi trường cần test (staging/prod)
- [ ] Xóa `test-results/` cũ để tránh nhầm lẫn: `rm -rf test-results/`
- [ ] Playwright browsers đã cài: `npx playwright install`
- [ ] Biết build number / commit hash của build đang test

---

## Checklist sau khi chạy Regression

- [ ] Xem HTML report: `npx playwright show-report`
- [ ] Phân loại fail: Regression mới / Known bug / Fixed
- [ ] Cập nhật `reports/bug-reports.md` nếu có thay đổi
- [ ] Ghi lại kết quả vào `reports/regression-history.md` (nếu có)
- [ ] Thông báo cho team nếu có Regression mới hoặc P1 bug chưa fix

---

## Lệnh thường dùng

```bash
# Xóa kết quả cũ trước khi chạy mới
rm -rf test-results/

# Smoke test nhanh (chỉ HAPPY, chromium)
npx playwright test --grep "\[HAPPY\]" --project=chromium --reporter=list

# Full regression với HTML report
npx playwright test --reporter=html

# Regression một module cụ thể
npx playwright test tests/specs/login.spec.js --reporter=html
npx playwright test tests/specs/dashboard.spec.js --reporter=html

# Chạy lại chỉ các test đã fail trong lần trước
npx playwright test --last-failed

# Xem report
npx playwright show-report
```
