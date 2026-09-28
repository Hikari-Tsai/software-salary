import csv
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PROJECT_ROOT / "etl" / "build_salary_dataset.py"
sys.path.insert(0, str(PROJECT_ROOT / "etl"))

from build_salary_dataset import normalize_company_name

HEADERS = [
    "時間戳記",
    "公司名稱",
    "職務(名片上的前綴抬頭)",
    "職級(Junior, Senior, Staff, etc...)",
    "相關年資（年）",
    "現職年資（年）",
    "月底薪（萬元，新台幣）",
    "Bonus（幾個月）",
    "總年薪（萬元，含分紅、年終與底薪）",
    "每日平均工時（小時）",
    "每月加班情況",
    "加班頻率（1–5，1＝幾乎不加班，5＝非常頻繁）",
    "爽度（1–5，5＝最爽）",
    "Loading（1–5，5＝最忙）",
    "心得、是否推薦、面試相關資訊等",
]


class BuildSalaryDatasetTest(unittest.TestCase):
    def test_normalizes_observed_aliases_to_bilingual_company_names(self):
        aliases = {
            "TrendMicro趨勢科技": "Trend Micro 趨勢科技",
            "新思科技 - Synopsys": "Synopsys 新思科技",
            "訊連Cyberlink": "CyberLink 訊連科技",
            "Systex精誠": "SYSTEX 精誠資訊",
            "台達電子": "Delta Electronics 台達電子",
            "華碩電腦": "ASUS 華碩",
            "pchome網家": "PChome 網路家庭",
            "Nvidia": "NVIDIA 輝達",
            "AMAZON": "Amazon 亞馬遜",
            "yahoo": "Yahoo 雅虎",
        }
        self.assertEqual(
            {alias: normalize_company_name(alias) for alias in aliases},
            aliases,
        )

    def test_converts_normalizes_deduplicates_and_writes_timestamped_json(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            dcard = root / "dcard.json"
            survey = root / "survey.csv"
            output_dir = root / "output"

            shared_record = {
                "timestamp": "2026/9/1 上午 10:00:00",
                "company": "台積電",
                "job_title": "Software Engineer",
                "job_level": "Senior",
                "total_exp_years": 5,
                "current_exp_years": 2,
                "base_salary_10k": 9,
                "bonus_months": 30,
                "total_comp_10k": 390,
                "daily_hours": 9,
                "monthly_overtime": "常態",
                "overtime_freq": 4,
                "chill": 2,
                "loading": 5,
                "notes": "",
                "sheet_row": 99,
            }
            dcard.write_text(
                json.dumps(
                    [
                        shared_record,
                        {
                            **shared_record,
                            "timestamp": "2026/9/1 上午 11:00:00",
                            "company": "google",
                            "total_comp_10k": 350,
                        },
                    ],
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

            with survey.open("w", encoding="utf-8-sig", newline="") as file:
                writer = csv.writer(file)
                writer.writerow(HEADERS)
                writer.writerow(
                    [
                        shared_record["timestamp"],
                        "TSMC",
                        shared_record["job_title"],
                        shared_record["job_level"],
                        "5",
                        "2",
                        "90000",
                        "30",
                        "390萬",
                        "9",
                        "常態",
                        "4",
                        "2",
                        "5",
                        "",
                    ]
                )
                writer.writerow(
                    [
                        "2026/9/1 下午 12:00:00",
                        "中華電信股份有限公司",
                        "Backend Engineer",
                        "Junior",
                        "1",
                        "1",
                        "67000",
                        "7",
                        "135",
                        "8",
                        "0",
                        "1",
                        "5",
                        "1",
                        "",
                    ]
                )

            result = subprocess.run(
                [
                    sys.executable,
                    SCRIPT,
                    "--dcard",
                    dcard,
                    "--csv",
                    survey,
                    "--output-dir",
                    output_dir,
                ],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            generated = list(output_dir.glob("salary_data_merged_*.json"))
            self.assertEqual(len(generated), 1)
            self.assertRegex(
                generated[0].name,
                re.compile(r"^salary_data_merged_\d{8}_\d{6}\.json$"),
            )
            records = json.loads(generated[0].read_text(encoding="utf-8"))
            self.assertEqual(len(records), 3)
            self.assertEqual(
                [record["company"] for record in records],
                [
                    "TSMC 台灣積體電路製造",
                    "Google 谷歌",
                    "Chunghwa Telecom 中華電信",
                ],
            )
            self.assertEqual(records[0]["sheet_row"], 99)
            self.assertIn("移除 1 筆重複資料", result.stdout)

    def test_rejects_a_dcard_json_that_is_not_an_array(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            dcard = root / "dcard.json"
            survey = root / "survey.csv"
            dcard.write_text('{"company": "TSMC"}', encoding="utf-8")
            with survey.open("w", encoding="utf-8-sig", newline="") as file:
                csv.writer(file).writerow(HEADERS)

            result = subprocess.run(
                [sys.executable, SCRIPT, "--dcard", dcard, "--csv", survey],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("JSON 陣列", result.stderr)


if __name__ == "__main__":
    unittest.main()
