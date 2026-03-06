---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/analysis/brainstorming-session-2026-03-06.md
  - AI_DEV_SYSTEM.md
  - bmad-fullstack-guide.html
  - claude-code-codex-workflow.md
  - guide-cn.html
  - guide-updev-cn.html
workflowType: 'architecture'
lastStep: 8
status: 'complete'
project_name: 'episkey'
user_name: 'Episkey'
date: '2026-03-06T18:47:47+0800'
completedAt: '2026-03-06T19:25:15+0800'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
该项目的功能需求围绕“可编排、可治理、可恢复”的 AI 开发运行时展开，覆盖 8 个能力域：
- Onboarding & Workspace：本地安装初始化、项目级配置与工作区管理；
- Stage Orchestration：按阶段推进、合法迁移校验与迁移留痕；
- Human Gates：approve/reject/other 三态决策与升级路径；
- Context Management：Context Packet 生成、执行前可见、跨 Agent 连续；
- Agent Routing & Handoff：默认 Agent、路由策略、显式 handoff 与结果回写；
- Recovery & Replay：一致性校验、失败 hard-stop、恢复后继续推进；
- Decision Log & Traceability：按阶段/结果检索、导出复盘、关键事件强制记录；
- Developer Adoption：Day-1 快速上手、迁移引导、受限连接器配置。

从架构角度看，功能重点不是“更多命令”，而是“状态机 + 决策治理 + 上下文连续 + 可恢复”。

**Non-Functional Requirements:**
NFR 对架构约束非常明确：
- 性能：Gate p95 <= 2s，next p95 <= 5s，init <= 60s；
- 可靠性：resume >= 95%，日志完整率 >= 99%，恢复前强制一致性校验；
- 数据与安全：Context Vault 默认本地、云同步 opt-in、Event Log append-only + checksum；
- 可扩展：MVP 单用户本地负载下每日 10-30 次跨 Agent 切换稳定；
- 集成：Claude + Codex 首发稳定可用，失败必须返回明确恢复路径。

这些 NFR 直接决定需要事件溯源风格的状态管理与严格错误边界。

**Scale & Complexity:**
项目属于“单用户本地优先的高治理运行时”，虽然部署形态轻（CLI-only），但一致性与可恢复要求高，复杂度不低。

- Primary domain: CLI orchestration runtime / developer tooling backend
- Complexity level: High
- Estimated architectural components: 8-10（Stage Engine, Gate Engine, Decision Log, Context Vault, Context Packet, Routing Layer, Recovery/Replay Engine, CLI Command Layer, Policy Config, Observability hooks）

### Technical Constraints & Dependencies

- Local-first 是硬约束：默认本地存储，不默认上传；
- 事件存储采用 append-only JSONL，并要求 checksum 校验；
- 恢复流程必须“先校验再继续”，校验失败 hard-stop；
- MVP 集成面聚焦 Claude（默认执行）+ Codex（深度分析）；
- Day-1 可用性要求高（30 分钟内完成首次可用流程）；

### Cross-Cutting Concerns Identified

- 状态一致性：阶段迁移、快照、事件序列的一致性维护；
- 可追溯性：Gate 证据链、关键事件留痕、可检索导出；
- 恢复性：deterministic replay、错误态显式化、恢复路径标准化；
- 路由治理：多 Agent 角色分工、触发条件、失败回退；
- 数据边界：本地优先、最小同步、数据完整性校验；
- 运营可观测：核心命令延迟、恢复成功率、日志完整率指标闭环。

## Starter Template Evaluation

### Primary Technology Domain

CLI Tool / Local Orchestration Runtime（基于项目需求中的 Stage Engine、Gate、Event Log、Resume/Replay）

### Starter Options Considered

1. oclif（推荐）
- 官方定位：Node.js/TypeScript CLI 框架，支持多命令与插件化扩展。
- 官方生成与初始化命令清晰（`oclif generate` / `oclif init`）。
- 对 AI-DEV 这种“多命令 + 可扩展 + 治理型 CLI”匹配度最高。

2. Commander.js（备选）
- 轻量、成熟、活跃维护。
- 主要是命令解析库，不提供完整工程脚手架与目录约束，需要自行搭建整体架构骨架。

3. Clipanion（备选）
- 类型友好、无运行时依赖。
- 更偏基础库而非完整 starter，初始化工程规范和命令组织需要自建。

### Selected Starter: oclif

**Rationale for Selection:**
- 与 PRD 的多命令编排形态天然契合（`init/next/approve/reject/other/replay/resume/handoff`）；
- 可快速建立统一命令结构与扩展机制，降低早期工程分歧；
- 对后续连接器插件化（Claude/Codex 及扩展）更友好；
- 官方文档与生成流程稳定，维护活跃（`@oclif/core` v4 系列）。

**Initialization Command:**

```bash
npm install --global oclif
oclif generate ai-dev-runtime
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Node.js + TypeScript CLI 基线，符合长期维护的 LTS 路径。

**Styling Solution:**
- N/A（CLI 文本交互为主）。

**Build Tooling:**
- 提供 `bin/dev.js` 与 `bin/run.js` 运行入口。
- 生成标准化 CLI 目录结构，便于后续命令扩展和打包发布。

**Testing Framework:**
- 可直接接入 `@oclif/test` 做命令级验证（适合 Gate/Resume/Replay 关键路径）。

**Code Organization:**
- 命令驱动结构（`src/commands/**`）与统一 CLI 配置约定，便于分阶段映射为命令主题。

**Development Experience:**
- 通过 `oclif generate command` 快速扩展功能命令。
- 帮助输出、参数解析、命令组织具备成熟默认能力。

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Runtime 基线：Node.js 24 LTS + TypeScript 5.9 + oclif/@oclif/core 4.5.2
2. 状态数据架构：append-only JSONL + stage snapshot + deterministic replay
3. Gate 治理模型：approve/reject/other + 升级链 + 恢复前 hard-stop 校验
4. 错误边界：稳定错误码 + 明确恢复路径

**Important Decisions (Shape Architecture):**
1. 配置与数据校验：AJV（配置）+ Zod（运行时 Context Packet）
2. CLI API：命令主题化 + `--json` 机器可读输出
3. Connector 适配层：Claude 默认执行、Codex 深度分析
4. 可观测性：结构化事件与命令耗时指标

**Deferred Decisions (Post-MVP):**
1. 多用户认证与 RBAC
2. 默认云同步
3. Web 控制面与远程编排

### Data Architecture

- `.ai-dev/events/events.jsonl`（append-only）
- `.ai-dev/snapshots/state.json`（阶段快照）
- `.ai-dev/context/context-*.json`（上下文包）
- 事件最小字段：
  `ts, session_id, stage, event, actor, decision, reason, context_ref, metadata, checksum`
- `schemaVersion + upcaster` 做版本兼容
- MVP 不引入外部缓存，优先一致性与恢复正确性

### FSM State Model (MVP)

- 合法状态集固定为 7 个：`IDLE`、`RESEARCH`、`PLAN`、`IMPLEMENT`、`REVIEW`、`EXECUTE`、`RECOVER`。
- 状态迁移必须显式验证；未列入矩阵的迁移一律视为非法跳转并返回 `EVT_INVALID_STAGE_TRANSITION`。

| From | To | Guard / Trigger |
|---|---|---|
| `IDLE` | `RESEARCH` | `ai-dev init` 后进入首个会话 |
| `RESEARCH` | `PLAN` | 完成需求收敛，触发 `prd_freeze` Gate |
| `PLAN` | `IMPLEMENT` | 方案确认，触发 `architecture_freeze` Gate |
| `IMPLEMENT` | `REVIEW` | 实现完成，触发 `high_complexity` Gate（按复杂度策略） |
| `REVIEW` | `EXECUTE` | 审查通过，触发 `release` Gate |
| `REVIEW` | `IMPLEMENT` | 审查未通过，返回实现修复 |
| `EXECUTE` | `IDLE` | 本轮目标完成并归档 |
| `EXECUTE` | `RECOVER` | 执行中断或一致性异常 |
| `RECOVER` | `IMPLEMENT` | 恢复成功，触发 `fix_loop` Gate 并回到修复阶段 |
| `RECOVER` | `REVIEW` | 恢复后可直接进入复审（受策略控制） |
| `RECOVER` | `IDLE` | 任务终止或人工关闭 |

### Default Gate Policy (MVP Zero-Config)

MVP 默认启用 5 个 Gate，`ai-dev init` 自动写入默认策略；用户可通过 `.ai-dev/config.yaml` 覆盖。

| Gate | Default Trigger | Default Purpose |
|---|---|---|
| `prd_freeze` | `RESEARCH -> PLAN` | 冻结需求边界，避免实现期范围漂移 |
| `architecture_freeze` | `PLAN -> IMPLEMENT` | 冻结关键技术决策与约束 |
| `high_complexity` | `IMPLEMENT -> REVIEW`（复杂任务） | 对高复杂度变更增加人工校验 |
| `release` | `REVIEW -> EXECUTE` | 发布前最终决策与证据留痕 |
| `fix_loop` | `RECOVER -> IMPLEMENT` | 故障恢复后限制无限修复循环 |

### Authentication & Security

- MVP 单用户本地模式，不引入独立登录系统
- 无 RBAC（MVP），治理由 Gate 机制承担
- Event Log append-only + checksum
- `resume` 前强制一致性校验，失败 hard-stop
- 默认不启用静态加密（与 PRD 对齐），保留扩展位

### API & Communication Patterns

- CLI 命令面：`init/next/approve/reject/other/replay/resume/handoff`
- 输出标准：human-readable + `--json` machine contract
- 分层错误码：`CFG_*`, `EVT_*`, `RESUME_*`, `LOCK_*`, `CONNECTOR_*`
- 连接器通信：统一 adapter contract + context handoff envelope

### Frontend Architecture

- MVP 无前端控制面（CLI-only）

### Infrastructure & Deployment

- 分发：npm 全局安装优先，Homebrew 次级
- CI：Node 24 LTS 主验证，Node Current 兼容验证
- 配置优先级：CLI flags > ENV vars > `.ai-dev/config.yaml`
- 关键路径指标：`next/gate/resume`

### Failure Mode Hardening (Advanced Elicitation)

- Checksum chain：
  `hash = sha256(prev_checksum + canonical_event_json)`
- 校验规范必须固定：
  UTF-8、确定性 key 排序、统一 timestamp/number 格式
- Snapshot 锚点：
  `last_event_id + last_event_checksum`，恢复时必须一致
- Context 合约：
  `schemaVersion + Zod`，不兼容直接拒绝并给出可恢复错误
- Gate 收敛：
  `reject/other` 轮次上限，超限强制升级+人工决策点
- Connector 两阶段事件：
  `agent_intent -> agent_result`
  失败：`agent_intent -> agent_compensation`
- 补偿幂等：
  `intent_id` 作为幂等键，result/compensation 必须关联同一 intent
- Workspace 锁：
  `.ai-dev/.lock` 文件锁（`O_CREAT|O_EXCL`）
  锁元数据含 `pid/host/started_at`，支持 stale-lock 安全接管
- Replay 策略：
  checkpoint 分段回放 + upcaster 兼容测试

### Critical Perspective Stress Test (Advanced Elicitation)

- Canonicalization contract is mandatory for checksum stability:
  UTF-8 encoding, deterministic key ordering, normalized timestamp and number formats.
- Lock robustness requires stale-lock recovery:
  lock metadata includes pid/host/started_at and supports safe takeover rules.
- Connector compensation must be idempotent:
  `intent_id` is the idempotency key linking `agent_intent`, `agent_result`, `agent_compensation`.
- Replay must support checkpoint-based recovery:
  segment replay by snapshot anchors plus schema upcaster compatibility tests.
- Recoverability requires stable machine-readable error taxonomy:
  `CFG_*`, `EVT_*`, `RESUME_*`, `LOCK_*`, `CONNECTOR_*` with mapped remediation paths.

### Operational Safety Model

- Event Store：checksum chain + append-only
- Resume Engine：snapshot anchor verification
- Gate Engine：bounded loops + escalation
- Router/Connector：two-phase protocol + idempotent compensation
- CLI Runtime：filesystem lock + 冲突错误可重试

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
16 个高风险冲突点（命名、文件组织、事件格式、错误语义、并发锁、恢复流程）

### Naming Patterns

**Database Naming Conventions:**
- 文件型存储路径使用小写 kebab/snake，不使用驼峰目录名
- 事件字段统一 `snake_case`
- 示例：`session_id`, `context_ref`, `last_event_checksum`

**API/CLI Naming Conventions:**
- CLI 命令使用 kebab-case（如 `ai-dev resume`、`ai-dev handoff`）
- CLI 参数使用 kebab-case（如 `--session-id`）
- JSON 输出字段使用 `snake_case`，不混用 `camelCase`

**Code Naming Conventions:**
- TypeScript 类型/类：PascalCase
- 变量/函数：camelCase
- 文件名：kebab-case（`resume-engine.ts`, `gate-policy.ts`）
- 常量：UPPER_SNAKE_CASE

### Structure Patterns

**Project Organization:**
- `src/commands/**`：所有 oclif 命令入口
- `src/core/**`：Stage/Gate/Replay/Resume 核心引擎
- `src/adapters/**`：Claude/Codex connector 适配层
- `src/schemas/**`：AJV/Zod schema 与版本转换
- `src/lib/**`：纯工具函数（无业务状态）

**File Structure Patterns:**
- `.ai-dev/events/events.jsonl`
- `.ai-dev/snapshots/state.json`
- `.ai-dev/context/context-*.json`
- `.ai-dev/.lock`（工作区锁）
- 测试目录固定：`tests/unit`, `tests/integration`, `tests/e2e`

### Format Patterns

**API Response Formats (`--json`):**
- 统一 envelope：
  - 成功：`{ "ok": true, "data": ..., "meta": ... }`
  - 失败：`{ "ok": false, "error": { "code": "...", "message": "...", "details": ... }, "meta": ... }`

**Data Exchange Formats:**
- 时间统一 ISO-8601 UTC（`YYYY-MM-DDTHH:mm:ss.sssZ`）
- 事件字段固定顺序用于 canonicalization（参与 checksum 计算）
- `null` 显式保留，不用空字符串替代

### Communication Patterns

**Event System Patterns:**
- 事件名统一 `snake_case`
- connector 两阶段标准：
  - 成功：`agent_intent -> agent_result`
  - 失败：`agent_intent -> agent_compensation`
- 每个 result/compensation 必须引用同一 `intent_id`
- 所有事件包含 `schema_version`

**State Management Patterns:**
- 状态更新只允许通过“事件追加 + 快照重建”，禁止直接改历史
- `resume` 前必须执行 preflight：
  1. checksum chain 验证
  2. snapshot anchor 验证
  3. schema/upcaster 兼容验证

### Process Patterns

**Error Handling Patterns:**
- 错误码族固定：`CFG_*`, `EVT_*`, `RESUME_*`, `LOCK_*`, `CONNECTOR_*`
- 所有错误必须带“可恢复动作”提示（retry / fallback / reroute / stop）
- 用户可见错误与内部日志分层

**Loading/Execution State Patterns:**
- 命令生命周期统一：`pending -> running -> succeeded|failed`
- 锁冲突返回可重试错误，不静默等待无限阻塞
- stale lock 采用 `pid/host/started_at` 规则安全接管

### Enforcement Guidelines

**All AI Agents MUST:**
- 严格使用既定命名与目录规则，不新增平行风格
- 所有事件写入前做 schema 校验，写入后做 checksum 链校验
- 所有跨 Agent handoff 必须经过 Context Packet 版本与结构验证

**Pattern Enforcement:**
- CI 检查：schema validation + event fixture replay + lint 命名规则
- 违反规则时写入 `pattern_violation` 事件并阻断关键命令
- 规则变更通过 ADR 记录，不接受隐式改动

### Pattern Examples

**Good Examples:**
- `agent_intent` 事件后仅允许 `agent_result` 或 `agent_compensation`
- `--json` 错误统一返回 `error.code` 可机读
- `resume` 在 `last_event_checksum` 不匹配时立即 hard-stop

**Anti-Patterns:**
- 同时混用 `camelCase` 与 `snake_case` JSON 字段
- 直接覆盖 `events.jsonl` 历史记录
- 用内存 mutex 代替文件锁处理多进程 CLI 并发

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
ai-dev-runtime/
├── README.md
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── .gitignore
├── .npmrc
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── docs/
│   ├── architecture.md
│   ├── adr/
│   │   ├── ADR-001-event-model.md
│   │   ├── ADR-002-gate-policy.md
│   │   └── ADR-003-resume-replay.md
│   └── contracts/
│       ├── cli-json-envelope.md
│       └── connector-adapter.md
├── bin/
│   ├── dev.js
│   └── run.js
├── src/
│   ├── index.ts
│   ├── commands/
│   │   ├── init.ts
│   │   ├── next.ts
│   │   ├── approve.ts
│   │   ├── reject.ts
│   │   ├── other.ts
│   │   ├── replay.ts
│   │   ├── resume.ts
│   │   └── handoff.ts
│   ├── core/
│   │   ├── stage/
│   │   │   ├── stage-machine.ts
│   │   │   ├── stage-policy.ts
│   │   │   └── stage-transition.ts
│   │   ├── gate/
│   │   │   ├── gate-engine.ts
│   │   │   ├── gate-policy.ts
│   │   │   └── escalation-policy.ts
│   │   ├── events/
│   │   │   ├── event-writer.ts
│   │   │   ├── event-reader.ts
│   │   │   ├── event-chain.ts
│   │   │   └── canonicalize.ts
│   │   ├── replay/
│   │   │   ├── replay-engine.ts
│   │   │   └── upcaster.ts
│   │   ├── resume/
│   │   │   ├── resume-engine.ts
│   │   │   └── preflight-check.ts
│   │   └── lock/
│   │       ├── workspace-lock.ts
│   │       └── stale-lock-policy.ts
│   ├── adapters/
│   │   ├── types.ts
│   │   ├── claude-adapter.ts
│   │   ├── codex-adapter.ts
│   │   └── adapter-router.ts
│   ├── context/
│   │   ├── context-packet.ts
│   │   ├── context-vault.ts
│   │   └── context-assembler.ts
│   ├── schemas/
│   │   ├── config.schema.json
│   │   ├── event.schema.json
│   │   ├── context-packet.schema.ts
│   │   └── schema-version.ts
│   ├── cli/
│   │   ├── output.ts
│   │   ├── error-codes.ts
│   │   └── envelope.ts
│   ├── config/
│   │   ├── load-config.ts
│   │   ├── validate-config.ts
│   │   └── defaults.ts
│   └── lib/
│       ├── time.ts
│       ├── fs-safe.ts
│       └── logger.ts
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   ├── adapters/
│   │   └── cli/
│   ├── integration/
│   │   ├── gate-flow/
│   │   ├── replay-resume/
│   │   └── connector-flow/
│   ├── e2e/
│   │   ├── init-next-gate.e2e.test.ts
│   │   └── resume-recover.e2e.test.ts
│   └── fixtures/
│       ├── events/
│       └── snapshots/
└── .ai-dev/
    ├── events/
    │   └── events.jsonl
    ├── snapshots/
    │   └── state.json
    ├── context/
    │   └── context-*.json
    └── .lock
```

### Architectural Boundaries

**API Boundaries:**
- 外部边界：CLI 命令入口（`src/commands/**`）
- 内部边界：命令层仅调用 `core/*` 服务，不直接操作存储文件
- Connector 边界：所有外部 Agent 通信统一走 `src/adapters/*`

**Component Boundaries:**
- Stage/Gate/Replay/Resume 各自独立模块，跨模块通过显式接口交互
- `context/*` 只负责上下文组装与读取，不包含路由决策
- `cli/*` 只负责输出协议与错误映射，不包含业务规则

**Service Boundaries:**
- `event-writer` 是唯一事件写入口（append-only）
- `resume-engine` 必须依赖 `preflight-check`，禁止绕过
- `workspace-lock` 统一处理并发互斥与 stale lock 接管

**Data Boundaries:**
- 运行态数据仅在 `.ai-dev/*`
- schema 由 `schemas/*` 集中定义，禁止模块私有 schema 漂移
- 快照与事件流通过 `last_event_id/checksum` 锚定

### Requirements to Structure Mapping

**FR 分类映射：**
- Onboarding & Workspace (FR1-5): `commands/init.ts`, `config/*`, `context-vault.ts`
- Stage Orchestration (FR6-11): `core/stage/*`
- Human Gates (FR12-17): `core/gate/*`, `commands/approve|reject|other.ts`
- Context Management (FR18-22): `context/*`
- Agent Routing & Handoff (FR23-27): `adapters/*`, `commands/handoff.ts`
- Recovery & Replay (FR28-32, FR42): `core/replay/*`, `core/resume/*`, `commands/replay.ts`, `commands/resume.ts`
- Decision Log & Traceability (FR33-36, FR41): `core/events/*`, `tests/integration/*`
- Adoption Support (FR37-40): `README.md`, `docs/contracts/*`, `commands/* --help`

**Cross-Cutting Concerns:**
- 一致性与恢复：`core/events/*`, `core/replay/*`, `core/resume/*`
- 错误语义：`cli/error-codes.ts`, `cli/envelope.ts`
- 命名与规则治理：`docs/adr/*` + CI 校验

### Integration Points

**Internal Communication:**
- 命令 -> core service -> event writer -> snapshot/replay
- Adapter Router 根据策略调用 claude/codex adapter 并回写事件

**External Integrations:**
- Claude/Codex 通过 adapter contract 集成
- 包分发通过 npm（后续可扩展 Homebrew）

**Data Flow:**
- `init` 建立工作区与配置
- `next/handoff` 组装 Context Packet 并触发 adapter
- 结果写入事件链 -> 可选快照
- `resume` 先 preflight，再 replay 恢复并回到可执行阶段

### File Organization Patterns

**Configuration Files:**
- 根配置：构建/测试/CI
- 运行时配置：`.ai-dev/config.yaml`（schema 校验）

**Source Organization:**
- 命令层、核心引擎层、适配层、schema 层分离

**Test Organization:**
- unit 验证模块正确性
- integration 验证 Gate/Replay/Resume 主流程
- e2e 验证 CLI 用户路径

**Asset Organization:**
- CLI 项目无前端静态资产依赖
- 文档资产集中在 `docs/`

### Development Workflow Integration

**Development Server Structure:**
- 使用 `bin/dev.js` 驱动本地命令开发与调试

**Build Process Structure:**
- TypeScript 编译输出 + 命令入口映射
- CI 执行 lint/test/integration/replay fixtures

**Deployment Structure:**
- npm 包发布结构与 `bin/run.js` 保持一致
- 工作区数据与应用代码解耦（`.ai-dev` 与 `src` 分离）

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- 技术栈兼容：Node 24 LTS + TypeScript 5.9 + oclif 4.5.2 + AJV/Zod 组合无冲突。
- 决策链闭环：事件链、快照、回放、恢复、Gate、Connector 之间依赖关系明确且无矛盾。
- 安全与数据完整性口径与 PRD 对齐（append-only/checksum/opt-in sync）。

**Pattern Consistency:**
- 命名、结构、格式、通信、流程五类模式已统一。
- `snake_case` 事件与 JSON 规范、`kebab-case` CLI 参数规范一致。
- 错误码族与恢复动作映射可被所有命令复用。

**Structure Alignment:**
- 项目目录结构支持全部核心决策（Stage/Gate/Replay/Resume/Adapters）。
- 边界清晰：命令层、核心引擎层、适配层、schema 层职责分离明确。
- `.ai-dev` 运行态数据与 `src` 源码目录隔离，利于稳定恢复与测试。

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
- 无独立 epics 文件；按 FR 分类映射完成。

**Functional Requirements Coverage:**
- PRD 8 个 FR 分类均有明确架构承载目录与组件。
- FR41/FR42（关键事件留痕、阶段快照恢复）在事件链和恢复引擎中被直接支持。

**Non-Functional Requirements Coverage:**
- 性能：next/gate/resume 关键路径与指标点位已定义。
- 可靠性：preflight + hard-stop + checkpoint replay 已定义。
- 安全与数据：checksum chain + append-only + 本地优先已定义。
- 可扩展与集成：Claude/Codex adapter contract 与后续扩展边界已定义。

### Implementation Readiness Validation ✅

**Decision Completeness:**
- 关键决策已给出版本、选择依据、影响范围。
- Failure Mode Hardening 与 Critical Perspective 两轮增强已并入。

**Structure Completeness:**
- 完整目录树、模块边界、集成点、数据流均已给出。
- FR 到目录映射可直接指导任务拆分与编码。

**Pattern Completeness:**
- 冲突高发点（命名、事件、并发、恢复）已覆盖。
- 多 Agent 一致性规则具备可执行性与可审计性。

### Gap Analysis Results

**Critical Gaps:** 无。  
**Important Gaps:** 无阻塞项。  
**Nice-to-Have Gaps:**
- 后续可补充 ADR 模板与自动化检查脚本样例（非当前阻塞）。
- 可增加 `--json` 响应 contract 的 fixture 集用于回归验证。

### Validation Issues Addressed

- 已处理 checksum canonicalization 歧义风险。
- 已处理 stale lock 僵死风险。
- 已处理 connector 补偿幂等与 replay 边界识别风险。

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION  
**Confidence Level:** high

**Key Strengths:**
- 以恢复一致性为核心的运行时架构闭环完整。
- 多 Agent 冲突点在模式层已前置约束。
- 目录与边界可直接支持实现拆解与测试验证。

**Areas for Future Enhancement:**
- 增加自动化架构一致性 lint（命名/事件/错误码 contract）。
- 补充 Web 控制面预留接口文档（Phase 2）。

### Implementation Handoff

**AI Agent Guidelines:**
- 严格按架构决策与一致性规则实现，不得隐式偏离。
- 所有关键流程以事件链与快照校验为准。
- 遇到冲突优先参照本架构文档与 ADR。

**First Implementation Priority:**
- 初始化 CLI 基座并建立命令骨架：
  `npm install --global oclif && oclif generate ai-dev-runtime`

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅  
**Total Steps Completed:** 8  
**Date Completed:** 2026-03-06T19:25:15+0800  
**Document Location:** _bmad-output/planning-artifacts/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**
- 11 architectural decisions made
- 16 implementation conflict patterns defined and constrained
- 10 core architectural component areas specified
- 59 requirements fully supported (42 FR + 17 NFR)

**📚 AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing episkey. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**
`npm install --global oclif && oclif generate ai-dev-runtime`

**Development Sequence:**
1. Initialize project using documented starter template.
2. Set up development environment per architecture.
3. Implement core architectural foundations.
4. Build features following established patterns.
5. Maintain consistency with documented rules.

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Solid Foundation**
The chosen starter template and architectural patterns provide a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
