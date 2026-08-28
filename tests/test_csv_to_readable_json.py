import csv
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PROJECT_ROOT / "etl" / "csv_to_readable_json.py"

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


class CsvToReadableJsonTest(unittest.TestCase):
    def test_converts_csv_to_existing_readable_key_structure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = Path(temp_dir) / "survey.csv"
            output_path = Path(temp_dir) / "survey.json"
            with input_path.open("w", encoding="utf-8-sig", newline="") as file:
                writer = csv.writer(file)
                writer.writerow(HEADERS)
                writer.writerow(
                    [
                        "2026/8/28 上午 3:04:57",
                        "匿名",
                        " SA ",
                        "無",
                        "4",
                        "0.7",
                        "66萬",
                        "2",
                        "105.5",
                        "7",
                        "幾乎沒有",
                        "1",
                        "4",
                        "3",
                        "",
                    ]
                )

            result = subprocess.run(
                [sys.executable, SCRIPT, input_path, "--output", output_path],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            generated_files = list(Path(temp_dir).glob("survey_*.json"))
            self.assertEqual(len(generated_files), 1)
            self.assertRegex(
                generated_files[0].name,
                re.compile(r"^survey_\d{8}_\d{6}\.json$"),
            )
            self.assertFalse(output_path.exists())
            records = json.loads(generated_files[0].read_text(encoding="utf-8"))
            self.assertEqual(
                records,
                [
                    {
                        "timestamp": "2026/8/28 上午 3:04:57",
                        "company": "匿名",
                        "job_title": "SA",
                        "job_level": "無",
                        "total_exp_years": 4,
                        "current_exp_years": 0.7,
                        "base_salary_10k": 5.5,
                        "bonus_months": 2,
                        "total_comp_10k": 105.5,
                        "daily_hours": 7,
                        "monthly_overtime": "幾乎沒有",
                        "overtime_freq": 1,
                        "chill": 4,
                        "loading": 3,
                        "notes": "",
                        "sheet_row": 2,
                    }
                ],
            )

    def test_normalizes_salary_values_to_ten_thousands(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = Path(temp_dir) / "survey.csv"
            output_path = Path(temp_dir) / "survey.json"
            with input_path.open("w", encoding="utf-8-sig", newline="") as file:
                writer = csv.writer(file)
                writer.writerow(HEADERS)

                for base_salary, total_comp in [
                    ("66萬", "105.5"),
                    ("54,000", "1,050,000"),
                    ("NT$79,000", "113.4萬"),
                    ("720000", "113400"),
                ]:
                    row = [""] * len(HEADERS)
                    row[6] = base_salary
                    row[8] = total_comp
                    writer.writerow(row)

            result = subprocess.run(
                [sys.executable, SCRIPT, input_path, "--output", output_path],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            generated_files = list(Path(temp_dir).glob("survey_*.json"))
            self.assertEqual(len(generated_files), 1)
            records = json.loads(generated_files[0].read_text(encoding="utf-8"))
            self.assertEqual(
                [
                    (row["base_salary_10k"], row["total_comp_10k"])
                    for row in records
                ],
                [(5.5, 105.5), (5.4, 105), (7.9, 113.4), (6, 113.4)],
            )


if __name__ == "__main__":
    unittest.main()
