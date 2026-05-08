# 同步与链接策略

> Wiki 和 repo 不是同一个真相的两个副本，而是**不同内容的不同家**。本文说明哪些可以同步、哪些不应该同步、怎么用链接代替同步。

## 核心立场：**少同步，多链接**

按 [source-of-truth](source-of-truth.md) 铁律，Wiki 和 repo 各为不同内容的真相：

| 内容 | 真相在哪 | 另一边的态度 |
|------|---------|------------|
| OpenAPI / 接口字段 | repo | 链接 |
| DB schema 字段 | repo 代码 model | 链接 + 业务说明 |
| 代码实现 | repo | 链接 |
| 部署脚本 | repo | 链接 + 流程说明 |
| PRD / 需求 | wiki PRD Hub | 不进 repo |
| ADR / 架构决策 | wiki | 不进 repo |
| 故障复盘 | wiki ops/ | 不进 repo |

如果对**同一份内容**做双向同步，会陷入两套 history 互相覆盖的死循环。**永远不要做双向同步**。

## 4 类需求，分别处理

### 1. 地址关联（双向链接）—— 必须做

**这是 ai-team-docs 当前内置支持的能力**。

每个文档都登记到 `.ai-team-docs-links.json`：

```json
{
  "version": 1,
  "links": [
    {
      "id": "arch-overview",
      "title": "架构总览",
      "wiki": "https://your-tenant.larksuite.com/wiki/Y11NwPojOiiQs2khFYEjKlc9pZe",
      "repo": ["docs/ARCHITECTURE.md"]
    },
    {
      "id": "rooms-table-design",
      "title": "rooms-v2 表设计",
      "wiki": "https://your-tenant.larksuite.com/wiki/ZCt4doOIZo7coIxXkscjgd5upec",
      "repo": [
        "internal/models/room.go",
        "internal/repository/v3/room_repository_v3.go"
      ]
    }
  ]
}
```

**用 CLI 管理**：

```bash
ai-team-docs links init       # 在当前目录创建空的 links.json
ai-team-docs links list       # 列出所有链接
ai-team-docs links show arch-overview   # 看单条
ai-team-docs links check      # 校验 repo 路径存在 + wiki URL 格式
```

**在 CI 加一步**：
```yaml
# .github/workflows/ci.yml
- name: Check wiki/repo links
  run: npx -y github:leeguooooo/ai-team-docs links check
```

防止：
- repo 文件被重命名 / 删除导致链接腐烂
- wiki URL 被复制错误（比如填了 wiki 节点 token 没填完整 URL）
- 重复 ID

### 2. Wiki → Repo 单向快照（可选，推荐做）

把 Lark wiki 内容定期导出到 `docs/wiki-snapshot/`，**只读镜像**。

**好处**：
- 离线可读
- Git history 记录 wiki 的变化
- Wiki 误删 / 平台挂掉时能从 git 恢复
- 用 grep / IDE 搜全部 wiki 内容

**实现思路**（需要自己写脚本，ai-team-docs 暂未集成）：

```bash
#!/usr/bin/env bash
# scripts/snapshot-wiki.sh
# 用 lark-cli 拉取 wiki 全部节点到 docs/wiki-snapshot/

SPACE_ID="<your wiki space id>"
mkdir -p docs/wiki-snapshot
cd docs/wiki-snapshot

# 列出全部节点 → 逐个 fetch
lark-cli wiki nodes list --params "{\"space_id\":\"$SPACE_ID\"}" --page-all --format json | \
  jq -r '.data.items[] | [.node_token, .obj_token, .title] | @tsv' | \
  while IFS=$'\t' read -r node_token obj_token title; do
    safe_title=$(echo "$title" | tr '/' '_' | tr ' ' '-')
    lark-cli docs +fetch --doc "$obj_token" --format markdown > "${safe_title}.md"
  done

# 自动 commit
git add docs/wiki-snapshot
git commit -m "chore: snapshot wiki ($(date +%Y-%m-%d))" || true
```

**关键约束**：
- snapshot 目录加 `.gitattributes` 标 `linguist-generated=true`
- README 顶部明写"自动同步，请勿手动改"
- 每次 snapshot 是 commit，不要 force push

### 3. Repo → Wiki 单向推送（高度选择性）

只对**少数明确希望让非工程师看到**的 repo 文件：

| 候选 repo 文件 | 推到 wiki 节点 | 触发时机 |
|---------------|--------------|---------|
| `CHANGELOG.md` | ops/发布记录 | git push to main |
| `README.md`（精简版）| 项目首页 | 每次相关变更 |
| 特定的 ADR 文件 | reference/ADR Log 子页 | 文件改动时 |

**实现思路**（需要自己加 GitHub Action）：

```yaml
# .github/workflows/sync-wiki.yml
on:
  push:
    branches: [main]
    paths:
      - 'CHANGELOG.md'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g @larksuite/cli
      - run: |
          lark-cli config init --token "${{ secrets.LARK_APP_TOKEN }}"
          lark-cli docs +update \
            --doc "${{ secrets.WIKI_OBJ_TOKEN_RELEASE_NOTES }}" \
            --mode overwrite \
            --markdown "$(cat CHANGELOG.md)"
```

**关键约束**：
- 被推的文件**必须只在 repo 编辑**（wiki 端禁止编辑或加水印"由 CI 同步，请去 repo 改"）
- 否则就变成双向同步，必然冲突

### 4. 完全不同步（占绝大多数）

PRD 正文、ADR 决策内容、技术方案细节、表设计——这些只在 wiki 写，repo 不复制。

如何让 AI / 工程师能找到？
- 用 `links.json` 登记
- IDE 插件（未来可做）能根据 `links.json` 在文件顶部显示"相关 wiki"
- 命令行：`ai-team-docs links list | grep <keyword>`

## 实操：给 zugo-voice-room 这种已有项目加上 links 清单

```bash
cd /path/to/your-repo
npx -y github:leeguooooo/ai-team-docs links init
# 编辑 .ai-team-docs-links.json，把现有 wiki 节点逐个登记
npx -y github:leeguooooo/ai-team-docs links check
git add .ai-team-docs-links.json
git commit -m "docs: add wiki/repo link manifest"
```

之后每次：
- 新建 wiki 文档 → 在 links.json 加一条
- 大重命名 repo 文件 → `links check` 会立即报错提醒更新
- CI 跑 `links check` 防止腐烂

## 反模式

❌ **把 wiki 内容定时导回到 repo 当成"主文档"**
理由：wiki 端可以直接编辑，repo 是镜像；但实际工作中很多人会"顺手"在 repo 里改 markdown，PR 合并后被下次同步覆盖，工作丢失。

❌ **用 git 子模块或 LFS 存 wiki 导出**
理由：过度工程化。普通 commit 就够了。

❌ **试图让 PRD 同步到 repo 给工程师 git pull**
理由：PRD 是 PM 的可读文档，工程师**应该去 wiki 读**，让 PM 知道有人在看，建立反馈环。

❌ **CHANGELOG 在 repo 写一份，又在 wiki 手动写一份**
理由：必然漂移。要么单向推送，要么 wiki 直接链 repo CHANGELOG.md（更简单）。

## 演进路径

ai-team-docs 当前提供：
- ✅ links 清单管理（v0.2+）
- ✅ links check 校验

未来可加（社区贡献）：
- 🔄 `ai-team-docs snapshot --from-lark`（一键 wiki 镜像到 repo）
- 🔄 `ai-team-docs push <file> --to <wiki-id>`（一键单向推送）
- 🔄 IDE 插件：编辑 repo 文件时显示对应 wiki 链接
- 🔄 GitHub Action template：一键启用 wiki 镜像 / 同步
