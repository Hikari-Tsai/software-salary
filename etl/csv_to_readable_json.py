#!/usr/bin/env python3

import argparse
import csv
import json
import re
from datetime import datetime
from pathlib import Path


FIELD_MAP = [
    ("timestamp", "時間戳記"),
    ("company", "公司名稱"),
    ("job_title", "職務(名片上的前綴抬頭)"),
    ("job_level", "職級(Junior, Senior, Staff, etc...)"),
    ("total_exp_years", "相關年資（年）"),
    ("current_exp_years", "現職年資（年）"),
    ("base_salary_10k", "月底薪（萬元，新台幣）"),
    ("bonus_months", "Bonus（幾個月）"),
    ("total_comp_10k", "總年薪（萬元，含分紅、年終與底薪）"),
    ("daily_hours", "每日平均工時（小時）"),
    ("monthly_overtime", "每月加班情況"),
    ("overtime_freq", "加班頻率（1–5，1＝幾乎不加班，5＝非常頻繁）"),
    ("chill", "爽度（1–5，5＝最爽）"),
    ("loading", "Loading（1–5，5＝最忙）"),
    ("notes", "心得、是否推薦、面試相關資訊等"),
]

NUMBER_PATTERN = re.compile(r"^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$")


def compact_number(number: float) -> int | float:
    return int(number) if number.is_integer() else number


def parse_value(raw_value: str) -> str | int | float:
    value = raw_value.strip()
    if not value or not NUMBER_PATTERN.fullmatch(value):
        return value

    return compact_number(float(value))


def parse_salary_number(raw_value: str) -> tuple[float, bool] | None:
    value = raw_value.strip().replace(",", "").replace("，", "")
    value = re.sub(r"^(?:NT\$|NTD|TWD|新台幣|\$)\s*", "", value, flags=re.IGNORECASE)
    has_ten_thousand_unit = re.search(r"萬(?:元)?$", value) is not None
    value = re.sub(r"萬(?:元)?$", "", value).strip()

    if not value or not NUMBER_PATTERN.fullmatch(value):
        return None

    return float(value), has_ten_thousand_unit


def parse_base_salary_10k(raw_value: str) -> str | int | float:
    parsed = parse_salary_number(raw_value)
    if parsed is None:
        return raw_value.strip()

    number, has_ten_thousand_unit = parsed
    if not has_ten_thousand_unit and abs(number) >= 10_000:
        number /= 10_000
    if abs(number) > 30:
        number /= 12
    return compact_number(number)


def parse_total_comp_10k(raw_value: str) -> str | int | float:
    parsed = parse_salary_number(raw_value)
    if parsed is None:
        return raw_value.strip()

    number, has_ten_thousand_unit = parsed
    if not has_ten_thousand_unit and abs(number) >= 10_000:
        number /= 10_000
        if 0 < abs(number) < 30:
            number *= 10
    return compact_number(number)


def convert_csv(input_path: Path) -> list[dict[str, object]]:
    with input_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        headers = set(reader.fieldnames or [])
        missing_headers = [csv_key for _, csv_key in FIELD_MAP if csv_key not in headers]
        if missing_headers:
            missing = "、".join(missing_headers)
            raise ValueError(f"CSV 缺少必要欄位：{missing}")

        records = []
        for sheet_row, row in enumerate(reader, start=2):
            record = {
                json_key: (
                    parse_base_salary_10k(row[csv_key] or "")
                    if json_key == "base_salary_10k"
                    else parse_total_comp_10k(row[csv_key] or "")
                    if json_key == "total_comp_10k"
                    else parse_value(row[csv_key] or "")
                )
                for json_key, csv_key in FIELD_MAP
            }
            record["sheet_row"] = sheet_row
            records.append(record)

    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="將軟體工程師薪資調查 CSV 轉成 readable-keys JSON。"
    )
    parser.add_argument("input", type=Path, help="來源 CSV 路徑")
    parser.add_argument("--output", "-o", type=Path, help="輸出 JSON 路徑")
    return parser.parse_args()


def add_timestamp(path: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = path.suffix or ".json"
    stem = path.stem if path.suffix else path.name
    return path.with_name(f"{stem}_{timestamp}{suffix}")


def main() -> None:
    args = parse_args()
    output_path = add_timestamp(args.output or args.input.with_suffix(".json"))
    records = convert_csv(args.input)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"已輸出 {len(records)} 筆資料：{output_path}")


if __name__ == "__main__":
    main()
