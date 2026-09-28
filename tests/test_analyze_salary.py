import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "etl"))
from analyze_salary import analyze, percentile, salary_exclusion, experience_group, survey_time


def row(index=0, **fields):
    return {
        "timestamp": "2026/9/27 下午 6:35:24", "sheet_row": index,
        "company": "Google", "job_title": "Software Engineer",
        "base_salary_10k": 5, "total_comp_10k": 100 + index,
        "total_exp_years": index, "daily_hours": 8,
        "chill": 3, "loading": 3, "overtime_freq": 1,
        **fields,
    }


class AnalyzeSalaryTest(unittest.TestCase):
    def test_percentiles_use_linear_interpolation(self):
        self.assertEqual(percentile([40, 10, 30, 20], .25), 17.5)
        self.assertEqual(percentile([40, 10, 30, 20], .5), 25)
        self.assertEqual(percentile([40, 10, 30, 20], .9), 37)
        self.assertIsNone(percentile([], .5))

    def test_filters_are_explicit_and_preserve_real_test_engineers(self):
        self.assertIsNone(salary_exclusion(row(job_title="Test Engineer")))
        self.assertEqual(salary_exclusion(row(job_title="測試")), "test_submission")
        self.assertIsNone(salary_exclusion(row(base_salary_10k=2, total_comp_10k=30)))
        self.assertIsNone(salary_exclusion(row(base_salary_10k=30, total_comp_10k=600)))
        self.assertEqual(salary_exclusion(row(base_salary_10k=30.1)), "base_outside_2_30")
        self.assertEqual(salary_exclusion(row(total_comp_10k=601)), "annual_outside_30_600")
        for value in [None, True, "100萬", float("nan"), float("inf")]:
            self.assertEqual(salary_exclusion(row(total_comp_10k=value)), "salary_not_numeric")

    def test_experience_boundaries_and_timestamp(self):
        expected = {0: "0–1 年", 1: "1–3 年", 3: "3–5 年", 5: "5–8 年", 8: "8–12 年", 12: "12 年＋"}
        for years, label in expected.items():
            self.assertEqual(experience_group(row(total_exp_years=years)), label)
        for value in [None, -1, 61, "3-5", True]:
            self.assertIsNone(experience_group(row(total_exp_years=value)))
        self.assertEqual(survey_time("2026/9/27 下午 12:00:00").hour, 12)
        self.assertEqual(survey_time("2026/9/27 上午 12:00:00").hour, 0)

    def test_aggregate_reconciles_and_deduplicates_aliases(self):
        records = [row(0), row(1, company="谷歌"), row(2),
                   row(3, company="匿名", total_exp_years=None, daily_hours=None),
                   row(4, company="Other"), row(5, job_title="test")]
        records.append({**records[0], "company": "Google 谷歌", "sheet_row": 99})
        data, audit = analyze(records)
        self.assertEqual(data["salary"]["n"], 5)
        self.assertEqual(data["salary"]["p50"], 102)
        self.assertEqual(data["hours"]["n"], 4)
        self.assertEqual(data["duplicateCount"], 1)
        self.assertEqual(data["excludedCount"], 1)
        self.assertEqual(sum(x["n"] for x in data["experience"]) + data["experienceMissing"], 5)
        self.assertEqual(sum(x["n"] for x in data["roles"]), 5)
        self.assertEqual(sum(x["n"] for x in data["companyTypes"]), 5)
        self.assertEqual(len(data["rankings"]), 1)
        company = data["rankings"][0]
        self.assertEqual(company["company"], "Google 谷歌")
        self.assertEqual(company["salary"], 101)
        self.assertEqual(company["score"], 79)  # 60 + 10 + 7.5 + 1.5
        self.assertEqual(audit["exclusionCounts"], {"test_submission": 1})
        self.assertNotIn("notes", json.dumps(data))

    def test_checked_in_snapshot_matches_source_and_current_rules(self):
        saved = json.loads((ROOT / "app/salary-data.json").read_text())
        source = ROOT / "data" / saved["sourceFile"]
        data, audit = analyze(json.loads(source.read_text()), source.name, hashlib.sha256(source.read_bytes()).hexdigest())
        self.assertEqual(data, saved)
        self.assertEqual(audit, json.loads((ROOT / "data/salary_analysis_audit.json").read_text()))
        self.assertEqual(data["rawCount"], data["salary"]["n"] + data["excludedCount"] + data["duplicateCount"])
        for group in ["roles", "companyTypes"]:
            self.assertEqual(sum(x["n"] for x in data[group]), data["salary"]["n"])


if __name__ == "__main__":
    unittest.main()
