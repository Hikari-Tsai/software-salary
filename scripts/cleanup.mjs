#!/usr/bin/env node

import { access, readFile, rm } from "node:fs/promises";
import { resolve, relative } from "node:path";

const generatedTargets = [
  ".next",
  ".vinext",
  ".wrangler",
  "dist",
  "out",
  "coverage",
];

const duplicateTargets = [
  "README 2.md",
  "app/page 2.tsx",
  "app/layout 2.tsx",
  "app/globals 2.css",
];

const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(["--apply", "--include-dependencies", "--help"]);

if ([...args].some((arg) => !allowedArgs.has(arg))) {
  console.error("未知參數。請使用 --help 查看用法。");
  process.exit(1);
}

if (args.has("--help")) {
  console.log(`用法：node scripts/cleanup.mjs [選項]

預設只預覽，不會刪除任何檔案。

選項：
  --apply                 執行清理
  --include-dependencies  一併清除 node_modules（需搭配 --apply）
  --help                  顯示說明`);
  process.exit(0);
}

const root = resolve(process.cwd());
const packageJsonPath = resolve(root, "package.json");

try {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  if (packageJson.name !== "site-creator-vinext-starter") {
    throw new Error("專案名稱不符");
  }
} catch {
  console.error("安全檢查失敗：請在 software-salary 專案根目錄執行。");
  process.exit(1);
}

const targets = [...generatedTargets, ...duplicateTargets];
if (args.has("--include-dependencies")) targets.push("node_modules");

const existingTargets = [];
for (const target of targets) {
  const absolutePath = resolve(root, target);
  const relativePath = relative(root, absolutePath);
  if (relativePath.startsWith("..") || relativePath === "") {
    console.error(`拒絕處理工作區外路徑：${target}`);
    process.exit(1);
  }

  try {
    await access(absolutePath);
    existingTargets.push({ relativePath, absolutePath });
  } catch {
    // 已不存在的清理目標可安全略過。
  }
}

const apply = args.has("--apply");
console.log(apply ? "APPLY：開始清理" : "DRY RUN：只顯示，不會刪除");

if (existingTargets.length === 0) {
  console.log("沒有需要清理的項目。");
  process.exit(0);
}

for (const target of existingTargets) {
  console.log(`${apply ? "清除" : "將清除"} ${target.relativePath}`);
  if (apply) await rm(target.absolutePath, { recursive: true, force: true });
}

if (apply && args.has("--include-dependencies")) {
  console.log("node_modules 已清除；請執行 npm ci 重新安裝依賴。");
}

