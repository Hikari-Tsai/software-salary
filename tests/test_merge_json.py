import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PROJECT_ROOT / "etl" / "merge_json.py"


class MergeJsonTest(unittest.TestCase):
    def test_merges_json_arrays_in_input_order_with_timestamped_output(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            first = root / "first.json"
            second = root / "second.json"
            output = root / "merged.json"
            first.write_text(
                json.dumps([{"source": "first", "id": 1}], ensure_ascii=False),
                encoding="utf-8",
            )
            second.write_text(
                json.dumps(
                    [
                        {"source": "first", "id": 1},
                        {"source": "second", "id": 2},
                        {"source": "second", "id": 3},
                    ],
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [sys.executable, SCRIPT, first, second, "--output", output],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            generated = list(root.glob("merged_*.json"))
            self.assertEqual(len(generated), 1)
            self.assertRegex(generated[0].name, re.compile(r"^merged_\d{8}_\d{6}\.json$"))
            self.assertFalse(output.exists())
            self.assertIn("移除 1 筆重複資料", result.stdout)
            self.assertEqual(
                json.loads(generated[0].read_text(encoding="utf-8")),
                [
                    {"source": "first", "id": 1},
                    {"source": "second", "id": 2},
                    {"source": "second", "id": 3},
                ],
            )

    def test_rejects_an_input_that_is_not_a_json_array(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            valid = root / "valid.json"
            invalid = root / "invalid.json"
            valid.write_text("[]", encoding="utf-8")
            invalid.write_text('{"id": 1}', encoding="utf-8")

            result = subprocess.run(
                [sys.executable, SCRIPT, valid, invalid, "--output", root / "merged.json"],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("JSON 陣列", result.stderr)
            self.assertEqual(list(root.glob("merged_*.json")), [])


if __name__ == "__main__":
    unittest.main()
