# [Done] 房间分类系统 v2.2

> 示例后端技术方案 —— 演示**链回 repo 而非复制 schema**、**对应 PRD 字段必填**的纪律。脱敏自真实项目。

## 元信息
- **状态**：[Done]
- **对应 PRD**：[example-prd-room-classification.md](example-prd-room-classification.md)
- **目标版本**：v2.2.0
- **完成日期**：2026-01-06（参考 release-notes/2.2.0.md 发布日期）
- **影响范围**：管理端 API + 客户端 API + DB schema + 前端列表/编辑 UI

## 1. 背景与目标

参见 [对应 PRD](example-prd-room-classification.md) 第 1 节。

后端目标：把房间表的 `isOfficial` / `roomOwnership` 等字段移除，改为 `isMysteryRoom` + `isExpertRoom` 两个独立 boolean，并相应更新管理端 / C 端接口与推荐 / 筛选逻辑。

## 2. 范围

- **新增字段**（rooms 表）：`isMysteryRoom`、`isExpertRoom`，均为 boolean，可独立组合（4 种状态）
- **彻底删除字段**（API 不再返回）：`isOfficial` / `roomOwnership` / `officialCount` / `personalCount`
- **管理端创建房间禁用**：相关接口保留但返回 `FEATURE_DISABLED`，统一由 C 端创建
- **涉及接口**：管理端 5 个、客户端 5 个，详见第 4 节

## 3. 方案概要

### 3.1 模型变化

| 维度 | 旧 | 新 |
|---|---|---|
| 字段 | `isOfficial: bool` | `isMysteryRoom: bool` + `isExpertRoom: bool` |
| 表达力 | 二选一 | 4 种组合 |
| 派生统计 | `officialCount` / `personalCount` | 不再维护派生计数 |

### 3.2 兼容性策略

- **服务端**：旧字段从 API 响应中**直接移除**，不保留兼容期
- **客户端**：所有现有房间默认 `false / false`
- **创建侧**：客户端创建默认普通房；管理端创建禁用

## 4. API 契约

详细 schema 与字段定义以 `api/openapi.yaml` 为准。下面只列出语义变更点。

### 管理端
- `POST /api/admin/voice-room/create` — **已禁用**，返回 `errCode=FEATURE_DISABLED`
- `POST /api/admin/voice-room/toggle-mystery` — **新增**
- `POST /api/admin/voice-room/toggle-expert` — **新增**
- `PUT /api/admin/voice-room/update` — **增强**，新增可选 `isMysteryRoom` / `isExpertRoom` 字段
- `POST /api/admin/voice-room/list` — **响应增强**，房间对象新增两个字段，移除旧字段

### 客户端
- `GET /api/voice-room/recommended` — **过滤**：自动排除特性为 true 的房间
- `GET /api/voice-room/more` — **新增筛选参数** `isMysteryRoom` / `isExpertRoom`
- `POST /api/voice-room/create` — 创建默认 `false / false`
- `GET /api/voice-room/list` / `detail` — 响应增强

## 5. 数据模型变化

- `rooms` 表新增字段：`isMysteryRoom (bool)`、`isExpertRoom (bool)`，默认值 `false`
- 删除字段（不再写入/读取）：`isOfficial` / `roomOwnership` / `officialCount` / `personalCount`
- **历史数据迁移**：源 PRD 未明确，但兼容性章节给出"现有房间默认 false"等价于读取时缺省视为 false
- **GSI 影响**：源材料未明确；客户端 `more` 接口的按特性筛选能力提示存在按这两个字段的查询路径

## 6. 风险与回滚

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 客户端未更新导致徽章错位 | 低 | 低 | 默认值兼容 |
| 推荐流过滤过严导致候选不足 | 低 | 中 | 监控候选池大小 |

**回滚方案**：本变更涉及移除字段，回滚需要 schema 还原 + 代码 revert。建议在低峰期上线。

## 7. 上线计划

- [x] Feature flag：无（直接切换）
- [x] 灰度策略：直接全量
- [x] 监控指标：推荐流候选池大小、`more` 筛选 QPS
- [x] 文档更新：术语表（移除 isOfficial 解释，加入新字段）
- [x] 通知：管理端运营人员

## 8. 验收标准

- [x] 推荐列表不再混入特殊房
- [x] "更多"列表三种筛选组合正确
- [x] 管理端 toggle 单独 / 组合操作正常
- [x] 旧字段从 API 完全移除
- [x] 兼容性：旧客户端不报错（仅类型徽章不显示）

## 9. 上线后回顾

> 源材料未明确记录。

## 10. 相关 repo 路径

- 关键代码（占位，请按你的项目实际路径替换）：
  - `internal/models/room.go` — 房间模型字段定义
  - `internal/repository/v3/room_repository_v3.go` — 多租户房间仓储（特性字段读写、筛选）
  - `internal/service/room_service_list.go` — 列表/`more` 筛选逻辑
- API 契约：`api/openapi.yaml`
- 上线版本：`docs/release-notes/2.2.0.md`
