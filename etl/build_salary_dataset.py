#!/usr/bin/env python3

import argparse
import json
import re
import unicodedata
from datetime import datetime
from pathlib import Path

from csv_to_readable_json import convert_csv


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DCARD = PROJECT_ROOT / "data" / "sheet_data_readable_dcard.json"
DEFAULT_CSV = (
    PROJECT_ROOT
    / "data"
    / "軟體工程師薪資調查(匿名) (回覆) - 表單回覆 1.csv"
)
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "data"


COMPANY_ALIAS_GROUPS: dict[str, tuple[str, ...]] = {
    "91APP 九易宇軒": ("91app", "九易宇軒"),
    "Appier 沛星互動科技": ("appier", "沛星", "沛星互動科技"),
    "Cadence 益華電腦": ("cadence", "益華電腦"),
    "Cathay United Bank 國泰世華銀行": (
        "cathay united bank",
        "cathay united bank 國泰世華銀行",
        "國泰",
        "國泰世華",
        "國泰世華銀行",
        "國泰世華銀行股份有限公司",
    ),
    "Chunghwa Telecom 中華電信": (
        "cht",
        "中華電信",
        "中華電信股份有限公司",
        "中華電信研究所",
        "中華電信研究院",
    ),
    "CyberLink 訊連科技": (
        "cyberlink",
        "訊連cyberlink",
        "訊連",
        "訊連科技",
        "訊連科技股份有限公司",
    ),
    "CyCraft 奧義智慧": (
        "cycraft",
        "奧義智慧",
        "奧義智慧科技",
        "奧義智慧科技股份有限公司",
    ),
    "Dcard 狄卡": ("dcard", "狄卡"),
    "DEInfo 德義資訊": ("deinfo", "德義資訊"),
    "E.SUN Bank 玉山銀行": ("e.sun bank", "esun", "玉山", "玉山銀行"),
    "Eastern Home Shopping 東森購物": ("東森購物",),
    "Far EasTone 遠傳電信": ("far eas tone", "遠傳", "遠傳電信"),
    "Galaxy Software Services 叡揚資訊": (
        "galaxy software services",
        "叡揚",
        "叡揚資訊",
    ),
    "Gamania 遊戲橘子": ("gamania", "遊戲橘子"),
    "Google 谷歌": ("google", "谷歌"),
    "GOGOX 高高客": ("gogox", "高高客"),
    "Heaven Games 天堂遊戲": ("heaven games", "天堂遊戲"),
    "Hon Hai 鴻海精密工業": ("hon hai", "鴻海", "鴻海精密工業"),
    "IBM 國際商業機器": ("ibm", "國際商業機器"),
    "ITRI 工業技術研究院": (
        "itri",
        "工研院",
        "工業技術研究院",
    ),
    "KKCompany 科科科技": ("kkcompany", "科科科技"),
    "Microsoft 微軟": ("microsoft", "微軟", "微軟air&d"),
    "Amazon 亞馬遜": ("amazon", "亞馬遜"),
    "ASUS 華碩": ("asus", "華碩", "華碩電腦"),
    "Delta Electronics 台達電子": (
        "delta electronics",
        "台達",
        "台達電子",
    ),
    "Mitake 三竹資訊": (
        "mitake",
        "三竹",
        "三竹資訊",
        "三竹資訊股份有限公司",
    ),
    "momo 富邦媒體科技": (
        "momo",
        "momo / 富邦媒體科技股份有限公司",
        "富邦媒體科技",
        "富邦媒體科技股份有限公司",
    ),
    "NEXT BANK 將來銀行": ("next bank", "將來銀行"),
    "Pinkoi 果翼科技": ("pinkoi", "果翼科技"),
    "PChome 網路家庭": ("pchome", "pchome網家", "網路家庭"),
    "Provision Information 普鴻資訊": ("provision information", "普鴻資訊"),
    "SHOPLINE 商線科技": ("shopline", "商線科技"),
    "Supermicro 美超微": ("supermicro", "美超微"),
    "Synology 群暉科技": ("synology", "群暉", "群暉科技"),
    "Synopsys 新思科技": (
        "synopsis",
        "synopsys",
        "synopsys 新思",
        "新思科技 - synopsys",
        "新思",
        "新思科技",
    ),
    "SYSTEX 精誠資訊": ("systex", "systex精誠", "精誠", "精誠資訊"),
    "Taiwan Mobile 台灣大哥大": ("taiwan mobile", "台灣大哥大"),
    "TPIsoftware 昕力資訊": ("tpisoftware", "昕力", "昕力資訊"),
    "Trend Micro 趨勢科技": (
        "trend micro",
        "trendmicro",
        "trendmicro趨勢科技",
        "趨勢",
        "趨勢科技",
    ),
    "TSMC 台灣積體電路製造": (
        "tsmc",
        "台積",
        "台積電",
        "台灣積體電路製造",
        "台灣積體電路製造股份有限公司",
    ),
    "TXOne Networks 睿控網安": (
        "txone",
        "txone network",
        "txone networks",
        "txone networks 睿控網安",
        "睿控網安",
    ),
    "ViewSonic 優派國際": ("viewsonic", "優派", "優派國際"),
    "Wistron ITS 緯創軟體": ("wistron its", "緯創軟體"),
    "NVIDIA 輝達": ("nvidia", "輝達"),
    "Yahoo 雅虎": ("yahoo", "雅虎"),
}


def company_lookup_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).strip().casefold()
    return re.sub(r"\s+", " ", normalized)


COMPANY_ALIASES = {
    company_lookup_key(alias): canonical
    for canonical, aliases in COMPANY_ALIAS_GROUPS.items()
    for alias in (canonical, *aliases)
}


def normalize_company_name(value: object) -> object:
    if not isinstance(value, str):
        return value
    trimmed = value.strip()
    return COMPANY_ALIASES.get(company_lookup_key(trimmed), trimmed)


def read_json_records(path: Path) -> list[dict[str, object]]:
    with path.open("r", encoding="utf-8-sig") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError(f"{path} 的最外層必須是 JSON 陣列")
    if not all(isinstance(record, dict) for record in data):
        raise ValueError(f"{path} 的每筆資料都必須是 JSON 物件")
    return data


def normalize_records(records: list[dict[str, object]]) -> list[dict[str, object]]:
    normalized = []
    for source in records:
        record = dict(source)
        record["company"] = normalize_company_name(record.get("company", ""))
        normalized.append(record)
    return normalized


def record_identity(record: dict[str, object]) -> str:
    semantic_record = {
        key: value for key, value in record.items() if key != "sheet_row"
    }
    return json.dumps(
        semantic_record,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def merge_records(
    record_groups: list[list[dict[str, object]]],
) -> tuple[list[dict[str, object]], int]:
    merged: list[dict[str, object]] = []
    seen: set[str] = set()
    duplicate_count = 0
    for records in record_groups:
        for record in normalize_records(records):
            identity = record_identity(record)
            if identity in seen:
                duplicate_count += 1
                continue
            seen.add(identity)
            merged.append(record)
    return merged, duplicate_count


def timestamped_output_path(output_dir: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return output_dir / f"salary_data_merged_{timestamp}.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="轉換匿名薪資 CSV、統一公司別名，並與 DCard JSON 合併。"
    )
    parser.add_argument(
        "--dcard",
        type=Path,
        default=DEFAULT_DCARD,
        help=f"DCard JSON 路徑（預設：{DEFAULT_DCARD}）",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help=f"匿名調查 CSV 路徑（預設：{DEFAULT_CSV}）",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"輸出資料夾（預設：{DEFAULT_OUTPUT_DIR}）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        dcard_records = read_json_records(args.dcard)
        csv_records = convert_csv(args.csv)
        records, duplicate_count = merge_records([dcard_records, csv_records])
        output_path = timestamped_output_path(args.output_dir)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(records, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise SystemExit(f"錯誤：{error}") from error

    print(
        f"DCard {len(dcard_records)} 筆 + CSV {len(csv_records)} 筆，"
        f"移除 {duplicate_count} 筆重複資料，輸出 {len(records)} 筆：{output_path}"
    )


if __name__ == "__main__":
    main()
