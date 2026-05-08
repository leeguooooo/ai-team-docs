# ai-team-docs

> **AI 时代的跨团队文档规范**——一套面向多端协作 + AI Agent 友好的项目文档结构、模板与工具集。

[![npm](https://img.shields.io/npm/v/ai-team-docs)](https://www.npmjs.com/package/ai-team-docs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 这是什么

如果你的团队有这些痛点，这个项目就是给你的：

- 写 PRD 时不知道格式，每个 PM 一套自己的写法
- 后端写"技术方案"，前端写"实现文档"，iOS 写"开发笔记"——**同一个需求散落 4 个地方**
- 文档和代码慢慢漂移，半年后没人敢信文档
- AI Agent（Claude / Cursor / Copilot）写文档时把 schema 复制十份，越改越乱
- 想立规范，但没人愿意写"文档使用说明"

**ai-team-docs** 提供：
- 📐 一套**经过实战验证**的跨团队文档结构（PRD 中心库 + 各端实现方案 wiki）
- 📝 **直接可用的模板**（PRD / 技术方案 / ADR / 表设计 / 术语表）
- 🤖 **CLI 工具**：`npx ai-team-docs init` 一键 scaffold 到你的 repo
- 🧠 **Claude Code Skill**：让 Claude 按这套规范帮你写/管文档

## 30 秒快速开始

**当前从 GitHub 源使用**（无需 npm 发布）：

```bash
# 看方法论
npx -y github:leeguooooo/ai-team-docs methodology

# 看 PRD 模板长什么样
npx -y github:leeguooooo/ai-team-docs show prd

# 把模板 scaffold 到当前 repo 的 docs/ 目录
npx -y github:leeguooooo/ai-team-docs init
```

> 嫌长？设个 alias：`alias atd='npx -y github:leeguooooo/ai-team-docs'`，之后 `atd init` 即可。

**未来**（发布到 npm registry 后）：

```bash
npx ai-team-docs methodology    # 同等效果，命令更短
```

锁定版本：
```bash
npx -y github:leeguooooo/ai-team-docs#v0.1.0 init   # 锁标签
npx -y github:leeguooooo/ai-team-docs#abc1234 init  # 锁 commit SHA
```

## 核心方法论（5 条铁律）

### 1. AI 友好结构 = 扁平 + 按"业务单元"组织

❌ 传统结构（按文档类型切）：
```
01-PRD/  02-技术方案/  03-接口/  04-DB/  05-运维/
```
一个改动散落 4 处，AI 拼不出全貌。

✅ AI 友好结构（按 feature 切）：
```
features/         ← 主战场，一个 feature 一篇自包含文档
reference/        ← 跨 feature 稳定参考资料（架构/ADR/术语表）
ops/              ← 运维实战
```

详见 [docs/why-ai-friendly.md](docs/why-ai-friendly.md)

### 2. PRD 与技术方案是不同维度，必须分开

| 维度 | PRD | 技术方案 |
|------|-----|---------|
| 作者 | PM | 工程师 |
| 范围 | 跨端业务规则 | 单端实现细节 |
| 读者 | PM/QA/全栈/领导 | 该端工程师 |
| 修改频率 | 上线前定稿 | 实现迭代时 |

→ **PRD 放统一的"PRD Hub"**，技术方案放各端独立 wiki，**双向链接**。

详见 [docs/cross-team-linking.md](docs/cross-team-linking.md)

### 3. Source-of-Truth 必须明确（最重要！）

| 内容 | 真相在哪 | 文档里只放 |
|------|---------|-----------|
| OpenAPI / 接口定义 | repo `api/openapi.yaml` | 链接 + 业务说明 |
| DB schema 字段 | repo 代码 model | 业务含义 + 访问模式 |
| 部署脚本 | repo `Makefile`/`scripts/` | 操作流程说明 |
| ADR / 决策背景 | wiki | 主战场 |
| PRD / 需求 | wiki PRD Hub | 主战场 |

**铁律**：wiki 涉及具体接口/字段时**必须链接 repo 路径**，不复制片段（永远会过期）。

详见 [docs/source-of-truth.md](docs/source-of-truth.md)

### 4. Feature 状态用标题前缀，不用目录

❌ 移动文档目录管状态（`进行中/已发布/归档`）→ 移动会断链
✅ 改标题前缀（`[WIP]/[Done]/[Hold]/[Deprecated]`）→ 一秒切换

### 5. ADR Log 是追加式日志，不是 wiki

每个架构决策一条独立条目，编号一旦分配不回收：
```
## ADR-001: <短标题>
- 日期 / 状态 / 背景 / 决策 / 替代方案 / 后果 / 来源
```

详见 [templates/ADR.md](templates/ADR.md)

## 推荐结构

```
你的项目
├── 公司级：PRD Hub（独立 wiki 空间）        ← npx ai-team-docs init prd-hub 生成本地版
│   ├── README - 跨端协作规则
│   ├── _PRD 模板
│   └── [WIP/Done] 各 PRD 文档
│
├── 后端 wiki（独立空间）                     ← npx ai-team-docs init impl 生成
│   ├── README - source-of-truth 规则
│   ├── features/                            ← 一 feature 一文档
│   │   ├── _模板：技术方案
│   │   └── [WIP/Done] 各方案文档
│   ├── reference/
│   │   ├── 术语表
│   │   ├── 架构总览
│   │   ├── ADR Log
│   │   ├── API 总览（链接 repo）
│   │   └── 数据模型索引 + tables/
│   └── ops/
│       ├── 环境与部署
│       ├── Dashboard & Runbook
│       ├── 发布记录
│       └── 故障复盘
│
├── 前端/iOS/Android wiki                    ← 同 impl 模式
│
└── repo（代码）
    ├── CLAUDE.md / AGENTS.md                ← AI 协作规则
    ├── api/openapi.yaml                     ← 接口契约（真相）
    └── 代码 ...
```

## CLI 用法

> 下文用短形式 `<atd>` 代表 `npx -y github:leeguooooo/ai-team-docs`（GitHub 源）或 `npx ai-team-docs`（npm 源，发布后）。

```bash
# 总览
<atd> --help

# 命令
<atd> methodology               # 打印方法论 README
<atd> docs                      # 列出方法论文档
<atd> docs <name>               # 查看某篇方法论（如 docs why-ai-friendly）
<atd> list                      # 列出可用模板
<atd> show <name>               # 查看单个模板（如 show prd / show tech-spec）
<atd> init [target]             # scaffold 模板到目标目录（默认 ./docs/）
<atd> init --type prd-hub       # 只生成 PRD Hub 结构
<atd> init --type impl          # 只生成单端实现方案 wiki 结构
<atd> init --type all           # 生成两套（默认）
<atd> init --force              # 覆盖已存在文件
```

## 与 Claude Code 集成

如果你用 [Claude Code](https://claude.com/claude-code)，把 [`skill/`](skill/) 目录复制到 `~/.claude/skills/ai-team-docs/`，Claude 就会在你说 "帮我建 PRD 文档" 时按本规范操作（自动用 lark-cli / Notion API / 本地 MD 三选一）。

详见 [skill/SKILL.md](skill/SKILL.md)

## 适用工具

这套规范**工具无关**——只要支持目录 + 文档的协作平台都能用：

| 平台 | 适配方式 |
|------|---------|
| 飞书 / Lark Wiki | `lark-cli` 自动建空间 + 写入模板（详见 skill） |
| Notion | 手动 / Notion API |
| Confluence | 手动 / Confluence REST API |
| GitHub Wiki / `docs/` 目录 | `npx ai-team-docs init` 直接 scaffold |
| 飞书云文档 / Google Docs | 复制模板内容 |

## 灵感与致谢

本项目脱胎于一个真实的语音房后端项目的文档治理实践（2026-05），结合了：
- Codex 独立 review 的反馈（拒绝单文档式 PRD/技术混杂）
- AI Agent 协作的真实痛点（一个 feature 散落 4 处，AI 改不全）
- 跨端团队（后端/前端/iOS/Android）的双向链接需求

## 贡献

欢迎 issue / PR：
- 新增工具适配（Confluence、Notion API、Logseq 等）
- 不同领域的模板（移动 App、数据团队、设计团队等）
- 翻译（English / 日本語 / etc.）

## License

MIT © leeguooooo
