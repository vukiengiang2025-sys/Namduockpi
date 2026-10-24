# Nam Dược Strategy AI

Ứng dụng đồng hành cho trình dược viên: KPI, dự báo, tuyến bán hàng và kế hoạch hành động.

## Chạy local

```bash
npm install
npm run dev
```

Mở tab **TDV Hub** để nạp dữ liệu SalesUp hoặc dùng dữ liệu mẫu.

## Kiểm tra

```bash
npm run lint
npm run test:tdv
npm run build
```

## Tích hợp dữ liệu SalesUp

Xem [docs/TDV-SUPER-APP.md](docs/TDV-SUPER-APP.md).

Công cụ xuất dữ liệu:

```bash
python3 scripts/export_salesup_tdv.py salesup.db \
  --login <DANGNHAP> --month 10 --year 2026 \
  --sales 120000000 --coverage 18 --output tdv-data.json
```
