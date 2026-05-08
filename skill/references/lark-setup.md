# Lark / 飞书 Wiki 自动化建立

> 使用 `lark-cli`（[GitHub](https://github.com/larksuite/cli)）在飞书 / Lark Wiki 中自动建立 PRD Hub + 实现方案 wiki，并写入模板。

## 前置条件

```bash
# 安装 lark-cli
npm i -g @larksuite/cli

# 配置应用 + 登录
lark-cli config init
lark-cli auth login
```

需要的 OAuth scopes（按需开通）：
- `wiki:space:write_only` — 创建知识空间
- `wiki:wiki` — 知识空间访问
- `wiki:node:create` — 创建节点
- `wiki:node:move` — 跨空间移动节点（如需迁移）

## 自动化流程

### Step 1：建 PRD Hub 空间

```bash
lark-cli wiki spaces create --as user --yes --data '{
  "name": "产品需求库 (PRD Hub)",
  "description": "跨端产品需求文档库",
  "open_sharing": "closed"
}'
```

返回 `space_id`，记下来。

### Step 2：在 PRD Hub 内建初始结构

```bash
SPACE_ID="<step1 returned>"

# README
lark-cli wiki +node-create --space-id $SPACE_ID --title "README - PRD 库使用指南"
# → 拿到 obj_token，下面写入内容

# _PRD 模板
lark-cli wiki +node-create --space-id $SPACE_ID --title "_PRD 模板"
```

把 ai-team-docs 的模板写入：

```bash
# 假设拿到 obj_token = README_OBJ_TOKEN
README_CONTENT=$(npx ai-team-docs show readme-prd-hub)
lark-cli docs +update --doc $README_OBJ_TOKEN --mode overwrite --markdown "$README_CONTENT"

# _PRD 模板
PRD_CONTENT=$(npx ai-team-docs show prd)
lark-cli docs +update --doc $PRD_TEMPLATE_OBJ_TOKEN --mode overwrite --markdown "$PRD_CONTENT"
```

### Step 3：建实现方案 wiki 空间（按端创建）

```bash
# 后端
lark-cli wiki spaces create --as user --yes --data '{
  "name": "<项目名> 后端实现方案",
  "open_sharing": "closed"
}'
# 类似的，前端、iOS、Android 各建一个
```

### Step 4：在实现方案 wiki 内建目录结构

```bash
IMPL_SPACE_ID="<step3 returned>"

# 一级节点
lark-cli wiki +node-create --space-id $IMPL_SPACE_ID --title "README - 项目索引与协作规则"
lark-cli wiki +node-create --space-id $IMPL_SPACE_ID --title "features"
lark-cli wiki +node-create --space-id $IMPL_SPACE_ID --title "reference"
lark-cli wiki +node-create --space-id $IMPL_SPACE_ID --title "ops"

# features 下
FEATURES_TOKEN="<上一步 features 节点的 node_token>"
lark-cli wiki +node-create --parent-node-token $FEATURES_TOKEN --title "_模板：技术方案"

# reference 下
REFERENCE_TOKEN="<reference node_token>"
for title in "术语表" "架构总览" "ADR Log" "API 总览" "数据模型索引"; do
  lark-cli wiki +node-create --parent-node-token $REFERENCE_TOKEN --title "$title"
done

# reference/tables 下
TABLES_TOKEN="<新建一个 tables 节点>"
# (按业务表名分别建)

# ops 下
OPS_TOKEN="<ops node_token>"
for title in "环境与部署" "Dashboard & Runbook 链接" "发布记录" "故障复盘"; do
  lark-cli wiki +node-create --parent-node-token $OPS_TOKEN --title "$title"
done
```

### Step 5：写入模板内容

每个节点用 `lark-cli docs +update` 写入对应模板内容：

```bash
# 各端实现方案 README
lark-cli docs +update --doc $README_OBJ_TOKEN --mode overwrite --markdown "$(npx ai-team-docs show readme-impl)"

# 技术方案模板
lark-cli docs +update --doc $TECHSPEC_TPL_OBJ_TOKEN --mode overwrite --markdown "$(npx ai-team-docs show tech-spec)"

# 架构总览
lark-cli docs +update --doc $ARCH_OBJ_TOKEN --mode overwrite --markdown "$(npx ai-team-docs show architecture)"

# ADR Log
lark-cli docs +update --doc $ADR_OBJ_TOKEN --mode overwrite --markdown "$(npx ai-team-docs show adr)"

# 术语表
lark-cli docs +update --doc $GLOSSARY_OBJ_TOKEN --mode overwrite --markdown "$(npx ai-team-docs show glossary)"
```

## 关键注意事项

### URL 域名

- 不同租户的 Lark 域名不同（如 `portwind.jp.larksuite.com`、`xxx.feishu.cn`）
- 跨空间链接用**完整 URL**，不要用相对路径
- 用户的 Lark 默认域名可从 wiki UI 顶部地址栏取得

### 跨空间双向链接

每个实现方案文档创建时，**手动**在文档头部加：
```markdown
## 元信息
- **对应 PRD**：[<PRD 标题>](<PRD URL>)
- ...
```

PRD 文档创建时，在"实现追踪"表里贴上各端文档 URL。

### 节点 token vs obj token

- `node_token`（wiki 节点 token）：用于 `wiki +move`、`wiki +node-create --parent-node-token`
- `obj_token`（底层文档 token）：用于 `docs +update --doc`、`docs +fetch`
- 创建节点后两个值都返回，分别记下来

### 跨空间移动

如果需要把已有节点搬到新空间（例如从共享 sandbox 搬出来）：
```bash
lark-cli wiki +move --node-token <NODE_TOKEN> --target-space-id <NEW_SPACE_ID>
```
注意：移动后 `node_token` 通常保持不变（实测），跨空间链接稳定。但实际效果以飞书 API 行为为准。

## 错误处理

| 错误 | 原因 | 解决 |
|------|------|------|
| `permission_violations: wiki:space:write_only` | scope 未授权 | `lark-cli auth login --scope "wiki:space:write_only"` |
| `permissions are already under review` | scope 待管理员审批 | 等审批，或让用户先用其他方式（手动创建空间） |
| `Permission denied [99991679]` | 应用 scope 未配置 | 飞书开发者后台开通应用权限 |

## 快速脚本（一次性 setup 整个结构）

可以包装成 shell 脚本：
```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${1:-MyProject}"

# 1. 建空间
PRD_SPACE=$(lark-cli wiki spaces create --as user --yes --data "{\"name\":\"产品需求库 (PRD Hub)\"}" | jq -r '.data.space.space_id')
IMPL_SPACE=$(lark-cli wiki spaces create --as user --yes --data "{\"name\":\"$PROJECT_NAME 实现方案\"}" | jq -r '.data.space.space_id')

# 2. PRD Hub 节点 + 写入
PRD_README=$(lark-cli wiki +node-create --space-id "$PRD_SPACE" --title "README - PRD 库使用指南" | jq -r '.data.obj_token')
lark-cli docs +update --doc "$PRD_README" --mode overwrite --markdown "$(npx ai-team-docs show readme-prd-hub)"
# ... 其余节点

echo "PRD Hub: https://your-domain.larksuite.com/wiki/<root>"
echo "Impl wiki: https://your-domain.larksuite.com/wiki/<root>"
```

可以推动 ai-team-docs 项目把这个脚本加到 CLI 里：`npx ai-team-docs lark-init`。
