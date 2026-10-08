#!/usr/bin/env node
// Mirror check: verify generated Playwright specs faithfully replicate the
// parsed test cases (1:1, no missing/extra/reordered steps).
//
// Specs must carry step anchor comments:  // [TC-001_Step2] 描述
//
// Usage:
//   node mirror-check.mjs <cases.json> <spec-dir-or-file>
//
// Exit codes: 0 pass, 1 mismatch, 2 usage error.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  if (argv.length < 2) {
    console.error("用法: node mirror-check.mjs <cases.json> <spec目录或文件>");
    process.exit(2);
  }
  return { cases: argv[0], spec: argv[1] };
}

function collectFiles(path) {
  const st = statSync(path);
  if (st.isFile()) return [path];
  const out = [];
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    if (statSync(full).isDirectory()) out.push(...collectFiles(full));
    else if (/\.(spec|test)\.[jt]s$/.test(entry)) out.push(full);
  }
  return out;
}

const { cases: casesPath, spec: specPath } = parseArgs(process.argv.slice(2));

let parsed;
try {
  parsed = JSON.parse(readFileSync(resolve(casesPath), "utf8"));
} catch (err) {
  console.error(`无法读取 cases.json: ${err.message}`);
  process.exit(2);
}

const specFiles = collectFiles(resolve(specPath));
const anchorsPerFile = specFiles.map((f) => {
  const text = readFileSync(f, "utf8");
  const anchors = [...text.matchAll(/\[\s*(TC-[A-Za-z0-9-]+_Step\d+)\s*\]/g)].map((m) => m[1].toUpperCase());
  return { file: f, anchors };
});
const allAnchors = anchorsPerFile.flatMap((f) => f.anchors);

const failures = [];
const summary = [];

for (const tc of parsed.cases) {
  const expected = tc.steps.map((_, i) => `${tc.id}_STEP${i + 1}`);
  const found = expected.filter((id) => allAnchors.includes(id));
  const missing = expected.filter((id) => !found.includes(id));

  // Anchors for this case that exceed the step count = extra steps.
  const caseAnchors = allAnchors.filter((a) => a.startsWith(`${tc.id}_STEP`));
  const extra = caseAnchors.filter((a) => !expected.includes(a));

  // Order check: positions of matched anchors must be ascending.
  const positions = expected.map((id) => allAnchors.indexOf(id)).filter((p) => p >= 0);
  const inOrder = positions.every((p, i) => i === 0 || p > positions[i - 1]);

  if (missing.length) failures.push(`${tc.id}: 缺少步骤锚点 ${missing.join(", ")}`);
  if (extra.length) failures.push(`${tc.id}: 多出未定义步骤 ${extra.join(", ")}`);
  if (!missing.length && !inOrder) failures.push(`${tc.id}: 步骤顺序与用例不一致`);
  if (!missing.length && !extra.length && inOrder) {
    summary.push(`✅ ${tc.id}: ${tc.steps.length}/${tc.steps.length} 步骤镜像一致`);
  } else {
    summary.push(`❌ ${tc.id}: 缺 ${missing.length} / 多 ${extra.length} / 顺序${inOrder ? "一致" : "不一致"}`);
  }
}

// Case IDs that never appear in any spec.
const caseIds = parsed.cases.map((c) => c.id);
const covered = caseIds.filter((id) => allAnchors.some((a) => a.startsWith(`${id}_STEP`)));
caseIds
  .filter((id) => !covered.includes(id))
  .forEach((id) => failures.push(`${id}: 未在任何 spec 中出现`));

console.log(`镜像校验: ${parsed.count} 条用例 vs ${specFiles.length} 个 spec 文件`);
summary.forEach((s) => console.log("  " + s));
if (failures.length) {
  console.log("未通过:");
  failures.forEach((f) => console.log(`  ❌ ${f}`));
  process.exit(1);
}
console.log("✅ 镜像校验通过：脚本步骤与用例 1:1 一致");
