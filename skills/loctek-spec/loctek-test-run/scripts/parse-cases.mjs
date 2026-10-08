#!/usr/bin/env node
// Parse a loctek-test-case black-box case file into structured JSON for
// script generation and mirror checking.
//
// Expected case format (produced by loctek-test-case):
//   ### TC-LOGIN-001: 标题 🏷️ [黑盒-正向]
//   **优先级**: P0
//   ...
//   **测试步骤**:
//   1. ...
//   2. ...
//   **预期结果**:
//   - ...
//
// Usage:
//   node parse-cases.mjs <case-file.md> [--out cases.json]
//
// Exit codes: 0 ok, 1 no cases parsed, 2 usage/read error.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

function parseArgs(argv) {
  const out = { file: "", out: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out.out = argv[++i] || "";
    else if (!argv[i].startsWith("--")) out.file = argv[i];
  }
  return out;
}

const FIELD_RE = /^\*\*(.+?)\*\*\s*[:：]\s*(.*)$/;

function splitFields(lines) {
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(FIELD_RE);
    if (m) {
      if (cur) blocks.push(cur);
      cur = { name: m[1].trim(), rest: m[2].trim(), body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function cleanList(body) {
  return body
    .map((l) => l.replace(/^\s*(?:\d+[.、)]|[-*•])\s*/, "").trimEnd())
    .filter((l) => l.trim().length > 0);
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) {
  console.error("用法: node parse-cases.mjs <用例文件.md> [--out cases.json]");
  process.exit(2);
}

let text;
try {
  text = readFileSync(args.file, "utf8");
} catch (err) {
  console.error(`无法读取文件: ${err.message}`);
  process.exit(2);
}

// Detail sections start at "### TC-" headings; stop blocks at next heading or ---.
const sections = [];
const headingRe = /^#{3,6}\s+(TC-[^\s:：]+)\s*[:：]?\s*(.*)$/;
let cur = null;
for (const line of text.split("\n")) {
  const m = line.match(headingRe);
  if (m) {
    if (cur) sections.push(cur);
    cur = { id: m[1].toUpperCase(), title: m[2].trim(), lines: [] };
  } else if (cur) {
    if (/^#{2,3}\s+/.test(line) && !headingRe.test(line) && cur.lines.length) {
      // A chapter heading without TC id ends the current case only if we already
      // captured something and the heading is a top-level section (##).
      if (/^##\s+/.test(line)) {
        sections.push(cur);
        cur = null;
      }
    }
    if (cur && /^---\s*$/.test(line)) {
      sections.push(cur);
      cur = null;
      continue;
    }
    if (cur) cur.lines.push(line);
  }
}
if (cur) sections.push(cur);

const cases = sections.map((sec) => {
  const fields = splitFields(sec.lines);
  const get = (name) => fields.find((f) => f.name === name);
  const tagMatch = sec.title.match(/🏷️\s*\[([^\]]+)\]/);
  return {
    id: sec.id,
    title: sec.title.replace(/🏷️\s*\[[^\]]+\]/, "").replace(/[:：]\s*$/, "").trim(),
    priority: (get("优先级") || {}).rest || "",
    tag: tagMatch ? tagMatch[1].trim() : "",
    steps: cleanList((get("测试步骤") || { body: [] }).body),
    expected: cleanList((get("预期结果") || { body: [] }).body),
  };
});

const problems = [];
for (const c of cases) {
  if (!c.steps.length) problems.push(`${c.id}: 无测试步骤`);
  if (!c.expected.length) problems.push(`${c.id}: 无预期结果`);
}
const ids = cases.map((c) => c.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
dup.forEach((id) => problems.push(`用例编号重复: ${id}`));

const result = { file: resolve(args.file), count: cases.length, cases };
const json = JSON.stringify(result, null, 2);
if (args.out) {
  const outPath = resolve(args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, json);
  console.log(`已解析 ${cases.length} 条用例 → ${outPath}`);
} else {
  console.log(json);
}
if (problems.length) {
  console.error("用例格式问题:");
  problems.forEach((p) => console.error(`  ⚠️  ${p}`));
}
if (!cases.length || problems.some((p) => p.includes("无测试步骤") || p.includes("无预期结果"))) {
  process.exit(1);
}
