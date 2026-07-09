#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative as pathRelative, resolve, join } from "node:path";

const repo = process.argv[2] || process.cwd();

function git(args) {
  try {
    return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const branch = git(["branch", "--show-current"]) || "unknown";
const changed = git(["diff", "--name-status"]) || git(["diff", "--cached", "--name-status"]) || git(["diff", "--name-status", "HEAD~1..HEAD"]);
const commands = detectCommands(repo);
const reportDir = join(repo, ".changes", "test-reports");
mkdirSync(reportDir, { recursive: true });

const path = join(reportDir, `${new Date().toISOString().slice(0, 10)}-${sanitize(branch)}.md`);
const report = `---
type: test-report
branch: ${branch}
status: draft
---

# Test Report

## 影响分析

### 改动文件

\`\`\`
${changed || "No changed files detected."}
\`\`\`

TODO: 根据 issue、intent、merge report 判断风险。

## 必跑测试

${commands.length ? commands.map((cmd) => `- \`${cmd}\``).join("\n") : "- TODO: 未自动识别测试命令。"}

## 已运行测试

TODO

## 失败与修复

TODO

## 未运行测试

TODO

## 手工验证

TODO

## 回归风险

TODO

## 归档建议

如果本次测试确认相关 issue 已完成，先 dry-run 归档：

\`\`\`bash
node tools/loctek/archive.mjs . --branch ${branch} --dry-run
\`\`\`

只有 dry-run 结果全部属于已完成工作时，才去掉 \`--dry-run\`。如果记录混杂或验收标准未完成，请保留活跃记录。
`;

if (!existsSync(path)) writeFileSync(path, report);
console.log(`Created ${relative(path, repo)}`);
if (commands.length) {
  console.log("Suggested commands:");
  for (const command of commands) console.log(`- ${command}`);
}

function detectCommands(root) {
  const out = [];
  const packageJson = join(root, "package.json");
  if (existsSync(packageJson)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJson, "utf8"));
      const scripts = pkg.scripts || {};
      for (const name of ["test", "lint", "typecheck", "build"]) {
        if (scripts[name]) out.push(`npm run ${name}`);
      }
    } catch {}
  }
  if (existsSync(join(root, "pyproject.toml")) || existsSync(join(root, "pytest.ini"))) out.push("pytest");
  if (existsSync(join(root, "go.mod"))) out.push("go test ./...");
  if (existsSync(join(root, "pom.xml"))) out.push("mvn test");
  if (existsSync(join(root, "build.gradle")) || existsSync(join(root, "build.gradle.kts"))) out.push("gradle test");
  if (existsSync(join(root, "Cargo.toml"))) out.push("cargo test");
  return [...new Set(out)];
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function relative(path, base) {
  return pathRelative(resolve(base), resolve(path)) || ".";
}
