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
    def test_company_quartiles_and_detail_metrics_use_eligible_rows(self):
        records = [row(i, total_comp_10k=value, daily_hours=8 if i < 4 else 42,
                       notes="一則回饋" if i == 0 else "", overtime_freq=2)
                   for i, value in enumerate([50, 80, 100, 120, 300])]
        records.append(row(9, total_comp_10k=900, notes="不應列入"))
        data, _ = analyze(records)
        company = data["rankings"][0]
        self.assertEqual((company["p25"], company["p75"]), (80, 120))
        self.assertEqual(company["details"]["hours"], {"median": 8, "n": 4})
        self.assertEqual(company["details"]["experience"], {"median": 2, "n": 5})
        self.assertEqual(company["details"]["overtime"], {"median": 2, "n": 5})
        self.assertEqual(company["details"]["feedbackCount"], 1)
        self.assertEqual(company["details"]["roles"], [{"label": "一般軟體", "n": 5}])
        self.assertNotIn("一則回饋", json.dumps(data, ensure_ascii=False))

    def test_company_interval_is_suppressed_below_five_samples(self):
        for n in [3, 4]:
            data, _ = analyze([row(i, daily_hours=None, chill=None, loading=None) for i in range(n)])
            company = data["rankings"][0]
            self.assertIsNone(company["p25"])
            self.assertIsNone(company["p75"])
            self.assertEqual(company["details"]["hours"], {"median": None, "n": 0})

    def test_reviewed_feedback_requires_matching_source_and_nonempty_responses(self):
        records = [row(i, notes="回饋" if i == 0 else "") for i in range(5)]
        reviews = {"sourceSha256": "current", "companies": {"Google 谷歌": "整理後的回饋"}}
        data, _ = analyze(records, source_sha256="current", feedback_reviews=reviews)
        self.assertEqual(data["rankings"][0]["details"]["feedback"], {"status": "reviewed", "text": "整理後的回饋"})
        data, _ = analyze(records, source_sha256="changed", feedback_reviews=reviews)
        self.assertEqual(data["rankings"][0]["details"]["feedback"], {"status": "pending", "text": ""})
        data, _ = analyze([row(i, notes="無") for i in range(5)], source_sha256="current", feedback_reviews=reviews)
        self.assertEqual(data["rankings"][0]["details"]["feedback"], {"status": "empty", "text": ""})

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
        reviews = json.loads((ROOT / "data/company_feedback_reviews.json").read_text())
        data, audit = analyze(json.loads(source.read_text()), source.name, hashlib.sha256(source.read_bytes()).hexdigest(), reviews)
        self.assertEqual(data, saved)
        self.assertEqual(audit, json.loads((ROOT / "data/salary_analysis_audit.json").read_text()))
        self.assertEqual(data["rawCount"], data["salary"]["n"] + data["excludedCount"] + data["duplicateCount"])
        for group in ["roles", "companyTypes"]:
            self.assertEqual(sum(x["n"] for x in data[group]), data["salary"]["n"])


if __name__ == "__main__":
    unittest.main()
