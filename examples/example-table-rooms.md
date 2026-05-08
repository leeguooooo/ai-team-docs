# rooms

> 示例表设计 —— 演示**链回 repo 而非复制完整 schema** 的纪律。脱敏自真实项目。

## 表概览
- **表名**：`rooms-v2`（生产）/ `rooms-v2-test`（测试隔离方案）
- **存储引擎**：DynamoDB
- **区域 / 集群**：ap-southeast-1
- **存储模式**：On-Demand（PAY_PER_REQUEST）
- **TTL**：`ttl` 字段（int64，按需启用，用于历史房间自动清理）
- **多租户状态**：🔄 进行中。新数据写入 `ROOM#{kolUserId}#{roomId}`；旧数据形如 `ROOM#{roomId}`，需通过迁移脚本处理

## 主键设计

- **PK**：v3 写入 `ROOM#{kolUserId}#{roomId}`；旧记录残留 `ROOM#{roomId}`
- **SK**：`METADATA`（房间元数据）/ `USER#{userId}`（房间内用户关系，部分历史路径）/ `LOCK`（用户活跃房间锁）

## 索引

| GSI 名称 | PK | SK | 用途 |
|---------|----|----|------|
| RoomNoIndex | roomNo | - | 通过 8 位公开号反查房间 |
| KolUserIdIndex | kolUserId | roomId | 按租户列出房间（多租户列表主路径） |

## 关键字段（按用途分组）

> 不在此处复制完整 schema —— 完整字段定义见 `internal/models/room.go` 中的 `Room` struct。

- **标识**：`roomId`（内部 `room_<UnixNano>`）、`roomNo`（公开 8 位号）、`kolUserId`、`creatorUserId`
- **状态机**：`status`（normal/disabled/deleted）、`createdAt`、`updatedAt`、`statusUpdatedAt`、`ttl`
- **元数据**：`roomName`、`roomType`、`roomCategory`、`roomNotice`、`description`、`language`
- **分类标志位**（v2.2，详见 [example-tech-spec-room-classification.md](example-tech-spec-room-classification.md)）：`isMysteryRoom`、`isExpertRoom`、`isCarouselRoom`
- **运营**：`tagIds[]`、`badgeIds[]`、`displayOrder`、`roomIcon`、`roomBackground`
- **进入门槛**：`entryThreshold`（结构化字段，含 type/passwordHash/minLevel/fansOnly）
- **权限**：`micPermission`、`messagePermission`
- **统计**：`currentUsers`（来自外部同步）、`maxUsers`、`seatCount`、`mode`
- **活跃度**：`joinLeaveCount`、`totalParticipants`、`uniqueParticipants[]`

## 访问模式

| # | 模式 | 实现 | 频次 |
|---|------|------|------|
| 1 | 按 PK 直查（roomId 已知）| GetItem | 高 |
| 2 | 按 roomNo 反查 roomId | Query GSI RoomNoIndex | 高 |
| 3 | 租户房间列表 | Query GSI KolUserIdIndex | 高 |
| 4 | 推荐列表（按状态 + 内存排序） | ListRoomsByStatusAndTenant Scan + filter | 中 |
| 5 | More 列表（按特性筛选） | Scan + kolUserId filter | 中 |
| 6 | 状态变更 / 关闭 | UpdateItem（带 attribute_exists(pk) 防误写）| 中 |
| 7 | 单用户单房间锁 | TransactWriteItems（房间记录 + USER_ACTIVE 锁） | 写入时 |

完整方法签名：`internal/repository/v3/room_repository_v3.go`

## 单用户单房间锁（特殊设计）

- 锁定项与房间元数据**同表共存**：PK = `USER_ACTIVE#{kolUserId}#{userId}`，SK = `LOCK`
- 创建/释放与房间记录在 **同一事务**（TransactWriteItems）写入，避免双写一致性问题
- 详见 [example-adr-multi-tenant-pk.md](example-adr-multi-tenant-pk.md)（同一组多租户决策）

## 历史变更与已知问题

- 早期表内混杂 `BADGE#` / `TAG#` / `USER#` 项，迁移前需要清理脚本
- 房间数据结构曾不统一（Room / RoomWithOwner / FavoriteItem），统一计划已落地
- 数据隔离热修：列表接口此前未按 `kolUserId` 过滤，存在跨租户数据泄漏，已通过添加 `ListRoomsByStatusAndTenant` 修复

## 关联资源

- 代码：`internal/repository/v3/room_repository_v3.go`、`internal/models/room.go`
- 设计：`docs/data-design/房间统一设计.md`
- 相关 ADR：[example-adr-multi-tenant-pk.md](example-adr-multi-tenant-pk.md)
- 相关 feature：[example-tech-spec-room-classification.md](example-tech-spec-room-classification.md)
