import assert from "node:assert/strict";
import test from "node:test";

import { companyRankings, normalizeCompanyName } from "../app/company-rankings.ts";

test("company aliases resolve to one display name", () => {
  assert.equal(normalizeCompanyName("Trend Micro"), "Trend Micro 趨勢科技");
  assert.equal(normalizeCompanyName("趨勢"), "Trend Micro 趨勢科技");
  assert.equal(normalizeCompanyName("Synology"), "Synology 群暉科技");
  assert.equal(normalizeCompanyName("群暉科技"), "Synology 群暉科技");
  assert.equal(normalizeCompanyName("沛星"), "Appier 沛星互動科技");
  assert.equal(normalizeCompanyName("國泰"), "Cathay United Bank 國泰世華銀行");
});

test("company shortlist contains every unique company with at least three samples", () => {
  assert.equal(companyRankings.length, 31);
  assert.equal(new Set(companyRankings.map(({ company }) => company)).size, 31);
  assert.ok(companyRankings.every(({ n }) => n >= 3));
  assert.equal(companyRankings.at(-1)?.company, "Gamania 遊戲橘子");
  assert.deepEqual(
    companyRankings.map(({ rank }) => rank),
    Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")),
  );
});

test("top three companies retain logo presentation", () => {
  assert.ok(companyRankings.slice(0, 3).every(({ logo }) => Boolean(logo)));
});

test("every company uses an English name followed by a Chinese name", () => {
  const bilingualName = /^[A-Za-z0-9][A-Za-z0-9.&+\- ]* [\p{Script=Han}]/u;
  assert.deepEqual(
    companyRankings.filter(({ company }) => !bilingualName.test(company)).map(({ company }) => company),
    [],
  );
  assert.equal(companyRankings[0].company, "Synopsys 新思科技");
  assert.equal(companyRankings[3].company, "Chunghwa Telecom 中華電信");
  assert.equal(companyRankings[23].company, "TPIsoftware 昕力資訊");
});

test("raw survey company names normalize to bilingual display names", () => {
  const rawNames = ["Synopsys", "Google", "微軟", "中華電信", "GoGoX", "工研院", "緯創軟體", "台灣大哥大", "IBM", "遊戲橘子"];
  assert.ok(rawNames.every((name) => /[A-Za-z].*[\p{Script=Han}]/u.test(normalizeCompanyName(name))));
});
