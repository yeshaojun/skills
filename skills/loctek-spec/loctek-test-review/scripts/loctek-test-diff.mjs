#!/usr/bin/env node
// Incremental diff analysis for loctek-test-review.
// Determines the baseline (fork-point -> merge-base -> --base), grades diff
// volume, lists changed files, extracts method-signature summaries, and
// proposes impact-analysis grep candidates. Writes JSON + MD summary.
//
// Usage:
//   node loctek-test-diff.mjs [repo-root] [--base <ref>] [--head <ref>]
//        [--main <ref>] [--out <dir>] [--print]

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const out = { root: ".", base: "", head: "HEAD", main: "", outDir: "", print: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") out.base = argv[++i] || "";
    else if (a === "--head") out.head = argv[++i] || "HEAD";
    else if (a === "--main") out.main = argv[++i] || "";
    else if (a === "--out") out.outDir = argv[++i] || "";
    else if (a === "--print") out.print = true;
    else if (!a.startsWith("--")) out.root = a;
  }
  return out;
}

function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

function gitOk(repo, ...args) {
  try {
    return git(repo, ...args);
  } catch {
    return "";
  }
}

function detectMainBranch(repo, explicit) {
  if (explicit) return explicit;
  const candidates = ["origin/main", "origin/master", "main", "master"];
  for (const ref of candidates) {
    if (gitOk(repo, "rev-parse", "--verify", "--quiet", ref)) return ref;
  }
  return "";
}

function resolveBaseline(repo, head, mainRef, userBase) {
  // Level 1: user-provided baseline wins.
  if (userBase) {
    return { base: userBase, strategy: "user-provided" };
  }
  // Level 2: fork-point.
  const forkPoint = mainRef ? gitOk(repo, "merge-base", "--fork-point", mainRef, head) : "";
  if (forkPoint) return { base: forkPoint, strategy: `fork-point(${mainRef})` };
  // Level 3: merge-base.
  if (mainRef) {
    const mergeBase = gitOk(repo, "merge-base", mainRef, head);
    if (mergeBase) return { base: mergeBase, strategy: `merge-base(${mainRef})` };
  }
  throw new Error("无法确定基线 commit：请用 --base <ref> 显式提供基线。");
}

const CODE_EXTS = new Set([
  "java", "kt", "go", "py", "rs", "c", "h", "cpp", "hpp", "m", "swift",
  "ts", "tsx", "js", "jsx", "vue", "svelte",
  "sql", "css", "scss", "less", "html", "sh", "yml", "yaml",
]);

function isCodePath(path) {
  const ext = extOf(path);
  if (CODE_EXTS.has(ext)) return !path.startsWith(".changes/");
  return false;
}

function parseNumstat(repo, base, head) {
  // <added>\t<deleted>\t<path>; binary files show "-\t-".
  const out = [];
  for (const line of git(repo, "diff", "--numstat", `${base}..${head}`).split("\n")) {
    if (!line) continue;
    const [add, del, ...rest] = line.split("\t");
    out.push({ path: rest.join("\t"), added: add === "-" ? 0 : Number(add), deleted: del === "-" ? 0 : Number(del) });
  }
  return out;
}

function gradeVolume(total) {
  if (total < 500) return { level: "small", emoji: "🟢", advice: "全量读取 diff，一次性完成走查" };
  if (total <= 2000)
    return { level: "medium", emoji: "🟡", advice: "按工程分批读取 diff，分片走查，每次只持有 1 个工程的源文件" };
  return { level: "large", emoji: "🔴", advice: "只读方法签名摘要与核心文件行范围，分片走查 + 摘要模式" };
}

const SIGNATURE_PATTERNS = [
  { key: "backend_java", exts: ["java"], re: /^[+-]\s*(public|private|protected|package)\s+.*\(/ },
  { key: "backend_go", exts: ["go"], re: /^[+-]\s*func\s+/ },
  { key: "backend_python", exts: ["py"], re: /^[+-]\s*(def |class |async def )/ },
  {
    key: "frontend",
    exts: ["ts", "tsx", "vue", "js", "jsx"],
    re: /^[+-]\s*(export\s+)?(default\s+)?(async\s+)?(function|class|const|let|interface|type|enum)\s+\w+/,
  },
];

function extOf(path) {
  const i = path.lastIndexOf(".");
  return i === -1 ? "" : path.slice(i + 1).toLowerCase();
}

function collectSignatures(repo, base, head) {
  const result = {};
  for (const spec of SIGNATURE_PATTERNS) {
    let diff = "";
    try {
      diff = git(repo, "diff", `${base}..${head}`, "--", ...spec.exts.map((e) => `*.${e}`));
    } catch {
      continue;
    }
    const lines = diff.split("\n").filter((l) => spec.re.test(l));
    if (lines.length) result[spec.key] = lines;
  }
  return result;
}

// Symbols worth an impact grep: changed public/class-level identifiers.
function extractSymbols(sigLines) {
  const symbols = new Set();
  const re = /(?:function|class|interface|enum|func|def)\s+([A-Za-z_]\w{2,})/;
  for (const line of sigLines || []) {
    const m = line.match(re);
    if (m) symbols.add(m[1]);
  }
  return [...symbols];
}

function impactCandidates(repo, base, head, changedPaths) {
  const sigLines = [];
  const cands = [];
  const changedSet = new Set(changedPaths);
  for (const [key, lines] of Object.entries(collectSignatures(repo, base, head))) {
    sigLines.push(...lines);
  }
  for (const sym of extractSymbols(sigLines)) {
    let hits = [];
    try {
      hits = git(repo, "grep", "-l", sym, head, "--", "*.java", "*.ts", "*.tsx", "*.vue", "*.js", "*.go", "*.py")
        .split("\n")
        .map((l) => l.replace(/^[^:]*:/, ""))
        .filter((p) => p && !changedSet.has(p))
        .slice(0, 10);
    } catch {}
    cands.push({ symbol: sym, affectedOutsideChange: hits });
  }
  return cands;
}

function detectProjects(root) {
  const has = (p) => existsSync(join(root, p));
  const backend = has("pom.xml") || has("build.gradle") || has("go.mod");
  const frontend =
    has("package.json") &&
    (existsSync(join(root, "src")) ||
      existsSync(join(root, "app")) ||
      existsSync(join(root, "pages")));
  if (backend && frontend) return "fullstack";
  if (backend) return "backend";
  if (frontend) return "frontend";
  return "unknown";
}

const args = parseArgs(process.argv.slice(2));
const repo = resolve(args.root);
if (!existsSync(join(repo, ".git"))) {
  console.error(`不是 git 仓库：${repo}`);
  process.exit(1);
}

const mainRef = detectMainBranch(repo, args.main);
let baseline;
try {
  baseline = resolveBaseline(repo, args.head, mainRef, args.base);
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
const nameStatus = git(repo, "diff", "--name-status", `${baseline.base}..${args.head}`);
const changedFiles = nameStatus
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    const [status, ...rest] = l.split("\t");
    return { status: status.trim(), path: rest.join("\t") };
  });
const newFiles = changedFiles.filter((f) => f.status.startsWith("A")).map((f) => f.path);

const numstat = parseNumstat(repo, baseline.base, args.head);
const codeEntries = numstat.filter((e) => isCodePath(e.path));
const codeLines = codeEntries.reduce((sum, e) => sum + e.added + e.deleted, 0);
const totalLines = numstat.reduce((sum, e) => sum + e.added + e.deleted, 0);
const grade = gradeVolume(codeLines);

const signatures = collectSignatures(repo, baseline.base, args.head);
const impacts = impactCandidates(repo, baseline.base, args.head, changedFiles.map((f) => f.path));

const result = {
  repo,
  head: args.head,
  headCommit: gitOk(repo, "log", "-1", "--oneline", args.head),
  currentBranch: gitOk(repo, "branch", "--show-current"),
  mainRef,
  baseline: baseline.base,
  baselineStrategy: baseline.strategy,
  stat: {
    files: changedFiles.length,
    codeFiles: codeEntries.length,
    codeLines,
    totalLines,
    insertions: numstat.reduce((s, e) => s + e.added, 0),
    deletions: numstat.reduce((s, e) => s + e.deleted, 0),
  },
  grade,
  projectType: detectProjects(repo),
  changedFiles,
  codeChangedFiles: changedFiles.filter((f) => isCodePath(f.path)),
  newFiles,
  signatureSummary: signatures,
  impactCandidates: impacts,
  advice: [
    grade.advice,
    `体量按代码行计算（${codeEntries.length} 个代码文件，${codeLines} 行）；.changes 记录与文档类变更不参与走查体量。`,
    impacts.length
      ? `发现 ${impacts.length} 个跨文件影响候选符号，走查时逐一确认调用方兼容性（见 impactCandidates）。`
      : "未发现跨文件影响候选；纯新增/私有变更可不分析影响面。",
    "必须同时覆盖前后端（如适用）；禁止只走查后端。",
  ],
};

const md = [
  `# 增量分析摘要`,
  ``,
  `- 仓库：\`${repo}\``,
  `- 分支：\`${result.currentBranch || "N/A"}\``,
  `- HEAD：${result.headCommit || args.head}`,
  `- 基线：\`${baseline.base}\`（${baseline.strategy}）`,
  `- 体量：${grade.emoji} ${grade.level} — 代码 ${codeEntries.length} 文件 ${codeLines} 行（全部变更 ${changedFiles.length} 文件 ${totalLines} 行）`,
  `- 走查策略：${grade.advice}`,
  `- 工程类型：${result.projectType}`,
  ``,
  `## 代码变更文件（走查对象）`,
  ``,
  ...result.codeChangedFiles.map((f) => `- \`${f.status}\` ${f.path}`),
  ``,
  `## 非代码变更（.changes 记录/文档等，走查可跳过）`,
  ``,
  ...changedFiles.filter((f) => !isCodePath(f.path)).map((f) => `- \`${f.status}\` ${f.path}`),
  ``,
  `## 方法签名摘要`,
  ``,
  ...(Object.keys(signatures).length
    ? Object.entries(signatures).flatMap(([k, lines]) => [`### ${k}`, "", ...lines.map((l) => "```diff\n" + l + "\n```")])
    : ["（无签名级变更）"]),
  ``,
  `## 影响面候选（需人工确认）`,
  ``,
  ...(impacts.length
    ? impacts.flatMap((c) => [
        `- \`${c.symbol}\`：${c.affectedOutsideChange.length ? "外部引用 → " + c.affectedOutsideChange.map((p) => "`" + p + "`").join(", ") : "仅变更文件内引用"}`,
      ])
    : ["（无）"]),
].join("\n");

if (args.outDir) {
  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "incremental-analysis.json"), JSON.stringify(result, null, 2));
  writeFileSync(join(outDir, "incremental-analysis.md"), md + "\n");
  console.log(`已写入 ${join(outDir, "incremental-analysis.json")} 与 incremental-analysis.md`);
}
if (args.print || !args.outDir) {
  console.log(md);
}
