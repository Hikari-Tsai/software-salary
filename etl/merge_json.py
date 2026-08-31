#!/usr/bin/env python3

import argparse
import json
from datetime import datetime
from pathlib import Path


def add_timestamp(path: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = path.suffix or ".json"
    stem = path.stem if path.suffix else path.name
    return path.with_name(f"{stem}_{timestamp}{suffix}")


def read_json_array(path: Path) -> list[object]:
    with path.open("r", encoding="utf-8-sig") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(f"{path} 的最外層必須是 JSON 陣列")
    return data


def merge_json_files(input_paths: list[Path]) -> tuple[list[object], int]:
    merged: list[object] = []
    seen: set[str] = set()
    duplicate_count = 0
    for path in input_paths:
        for record in read_json_array(path):
            identity = json.dumps(
                record,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            if identity in seen:
                duplicate_count += 1
                continue
            seen.add(identity)
            merged.append(record)
    return merged, duplicate_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="依輸入順序合併多個 JSON 陣列，並輸出帶時間戳記的單一檔案。"
    )
    parser.add_argument("inputs", nargs="+", type=Path, help="要合併的 JSON 檔案")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("merged.json"),
        help="輸出路徑，預設為 merged.json",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        records, duplicate_count = merge_json_files(args.inputs)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise SystemExit(f"錯誤：{error}") from error

    output_path = add_timestamp(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"已合併 {len(args.inputs)} 個檔案、共 {len(records)} 筆資料，"
        f"移除 {duplicate_count} 筆重複資料：{output_path}"
    )


if __name__ == "__main__":
    main()
