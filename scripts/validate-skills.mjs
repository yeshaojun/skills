import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const skillsDir = join(root, "skills");
const failures = [];
const dirs = findSkillDirs(skillsDir);

for (const dir of dirs) {
  const name = dir.split("/").pop();
  const skillPath = join(dir, "SKILL.md");
  const text = readFileSync(skillPath, "utf8");
  if (!text.startsWith("---\n")) failures.push(`${name}: SKILL.md must start with YAML frontmatter`);
  if (!text.includes("name:")) failures.push(`${name}: missing name`);
  if (!text.includes("description:")) failures.push(`${name}: missing description`);
}

if (dirs.length === 0) failures.push("No skills found under skills/");

if (failures.length) {
  console.error("Skill validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${dirs.length} skills.`);

function findSkillDirs(dir, depth = 0) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (!statSync(path).isDirectory()) continue;
    try {
      if (statSync(join(path, "SKILL.md")).isFile()) out.push(path);
    } catch {}
    if (depth < 4) out.push(...findSkillDirs(path, depth + 1));
  }
  return out;
}

