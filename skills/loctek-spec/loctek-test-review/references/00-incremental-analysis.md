# 增量代码识别与影响面分析

白盒走查必须基于**精确的增量代码**。本文档定义基线确定、diff 体量分级和影响面分析的规则。机械步骤优先用脚本完成：

```bash
node "<skill-dir>/scripts/loctek-test-diff.mjs" <repo-root> [--base <ref>] [--head <ref>] [--out <dir>]
```

脚本输出 JSON（基线、体量分级、文件清单、方法签名摘要、影响面候选）+ 可读的 MD 摘要。脚本失败时按下面的规则手工执行。

## 一、基线 commit 确定（三级策略）

| 优先级 | 策略 | 命令 | 适用场景 |
| :--- | :--- | :--- | :--- |
| 1️⃣ 最优 | 用户提供基线 commit | 用户告知主分支的 commit hash | 用户知道从哪个版本拉的分支 |
| 2️⃣ 推荐 | fork-point 自动计算 | `git merge-base --fork-point origin/main HEAD` | 分支未 rebase 过 |
| 3️⃣ 兜底 | merge-base 计算 | `git merge-base origin/main HEAD` | 通用场景（含已 merge main） |

```bash
BASE=$(git merge-base --fork-point origin/main HEAD 2>/dev/null)
if [ -z "$BASE" ]; then BASE=$(git merge-base origin/main HEAD); fi
```

主分支可能是 `main` 或 `master`，先从 `git symbolic-ref refs/remotes/origin/HEAD` 或本地分支列表确认。

**隐患提示**：若主分支持续推进并多次合并进 feature，merge-base 会变成最新合并点，早期 feature 提交的改动可能"消失"。所以优先用 `--fork-point`；用户能提供基线时永远以用户为准。`.changes/intents/` 里记录的基线或关联 commit 也是可信来源。

## 二、获取变更信息

### 2.1 变更文件列表

```bash
git diff --name-status $BASE..HEAD
git diff --stat $BASE..HEAD
```

### 2.2 Diff 体量评估与分级（读取 diff 内容之前必须执行）

对每个涉及的代码工程求和 insertions + deletions，得到总变更行数，按分级处理：

| 变更规模 | 总变更行数 | Diff 读取策略 | 走查策略 |
| :--- | :--- | :--- | :--- |
| 🟢 小型 | < 500 行 | 全量读取 diff | 一次性完成走查 |
| 🟡 中型 | 500-2000 行 | 按工程分批读取，每次只读一个工程 | 分片走查，每个工程单独产出 |
| 🔴 大型 | > 2000 行 | **只读方法签名级摘要**，核心文件按需精读 | 分片走查 + 摘要模式 |

### 2.3 大型变更的摘要机制（🔴 必做）

> 目的：把数百 KB 的原始 diff 压缩为 ~10KB 的方法级摘要，避免上下文膨胀。脚本已自动生成；手工命令如下。

```bash
# 变更文件清单
git diff --name-only $BASE..HEAD > /tmp/repo_changed_files.txt
# 新增文件清单（重点关注）
git diff --name-only --diff-filter=A $BASE..HEAD > /tmp/repo_new_files.txt
# 方法签名级变更摘要（Java 后端）
git diff $BASE..HEAD -- "*.java" | grep -E "^[+-]\s*(public|private|protected|package)\s+" > /tmp/repo_method_changes.txt
# 前端组件/函数级变更摘要
git diff $BASE..HEAD -- "*.ts" "*.tsx" "*.vue" | grep -E "^[+-]\s*(export|function|const|interface|class|type)\s+" > /tmp/repo_frontend_changes.txt
```

**关键规则**：

- 禁止读取完整 git diff 输出：diff 格式冗余度高（`+/-` 前缀 + 重复上下文行，比源文件膨胀 2-3 倍）。
- 后续步骤用摘要确定核心类，然后直接读核心类的**源文件**精读（可看完整实现、全部分支、异常处理）。
- 每个片段独立完成一个工程的分析，写完即释放；禁止同时读多个工程的源文件。
- 单个源文件超过 500 行时，只读核心方法所在行范围。

### 2.4 diff 内容分类

| diff 内容 | 标识 | 检查重点 |
| :--- | :--- | :--- |
| 新增代码 | `+` 行 | 新逻辑是否正确、空值保护、与需求一致性 |
| 删除代码 | `-` 行 | 删除是否安全、是否有依赖 |
| 修改代码 | `- → +` | 修改是否正确、是否引入回归 |
| 文件改名 | rename | import 路径是否全部更新 |

## 三、影响面分析（强制）

变更的方法可能被其他未改动的文件调用。只看变更文件本身不够，必须分析影响面。

### 3.1 需要分析影响面的变更类型

| 变更类型 | 搜索方式 | 检查要点 |
| :--- | :--- | :--- |
| 枚举新增 | grep 枚举名 | 所有 switch/if 是否覆盖新值 |
| 公共方法签名变更 | grep 方法名 | 调用方是否兼容新签名 |
| DTO/Resp 字段新增 | grep 类名（含前端） | 序列化/反序列化是否兼容 |
| 接口路径变更 | grep 旧路径 | 前端调用是否同步更新 |
| 配置项新增 | grep 配置 key（含 yml） | 各环境是否已配置 |

### 3.2 输出格式

| 变更点 | 变更类型 | 被影响的文件/方法 | 是否需要检查 |
| :--- | :--- | :--- | :--- |
| {具体变更} | 新增/修改/删除 | {被影响的代码位置} | ✅/❌ |

### 3.3 不需要分析影响面的情况

- 纯新增文件（无历史调用方）
- 私有方法变更（仅本类使用）
- 测试代码变更

## 四、前后端工程自动识别

### 4.1 工程类型判断

| 判断依据 | 工程类型 |
| :--- | :--- |
| 含 `pom.xml` / `build.gradle` / `go.mod` | 后端 |
| 含 `package.json` + (`src/*.vue` 或 `src/*.tsx` 或 `src/*.jsx`) | 前端 |
| 含 `pom.xml` + `package.json`（monorepo） | 全栈 |

### 4.2 需求相关性判断

检查各工程的当前分支名是否包含 issue 编号或需求关键词。只有需求相关的工程才纳入走查范围。有 `.changes/issues/` 时以 issue 的"预计改动区域"为准做交叉验证。

### 4.3 强制规则

> 🚨 **必须同时覆盖前后端**。禁止只做后端走查而忽略前端，除非确认本次改动无前端变更。
