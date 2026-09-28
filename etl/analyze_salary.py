#!/usr/bin/env python3
"""Reproducible, conservative salary snapshot for the static frontend (stdlib only)."""

import argparse
from collections import Counter, defaultdict
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import math
from pathlib import Path
import re

from build_salary_dataset import normalize_company_name, read_json_records

ROOT = Path(__file__).resolve().parents[1]
TEST_VALUES = {"test", "測試", "假的", "只想看結果", "123"}
# Exact exclusions: never mistake a real QA/test engineer for a test submission.
NON_TECH_ROLES = {"廚師"}
ANONYMOUS_COMPANIES = {"", "匿名", "不提供", "不便透露", "保密", "新創", "新創公司", "電商", "外商", "軟體公司", "公司", "博弈", "傳產"}

ROLE_RULES = [
    ("全端", r"全端|full[\s-]?stack"),
    ("前端", r"前端|front[\s-]?end"),
    ("後端", r"後端|後段|back[\s-]?end"),
    ("DevOps / SRE", r"\b(devops|sre)\b|雲端|cloud|infrastructure"),
    ("QA / 測試", r"\bqa\b|test|測試|validation"),
    ("資料 / AI", r"\b(ai|ml|data)\b|資料|數據|人工智|演算法|machine learning"),
    ("行動端", r"android|\bios\b|mobile|行動"),
    ("資安", r"security|資安"),
    ("管理 / PM", r"\b(pm|tpm|manager|director)\b|主管|經理|專案管理|產品管理"),
    ("顧問 / FAE", r"consultant|\b(fae|fse)\b|顧問"),
    ("硬體 / 韌體", r"firmware|hardware|embedded|硬體|韌體|嵌入式|\bplc\b"),
    ("一般軟體", r"software|軟體|程式|developer|\b(swe|sde|rd|r&d|pg|sa)\b|architect|系統工程"),
]

# Company names alone do not prove an industry. Only explicit mappings/keywords
# are classified; the remainder stays unclassified instead of defaulting to software.
COMPANY_RULES = [
    ("資安", r"trend micro|txone|cycraft|netskope|teamt5|資安|全景軟體"),
    ("半導體 / 硬體", r"tsmc|synopsys|cadence|nvidia|\bamd\b|asml|micron|asus|supermicro|hon hai|台達|微星|半導體|電子|光寶|智邦|鴻勁|新代|聯發|聯詠"),
    ("金融", r"bank|銀行|金控|證券|保險|金融|binance|幣安|交易|加密|quant|kronos"),
    ("遊戲 / 博弈", r"遊戲|博[弈奕]|gaming|games|gamania"),
    ("電商 / 平台", r"91app|pchome|momo|pinkoi|shopline|gogox|dcard|yahoo|購物|電商"),
    ("外商 / 大型科技", r"google|microsoft|amazon|\bibm\b|servicenow|salesforce|\bmeta\b|抖音|外商|美商|歐商"),
    ("新創", r"新創|startup"),
    ("SI / 外包", r"tpisoftware|systex|deinfo|wistron its|galaxy software|外包|接案|駐點|\bsi\b|資拓|凌群|中菲|康大|捷而思"),
    ("一般軟體公司", r"synology|appier|cyberlink|kkcompany|provision information|mitake|軟體|software"),
    ("傳統企業 / 電信", r"chunghwa|taiwan mobile|far eastone|itri|醫院|電信|傳產|傳統|電機|藥品|旅行|鋼鐵|華新"),
]


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def rounded(value):
    return float(Decimal(str(value)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def percentile(values, fraction):
    """Linear interpolation at (n - 1) * p, same convention for all charts."""
    if not values:
        return None
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower = math.floor(position)
    upper = math.ceil(position)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def stats(values):
    if not values:
        return {"n": 0, "mean": None, **{f"p{p}": None for p in (10, 25, 50, 75, 90)}}
    return {"n": len(values), "mean": rounded(sum(values) / len(values)),
            **{f"p{p}": rounded(percentile(values, p / 100)) for p in (10, 25, 50, 75, 90)}}


def salary_exclusion(row):
    if any(str(row.get(k, "")).strip().casefold() in TEST_VALUES for k in ("company", "job_title")):
        return "test_submission"
    if str(row.get("job_title", "")).strip() in NON_TECH_ROLES:
        return "non_technical_role"
    base, annual = row.get("base_salary_10k"), row.get("total_comp_10k")
    if not number(base) or not number(annual):
        return "salary_not_numeric"
    if not 2 <= base <= 30:
        return "base_outside_2_30"
    if not 30 <= annual <= 600:
        return "annual_outside_30_600"
    return None


def experience_group(row):
    # Do not invent a precise year from '不到一年', '3-5', etc.
    years = row.get("total_exp_years")
    if not number(years) or not 0 <= years <= 60:
        return None
    for upper, label in [(1, "0–1 年"), (3, "1–3 年"), (5, "3–5 年"), (8, "5–8 年"), (12, "8–12 年"), (61, "12 年＋")]:
        if years < upper:
            return label


def classify(text, rules, fallback):
    for label, pattern in rules:
        if re.search(pattern, text, re.I):
            return label
    return fallback


def role_group(row):
    return classify(str(row.get("job_title", "")), ROLE_RULES, "其他 / 未分類")


def company_group(row):
    return classify(str(row.get("company", "")), COMPANY_RULES, "未分類公司")


def grouped(rows, classifier, labels):
    result = []
    for label in labels:
        values = [r["total_comp_10k"] for r in rows if classifier(r) == label]
        if values:
            result.append({"label": label, "n": len(values), "median": rounded(percentile(values, .5)), "p75": rounded(percentile(values, .75))})
    return result


def valid_metric(rows, key, low, high):
    return [r[key] for r in rows if number(r.get(key)) and low <= r[key] <= high]


def survey_time(value):
    match = re.fullmatch(r"(\d{4})/(\d{1,2})/(\d{1,2})\s+(上午|下午)\s+(\d{1,2}):(\d{2}):(\d{2})", str(value))
    if not match:
        return None
    y, m, d, period, h, minute, second = match.groups()
    try:
        return datetime(int(y), int(m), int(d), int(h) % 12 + (12 if period == "下午" else 0), int(minute), int(second))
    except ValueError:
        return None


def analyze(records, source_name="", source_sha256=""):
    valid, excluded, duplicates, seen = [], [], [], set()
    for index, original in enumerate(records):
        row = {**original, "company": normalize_company_name(original.get("company", ""))}
        identity = json.dumps({k: v for k, v in row.items() if k != "sheet_row"}, sort_keys=True, ensure_ascii=False)
        if identity in seen:
            duplicates.append(index)
            continue
        seen.add(identity)
        reason = salary_exclusion(row)
        if reason:
            excluded.append({"index": index, "sheet_row": row.get("sheet_row"), "reason": reason})
        else:
            valid.append(row)
    if not valid:
        raise ValueError("沒有符合分析規則的薪資資料")
    dates = [date for row in records if (date := survey_time(row.get("timestamp"))) is not None]
    if not dates:
        raise ValueError("沒有可辨識的填答時間")
    latest = max(dates)
    company_rows = defaultdict(list)
    for row in valid:
        name = row["company"]
        if isinstance(name, str) and name not in ANONYMOUS_COMPANIES:
            company_rows[name].append(row)
    rankings = []
    for name, rows in company_rows.items():
        if len(rows) < 3:
            continue
        salary = percentile([r["total_comp_10k"] for r in rows], .5)
        chill = percentile(valid_metric(rows, "chill", 1, 5), .5)
        loading = percentile(valid_metric(rows, "loading", 1, 5), .5)
        hours = percentile(valid_metric(rows, "daily_hours", 4, 16), .5)
        rankings.append({"company": name, "salary": rounded(salary), "chill": rounded(chill) if chill is not None else None,
                         "工作強度": rounded(loading) if loading is not None else None, "hours": rounded(hours) if hours is not None else None,
                         "n": len(rows), "hoursN": len(valid_metric(rows, "daily_hours", 4, 16))})
    max_salary = max((r["salary"] for r in rankings), default=1)
    for row in rankings:
        # A missing self-rating contributes no points, and is displayed as missing.
        score = (60 * row["salary"] / max_salary + 20 * ((row["chill"] or 1) - 1) / 4
                 + 15 * (5 - (row["工作強度"] if row["工作強度"] is not None else 5)) / 4
                 + 5 * min(row["n"], 10) / 10)
        row["score"] = rounded(score)
        row["tag"] = f"綜合分數 {row['score']:g}"
    rankings.sort(key=lambda r: (-r["score"], -r["salary"], -r["n"], r["company"]))
    for i, row in enumerate(rankings):
        row["rank"] = str(i + 1).zfill(2)
    company = grouped(valid, company_group, [x[0] for x in COMPANY_RULES] + ["未分類公司"])
    comparison = {x["label"]: x["median"] for x in company}
    high_load = [r["total_comp_10k"] for r in valid if number(r.get("loading")) and 4 <= r["loading"] <= 5]
    low_load = [r["total_comp_10k"] for r in valid if number(r.get("loading")) and 1 <= r["loading"] <= 2]
    heavy = [r["total_comp_10k"] for r in valid if (number(r.get("loading")) and 4 <= r["loading"] <= 5) or (number(r.get("overtime_freq")) and 4 <= r["overtime_freq"] <= 5)]
    snapshot = {
        "schemaVersion": 1, "methodVersion": "2026-09-28", "sourceFile": source_name, "sourceSha256": source_sha256,
        "updatedAt": latest.isoformat() + "+08:00", "updatedLabel": f"{latest.year} 年 {latest.month} 月 {latest.day} 日 {latest:%H:%M}",
        "rawCount": len(records), "duplicateCount": len(duplicates), "excludedCount": len(excluded),
        "salary": stats([r["total_comp_10k"] for r in valid]), "base": stats([r["base_salary_10k"] for r in valid]),
        "hours": stats(valid_metric(valid, "daily_hours", 4, 16)),
        "experience": grouped(valid, experience_group, ["0–1 年", "1–3 年", "3–5 年", "5–8 年", "8–12 年", "12 年＋"]),
        "experienceMissing": sum(experience_group(r) is None for r in valid),
        "experienceZero": sum(r.get("total_exp_years") == 0 for r in valid),
        "roles": grouped(valid, role_group, [x[0] for x in ROLE_RULES] + ["其他 / 未分類"]),
        "companyTypes": company, "rankings": rankings,
        "insights": {"generalSalary": comparison.get("一般軟體公司"), "bigTechSalary": comparison.get("外商 / 大型科技"),
                     "highLoad": stats(high_load), "lowLoad": stats(low_load), "heavy": stats(heavy)},
    }
    audit = {"sourceFile": source_name, "sourceSha256": source_sha256, "methodVersion": snapshot["methodVersion"],
             "exclusionCounts": dict(Counter(x["reason"] for x in excluded)), "excluded": excluded, "duplicates": duplicates}
    return snapshot, audit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "app" / "salary-data.json")
    parser.add_argument("--audit", type=Path, default=ROOT / "data" / "salary_analysis_audit.json")
    args = parser.parse_args()
    try:
        records = read_json_records(args.input)
        snapshot, audit = analyze(records, args.input.name, hashlib.sha256(args.input.read_bytes()).hexdigest())
        for path, value in [(args.output, snapshot), (args.audit, audit)]:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    except (OSError, ValueError) as exc:
        raise SystemExit(f"分析失敗：{exc}") from exc
    print(f"原始 {snapshot['rawCount']} / 薪資 {snapshot['salary']['n']} / 工時 {snapshot['hours']['n']} / 公司 {len(snapshot['rankings'])}")
    print(f"年薪中位數 {snapshot['salary']['p50']} / 平均 {snapshot['salary']['mean']} / P90 {snapshot['salary']['p90']}")
    print(args.output)


if __name__ == "__main__":
    main()
