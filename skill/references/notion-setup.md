# Notion 设置指南

> Notion 没有像 Lark wiki 那样的标准 CLI，推荐**手动设置 + 用模板复制**。

## 推荐结构

Notion 用 workspace 的 sidebar，建议建两个 top-level pages：

```
[your workspace sidebar]
├── 📘 Product Requirements (PRD Hub)
│   ├── 📄 README - PRD 库使用指南
│   ├── 📄 _PRD Template
│   └── 📁 各 PRD（用 Status property 管理状态，不用子目录）
│
└── 📗 <Project> Implementation Wiki
    ├── 📄 README - 协作规则
    ├── 📁 features
    │   ├── 📄 _Tech Spec Template
    │   └── 📁 各方案文档
    ├── 📁 reference
    │   ├── 📄 Glossary
    │   ├── 📄 Architecture Overview
    │   ├── 📄 ADR Log
    │   ├── 📄 API Overview
    │   └── 📁 tables（一表一页）
    └── 📁 ops
        ├── 📄 Environment & Deployment
        ├── 📄 Dashboard & Runbook Links
        ├── 📄 Release Notes
        └── 📁 Postmortems
```

## 设置步骤

### Step 1：复制模板内容到 Notion

```bash
# 拿到模板的 markdown 内容
npx ai-team-docs show prd > prd-template.md
npx ai-team-docs show tech-spec > tech-spec-template.md
npx ai-team-docs show readme-prd-hub > prd-hub-readme.md
npx ai-team-docs show readme-impl > impl-wiki-readme.md
# ...
```

Notion 支持粘贴 Markdown，会自动转换成 Notion blocks。

### Step 2：用 Notion Database 管理 PRD 状态

**推荐**：把 PRD Hub 下的"各 PRD"做成一个 **Database**：

| Property | Type | 用途 |
|----------|------|------|
| Name | Title | PRD 标题 |
| Status | Select | Draft / Review / WIP / Done / Hold / Cancelled |
| PM | Person | PM 负责人 |
| Created | Date | 创建日期 |
| Target Launch | Date | 目标上线月份 |
| Priority | Select | P0 / P1 / P2 |
| 后端实现方案 | URL | 链接到后端 wiki |
| Web 实现方案 | URL | 链接到 Web wiki |
| iOS 实现方案 | URL | 链接到 iOS wiki |
| Android 实现方案 | URL | 链接到 Android wiki |

这样可以用 **Filter View** 快速筛"WIP 的 PRD"、"P0 的 PRD"等。

### Step 3：实现方案 wiki 同样用 Database

`features/` 做成 Database：

| Property | Type |
|----------|------|
| Name | Title |
| Status | Select (WIP / Done / Hold / Deprecated) |
| Owner | Person |
| Last Updated | Last edited time（自动）|
| 对应 PRD | URL（链回 PRD Hub）|
| Target Version | Text |

## 跨 workspace 共享

Notion 的 page link 可跨 workspace（如果两个 workspace 都在你账号下）。
跨公司协作（PM 在公司 A workspace、工程师在公司 B workspace）：
- 用 **Notion Sites** 把 PRD Hub 公开发布（生成 public URL）
- 工程师在自己 workspace 内引用 public URL
- 但反向链接不存在 → 有断链风险

如果跨公司协作严重，建议：
- PRD Hub 用一个**所有人都有权限的中立 workspace**
- 或考虑切换到飞书 / Lark Wiki（跨租户协作更原生）

## 关键约束

⚠️ Notion 不像 Lark wiki 一样有稳定的"node_token"概念。链接用 page URL：
- Notion page URL 包含 page ID（即使 title 改了 URL 也稳定）
- 移动 page 不会改 URL（只要 page 还在同一 workspace）
- 跨 workspace 移动会失效

⚠️ Notion 的"DB inline view" 在嵌套层级深时会卡——尽量保持扁平。

## 与 Notion API 集成（高级）

Notion 有官方 API（[developers.notion.com](https://developers.notion.com)），可以编程方式：
- 创建 page
- 更新 page content
- 查询 database

但工作量比 Lark CLI 大很多——要自己处理 OAuth、Block 结构、限流等。**建议除非自动化需求很高，否则手动设置就好**。

## 替代：用 GitHub `docs/` 目录代替 Notion

如果团队都用 Git，且不需要非工程角色协作，**直接把 docs/ 放在 repo 里更简单**：

```bash
cd <repo>
npx ai-team-docs init  # scaffold 到 ./docs/
git add docs/
git commit -m "docs: add ai-team-docs skeleton"
```

GitHub UI 自动渲染 Markdown，PR 评审可见。劣势：PM/QA 不读 git。
