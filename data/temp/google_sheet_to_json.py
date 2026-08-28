#!/usr/bin/env python3
"""
Read a public Google Sheets tab and convert it to JSON.

Example:
  python google_sheet_to_json.py "https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997" -o output.json

Note:
  The sheet must be accessible to anyone with the link, or published publicly.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen


DEFAULT_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/"
    "edit?gid=788239997#gid=788239997"
)


def parse_google_sheet_reference(value: str) -> tuple[str, str]:
    """Return (spreadsheet_id, gid) from a Google Sheets URL or an id."""
    spreadsheet_id = value
    gid = "0"

    parsed = urlparse(value)
    if parsed.netloc:
        match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
        if not match:
            raise ValueError("找不到 Google Sheets spreadsheet id。")

        spreadsheet_id = match.group(1)

        query_gid = parse_qs(parsed.query).get("gid", [None])[0]
        fragment_gid = parse_qs(parsed.fragment).get("gid", [None])[0]
        gid = query_gid or fragment_gid or "0"

    return spreadsheet_id, gid


def make_csv_export_url(spreadsheet_id: str, gid: str) -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
        f"/export?format=csv&gid={gid}"
    )


def download_csv(url: str, timeout: int = 30) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (compatible; google-sheet-to-json/1.0; "
                "+https://docs.google.com/spreadsheets/)"
            )
        },
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8-sig"
            return response.read().decode(charset)
    except HTTPError as exc:
        if exc.code in {401, 403}:
            raise RuntimeError(
                "無法讀取試算表。請確認這份 Google Sheets 已設為「知道連結的任何人可查看」。"
            ) from exc
        raise RuntimeError(f"下載 CSV 失敗，HTTP 狀態碼：{exc.code}") from exc
    except URLError as exc:
        raise RuntimeError(f"下載 CSV 失敗：{exc.reason}") from exc


def dedupe_headers(headers: list[str]) -> list[str]:
    counts: dict[str, int] = {}
    result: list[str] = []

    for index, header in enumerate(headers, start=1):
        name = header.strip() or f"column_{index}"
        counts[name] = counts.get(name, 0) + 1
        if counts[name] > 1:
            name = f"{name}_{counts[name]}"
        result.append(name)

    return result


def csv_text_to_records(csv_text: str) -> list[dict[str, str]]:
    reader = csv.reader(io.StringIO(csv_text))
    rows = [row for row in reader if any(cell.strip() for cell in row)]

    if not rows:
        return []

    headers = dedupe_headers(rows[0])
    records: list[dict[str, str]] = []

    for row in rows[1:]:
        padded_row = row + [""] * (len(headers) - len(row))
        records.append(dict(zip(headers, padded_row[: len(headers)])))

    return records


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(
        description="Read a public Google Sheets tab and convert it to JSON."
    )
    parser.add_argument(
        "sheet",
        nargs="?",
        default=DEFAULT_URL,
        help="Google Sheets URL or spreadsheet id. Defaults to the URL in this task.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output JSON file path. If omitted, JSON is printed to stdout.",
    )
    parser.add_argument(
        "--gid",
        help="Override the sheet gid. Useful when passing only a spreadsheet id.",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="Write compact JSON instead of pretty-printed JSON.",
    )

    args = parser.parse_args()

    try:
        spreadsheet_id, parsed_gid = parse_google_sheet_reference(args.sheet)
        gid = args.gid or parsed_gid
        csv_url = make_csv_export_url(spreadsheet_id, gid)
        records = csv_text_to_records(download_csv(csv_url))

        json_text = json.dumps(
            records,
            ensure_ascii=False,
            indent=None if args.compact else 2,
        )

        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json_text + "\n", encoding="utf-8")
            print(f"Wrote {len(records)} rows to {args.output}")
        else:
            print(json_text)

        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
