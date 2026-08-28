import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cleanupScript = fileURLToPath(new URL("../scripts/cleanup.mjs", import.meta.url));

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function createFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "software-salary-cleanup-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const files = [
    "package.json",
    ".next/cache/data",
    ".vinext/dev/lock.json",
    "app/page 2.tsx",
    "README 2.md",
    "node_modules/example/index.js",
    "app/page.tsx",
  ];

  for (const file of files) {
    const path = join(root, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file === "package.json" ? '{"name":"site-creator-vinext-starter"}' : "fixture");
  }

  return root;
}

function runCleanup(root, ...args) {
  return spawnSync(process.execPath, [cleanupScript, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("dry run reports targets without deleting them", async (t) => {
  const root = await createFixture(t);
  const result = runCleanup(root);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /DRY RUN/);
  assert.equal(await exists(join(root, ".next")), true);
  assert.equal(await exists(join(root, "app/page 2.tsx")), true);
  assert.equal(await exists(join(root, "node_modules")), true);
});

test("apply removes generated and duplicate targets but keeps dependencies", async (t) => {
  const root = await createFixture(t);
  const result = runCleanup(root, "--apply");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await exists(join(root, ".next")), false);
  assert.equal(await exists(join(root, ".vinext")), false);
  assert.equal(await exists(join(root, "app/page 2.tsx")), false);
  assert.equal(await exists(join(root, "README 2.md")), false);
  assert.equal(await exists(join(root, "node_modules")), true);
  assert.equal(await exists(join(root, "app/page.tsx")), true);
});

test("include-dependencies removes node_modules when applying", async (t) => {
  const root = await createFixture(t);
  const result = runCleanup(root, "--apply", "--include-dependencies");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await exists(join(root, "node_modules")), false);
});
