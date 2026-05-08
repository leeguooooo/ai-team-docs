# Examples

> 用真实场景演示 ai-team-docs 模板填出来长什么样。**全部是脱敏后的真实案例**——基于一个语音房后端项目治理实践。

## 目录

| 文件 | 类型 | 说明 |
|------|------|------|
| [example-prd-room-classification.md](example-prd-room-classification.md) | PRD | 一个完整 PRD 示例：把"官方房二元标识"改造为"可组合特性标志位" |
| [example-tech-spec-room-classification.md](example-tech-spec-room-classification.md) | 技术方案 | 上述 PRD 的后端实现方案，演示**双向链接**（"对应 PRD" 字段） |
| [example-adr-multi-tenant-pk.md](example-adr-multi-tenant-pk.md) | ADR | 多租户主键设计的 ADR 条目 |
| [example-table-rooms.md](example-table-rooms.md) | 表设计 | rooms 表的设计文档，演示**链回 repo 而非复制 schema**的纪律 |

## 怎么用这些 examples

- 当你不知道某个模板该怎么填，先翻这里的对应 example
- example 全部用了我们文档里强调的"链回 repo"模式，而不是堆砌长 schema 表
- 每个 example 顶部 metadata 区有"对应 PRD" / "实现追踪"等字段，演示双向链接

## 真实开源参照

ai-team-docs 这套规范本身脱胎于一个真实的语音房后端项目治理实践（2026-05），完整的 wiki 结构（PRD Hub + 后端实现方案）和这套模板的反复打磨发生在那里。本仓库的 examples 是把那次实战的关键文档**脱敏 + 简化**后呈现。

如果你的团队规模 / 复杂度类似（10-50 个 feature、3+ 个端协作、AI Agent 深度参与），这些 examples 应该能直接借鉴。如果团队是 1-2 人项目，参考 [docs/methodology.md "小团队豁免"](../docs/methodology.md) 段落选简化版。

## 想贡献新的 example

欢迎 PR：
- 不同领域的 PRD（移动 App、数据团队、设计团队等）
- 不同规模团队的实践（1 人独立开发者 vs 50 人小公司）
- 失败案例 + 教训（比 success story 更稀缺）

每个 example 必须：
- 真实脱敏，不要凭空捏造
- 不超过 300 行（保持示范性，不堆砌细节）
- 顶部 metadata 完整，演示元信息字段的填法
