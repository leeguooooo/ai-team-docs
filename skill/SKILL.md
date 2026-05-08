---
name: ai-team-docs
description: ai-team-docs 跨团队文档规范的应用 skill —— PRD Hub + 各端实现方案 wiki + 双向链接 + Source-of-Truth 边界。当用户明确需要建立 PRD 库 / 技术方案 wiki 结构、复制本规范的模板（PRD / 技术方案 / ADR / 表设计 / 术语表）、按本规范迁移已有文档、或在 Lark/Notion/Confluence 中按本规范建空间时使用。Use when user explicitly requests ai-team-docs scaffolding, PRD Hub setup, cross-team wiki structure with bidirectional linking, or wants to apply the source-of-truth methodology to organize project docs. Do NOT trigger on generic "how to write docs" / "code comment style" / "API doc tooling" questions — only when user wants this specific cross-team methodology.
---

# ai-team-docs

> AI 时代跨团队文档规范——把 PRD、技术方案、架构决策、数据模型按"业务单元 + 双向链接 + Source-of-Truth"的规则组织起来。

## 何时使用

触发场景：
- 用户说"我想建个项目文档结构 / PRD 库 / wiki"
- 用户说"团队文档很乱 / 不知道 PRD 怎么写 / 技术方案没规范"
- 用户给一个新项目要规划文档结构
- 用户问"PRD 应该放在哪 / 跟技术方案怎么分"
- 用户要求把现有文档迁移到统一规范

## 核心原则（必须遵守）

读完即明白这套规范的精神，遇到具体问题往这里对：

### 1. AI 友好结构 = 扁平 + 业务单元

**不要按文档类型分目录**（`PRD/技术方案/接口/DB/`）—— 跨切散落。

**按 feature 切**：
```
features/   # 一 feature 一篇自包含文档
reference/  # 跨 feature 稳定参考资料
ops/        # 运维实战
```

### 2. PRD 与技术方案是不同维度，必须分开

PRD 写"做什么 + 为什么"（PM 主导，跨端读者）。
技术方案写"怎么实现"（工程师主导，单端深度）。

**分两个独立 wiki 空间**：
- PRD Hub（公司级共享）
- 各端实现方案 wiki（后端/前端/iOS/Android 各一个）

### 3. Source-of-Truth 必须明确（最重要！）

| 内容 | 真相在哪 | 文档里只放 |
|------|---------|-----------|
| OpenAPI / 接口字段 | repo `api/openapi.yaml` | 链接 + 业务说明 |
| DB schema | repo 代码 model | 业务含义、访问模式 |
| 错误码 / 部署脚本 | repo | 命名约定 / 操作流程说明 |
| ADR / 决策 | wiki | 主战场 |
| PRD / 需求 | wiki PRD Hub | 主战场 |

**铁律**：wiki 涉及具体接口/字段时**必须链接 repo 路径**，不复制片段。

### 4. 状态用标题前缀

`[Draft]/[Review]/[WIP]/[Done]/[Hold]/[Deprecated]`

不要用目录管状态——移动文档会断链。

### 5. ADR Log 是追加式日志

每条 ADR 编号独立、追加，废弃决策也保留（标记 `已废弃`）。

### 6. 双向链接

PRD 文末"实现追踪"表 → 各端实现方案。
各端实现方案文档头"对应 PRD" 字段 → PRD。
**任何文档应能 30 秒内跳到上下游**。

## 工作流

### 场景 A：用户要新建一套项目文档结构

1. **确认平台**：Lark / Notion / Confluence / GitHub wiki / 本地 markdown 哪个？
2. **确认是否有 PRD Hub**（公司可能已有跨项目共享的 PRD 库）：
   - 有 → 链接进来
   - 无 → 帮用户建一个（一次性，多个项目共享）
3. **建本端实现方案 wiki**（后端/前端/iOS/Android 二选一或多选）
4. **bootstrap 目录骨架**：
   - PRD Hub: README + `_PRD 模板`
   - 实现方案 wiki: README + `features/_tech-spec-template` + `reference/{术语表,架构总览,ADR Log,数据模型索引}` + `ops/`
5. **写一个示例 feature**（基于真实正在做的 feature）验证模板

平台特定指引：
- **Lark/飞书** → 见 [references/lark-setup.md](references/lark-setup.md)
- **Notion** → 见 [references/notion-setup.md](references/notion-setup.md)
- **本地 markdown / GitHub Wiki** → 直接 `npx ai-team-docs init`

### 场景 B：用户要写一篇新 PRD

1. 进 PRD Hub 复制 `_PRD 模板`
2. 标题：`[Draft] YYYY-MM 需求名`
3. 填模板章节，**特别强调**：
   - 第 7 节 "跨端范围 & 实现追踪" 必填表格（开发起稿后回填实现方案链接）
   - 第 6 节"数据/业务规则"只写业务规则，不写字段定义
4. PM 评审通过 → 状态改 `[Review]` → `[WIP]`

### 场景 C：用户要写一篇新技术方案

1. 进对应端实现方案 wiki 的 `features/`，复制 `_模板`
2. 标题：`[WIP] 方案名`
3. **必填**：文档头部"对应 PRD"字段
   - 链回 PRD Hub 的对应 PRD
   - 没有 PRD（如内部技术债）→ 填 "无（内部技术债务整治）"
4. 注意 source-of-truth 边界：
   - 第 4 节"API 契约"只列 endpoint 名称，详细 schema 链 `api/openapi.yaml`
   - 第 5 节"数据模型"只写"差异"，不复制完整字段（链 `reference/tables/<表>`）

### 场景 D：用户要新增一张数据库表

1. 进 `reference/tables/`，复制 `_table-design-template`
2. 命名：表名直接做文件名（如 `users-v3.md`、`orders.md`）
3. 填关键字段族（不复制完整 schema，链 repo model）
4. 列出访问模式（GetItem / Query / Scan）+ GSI 设计
5. 在 `reference/数据模型索引` 加一行
6. 重大设计决策 → 加一条 ADR，链回本表设计

### 场景 E：用户要做架构决策记录

1. 进 `reference/ADR Log`
2. 编号取下一个连续号（已废弃决策保留编号，不回收）
3. 必填：日期、状态、背景、决策、替代方案、后果、来源
4. 决策被取代时，新写一条 ADR-N+1（状态改 `已替代为 ADR-N+1`），不删旧的

## 模板速查

通过 npx 即取即用：
```bash
npx ai-team-docs show prd          # PRD 模板
npx ai-team-docs show tech-spec    # 技术方案模板
npx ai-team-docs show adr          # ADR 模板
npx ai-team-docs show table        # 表设计模板
npx ai-team-docs show glossary     # 术语表模板
npx ai-team-docs show architecture # 架构总览模板
```

scaffold 整套到本地：
```bash
npx ai-team-docs init                      # 默认到 ./docs/
npx ai-team-docs init my-project --type all   # 指定目录
npx ai-team-docs init prd-hub --type prd-hub  # 只生成 PRD Hub
npx ai-team-docs init impl --type impl        # 只生成实现方案 wiki
```

## 反模式（用户做这些时立即纠正）

❌ **PRD 写到接口字段级**：PRD 应停在业务规则；字段细节是技术方案的事。
❌ **技术方案复制完整 OpenAPI / schema**：那是真相镜像，会过期。
❌ **用文档目录管状态**（"进行中/已发布/归档"）：移动文档会断链。
❌ **故障复盘藏在 feature 里**：复盘要在 `ops/故障复盘`，独立时间线。
❌ **没有"对应 PRD"字段**：技术方案脱离背景，半年后没人能解释为什么写。
❌ **没有"实现追踪"表**：PRD 不知道实施进度。
❌ **重复定义同一事实**：典型如 OpenAPI 在 wiki 复制一份；改一处忘改另一处。

## 推荐操作

用户说"建文档结构" → 先问平台 + 项目背景 → 再用本 skill 的工作流；不要直接用本地文件。
用户说"PRD 怎么写" → 先 `npx ai-team-docs show prd` 让用户看模板，再帮填。
用户说"我们文档很乱" → 先识别核心病（哪些反模式），再渐进式重构（不要一次大搬迁）。

## 详细参考

- [references/lark-setup.md](references/lark-setup.md) — Lark/飞书 wiki 自动建空间 + 写入模板（用 lark-cli）
- [references/notion-setup.md](references/notion-setup.md) — Notion 手动设置指南
- [references/migration-guide.md](references/migration-guide.md) — 已有杂乱文档怎么渐进式迁移到本规范

## 相关文档（npm 包内）

- README — 用户向使用指南
- docs/methodology.md — 方法论总览
- docs/why-ai-friendly.md — 为什么扁平结构
- docs/source-of-truth.md — wiki/repo 边界
- docs/cross-team-linking.md — 跨端双向链接

## 仓库

GitHub: https://github.com/leeguooooo/ai-team-docs
npm: https://www.npmjs.com/package/ai-team-docs
