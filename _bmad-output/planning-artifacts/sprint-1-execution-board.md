# Sprint 1 执行板（Day 1-10）

**项目：** episkey（AI Orchestration Runtime）  
**日期：** 2026-03-07  
**Sprint 目标：** 打通运行时内核最小闭环：`event model -> canonical_event_json -> event store/checksum -> stage FSM/guard`

## 执行约束（必须遵守）

1. 严格按顺序实现：`1 -> 2 -> 3 -> 4`，不得跳步。
2. CLI 保持薄层，不承载核心状态逻辑。
3. 每完成一层，必须补齐对应测试（unit + integration）。
4. 关键事件写入失败必须 hard-stop，不允许“业务成功但审计缺失”。

## Day 1

**目标：** 初始化工程骨架（oclif + TS + lint + test）  
**输出文件：**
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/commands/init.ts`
- `tests/unit/.gitkeep`

**每日验收清单：**
- [ ] 本地可执行 `ai-dev --help`
- [ ] TypeScript 编译通过
- [ ] lint/test 命令可运行

## Day 2

**目标：** 定义事件模型与 schema version  
**输出文件：**
- `src/schemas/event.schema.json`
- `src/schemas/schema-version.ts`
- `src/core/events/types.ts`

**每日验收清单：**
- [ ] 事件字段最小集合固定（含 `event_id/session_id/stage/event/ts/checksum`）
- [ ] `schema_version` 可解析并可校验
- [ ] 事件模型 unit test 通过

## Day 3

**目标：** 实现 `canonical_event_json`  
**输出文件：**
- `src/core/events/canonicalize.ts`
- `tests/unit/core/events/canonicalize.test.ts`

**每日验收清单：**
- [ ] key 排序稳定
- [ ] 时间和数字格式归一化
- [ ] 同输入多次 canonical 结果一致

## Day 4

**目标：** 实现 append-only event store + checksum chain  
**输出文件：**
- `src/core/events/event-writer.ts`
- `src/core/events/event-chain.ts`
- `tests/unit/core/events/event-chain.test.ts`

**每日验收清单：**
- [ ] append-only 语义成立
- [ ] checksum chain 可验证
- [ ] 首个损坏事件可被定位

## Day 5

**目标：** 实现 event reader 与最小查询  
**输出文件：**
- `src/core/events/event-reader.ts`
- `tests/unit/core/events/event-reader.test.ts`

**每日验收清单：**
- [ ] 支持按 `session_id`、时间范围读取
- [ ] 读取顺序稳定
- [ ] 异常输入返回结构化错误

## Day 6

**目标：** 实现 stage enum + transition map（单一真相源）  
**输出文件：**
- `src/core/stage/stage-machine.ts`
- `src/core/stage/stage-transition.ts`
- `tests/unit/core/stage/stage-transition.test.ts`

**每日验收清单：**
- [ ] 固定 7 个 stage
- [ ] 合法迁移矩阵可验证
- [ ] 非法迁移返回 `EVT_INVALID_STAGE_TRANSITION`

## Day 7

**目标：** 实现 guard engine（state/policy/integrity/lock）  
**输出文件：**
- `src/core/stage/stage-policy.ts`
- `src/core/gate/gate-policy.ts`
- `tests/unit/core/stage/guards.test.ts`

**每日验收清单：**
- [ ] guard 类型可区分
- [ ] guard_result 结构化输出
- [ ] 锁冲突 guard 可阻断迁移

## Day 8

**目标：** 打通 `init -> transition -> stage_transition event` 主链  
**输出文件：**
- `src/commands/next.ts`
- `src/cli/envelope.ts`
- `tests/integration/init-next-stage.test.ts`

**每日验收清单：**
- [ ] 主链可运行
- [ ] `stage_transition` 事件落盘
- [ ] `--json` envelope 稳定输出

## Day 9

**目标：** 故障注入测试  
**输出文件：**
- `tests/integration/stage-invalid-transition.test.ts`
- `tests/integration/checksum-corruption.test.ts`
- `tests/integration/workspace-lock-conflict.test.ts`

**每日验收清单：**
- [ ] 非法迁移 hard-stop
- [ ] checksum 损坏可检测并阻断
- [ ] 锁冲突返回可恢复动作

## Day 10

**目标：** Sprint 收口与准入评审  
**输出文件：**
- `README.md`（最小运行说明）
- `_bmad-output/planning-artifacts/sprint-1-dod.md`（可选）
- `_bmad-output/planning-artifacts/sprint-2-entry.md`（可选）

**每日验收清单：**
- [ ] 全量测试通过
- [ ] 风险与已知限制更新
- [ ] Sprint 2 入口条件确认

## Sprint 1 DoD（完成定义）

1. `event model/canonical/store/checksum/FSM/guard` 全部实现并测试通过。  
2. `init` 与基础迁移闭环可运行，关键事件可追溯。  
3. 非法迁移与一致性异常都能明确阻断并返回错误。  
4. `--json` 输出满足稳定契约（最小命令面）。  
5. 文档可支持下一 Sprint 无缝接续。

## Sprint 2 入口条件

1. Sprint 1 DoD 全满足。  
2. 测试稳定，无阻塞级 flake。  
3. 允许进入：`gate governance -> router/adapter -> replay -> snapshot -> observability`。
