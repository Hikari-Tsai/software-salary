import assert from "node:assert/strict";
import test from "node:test";

import { interpolateSalary } from "../app/salary-interpolation.ts";

const anchors = [
  { year: 0, median: 84.5, p75: 120 },
  { year: 2, median: 77, p75: 109.5 },
  { year: 4, median: 98, p75: 130 },
];

test("interpolates salary values between adjacent experience anchors", () => {
  assert.deepEqual(interpolateSalary(anchors, 3), { median: 87.5, p75: 119.8 });
});

test("clamps salary values outside the experience range", () => {
  assert.deepEqual(interpolateSalary(anchors, -1), { median: 84.5, p75: 120 });
  assert.deepEqual(interpolateSalary(anchors, 8), { median: 98, p75: 130 });
});
