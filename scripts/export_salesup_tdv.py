#!/usr/bin/env python3
"""Export a pulled SalesUp SQLite database to the TDV Hub JSON schema."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path


def parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(value / 1000 if value > 10_000_000_000 else value)
        except (ValueError, OSError):
            return None
    text = str(value).strip()
    match = re.search(r"/Date\((-?\d+)", text)
    if match:
        return datetime.fromtimestamp(int(match.group(1)) / 1000)
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%d/%m/%Y %H:%M:%S"):
        try:
            return datetime.strptime(text[:19], fmt)
        except ValueError:
            continue
    return None


def number(value, fallback=0):
    if value is None or value == "":
        return fallback
    if isinstance(value, (int, float)):
        return float(value)
    raw = re.sub(r"[^\d.,-]", "", str(value).strip())
    if not raw:
        return fallback
    if "." in raw and "," in raw:
        raw = raw.replace(".", "").replace(",", ".") if raw.rfind(",") > raw.rfind(".") else raw.replace(",", "")
    elif "." in raw:
        raw = raw.replace(".", "") if re.fullmatch(r"-?\d{1,3}(\.\d{3})+", raw) else raw
    elif "," in raw:
        raw = raw.replace(",", "") if re.fullmatch(r"-?\d{1,3}(,\d{3})+", raw) else raw.replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return fallback


def table_rows(conn, table):
    try:
        return [dict(row) for row in conn.execute(f'SELECT * FROM "{table}"')]
    except sqlite3.Error:
        return []



def kpi_target(rows, aliases):
    for row in rows:
        kind = str(row.get("type") or row.get("TYPE") or "").strip().lower()
        if any(alias in kind for alias in aliases):
            value = number(row.get("chitieu") or row.get("CHITIEU"))
            if value:
                return value
    return 0

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path, help="Path to SalesUp SQLite database")
    parser.add_argument("--output", type=Path, help="Output JSON path (default: stdout)")
    parser.add_argument("--login", help="Filter by DANGNHAP")
    parser.add_argument("--month", type=int, default=date.today().month)
    parser.add_argument("--year", type=int, default=date.today().year)
    parser.add_argument("--sales", type=float, default=0, help="Monthly sales target")
    parser.add_argument("--coverage", type=float, default=0, help="Monthly coverage target")
    parser.add_argument("--sku", type=float, default=4.7, help="Average SKU target")
    parser.add_argument("--sales15", type=float, default=0, help="15-day sales target")
    parser.add_argument("--name", default="Trình dược viên")
    parser.add_argument("--region", default="")
    parser.add_argument("--depot-lat", type=float)
    parser.add_argument("--depot-lng", type=float)
    args = parser.parse_args()

    if not args.database.exists():
        raise SystemExit(f"Database not found: {args.database}")

    conn = sqlite3.connect(args.database)
    conn.row_factory = sqlite3.Row

    def login_filter(rows):
        if not args.login:
            return rows
        return [row for row in rows if str(row.get("DANGNHAP", "")) == args.login]

    customers_raw = login_filter(table_rows(conn, "KHACHHANG"))
    orders_raw = login_filter(table_rows(conn, "U_DONHANG"))
    lines_raw = login_filter(table_rows(conn, "U_DONHANG_SP"))
    products_raw = login_filter(table_rows(conn, "SANPHAM"))
    routes_raw = login_filter(table_rows(conn, "TUYENBANHANG"))
    links_raw = login_filter(table_rows(conn, "KHACHHANG_TUYENBANHANG"))
    visits_raw = login_filter(table_rows(conn, "U_AUDITKHACHHANG"))
    npp_raw = login_filter(table_rows(conn, "NPP"))
    kpi_raw = login_filter(table_rows(conn, "KPI"))

    route_by_customer = {}
    for link in links_raw:
        customer_id = str(link.get("KHACHHANG_FK") or "")
        route_id = str(link.get("TBH_FK") or "")
        if customer_id and route_id:
            route_by_customer[customer_id] = route_id

    lines_by_order = defaultdict(list)
    for line in lines_raw:
        order_id = str(line.get("DONHANG_FK") or "")
        if order_id:
            lines_by_order[order_id].append({
                "productId": str(line.get("SANPHAM_FK") or ""),
                "quantity": number(line.get("SOLUONG")),
                "price": number(line.get("DONGIA")),
            })

    orders = []
    for row in orders_raw:
        order_id = str(row.get("PK_SEQ") or "")
        orders.append({
            "id": order_id,
            "customerId": str(row.get("KHACHHANG_FK") or ""),
            "date": str(row.get("NGAYNHAP") or ""),
            "total": number(row.get("TONGGIATRI")),
            "lines": lines_by_order.get(order_id, []),
        })

    month_start = datetime(args.year, args.month, 1)
    month_end = datetime(args.year + (1 if args.month == 12 else 0), 1 if args.month == 12 else args.month + 1, 1)
    trailing_start = month_end - timedelta(days=90)
    orders_by_customer = defaultdict(list)
    for order in orders:
        parsed = parse_date(order["date"])
        if parsed:
            orders_by_customer[order["customerId"]].append((parsed, order))

    visits_by_customer = defaultdict(list)
    for visit in visits_raw:
        parsed = parse_date(visit.get("NGAY"))
        if parsed:
            visits_by_customer[str(visit.get("KHACHHANG_FK") or "")].append(parsed)

    customers = []
    for row in customers_raw:
        customer_id = str(row.get("PK_SEQ") or "")
        history = orders_by_customer.get(customer_id, [])
        month_orders = [(d, o) for d, o in history if month_start <= d < month_end]
        trailing_orders = [(d, o) for d, o in history if trailing_start <= d < month_end]
        sku_ids = {line["productId"] for _, order in month_orders for line in order["lines"] if line["productId"]}
        last_order = max((d for d, _ in history), default=None)
        last_visit = max(visits_by_customer.get(customer_id, []), default=last_order)
        customers.append({
            "id": customer_id,
            "name": str(row.get("TEN") or ""),
            "address": str(row.get("DIACHI") or ""),
            "phone": str(row.get("DIENTHOAI") or ""),
            "lat": number(row.get("LAT"), None),
            "lng": number(row.get("LON"), None),
            "routeId": route_by_customer.get(customer_id, ""),
            "tier": str(row.get("loaiNPP") or "B"),
            "potential": sum(o["total"] for _, o in trailing_orders),
            "lastVisitAt": last_visit.isoformat() if last_visit else None,
            "lastOrderAt": last_order.isoformat() if last_order else None,
            "mtdSales": sum(o["total"] for _, o in month_orders),
            "mtdOrders": len(month_orders),
            "skuCount": len(sku_ids),
            "debt": 0,
            "promoEligible": False,
            "visitFrequencyDays": number(row.get("TANSO"), 0) or None,
        })

    products = []
    for row in products_raw:
        products.append({
            "id": str(row.get("PK_SEQ") or ""),
            "sku": str(row.get("MA") or ""),
            "name": str(row.get("TEN") or ""),
            "price": number(row.get("DONGIA")),
            "stock": number(row.get("SOLUONG1")),
            "promo": False,
            "margin": number(row.get("CHIETKHAU")),
            "category": str(row.get("NHOMSP") or ""),
        })

    routes = [{
        "id": str(row.get("PK_SEQ") or ""),
        "name": str(row.get("DIENGIAI") or ""),
    } for row in routes_raw]

    profile_name = args.name
    if npp_raw and npp_raw[0].get("TEN"):
        profile_name = args.name if args.name != "Trình dược viên" else str(npp_raw[0]["TEN"])

    dataset = {
        "version": 1,
        "generatedAt": datetime.now().isoformat(),
        "month": args.month,
        "year": args.year,
        "asOfDate": datetime.now().isoformat(),
        "profile": {
            "id": args.login or "tdv",
            "name": profile_name,
            "region": args.region,
            "depot": (
                {"lat": args.depot_lat, "lng": args.depot_lng, "name": "Kho"}
                if args.depot_lat is not None and args.depot_lng is not None else None
            ),
            "preferredHours": {"morning": 1.2, "afternoon": 0.8},
        },
        "targets": {
            "sales": args.sales or kpi_target(kpi_raw, ("dt", "ds", "doanhso", "doanh số")),
            "coverage": args.coverage or kpi_target(kpi_raw, ("dp", "dophu", "độ phủ", "bao phu")),
            "sku": args.sku or kpi_target(kpi_raw, ("sku", "nhomsku")) or 4.7,
            "sales15Days": args.sales15 or kpi_target(kpi_raw, ("15", "kpi15", "15ngay")),
        },
        "customers": customers,
        "orders": orders,
        "products": products,
        "routes": routes,
        "weights": {"sales": 80, "coverage": 10, "month15Days": 5, "sku": 7.5},
    }

    text = json.dumps(dataset, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(text, encoding="utf-8")
        print(f"Wrote {args.output} ({len(customers)} customers, {len(orders)} orders)")
    else:
        print(text)


if __name__ == "__main__":
    main()
