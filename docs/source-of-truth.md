# Source of Truth 边界

> 文档治理最大的失败模式：**同一个事实在多处定义，且不知道哪个是真的**。

## 铁律

| 内容 | 真相在哪 | 文档里只放 |
|------|---------|-----------|
| OpenAPI / 接口契约 | repo `api/openapi.yaml` | 链接 + 业务说明 |
| DB schema 字段定义 | repo 代码（`internal/models/...`） | 业务含义、访问模式、迁移背景 |
| 错误码 | repo 代码（生成的常量）+ 中央 Worker | 命名约定、新增流程说明 |
| 部署脚本 / Makefile | repo `Makefile`、`scripts/`、`build.sh` | 操作流程说明 |
| 生成代码 | repo（生成的目录） | 不要复制，永远过期 |
| 配置常量 / 环境变量 | repo `.env.example` 或 README | 名字 + 用途，不复制默认值（漂移源）|
| **ADR / 架构决策** | **wiki ADR Log** | 主战场 |
| **PRD / 需求背景** | **wiki PRD Hub** | 主战场 |
| **故障复盘** | **wiki ops/故障复盘** | 主战场 |
| **业务规则 / 状态机** | **wiki PRD + features 文档** | 主战场 |

## 为什么这么分

### 写在 repo 才对的内容
- **可被代码引用**：OpenAPI yaml 直接生成 server/client，schema 改了代码自然失败
- **CI 强制一致**：错误码生成 / 类型生成被 CI 验证，不可能漂移
- **PR review 自然覆盖**：改字段必走 review

### 写在 wiki 才对的内容
- **决策上下文**：为什么选 A 不选 B，代码看不出来
- **跨团队可读**：PM / 运营 / QA 不读代码
- **历史档案**：废弃方案、上线复盘、迁移过程

### 灰色地带

某些内容看似中间地带，但其实有清晰归属：

| 内容 | 看起来 | 实际 |
|------|-------|------|
| 数据模型表的 GSI 设计 | 像代码 | 是**决策**——属于 wiki tables/ + ADR Log |
| 接口的请求 / 响应 schema | 像 wiki | 是**契约**——属于 repo openapi.yaml |
| 重构计划 / Migration 步骤 | 像运维脚本 | 是**计划**——属于 wiki features/，脚本本身在 repo |

## 检验方法：3 个问题

放新内容前问自己：

### Q1：这个事实改一次，需不需要改代码？
- **是** → 真相在 repo，wiki 链回去
- **否** → 真相在 wiki

### Q2：这个内容半年后还有人需要看吗？
- **是** → wiki（决策、复盘、教训）
- **否** → 临时性的，PR 描述 / git 提交信息就够了

### Q3：这个内容是不是只有特定时刻有效（如灰度方案、迁移步骤）？
- **是** → wiki feature 文档里写，并标记上线日期
- **持续有效** → wiki reference 或 repo

## 链接的纪律

wiki 涉及具体接口 / 字段时，**必须链接 repo 路径**，不复制片段：

✅ 好：
```markdown
新增 endpoint：
- POST /api/lucky-game/order/create

详细 schema 见 `api/openapi.yaml` 中对应 path。
```

❌ 差：
```markdown
新增 endpoint：
- POST /api/lucky-game/order/create
- 请求：{ orderId: string, amount: int, ... 30 个字段 }
- 响应：{ ... }
```

理由：复制的字段会过期，链接的字段永远新鲜。

## ADR：在哪写

ADR 是 wiki 的"主战场"，但也有例外：

| 情况 | 写哪 |
|------|------|
| 普通架构决策 | wiki ADR Log |
| 决策小、PR 描述可承载 | git commit message + PR description |
| 影响代码组织、需要团队对齐 | wiki ADR Log |
| 与具体实现深度耦合（如 "这个文件为什么这么拆"）| 代码注释（顶级）|

## 真实场景

### 场景 1：新增数据库字段
- repo 改 `internal/models/user.go` 添加字段——**真相**
- repo 改 `api/openapi.yaml` 同步——**契约**
- wiki `reference/tables/users-v3` 更新一句"新增字段，详见 model"——**业务说明**
- wiki feature 文档"为什么加这个字段"——**决策**

不复制完整 schema 到 wiki。

### 场景 2：废弃旧 API
- repo 改 OpenAPI 标记 `deprecated: true`
- wiki feature 文档新建 `[Deprecated] xxx 旧 API`，写废弃原因 + 迁移建议
- ADR Log 加一条记录决策

不要在 wiki "API 总览" 里改字段——那是真相的镜像，会自动跟随。

### 场景 3：故障复盘
- 复盘内容**全部在 wiki ops/故障复盘**
- 修复 commit 在 repo
- 如果引出架构决策，在 ADR Log 加一条，链回复盘

复盘不写在 feature 文档下面。复盘有自己的时间线。

## 进一步阅读

- [methodology.md](methodology.md) — 总览
- [why-ai-friendly.md](why-ai-friendly.md) — 为什么扁平结构
- [cross-team-linking.md](cross-team-linking.md) — 跨端协作链接规则
