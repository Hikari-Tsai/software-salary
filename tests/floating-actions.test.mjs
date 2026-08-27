import assert from "node:assert/strict";
import test from "node:test";

import { floatingActions, navStarAction } from "../app/floating-actions.ts";

test("floating actions provide GitHub Star and salary survey destinations", () => {
  assert.deepEqual(floatingActions, [
    {
      label: "賞個 Star",
      icon: "★",
      href: "https://github.com/Hikari-Tsai/software-salary",
      kind: "star",
    },
    {
      label: "提供資料",
      icon: "✎",
      href: "https://docs.google.com/forms/d/e/1FAIpQLSex_qWWtuEYO0rmxFs7bsJof4KAzlQ4qveLH4IGxhff7FXcDg/viewform?usp=publish-editor",
      kind: "contribute",
    },
  ]);
});

test("navigation Star action reuses the repository destination", () => {
  assert.deepEqual(navStarAction, {
    label: "賞個 Star",
    shortLabel: "Star",
    href: "https://github.com/Hikari-Tsai/software-salary",
  });
});
