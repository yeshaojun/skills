#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { accessSync, constants, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative as pathRelative, resolve } from "node:path";

const repo = resolve(process.argv[2] || process.cwd());
const options = parseArgs(process.argv.slice(3));

ensureGitRepo();

const branch = git(["branch", "--show-current"]) || "unknown";
const conflicts = lines(git(["diff", "--name-only", "--diff-filter=U"]));
if (conflicts.length) {
  fail("Merge conflicts found. Resolve conflicts before using loctek-commit.", conflicts);
}

const candidates = collectChangedFiles();
if (!candidates.length) fail("No working tree changes found.");

const selected = selectFiles(candidates, options);
const blocked = candidates
  .map((file) => ({ file, reason: dangerousReason(file) }))
  .filter((item) => item.reason);

if (!selected.length) {
  fail("No safe files selected for commit.", blocked.map((item) => `${item.file} (${item.reason})`));
}

const preStaged = lines(git(["diff", "--cached", "--name-only"]));
const unselectedStaged = preStaged.filter((file) => !selected.includes(file));
if (unselectedStaged.length) {
  fail(
    "There are already staged files outside the selected commit set. Unstage them or include them explicitly.",
    unselectedStaged,
  );
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const safeBranch = sanitize(branch);
const intentDir = join(repo, ".changes", "intents", safeBranch);
const prDir = join(repo, ".changes", "pr");
const intentPath = join(intentDir, `${timestamp}-intent.md`);
const prPath = join(prDir, `${safeBranch}.md`);
assertLoctekWritable([intentPath, prPath]);
mkdirSync(intentDir, { recursive: true });
mkdirSync(prDir, { recursive: true });

git(["add", "--", ...selected]);

const workNameStatus = git(["diff", "--cached", "--name-status"]);
const workStat = git(["diff", "--cached", "--stat"]);
const workDiff = git(["diff", "--cached", "--", "."]);
if (!workNameStatus) fail("No staged diff found after selecting files.");
const sessionNotes = collectSessionNotes({ branch, issues: options.issues, selected });

const intentRel = relative(intentPath, repo);
const prRel = relative(prPath, repo);
const highRisk = selected.filter(isHighRiskFile);

writeFileSync(intentPath, buildIntent({ branch, workNameStatus, workStat, workDiff, highRisk, blocked, sessionNotes }));
writeFileSync(prPath, buildPr({ workNameStatus, highRisk, intentRel }));

git(["add", "--", intentRel, prRel]);

const finalNameStatus = git(["diff", "--cached", "--name-status"]);
const finalStat = git(["diff", "--cached", "--stat"]);
const type = options.type || inferType(selected, branch);
const scope = options.scope || inferScope(selected);
const summary = options.summary || inferSummary(selected, branch);
const message = buildCommitMessage({ type, scope, summary, intentRel, prRel, finalNameStatus, finalStat, highRisk });
const messagePath = writeCommitMessage(timestamp, message);

const check = gitResult(["diff", "--cached", "--check"]);
if (!check.ok) {
  fail("git diff --cached --check failed. Fix whitespace/conflict marker issues before committing.", [check.stderr || check.stdout]);
}

if (options.prepare) {
  console.log(`Prepared commit without creating it:`);
  console.log(`- Intent: ${intentRel}`);
  console.log(`- PR draft: ${prRel}`);
  console.log(`- Commit message: ${messagePath}`);
  console.log(`Run: git commit -F "${messagePath}"`);
  printBlocked(blocked);
  process.exit(0);
}

git(["commit", "-F", messagePath], { stdio: "pipe" });
const commitHash = git(["rev-parse", "--short", "HEAD"]);
console.log(`Committed ${commitHash}`);
console.log(`Intent: ${intentRel}`);
console.log(`PR draft: ${prRel}`);
printBlocked(blocked);

function parseArgs(args) {
  const out = {
    prepare: false,
    exclude: [],
    only: [],
    summary: "",
    why: "",
    what: "",
    validation: "",
    risks: "",
    type: "",
    scope: "",
    issues: [],
    multiIssueReason: "",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--prepare" || arg === "--no-commit") out.prepare = true;
    else if (arg === "--exclude") i = collectValues(args, i + 1, out.exclude);
    else if (arg === "--only") i = collectValues(args, i + 1, out.only);
    else if (arg === "--summary") out.summary = args[++i] || "";
    else if (arg === "--why") out.why = args[++i] || "";
    else if (arg === "--what") out.what = args[++i] || "";
    else if (arg === "--validation") out.validation = args[++i] || "";
    else if (arg === "--risks") out.risks = args[++i] || "";
    else if (arg === "--type") out.type = args[++i] || "";
    else if (arg === "--scope") out.scope = args[++i] || "";
    else if (arg === "--issue") out.issues.push(args[++i] || "");
    else if (arg === "--multi-issue-reason") out.multiIssueReason = args[++i] || "";
    else if (arg.startsWith("--exclude=")) out.exclude.push(arg.slice("--exclude=".length));
    else if (arg.startsWith("--only=")) out.only.push(arg.slice("--only=".length));
    else if (arg.startsWith("--summary=")) out.summary = arg.slice("--summary=".length);
    else if (arg.startsWith("--why=")) out.why = arg.slice("--why=".length);
    else if (arg.startsWith("--what=")) out.what = arg.slice("--what=".length);
    else if (arg.startsWith("--validation=")) out.validation = arg.slice("--validation=".length);
    else if (arg.startsWith("--risks=")) out.risks = arg.slice("--risks=".length);
    else if (arg.startsWith("--type=")) out.type = arg.slice("--type=".length);
    else if (arg.startsWith("--scope=")) out.scope = arg.slice("--scope=".length);
    else if (arg.startsWith("--issue=")) out.issues.push(arg.slice("--issue=".length));
    else if (arg.startsWith("--multi-issue-reason=")) out.multiIssueReason = arg.slice("--multi-issue-reason=".length);
    else fail(`Unknown option: ${arg}`);
  }

  out.issues = unique(out.issues.filter(Boolean));
  return out;
}

function collectValues(args, start, target) {
  let index = start;
  for (; index < args.length; index += 1) {
    if (args[index].startsWith("--")) break;
    target.push(args[index]);
  }
  return index - 1;
}

function ensureGitRepo() {
  const result = gitResult(["rev-parse", "--is-inside-work-tree"]);
  if (!result.ok || result.stdout.trim() !== "true") fail(`Not a git repository: ${repo}`);
}

function collectChangedFiles() {
  return unique([
    ...lines(git(["diff", "--name-only", "--diff-filter=ACMRTD"])),
    ...lines(git(["diff", "--cached", "--name-only", "--diff-filter=ACMRTD"])),
    ...lines(git(["ls-files", "--others", "--exclude-standard"])),
  ]).sort();
}

function selectFiles(files, opts) {
  return files.filter((file) => {
    if (dangerousReason(file)) return false;
    if (opts.only.length && !matchesAny(file, opts.only)) return false;
    if (opts.exclude.length && matchesAny(file, opts.exclude)) return false;
    return true;
  });
}

function buildIntent({ branch, workNameStatus, workStat, workDiff, highRisk, blocked, sessionNotes }) {
  return `${intentFrontmatter(branch)}

# Change Intent

## 为什么改

${options.why || "由 loctek-commit 根据当前改动自动生成。提交前如需更强业务语义，请用 --why 补充背景。"}

## 改了什么

${options.what || "见下方文件列表和 diff 摘要。"}

## 涉及文件

\`\`\`
${workNameStatus}
\`\`\`

## 必须保留的行为

必须保留未列入本次提交范围的既有行为；高风险文件需要在 PR 阶段重点复查。

## 验证方式

${options.validation || "已运行 git diff --cached --check。其他测试请在 loctek-test 中补充。"}

## 风险点

${options.risks || formatRiskText(highRisk, blocked)}

## 关联 Issue

${options.issues.length ? options.issues.map((issue) => `- ${issue}`).join("\n") : "TODO: 填写 .changes/issues、work report 或 tracker 链接。"}

## 多 Issue 说明

${options.issues.length > 1 ? options.multiIssueReason || "TODO: 说明为什么这些 issue 适合一起提交。" : "N/A"}

## 会话决策记录

${formatSessionNotes(sessionNotes)}

## Diff Stat

\`\`\`
${workStat}
\`\`\`

## Diff 摘要输入

以下 diff 供 AI 总结，不要在 PR 正文里原样粘贴大段 diff：

\`\`\`diff
${truncate(workDiff, 30000)}
\`\`\`
`;
}

function intentFrontmatter(branch) {
  const out = [
    "---",
    "type: intent",
    `branch: ${branch}`,
    `created_at: ${new Date().toISOString()}`,
    "status: draft",
  ];
  if (options.issues.length) {
    out.push("issues:");
    for (const issue of options.issues) out.push(`  - ${issue}`);
  }
  if (options.multiIssueReason) out.push(`multi_issue_reason: ${yamlScalar(options.multiIssueReason)}`);
  out.push("---");
  return out.join("\n");
}

function buildPr({ workNameStatus, highRisk, intentRel }) {
  return `## Why

${options.why || "TODO"}

## What Changed

${options.what || "TODO"}

## Files Changed

\`\`\`
${workNameStatus}
\`\`\`

## Related Issues

${options.issues.length ? options.issues.map((issue) => `- ${issue}`).join("\n") : "- TODO"}

## Multi-Issue Reason

${options.issues.length > 1 ? options.multiIssueReason || "TODO" : "N/A"}

## Behavior To Preserve

TODO

## Validation

${options.validation || "- git diff --cached --check"}

## Risks

${options.risks || formatRiskText(highRisk, [])}

## Rollback Plan

TODO

## Loctek Records

- Intent: ${intentRel}
`;
}

function buildCommitMessage({ type, scope, summary, intentRel, prRel, finalNameStatus, finalStat, highRisk }) {
  const header = scope ? `${type}(${scope}): ${summary}` : `${type}: ${summary}`;
  return `${truncateLine(header, 100)}

Why:
${bullet(options.why || `Record and commit the current related changes on ${branch}.`)}

What:
${bullet(options.what || "Stage selected safe files, create Loctek intent/PR records, and commit them together.")}

Preserve:
${bullet("Existing behavior outside the selected commit scope.")}

Validation:
${bullet(options.validation || "git diff --cached --check")}

Risks:
${bullet(options.risks || (highRisk.length ? `High-risk files changed: ${highRisk.join(", ")}` : "No high-risk files detected by loctek-commit."))}

${options.issues.length ? `Issues:\n${options.issues.map((issue) => `- ${issue}`).join("\n")}\n\n` : ""}${options.issues.length > 1 ? `Multi-Issue-Reason:\n${bullet(options.multiIssueReason || "Multiple related issues are included in this commit.")}\n\n` : ""}Loctek-Intent: ${intentRel}
Loctek-PR-Draft: ${prRel}

Files:
${finalNameStatus}

Stat:
${finalStat}
`;
}

function writeCommitMessage(timestamp, message) {
  const gitDir = git(["rev-parse", "--git-dir"]);
  const messageDir = resolve(repo, gitDir, "loctek");
  mkdirSync(messageDir, { recursive: true });
  const path = join(messageDir, `${timestamp}-commit-message.txt`);
  writeFileSync(path, message);
  return path;
}

function assertLoctekWritable(paths) {
  const issues = [];
  const dirs = unique([
    ".changes",
    ".changes/intents",
    `.changes/intents/${safeBranch}`,
    ".changes/pr",
    "tools/loctek",
    ...paths.map((path) => relative(dirname(path), repo)),
  ]);

  for (const rel of dirs) {
    const path = join(repo, rel);
    if (!existsSync(path)) continue;
    const stat = statSync(path);
    if (!stat.isDirectory()) continue;
    const owner = ownerText(stat);
    if (isRootOwned(stat) && !isRoot()) issues.push(`${rel} is owned by root (${owner}).`);
    try {
      accessSync(path, constants.W_OK);
    } catch {
      issues.push(`${rel} is not writable by current user (${owner}).`);
    }
  }

  for (const path of paths) {
    if (!existsSync(path)) continue;
    const stat = statSync(path);
    const rel = relative(path, repo);
    const owner = ownerText(stat);
    if (isRootOwned(stat) && !isRoot()) issues.push(`${rel} is owned by root (${owner}).`);
    try {
      accessSync(path, constants.W_OK);
    } catch {
      issues.push(`${rel} is not writable by current user (${owner}).`);
    }
  }

  if (issues.length) {
    fail("Loctek record paths are not writable. Fix ownership before committing.", [
      ...issues,
      `Repair command: ${repairCommand([".changes", "tools/loctek"])}`,
    ]);
  }
}

function git(args, opts = {}) {
  const result = gitResult(args, opts);
  if (!result.ok) fail(`git ${args.join(" ")} failed`, [result.stderr || result.stdout]);
  return result.stdout.trim();
}

function gitResult(args, opts = {}) {
  try {
    const stdout = execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: opts.stdio || "pipe" });
    return { ok: true, stdout: stdout || "", stderr: "" };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || error.message || ""),
    };
  }
}

function dangerousReason(file) {
  const lower = file.toLowerCase();
  if (/(^|\/)\.env($|\.|\/)/.test(lower)) return "environment file";
  if (/(^|\/)(id_rsa|id_ed25519|id_ecdsa)($|\.)/.test(lower)) return "private key";
  if (/\.(pem|key|p12|pfx|crt|cer)$/i.test(file)) return "certificate or key material";
  if (/(^|\/)(secret|secrets|credential|credentials)(\.|\/|$)/i.test(file)) return "secret-like path";
  if (/\.(log|tmp|bak|swp)$/i.test(file)) return "temporary or log file";
  if (/(^|\/)\.ds_store$/i.test(file)) return "system metadata file";
  if (/(^|\/)node_modules\//.test(lower)) return "dependency directory";
  if (existsSync(join(repo, file))) {
    try {
      if (statSync(join(repo, file)).size > 5 * 1024 * 1024) return "file larger than 5MB";
    } catch {}
  }
  return "";
}

function isHighRiskFile(file) {
  return [
    /^package\.json$/,
    /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/,
    /^\.github\//,
    /^db\//,
    /^migrations\//,
    /^src\/routes\//,
    /^src\/permissions\//,
    /^src\/auth\//,
    /^src\/payment\//,
  ].some((regex) => regex.test(file));
}

function inferType(files, currentBranch) {
  const text = `${currentBranch} ${files.join(" ")}`.toLowerCase();
  if (/(fix|bug|hotfix|修复)/.test(text)) return "fix";
  if (/(feat|feature|新增|需求)/.test(text)) return "feat";
  if (files.every((file) => /(^|\/)(test|tests|__tests__)\//.test(file) || /\.test\./.test(file) || /\.spec\./.test(file))) return "test";
  if (files.every((file) => /\.(md|mdx|txt)$/.test(file) || file.startsWith("docs/"))) return "docs";
  if (files.some(isHighRiskFile)) return "chore";
  return "chore";
}

function inferScope(files) {
  const first = files.find((file) => !file.startsWith(".changes/")) || files[0] || "";
  if (!first) return "";
  const parts = first.split("/");
  if (parts[0] === "src" && parts[1]) return sanitize(parts[1]).slice(0, 24);
  return sanitize(parts[0].replace(/\..+$/, "")).slice(0, 24);
}

function inferSummary(files, currentBranch) {
  const branchSummary = currentBranch
    .replace(/^(feature|feat|fix|bugfix|hotfix|chore|docs|test)[/-]/i, "")
    .replace(/[_/]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (branchSummary && !["main", "master", "unknown"].includes(branchSummary)) return truncateLine(branchSummary, 60);
  const first = files.find((file) => !file.startsWith(".changes/")) || files[0] || "project";
  return truncateLine(`update ${basename(first)}`, 60);
}

function formatRiskText(highRisk, blocked) {
  const parts = [];
  if (highRisk.length) parts.push(`高风险文件：${highRisk.join(", ")}`);
  if (blocked.length) parts.push(`已排除危险文件：${blocked.map((item) => `${item.file} (${item.reason})`).join(", ")}`);
  return parts.length ? parts.join("\n") : "未检测到高风险文件。";
}

function collectSessionNotes({ branch, issues, selected }) {
  const root = join(repo, ".changes", "session-notes");
  if (!existsSync(root)) return [];
  const files = walkFiles(root)
    .filter((path) => basename(path) !== ".gitkeep" && basename(path) !== "_template.md")
    .filter((path) => statSync(path).isFile())
    .map((path) => {
      const text = safeRead(path);
      return {
        path,
        rel: relative(path, repo),
        text,
        mtime: statSync(path).mtimeMs,
      };
    });

  const currentBranchSafe = sanitize(branch);
  const selectedHints = selected.map((file) => file.toLowerCase());
  const issueHints = issues.map((issue) => issue.toLowerCase());

  return files
    .filter((file) => {
      const haystack = `${file.rel}\n${file.text}`.toLowerCase();
      if (haystack.includes(branch.toLowerCase()) || haystack.includes(currentBranchSafe.toLowerCase())) return true;
      if (issueHints.some((issue) => haystack.includes(issue))) return true;
      return selectedHints.some((changed) => haystack.includes(changed));
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 5);
}

function formatSessionNotes(notes) {
  if (!notes.length) return "未发现与当前分支、issue 或改动文件匹配的 session notes。";
  return notes
    .map((note) => {
      const excerpt = truncate(note.text.replace(/\r?\n{3,}/g, "\n\n").trim(), 4000);
      return `### ${note.rel}

\`\`\`markdown
${excerpt}
\`\`\``;
    })
    .join("\n\n");
}

function walkFiles(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walkFiles(path));
    else out.push(path);
  }
  return out;
}

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function printBlocked(blocked) {
  if (!blocked.length) return;
  console.log("Blocked dangerous files:");
  for (const item of blocked) console.log(`- ${item.file}: ${item.reason}`);
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => matchPattern(file, pattern));
}

function matchPattern(file, pattern) {
  if (file === pattern || file.startsWith(`${pattern}/`)) return true;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(file);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lines(value) {
  return value ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
}

function bullet(value) {
  return value.split(/\r?\n/).filter(Boolean).map((line) => `- ${line}`).join("\n");
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function yamlScalar(value) {
  return JSON.stringify(value);
}

function truncate(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n\n[Diff truncated at ${max} chars. Run git diff --cached for full context.]`;
}

function truncateLine(value, max) {
  return value.length <= max ? value : value.slice(0, max - 1).replace(/\s+\S*$/, "") || value.slice(0, max - 1);
}

function relative(path, base) {
  return pathRelative(resolve(base), resolve(path)) || ".";
}

function isRoot() {
  return typeof process.getuid === "function" && process.getuid() === 0;
}

function isRootOwned(stat) {
  return typeof stat.uid === "number" && stat.uid === 0;
}

function ownerText(stat) {
  return typeof stat.uid === "number" ? `uid:${stat.uid} gid:${stat.gid}` : "owner unknown";
}

function repairCommand(relPaths) {
  const existing = relPaths.filter((rel) => existsSync(join(repo, rel)));
  const targets = existing.length ? existing.join(" ") : relPaths.join(" ");
  return `sudo chown -R "$(id -u):$(id -g)" ${targets}`;
}

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}
