# {表名}

> {一句话说明这张表的用途和定位}

## 表概览
- **表名**：`{full-table-name}`（生产）/ `{table-name-test}`（测试隔离方案下）
- **存储引擎**：DynamoDB / PostgreSQL / MySQL / ...
- **区域 / 集群**：
- **存储模式**：On-Demand / 预置容量 / ...
- **TTL**：（如有）
- **多租户状态**：✅ 已多租户 / 🔄 进行中 / ⏸ 单租户

## 主键设计

- **PK**：`{字段}`（含义）
- **SK**：`{字段}`（含义，如适用）

## 索引（GSI / 二级索引）

| 索引名 | PK | SK | 用途 | 频次 |
|--------|----|----|------|------|
|  |  |  |  | 高/中/低 |

**索引设计原则**：
- 用索引替代全表 Scan
- SK 优先用 `<分类>#<时间>` 格式
- 避免高基数字段作 SK 引发热分区

## 关键字段（按用途分组）

> 不复制完整 schema —— 完整字段定义见 `<repo path to model file>`。

- **标识**：
- **状态机**：
- **元数据**：
- **关联**：
- **审计**：createdAt / updatedAt / 其他

## 访问模式

| # | 模式 | 实现 | 频次 |
|---|------|------|------|
| 1 | (按 PK 直查) | GetItem | 高 |
| 2 | (按 X 列表) | Query GSI-N | 中 |
| 3 | (CRUD) |  | 中 |

完整方法签名：`<repo path to repository file>`

## 历史变更与已知问题

- YYYY-MM-DD：变更说明（链接对应 feature 文档或 ADR）
-

## 关联资源

- 代码：
  - `<repo>/internal/repository/...`
  - `<repo>/internal/models/...`
- 服务层：`<repo>/internal/service/...`
- API 契约：`<repo>/api/openapi.yaml` 中对应 schema
- 相关 ADR：ADR-NNN
- 相关 feature：features/[Done] xxx
