# {项目名} 实现方案 wiki

> 本 wiki 为 **{后端 / 前端 / iOS / Android}** 实现方案库。PRD 在 [PRD Hub](URL_TO_PRD_HUB)，相互链接。

## 0. 先读这个：Wiki vs Repo 的 Source of Truth 规则

| 内容 | 真相在哪 | Wiki 角色 |
|------|---------|----------|
| OpenAPI / 接口契约 | repo `api/openapi.yaml` | 链接 + 业务说明 |
| DB schema 字段定义 | repo（model / repository 代码） | 业务含义、访问模式、迁移背景 |
| 错误码 | repo `api/error-codes.yaml` 等 | 体系说明 + 命名约定 |
| Makefile / 部署脚本 | repo `Makefile`、`scripts/` | 操作流程说明 |
| 生成代码 | repo（生成的目录） | 不要复制 |
| **ADR / 架构决策** | **Wiki — reference/ADR Log** | 主战场 |
| **PRD** | **PRD Hub（外部空间）** | 本空间不放 |
| **实现方案** | **Wiki — features/** | 主战场 |
| **故障复盘** | **Wiki — ops/故障复盘** | 主战场 |
| **发布记录** | **Wiki — ops/发布记录** | repo 有 CHANGELOG |

**铁律**：
1. 代码、生成产物、可执行脚本 → **只在 repo**
2. 决策上下文、背景、可读说明 → **只在 wiki**
3. wiki 涉及具体接口 / 表字段时**必须链接 repo 路径**，不复制片段
4. PRD 在外部 PRD Hub，本空间不重复

## 1. 目录导航

- **features/** — 业务 / 迭代主战场，一个 feature 一篇自包含文档
- **reference/** — 跨 feature 稳定参考资料
  - 术语表（**强烈建议先读，避免踩核心概念坑**）
  - 架构总览
  - ADR Log（架构决策追加日志）
  - API 总览
  - 数据模型索引 + tables/ 子目录（一表一页）
- **ops/** — 运维实战
  - 环境与部署
  - Dashboard & Runbook 链接
  - 发布记录
  - 故障复盘

## 2. Feature 状态约定（标题前缀）

| 前缀 | 含义 |
|------|------|
| `[WIP]` | 进行中 |
| `[Done]` | 已上线 |
| `[Hold]` | 暂停 / 排期外 |
| `[Deprecated]` | 已废弃，保留作历史 |

示例：`[WIP] 2026-Q2 xxx 接入`

> 状态前缀只做粗筛。文档超过 ~15 个时，在下方 Feature 索引表里维护精确状态。

## 3. Feature 索引（手动维护）

| 状态 | 标题 | 对应 PRD | 负责人 | 最近更新 |
|------|------|---------|--------|---------|
|  |  |  |  |  |

## 4. 写新文档怎么做

1. 进 `features/` 复制 `_模板：技术方案`
2. 标题加 `[WIP]` 前缀
3. **必填**：文档头部"对应 PRD"字段链回 PRD Hub 中对应 PRD（无 PRD 时填"无（内部技术债务）"）
4. 完成上线后改成 `[Done]`，并在本页第 3 节索引表里记一笔
5. 涉及新表 / 大改 schema：在 `reference/tables/` 加一页或更新现有页，并记 ADR
6. 出故障：`ops/故障复盘` 加一篇

## 5. 关键 repo 路径

- 项目根：(本端 repo URL)
- API 契约：`api/openapi.yaml`
- 错误码：
- 配置说明（CLAUDE.md 等 AI 协作规则）：

## 6. 关联空间

- [PRD Hub](URL_TO_PRD_HUB)
- 兄弟实现方案 wiki：(列出其他端的 wiki)
