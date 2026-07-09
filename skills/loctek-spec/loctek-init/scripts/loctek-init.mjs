#!/usr/bin/env node
import { accessSync, constants, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, chownSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = process.argv[2] || process.cwd();
const args = process.argv.slice(3);
const fixPermissions = args.includes("--fix-permissions");
const allowRoot = args.includes("--allow-root");
const now = new Date().toISOString();
const created = [];
const skipped = [];
const permissionNotes = [];

if (isRoot() && !allowRoot && !fixPermissions) {
  console.error("loctek-init is running as root. This can create root-owned .changes records that normal users cannot update.");
  console.error("Run without sudo, or use --allow-root only inside a root-owned container.");
  console.error("If the project already has root-owned Loctek files, run:");
  console.error("  sudo node <skill-dir>/scripts/loctek-init.mjs . --fix-permissions");
  process.exit(1);
}

const preflight = checkPermissions([".changes", "tools/loctek"]);
if (preflight.length) {
  if (!fixPermissions) {
    console.error("Loctek directories are not writable by the current user.");
    for (const issue of preflight) console.error(`- ${issue}`);
    console.error(`Repair command: ${repairCommand([".changes", "tools/loctek"])}`);
    process.exit(1);
  }
  fixOwnership([".changes", "tools/loctek"]);
  permissionNotes.push("Ran permission repair before initialization.");
}

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    created.push(path);
  }
}

function writeNew(rel, content) {
  const path = join(repo, rel);
  ensureDir(dirname(path));
  if (existsSync(path)) {
    skipped.push(rel);
    return;
  }
  writeFileSync(path, content);
  created.push(rel);
}

function template(name) {
  return readFileSync(join(__dirname, "..", "assets", name), "utf8");
}

ensureDir(join(repo, ".changes"));
for (const dir of [
  "issues",
  "work-reports",
  "intents",
  "merge-reports",
  "test-reports",
  "pr",
  "session-notes",
  "archive",
  "adr",
  "releases",
]) {
  ensureDir(join(repo, ".changes", dir));
  writeNew(join(".changes", dir, ".gitkeep"), "");
}

writeNew(".changes/config.yml", template("changes-config.yml"));
writeNew(".changes/README.md", template("changes-readme.md"));
writeNew(".changes/session-notes/_template.md", template("session-note-template.md"));
writeNew(".gitmessage", template("gitmessage.txt"));
writeNew(".github/pull_request_template.md", template("pull_request_template.md"));
writeNew(".github/workflows/loctek-intent-check.yml", template("loctek-intent-check.yml"));
writeNew("AGENTS.md", template("AGENTS.md"));
writeNew("CLAUDE.md", template("CLAUDE.md"));
writeNew(".cursor/rules/loctek.mdc", template("cursor-loctek.mdc"));
writeNew("CODEOWNERS", template("CODEOWNERS"));
writeNew("tools/loctek/validate-intent.mjs", template("validate-intent.mjs"));
writeNew("tools/loctek/collect-context.mjs", template("collect-context.mjs"));
writeNew("tools/loctek/check-permissions.mjs", template("check-permissions.mjs"));
writeNew("tools/loctek/archive.mjs", template("archive.mjs"));
writeNew("tools/loctek/install-git-hooks.mjs", template("install-git-hooks.mjs"));
writeNew("tools/loctek/hooks/commit-msg", template("commit-msg-hook"));

if (fixPermissions) {
  fixOwnership([".changes", "tools/loctek"]);
  permissionNotes.push("Ran permission repair after initialization.");
}

const permissionIssues = checkPermissions([".changes", "tools/loctek"]);
if (permissionIssues.length) {
  permissionNotes.push("Permission check failed:");
  permissionNotes.push(...permissionIssues.map((issue) => `  - ${issue}`));
  permissionNotes.push(`Repair command: ${repairCommand([".changes", "tools/loctek"])}`);
} else {
  permissionNotes.push("Permission check passed for .changes and tools/loctek.");
}

const report = `# Loctek Init Report

Created at: ${now}
Repository: ${repo}

## Created

${created.length ? created.map((item) => `- ${item}`).join("\n") : "- None"}

## Skipped Existing Files

${skipped.length ? skipped.map((item) => `- ${item}`).join("\n") : "- None"}

## Permission Check

${permissionNotes.length ? permissionNotes.map((item) => `- ${item}`).join("\n") : "- None"}

## Next Steps

- Review .changes/config.yml.
- Run: node tools/loctek/check-permissions.mjs
- Run: node tools/loctek/install-git-hooks.mjs
- Ask AI tools to follow AGENTS.md, CLAUDE.md, or .cursor/rules/loctek.mdc and record important decisions in .changes/session-notes/.
- Configure branch protection so CI must pass before merging.
- Ask an agent to use $loctek-issue for the first feature breakdown.
`;

writeNew(".changes/init-report.md", report);

console.log(report);

function checkPermissions(relPaths) {
  const issues = [];
  for (const rel of relPaths) {
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
  return issues;
}

function fixOwnership(relPaths) {
  const target = targetUser();
  if (target.uid === undefined || target.gid === undefined) {
    permissionNotes.push("Cannot determine target uid/gid for permission repair.");
    return;
  }
  for (const rel of relPaths) {
    const path = join(repo, rel);
    if (!existsSync(path)) continue;
    chownRecursive(path, target.uid, target.gid);
  }
}

function chownRecursive(path, uid, gid) {
  chownSync(path, uid, gid);
  const stat = statSync(path);
  if (!stat.isDirectory()) return;
  for (const entry of readdirSync(path)) chownRecursive(join(path, entry), uid, gid);
}

function targetUser() {
  const sudoUid = Number(process.env.SUDO_UID);
  const sudoGid = Number(process.env.SUDO_GID);
  if (Number.isInteger(sudoUid) && Number.isInteger(sudoGid)) return { uid: sudoUid, gid: sudoGid };
  if (typeof process.getuid === "function" && typeof process.getgid === "function") {
    return { uid: process.getuid(), gid: process.getgid() };
  }
  return {};
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
