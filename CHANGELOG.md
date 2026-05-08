# Changelog

ai-team-docs follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.2] - 2026-05-08

第二轮独立 review 修复（codex agent 投递的 8 条反馈）。

### Fixed
- **`links check` 路径解析 bug**（HIGH）：`fs.existsSync(r)` 之前用 CWD 解析 repo 路径，子目录运行 `links check` 会 false-positive 全失败。改为相对 manifest 文件所在目录解析。加了回归测试。
- **空的 `examples/` + 文档死链**（HIGH）：`package.json` `files` 字段含 `examples`、`docs/methodology.md` 引用 `examples/` 却为空目录。补上 4 个真实脱敏示例（PRD / 技术方案 / ADR / 表设计）+ examples README。

### Improved
- **核心论点澄清**：之前过度强调"AI 友好 = 扁平"，被指出在大型项目反噬。`docs/why-ai-friendly.md` 新增"关于扁平的边界"段，明确**自包含是核心，扁平是手段**，并给出小/中/大型项目的渐进路径。
- **小团队豁免**：`docs/methodology.md` 新增小团队（1-2 人 / 单端项目 / PM 工程师混合）的简化路径——不分 PRD Hub 和实现方案 wiki。但 source-of-truth / 状态前缀 / ADR 追加 这 3 条铁律即使一个人也要遵守。
- **SKILL trigger 收窄**：之前的描述被任何"怎么写文档"对话都可能误激活。改为强信号词：明确请求 ai-team-docs scaffolding / PRD Hub setup / cross-team wiki / source-of-truth methodology 才触发。
- **README quick start 重排**：之前的"30 秒快速开始"实际不到 30 秒就被 README 全文 dump 淹没。改为"5 分钟上手"，第一步 `show prd` 立即感受价值，第四步才 `methodology`（可选深读）。
- **package.json keywords**：补充差异化词（`doc-methodology` / `cross-team` / `wiki-linking` / `source-of-truth` / `prd-hub` / `confluence` / `adr`），改善 npm 搜索发现性。

### Added
- `examples/` 目录：4 个脱敏真实示例 + 索引 README
  - `example-prd-room-classification.md` — 完整 PRD
  - `example-tech-spec-room-classification.md` — 对应技术方案（演示双向链接）
  - `example-adr-multi-tenant-pk.md` — ADR 单条
  - `example-table-rooms.md` — 表设计（演示链回 repo 而非复制 schema）
- 2 条新回归测试（manifest dir 路径解析、examples 非空）

### Notes
- `parseArgs` 对 `--key VALUE` 后跟已知命令关键字的歧义（如 `--type show`）暂未结构化修复——靠 cmdInit 的 enum 校验兜底。已在代码注释中标明设计取舍。

## [0.2.1] - 2026-05-08

### Fixed
- **CLI argv parser**: Now supports Unix-standard `--key=value` syntax (was only accepting `--key value`). Reported via review.
- **`$schema` reference**: Pointed to a missing file path. Replaced with a real schema at `schema/links.schema.json` (draft-07 JSON Schema).
- **Wiki URL validation in `links check`**: Was too lenient (accepted any URL). Now classifies URLs into recognized patterns (Lark / Feishu / Notion / Confluence / GitHub) vs unrecognized (warning, not error). Detects unfilled placeholders (`REPLACE_WITH_NODE_TOKEN`, `YOUR_TENANT`).
- **`.ai-team-docs-links.json` discovery**: Hardcoded to `cwd`; now walks up parent dirs (stops at git root) to find existing manifest.

### Added
- **`schema/links.schema.json`**: JSON Schema for the links manifest. Compatible IDEs/validators (VSCode, etc.) can autocomplete and validate.
- **`--json` flag** for `links list` and `links check`: Machine-readable output for CI integration.
- **Warning level** in `links check` (in addition to pass/fail): unrecognized but accepted URL patterns get a warning, not a fail.

### Changed
- `links check` now prints a 3-state summary: `Pass / Warn / Fail`. Fail count drives exit code (still exits 1 on any fail).

## [0.2.0] - 2026-05-08

### Added
- **`links` subcommand**: Manage `.ai-team-docs-links.json` manifest for wiki↔repo address linking.
  - `links init`: Create a starter manifest with example entries.
  - `links list`: List all links with wiki URL and repo paths.
  - `links show <id>`: View a single link's full JSON.
  - `links check`: Validate repo paths exist + wiki URL format. Exits 1 on failure (CI-friendly).
- **`docs/sync-and-linking.md`**: New doc explaining 4 categories of sync needs and why we only support address linking (not bidirectional content sync).

### Philosophy
- Explicit stance against bidirectional content sync: wiki and repo are different sources of truth for different content. Manifest-based address linking is the correct primitive. See `docs/sync-and-linking.md`.

## [0.1.0] - 2026-05-08

### Added
- **Initial release**: AI-era cross-team documentation conventions.
- **Methodology docs**: `methodology` / `why-ai-friendly` / `source-of-truth` / `cross-team-linking`.
- **8 templates**: PRD, tech-spec, ADR, table-design, glossary, architecture-overview, README-prd-hub, README-impl-wiki.
- **Zero-dependency Node 18+ CLI** (`bin/cli.mjs`): `methodology` / `docs` / `list` / `show` / `init` / `version` / `help`.
- **Claude Code Skill** with references for Lark, Notion, and migration scenarios.
- **MIT License**.

[Unreleased]: https://github.com/leeguooooo/ai-team-docs/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/leeguooooo/ai-team-docs/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/leeguooooo/ai-team-docs/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/leeguooooo/ai-team-docs/releases/tag/v0.1.0
