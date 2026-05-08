# Changelog

ai-team-docs follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
