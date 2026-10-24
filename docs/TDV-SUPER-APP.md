# TDV Super App — tích hợp SalesUp + thuật toán Namduockpi

## 1. Mục tiêu

Biến dữ liệu vận hành của SalesUp (khách hàng, tuyến, đơn hàng, sản phẩm) thành một
“siêu ứng dụng” cá nhân hóa cho từng trình dược viên (TDV):

- Biết **hôm nay cần làm gì**, ghé ai, bán thêm SKU nào.
- Dự báo **doanh số cuối tháng** và số doanh số/độ phủ cần mỗi ngày.
- Tự động xếp **tuyến ghé thăm** theo điểm ưu tiên, khoảng cách và thời gian.
- Đồng bộ kế hoạch sang hệ thống nhiệm vụ/ghi chú sẵn có.

Phạm vi hiện tại là **Phase 1**: ứng dụng đồng hành dạng React + Capacitor, dùng dữ liệu
SalesUp đã xuất ra JSON. Phase 2 có thể nhúng trực tiếp vào APK SalesUp hoặc đồng bộ
qua API/DB nội bộ.

## 2. Những gì đã triển khai

| Thành phần | File | Chức năng |
|---|---|---|
| KPI engine | `src/lib/kpi.ts` | Doanh số, độ phủ, 15 ngày, SKU, tổng điểm |
| TDV engine | `src/lib/tdv.ts` | Chuẩn hóa dữ liệu, dự báo, scoring khách hàng, tối ưu tuyến, gợi ý hành động |
| TDV Hub UI | `src/pages/TDVHub.tsx` | Nhập JSON, KPI, dự báo, tuyến, khách ưu tiên, kế hoạch ngày |
| Import SalesUp | `scripts/export_salesup_tdv.py` | Đọc SQLite SalesUp → JSON TDV |
| Self-test | `scripts/tdv-selftest.ts` | Kiểm tra công thức và luồng dữ liệu |

## 3. Công thức KPI đang dùng

Các công thức bám theo `src/lib/kpi.ts`:

- **Doanh số**: `ratio = actual / target`; dưới 80% = 0 điểm; tối đa 187,5% target
  (hệ số 1,875 × 80 điểm).
- **Độ phủ**: dưới 80% = 0; tối đa 150% target (1,5 × 10 điểm).
- **15 ngày**: dưới 44% = 0; mốc 55% target = 5 điểm; tối đa 7,5 điểm.
- **SKU**: bảng mốc 3,3 → 4,7 tương ứng 4,0 → 7,5 điểm.
- **Tổng**: doanh số + độ phủ + 15 ngày + SKU + điểm tùy chỉnh.

## 4. Cách dữ liệu SalesUp được ánh xạ

| Bảng SalesUp | Trường TDV | Ghi chú |
|---|---|---|
| `KHACHHANG` | `customers` | `PK_SEQ`, `TEN`, `DIACHI`, `DIENTHOAI`, `LAT`, `LON`, `loaiNPP`, `TANSO` |
| `KHACHHANG_TUYENBANHANG` | `customers.routeId` | Nối khách với tuyến |
| `TUYENBANHANG` | `routes` | `PK_SEQ`, `DIENGIAI` |
| `U_DONHANG` | `orders` | `PK_SEQ`, `KHACHHANG_FK`, `NGAYNHAP`, `TONGGIATRI` |
| `U_DONHANG_SP` | `orders[].lines` | `SANPHAM_FK`, `SOLUONG`, `DONGIA` |
| `SANPHAM` | `products` | `MA`, `TEN`, `DONGIA`, `SOLUONG1`, `NHOMSP` |
| `U_AUDITKHACHHANG` | `customers.lastVisitAt` | Lấy lần ghé gần nhất |
| `NPP` | `profile.name` | Tên NPP/TDV nếu có |
| `KPI` | `targets` | Đọc `type` + `chitieu` nếu bảng tồn tại; `DT`/`DS` → doanh số, `DP` → độ phủ, `SKU` → SKU, `15` → KPI 15 ngày |

Chỉ tiêu tháng (`targets`) ưu tiên tham số dòng lệnh; nếu không có, exporter đọc bảng `KPI`
khi bảng này tồn tại. Nếu vẫn thiếu, TDV Hub cho phép nhập tay hoặc dùng dữ liệu mẫu.

## 5. Quy trình đưa dữ liệu thật vào app

### Bước 1 — Lấy database SalesUp

Database nằm trong vùng app trên thiết bị Android, thường là:

```text
/data/data/geso.best.pdanamduocnew/databases/<ten-db>
```

Chỉ lấy được khi bạn có quyền phù hợp (máy root, bản debug, hoặc cơ chế backup nội bộ
được chủ sở hữu dữ liệu cho phép). Không vượt quyền truy cập thiết bị.

### Bước 2 — Xuất JSON

```bash
python3 scripts/export_salesup_tdv.py /duong/dan/salesup.db \
  --login <DANGNHAP> \
  --month 10 --year 2026 \
  --sales 120000000 --coverage 18 --sku 4.7 \
  --name "Nguyễn Minh Anh" --region "Hà Nội" \
  --output tdv-data.json
```

Nếu không truyền `--login`, script lấy toàn bộ dữ liệu. Nên lọc theo tài khoản TDV để
tránh trộn dữ liệu nhiều người.

### Bước 3 — Nhập vào TDV Hub

Mở tab **TDV Hub** → **Nạp dữ liệu SalesUp** → chọn `tdv-data.json`.

Dữ liệu được lưu cục bộ bằng `localStorage` trên thiết bị; không tự gửi lên server.

## 6. Cá nhân hóa hoạt động thế nào

### 6.1 Điểm ưu tiên khách hàng

Điểm 0–100 kết hợp:

- Tiềm năng doanh số 90 ngày gần nhất.
- Khách chưa phát sinh đơn trong tháng (ưu tiên mở phủ).
- Số ngày từ lần ghé cuối so với tần suất chăm sóc.
- Hạng khách A/B/C.
- Có CTKM phù hợp.
- Trừ điểm nếu có công nợ.

### 6.2 Gợi ý hành động

- Chưa có đơn → ghé thăm, kiểm tra tồn kho, chốt đơn.
- Ít SKU → tư vấn SKU trọng tâm.
- Doanh số thấp hơn tiềm năng → khai thác nhóm sản phẩm chủ lực.
- Có CTKM → áp dụng chương trình.
- Có công nợ → đối chiếu và thu.

### 6.3 Tuyến tối ưu

- Lấy tối đa 8 khách có điểm cao nhất (tối thiểu 4 điểm/ngày).
- Duyệt nearest-neighbor có trọng số: khoảng cách × (1,35 − điểm/100 × 0,55).
- ETA bắt đầu 8:00, 20 phút/điểm, tốc độ 25 km/h + 5 phút mỗi chặng.
- Có thể thay bằng OR-Tools/Google Routes ở Phase 2.

### 6.4 Dự báo

- `avgDaily = doanh số thực / số ngày đã qua`.
- `projected = thực + avgDaily × số ngày còn lại`.
- `requiredDaily = (target − thực) / số ngày còn lại`.
- Nếu tháng đã kết thúc, dùng số thực tế, không ngoại suy.

## 7. Chạy và kiểm thử

```bash
npm install
npm run lint
npm run test:tdv
npm run build
npm run dev
```

`npm run test:tdv` kiểm tra:

- Công thức KPI.
- Dữ liệu mẫu sinh đủ KPI/tuyến/nhiệm vụ.
- Chuẩn hóa khóa tiếng Việt từ SalesUp.
- Tọa độ, số SKU, đơn hàng và tuyến.

## 8. Giới hạn hiện tại

- Chưa đồng bộ trực tiếp với API SalesUp; cần xuất DB/JSON.
- Chưa có bản đồ offline; tuyến hiển thị dạng danh sách + ETA.
- Chỉ tiêu tháng phải nhập từ CLI/UI.
- Công nợ, CTKM và tồn kho mới ở mức tín hiệu nếu dữ liệu nguồn có sẵn.
- Chưa thay thế app SalesUp gốc; đây là lớp đồng hành và ra quyết định.

## 9. Roadmap Phase 2

1. Đồng bộ trực tiếp qua API nội bộ/WebView bridge thay vì file JSON.
2. Nhúng TDV Hub vào APK SalesUp bằng WebView hoặc native module.
3. Bản đồ offline + tối ưu tuyến có ràng buộc thời gian.
4. Học từ lịch sử chốt đơn để hiệu chỉnh điểm ưu tiên theo từng TDV.
5. Cảnh báo công nợ/CTKM/tồn kho theo thời gian thực.
6. Phân quyền, mã hóa dữ liệu cục bộ và chính sách xóa dữ liệu khi đăng xuất.
