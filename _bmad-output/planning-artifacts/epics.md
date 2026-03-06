---
stepsCompleted: [step-01-validate-prerequisites]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
---

# episkey - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for episkey, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Onboarding & Workspace (FR1-5):**
- FR1: 开发者可以在本地安装并初始化 AI-DEV Runtime。
- FR2: 开发者可以为项目自动生成初始编排配置。
- FR3: 开发者可以查看与修改项目级编排配置。
- FR4: 开发者可以在初始化后直接启动首个编排工作流。
- FR5: 开发者可以在单项目范围内管理独立的编排工作区。

**Stage Orchestration (FR6-11):**
- FR6: 开发者可以按定义的阶段推进工作流。
- FR7: 系统可以基于阶段规则判断下一步允许动作。
- FR8: 开发者可以触发当前阶段的下一步建议生成。
- FR9: 系统可以阻止不合法的阶段跳转。
- FR10: 开发者可以查看当前阶段状态与最近一次迁移结果。
- FR11: 系统可以在阶段迁移时记录迁移原因与上下文引用。

**Human Gates (FR12-17):**
- FR12: 开发者可以配置哪些阶段必须经过人工 Gate 决策。
- FR13: 决策者可以在 Gate 上执行 `approve`。
- FR14: 决策者可以在 Gate 上执行 `reject` 并附带理由。
- FR15: 决策者可以在 Gate 上执行 `other` 并给出替代方向。
- FR16: 系统可以在连续 `reject` 后触发预定义升级路径。
- FR17: 系统可以为每次 Gate 决策保留证据与决策理由。

**Context Management (FR18-22):**
- FR18: 开发者可以为当前任务生成可复用的 Context Packet。
- FR19: 系统可以从当前工作区状态组装执行上下文。
- FR20: 开发者可以在执行前查看将被交接的上下文内容。
- FR21: 开发者可以在流程中更新任务约束与上下文说明。
- FR22: 系统可以在跨 Agent 切换时保持上下文连续性。

**Agent Routing & Handoff (FR23-27):**
- FR23: 开发者可以定义默认执行 Agent 与深度分析 Agent。
- FR24: 系统可以按路由策略选择目标 Agent 执行当前步骤。
- FR25: 开发者可以显式触发跨 Agent handoff。
- FR26: 系统可以将 Agent 输出回写到当前阶段上下文。
- FR27: 开发者可以在 handoff 后继续同一工作流而无需重建任务状态。

**Recovery & Replay (FR28-32, FR42):**
- FR28: 开发者可以从中断状态恢复工作流执行。
- FR29: 系统可以在恢复前执行一致性校验。
- FR30: 开发者可以回放历史事件序列用于排障与复盘。
- FR31: 系统可以在恢复校验失败时阻断流程并给出明确错误态。
- FR32: 开发者可以在恢复成功后继续后续阶段推进。
- FR42: 系统必须在阶段迁移时生成上下文快照，用于确定恢复点并支撑一致性恢复。

**Decision Log & Traceability (FR33-36, FR41):**
- FR33: 开发者可以查看按时间排序的决策与事件历史。
- FR34: 开发者可以按阶段、Gate、决策结果检索历史记录。
- FR35: 系统可以维持事件记录的追加式写入语义。
- FR36: 开发者可以导出工作流决策历史用于审阅与复盘。
- FR41: 系统必须在每个关键动作时写入事件记录，至少包括 `workspace_initialized`、`stage_transition`、`gate_decision`、`agent_handoff`、`resume`。

**Developer Adoption Support (FR37-40):**
- FR37: 开发者可以获取"当日可上手"的快速启动指引。
- FR38: 开发者可以获取 Gate 决策流与恢复回放的示例流程。
- FR39: 开发者可以通过引导初始化从手工多 Agent 切换迁移到 AI-DEV。
- FR40: 开发者可以在受限接口边界内配置支持的 Agent 连接器。

**Runtime Observability (FR43-45):**
- FR43: 系统必须提供 Runtime 可观测性命令入口，用于支持 `ai-dev log`、`ai-dev events`、`ai-dev stage` 等运行时诊断。
- FR44: 开发者可以通过命令检查 Event Log，按时间与关键维度查看事件记录。
- FR45: 开发者可以通过命令查看当前 Stage 状态与阶段上下文摘要。

### NonFunctional Requirements

**Performance (NFR1-4):**
- NFR1: Gate 决策处理延迟在正常负载下 p95 <= 2s。
- NFR2: `ai-dev next` 从触发到可执行建议返回在标准本地环境下 p95 <= 5s。
- NFR3: `ai-dev init` 在标准本地环境下应在 <= 60s 内完成。
- NFR4: Day-1 上手路径（安装到首个工作流）在理想场景下 <= 30 分钟完成。

**Reliability (NFR5-8):**
- NFR5: `resume` 成功率应 >= 95%（按 MVP 验证窗口统计）。
- NFR6: 事件日志完整率应 >= 99%（无缺失且可顺序回放）。
- NFR7: 恢复前必须执行一致性校验；校验失败时必须 hard-stop，禁止继续执行。
- NFR8: 系统中断后应支持 deterministic replay 重建最近可用状态。

**Security & Data Handling (NFR9-12):**
- NFR9: Context Vault 默认本地存储，不得默认上传云端。
- NFR10: 云同步（若启用）必须为明确 opt-in 行为。
- NFR11: Event Log 必须 append-only，并支持事件 checksum 校验。
- NFR12: MVP 阶段允许本地明文 JSONL 存储；后续阶段可引入可选静态加密。

**Scalability (NFR13-14):**
- NFR13: 单用户本地场景下，系统应稳定支持每日 10-30 次跨 Agent 切换工作负载。
- NFR14: 在 MVP 负载范围内，事件量增长时核心命令性能退化应可观测且可控。

**Integration (NFR15-17):**
- NFR15: 首发仅要求本地集成 Claude（默认执行）与 Codex（深度分析）通道稳定可用。
- NFR16: 集成失败必须返回明确错误信息与可恢复路径（重试、回退、改路由）。
- NFR17: 跨 Agent handoff 过程中必须保持上下文包结构一致性与可追溯性。

### Additional Requirements

**From Architecture Document:**

1. **Starter Template**: 使用 oclif 框架生成 CLI 项目骨架
   - 技术栈: Node.js 24 LTS + TypeScript 5.9 + oclif/@oclif/core 4.5.2
   - 初始化命令: `npm install --global oclif && oclif generate ai-dev-runtime`

2. **Configuration & Validation**:
   - 使用 AJV 进行配置验证
   - 使用 Zod 进行运行时 Context Packet 验证

3. **FSM State Model**:
   - 7个合法状态: IDLE, RESEARCH, PLAN, IMPLEMENT, REVIEW, EXECUTE, RECOVER
   - 状态迁移矩阵已定义

4. **Event Schema**:
   - 事件字段: ts, session_id, stage, event, actor, decision, reason, context_ref, metadata, checksum

5. **Data Storage**:
   - `.ai-dev/events/events.jsonl` (append-only)
   - `.ai-dev/snapshots/state.json`
   - `.ai-dev/context/context-*.json`
   - `.ai-dev/.lock` (workspace lock)

6. **CLI Commands**:
   - init, next, approve, reject, other, replay, resume, handoff
   - 参数使用 kebab-case

7. **API Response Format**:
   - 统一 envelope: `{ ok: true/false, data/error, meta }`

8. **Error Code Taxonomy**:
   - CFG_*, EVT_*, RESUME_*, LOCK_*, CONNECTOR_*

9. **Failure Mode Hardening**:
   - Checksum chain: `hash = sha256(prev_checksum + canonical_event_json)`
   - Workspace lock: O_CREAT|O_EXCL with pid/host/started_at metadata
   - Stale lock recovery support

10. **Project Structure**:
    - `src/commands/`, `src/core/`, `src/adapters/`, `src/schemas/`, `src/lib/`
    - 测试目录: `tests/unit`, `tests/integration`, `tests/e2e`

### FR Coverage Map

| Epic | FR Coverage |
|------|-------------|
| Epic 1: Project Setup & CLI Foundation | FR1, FR2, FR3, FR4, FR5, FR37, FR38, FR39, FR40 |
| Epic 2: Stage Engine | FR6, FR7, FR8, FR9, FR10, FR11, FR42, FR43, FR44, FR45 |
| Epic 3: Human Gates | FR12, FR13, FR14, FR15, FR16, FR17 |
| Epic 4: Context Management | FR18, FR19, FR20, FR21, FR22 |
| Epic 5: Agent Routing & Handoff | FR23, FR24, FR25, FR26, FR27, NFR15, NFR16, NFR17 |
| Epic 6: Recovery & Replay | FR28, FR29, FR30, FR31, FR32, NFR5, NFR6, NFR7, NFR8 |
| Epic 7: Decision Log & Traceability | FR33, FR34, FR35, FR36, FR41 |

## Epic List

- **Epic 1**: Project Setup & CLI Foundation (基础项目设置)
- **Epic 2**: Stage Engine (阶段引擎)
- **Epic 3**: Human Gates (人工门控)
- **Epic 4**: Context Management (上下文管理)
- **Epic 5**: Agent Routing & Handoff (Agent路由与切换)
- **Epic 6**: Recovery & Replay (恢复与回放)
- **Epic 7**: Decision Log & Traceability (决策日志与可追溯性)

---

## Epic 1: Project Setup & CLI Foundation

**Goal**: 建立 AI-DEV Runtime 的 CLI 基础框架，实现项目初始化、工作区管理和快速上手能力。

### Story 1.1: Initialize CLI Project with oclif

As a developer,
I want to initialize the AI-DEV Runtime project using oclif CLI framework,
So that I can have a standardized, maintainable CLI foundation with plugin support.

**Acceptance Criteria:**

**Given** Node.js 24 LTS and npm are installed
**When** Running `npm install --global oclif && oclif generate ai-dev-runtime`
**Then** A complete CLI project structure is created in `/root/.openclaw/workspace/ai-dev-runtime/`
**And** The following directories exist: `src/commands/`, `src/core/`, `src/adapters/`, `src/schemas/`, `src/lib/`, `tests/unit`, `tests/integration`, `tests/e2e`
**And** The project builds successfully with `npm run build`

**Given** TypeScript 5.9 and oclif 4.5.2
**When** Running `npm install`
**Then** All dependencies are installed without errors
**And** Development server works with `bin/dev.js --help`

### Story 1.2: Configure Default Project Workspace

As a developer,
I want to run `ai-dev init` and automatically generate initial orchestration configuration,
So that I can start using the runtime immediately without manual setup.

**Acceptance Criteria:**

**Given** The CLI is installed
**When** Running `ai-dev init` in an empty project directory
**Then** A `.ai-dev/` directory is created with:
  - `config.yaml` containing default gate policies
  - `events/events.jsonl` for append-only event storage
  - `snapshots/state.json` for stage snapshots
  - `context/` directory for context packets
  - `.lock` file for workspace locking
**And** The initialization completes in <= 60s (NFR3)
**And** A `workspace_initialized` event is written to events.jsonl

**Given** Default configuration is generated
**When** Reading `.ai-dev/config.yaml`
**Then** It contains 5 default gate policies: `prd_freeze`, `architecture_freeze`, `high_complexity`, `release`, `fix_loop`

### Story 1.3: Implement Basic CLI Commands

As a developer,
I want to use basic CLI commands (next, approve, reject, other),
So that I can interact with the orchestration runtime.

**Acceptance Criteria:**

**Given** The CLI is initialized
**When** Running `ai-dev next`
**Then** The command executes and returns a response
**And** The response follows the unified envelope format `{ ok: true/false, data/error, meta }`

**Given** The CLI is initialized
**When** Running `ai-dev approve`, `ai-dev reject`, `ai-dev other`
**Then** Each command accepts appropriate arguments
**And** Each command returns structured output

**Given** The CLI is initialized
**When** Running any command with `--json` flag
**Then** The output is machine-readable JSON in the envelope format

### Story 1.4: Create Quick Start Guide

As a new developer,
I want to have a "Day-1 ready" quick start guide,
So that I can get from installation to first workflow within 30 minutes.

**Acceptance Criteria:**

**Given** A new developer
**When** Reading the README.md after `ai-dev init`
**Then** There is a clear "Getting Started" section with step-by-step instructions
**And** The guide includes examples for:
  - Running the first workflow
  - Using Gate decisions (approve/reject/other)
  - Recovering from interruption (resume/replay)
**And** The total time from installation to first workflow is <= 30 minutes (NFR4)

---

## Epic 2: Stage Engine

**Goal**: 实现基于 FSM 的阶段引擎，支持工作流状态迁移、合法性校验和可观测性。

### Story 2.1: Implement FSM State Machine

As a developer,
I want the system to maintain a defined set of stages (IDLE, RESEARCH, PLAN, IMPLEMENT, REVIEW, EXECUTE, RECOVER),
So that the workflow progresses through predictable, governed states.

**Acceptance Criteria:**

**Given** The FSM is implemented
**When** Querying the current stage
**Then** The stage can only be one of: IDLE, RESEARCH, PLAN, IMPLEMENT, REVIEW, EXECUTE, RECOVER

**Given** The FSM state machine
**When** Attempting an invalid stage transition
**Then** The transition is rejected with error code `EVT_INVALID_STAGE_TRANSITION`
**And** The current stage remains unchanged

**Given** Valid transition matrix
**When** Transitions occur according to the matrix:
  - IDLE -> RESEARCH (after init)
  - RESEARCH -> PLAN (after prd_freeze Gate)
  - PLAN -> IMPLEMENT (after architecture_freeze Gate)
  - IMPLEMENT -> REVIEW (after high_complexity Gate)
  - REVIEW -> EXECUTE (after release Gate)
  - REVIEW -> IMPLEMENT (on reject)
  - EXECUTE -> IDLE (on completion)
  - EXECUTE -> RECOVER (on interruption)
  - RECOVER -> IMPLEMENT/REVIEW/IDLE (based on recovery)
**Then** Each transition is allowed and recorded

### Story 2.2: Stage Transition with Logging

As a developer,
I want every stage transition to be logged with reason and context reference,
So that I can trace the workflow history.

**Acceptance Criteria:**

**Given** A stage transition occurs
**When** The transition is executed
**Then** A `stage_transition` event is written to events.jsonl
**And** The event contains: ts, session_id, from_stage, to_stage, reason, context_ref, checksum

**Given** The developer wants to view current stage
**When** Running `ai-dev stage` or `ai-dev status`
**Then** The output shows current stage, last transition time, and recent migration result

### Story 2.3: Stage Snapshot for Recovery

As a developer,
I want the system to generate a snapshot on each stage transition,
So that I can recover to a known good state.

**Acceptance Criteria:**

**Given** A stage transition occurs
**When** The transition completes
**Then** A snapshot is saved to `.ai-dev/snapshots/state.json`
**And** The snapshot contains: last_event_id, last_event_checksum, current_stage, stage_context

**Given** The snapshot exists
**When** The system needs to recover
**Then** The snapshot provides the anchor point for recovery

### Story 2.4: Runtime Observability Commands

As a developer,
I want to inspect the runtime state through CLI commands,
So that I can diagnose issues and understand workflow status.

**Acceptance Criteria:**

**Given** The runtime is initialized
**When** Running `ai-dev log` or `ai-dev events`
**Then** Events are displayed in chronological order
**And** Events can be filtered by stage, gate, decision result

**Given** The runtime is running
**When** Running `ai-dev stage`
**Then** The current stage and stage context summary are displayed

---

## Epic 3: Human Gates

**Goal**: 实现人工门控机制，支持三态决策（approve/reject/other）和升级路径。

### Story 3.1: Configure Gate Policies

As a developer,
I want to configure which stages require human Gate decisions,
So that I can enforce governance at critical points.

**Acceptance Criteria:**

**Given** The system is initialized
**When** Reading `.ai-dev/config.yaml`
**Then** It contains 5 default gate policies:
  - `prd_freeze` (triggers on RESEARCH -> PLAN)
  - `architecture_freeze` (triggers on PLAN -> IMPLEMENT)
  - `high_complexity` (triggers on IMPLEMENT -> REVIEW for complex tasks)
  - `release` (triggers on REVIEW -> EXECUTE)
  - `fix_loop` (triggers on RECOVER -> IMPLEMENT)

**Given** Gate policies are defined
**When** A stage reaches a gate-triggering transition
**Then** The workflow pauses and waits for human decision

### Story 3.2: Implement Approve Decision

As a decision maker,
I want to approve a Gate and continue the workflow,
So that the approved path can proceed.

**Acceptance Criteria:**

**Given** A Gate is pending
**When** Running `ai-dev approve`
**Then** The Gate decision is recorded with decision="approve"
**And** The workflow proceeds to the next stage
**And** A `gate_decision` event is written with evidence and reason

### Story 3.3: Implement Reject Decision with Reason

As a decision maker,
I want to reject a Gate with a reason,
So that the developer understands what needs to be changed.

**Acceptance Criteria:**

**Given** A Gate is pending
**When** Running `ai-dev reject --reason "reason text"`
**Then** The Gate decision is recorded with decision="reject" and the provided reason
**And** The workflow returns to the appropriate previous stage
**And** A `gate_decision` event is written with evidence and reason

**Given** Two consecutive rejects occur
**When** The second reject is recorded
**Then** An escalation path is triggered per policy

### Story 3.4: Implement Other Decision

As a decision maker,
I want to provide an alternative direction at a Gate,
So that the workflow can pivot to a different approach.

**Acceptance Criteria:**

**Given** A Gate is pending
**When** Running `ai-dev other --direction "alternative direction"`
**Then** The Gate decision is recorded with decision="other" and the alternative
**And** The workflow continues based on the alternative direction

### Story 3.5: Gate Evidence Preservation

As a developer,
I want every Gate decision to preserve evidence and rationale,
So that I can audit decisions and understand the workflow history.

**Acceptance Criteria:**

**Given** Any Gate decision is made
**When** The decision is recorded
**Then** The decision includes: actor, timestamp, decision type, reason/direction, context snapshot

---

## Epic 4: Context Management

**Goal**: 实现 Context Packet 生成、组装和跨 Agent 连续性管理。

### Story 4.1: Generate Context Packet

As a developer,
I want to generate a reusable Context Packet for the current task,
So that I can share structured context with other agents.

**Acceptance Criteria:**

**Given** The workflow is at a specific stage
**When** Running `ai-dev context generate` or triggered by stage transition
**Then** A Context Packet is created containing:
  - Current stage and stage state
  - Constraints and requirements from the workflow
  - Code delta since last agent
  - Pending decisions and their context
**And** The packet is saved to `.ai-dev/context/context-{timestamp}.json`

**Given** The Context Packet schema
**When** The packet is created
**Then** It follows the Zod schema for Context Packet (validated by NFR17)

### Story 4.2: View Context Before Handoff

As a developer,
I want to view the context that will be handed off before the handoff,
So that I can verify it's correct.

**Acceptance Criteria:**

**Given** A Context Packet exists
**When** Running `ai-dev context view` or `ai-dev context show`
**Then** The full context content is displayed in readable format

**Given** A handoff is about to occur
**When** Running `ai-dev handoff --dry-run` or the system prompts before handoff
**Then** The developer can review the context content before confirming

### Story 4.3: Update Context During Workflow

As a developer,
I want to update task constraints and context explanations during the workflow,
So that the context remains accurate.

**Acceptance Criteria:**

**Given** The workflow is in progress
**When** Running `ai-dev context update --constraint "new constraint"`
**Then** The context is updated with the new constraint
**And** The update is recorded as an event

### Story 4.4: Maintain Context Continuity Across Agent Handoff

As a developer,
I want the context to remain continuous when switching between agents,
So that the new agent has all the necessary information.

**Given** An agent handoff occurs
**When** The new agent receives the Context Packet
**Then** The packet contains all necessary context (stage, constraints, code delta, pending decisions)
**And** The handoff is logged as an `agent_handoff` event (FR41)

---

## Epic 5: Agent Routing & Handoff

**Goal**: 实现 Agent 路由策略和跨 Agent 切换机制。

### Story 5.1: Configure Default Agent Routing

As a developer,
I want to define default execution agent and deep analysis agent,
So that the system knows which agent to use for different tasks.

**Acceptance Criteria:**

**Given** The system is initialized
**When** Reading `.ai-dev/config.yaml`
**Then** Default routing is set: Claude as default executor, Codex as deep analysis

**Given** Routing configuration exists
**When** The system needs to select an agent
**Then** It follows the routing policy to select the appropriate agent

### Story 5.2: Trigger Agent Handoff

As a developer,
I want to explicitly trigger a handoff to another agent,
So that I can switch from one agent to another while maintaining context.

**Acceptance Criteria:**

**Given** The current agent has completed its task
**When** Running `ai-dev handoff --to codex` or `ai-dev handoff --to claude`
**Then** A Context Packet is assembled for the target agent
**And** An `agent_handoff` event is written to the event log
**And** The workflow continues in the new agent's context

### Story 5.3: Write Agent Output to Context

As a developer,
I want agent output to be written back to the current stage context,
So that the workflow maintains a complete record.

**Given** An agent completes its work
**When** The agent output is received
**Then** The output is written to the current stage context
**And** The context is updated for the next step

### Story 5.4: Integrate Claude Adapter

As a developer,
I want Claude to be available as the default execution agent,
So that I can use Claude for primary implementation tasks.

**Acceptance Criteria:**

**Given** Claude adapter is implemented
**When** The routing policy selects Claude
**Then** The adapter can execute tasks and return results
**And** The adapter follows the two-phase protocol: intent -> result/compensation
**And** Integration failures return clear error messages with recovery paths (NFR16)

### Story 5.5: Integrate Codex Adapter

As a developer,
I want Codex to be available as the deep analysis agent,
So that I can use Codex for complex reasoning tasks.

**Acceptance Criteria:**

**Given** Codex adapter is implemented
**When** The routing policy selects Codex
**Then** The adapter can execute deep analysis tasks and return results
**And** The adapter follows the two-phase protocol
**And** Integration failures return clear error messages with recovery paths

---

## Epic 6: Recovery & Replay

**Goal**: 实现工作流恢复和事件回放机制，确保可恢复性。

### Story 6.1: Resume Workflow from Interruption

As a developer,
I want to resume a workflow from an interrupted state,
So that I can continue working without losing progress.

**Acceptance Criteria:**

**Given** A workflow is interrupted (e.g., process crash, manual stop)
**When** Running `ai-dev resume`
**Then** A preflight check is executed:
  - Checksum chain validation
  - Snapshot anchor validation
  - Schema/upcaster compatibility validation
**And** If all checks pass, the workflow resumes from the last valid state
**And** Resume success rate >= 95% (NFR5)

**Given** Preflight check fails
**When** Running `ai-dev resume`
**Then** The workflow is NOT resumed
**And** An explicit error state is returned with error code
**And** The execution is hard-stopped (NFR7)

### Story 6.2: Replay Historical Events

As a developer,
I want to replay historical events for troubleshooting and review,
So that I can understand what happened and debug issues.

**Acceptance Criteria:**

**Given** Event history exists
**When** Running `ai-dev replay`
**Then** Events are replayed in chronological order
**And** The system rebuilds the state from events
**And** The replay is deterministic (NFR8)

**Given** Replay is executed
**When** Schema version mismatch occurs
**Then** The upcaster transforms old events to current schema
**And** Compatibility is verified before replay

### Story 6.3: Deterministic Replay for Recovery

As a developer,
I want the system to support deterministic replay to rebuild the most recent available state,
So that recovery is reliable.

**Given** An interruption occurs
**When** The system rebuilds state from events
**Then** The replay produces the same result every time (deterministic)
**And** Event log completeness >= 99% (NFR6)

### Story 6.4: Workspace Lock and Concurrency

As a developer,
I want the workspace to be protected by a lock mechanism,
So that concurrent CLI invocations don't corrupt state.

**Given** A CLI command is running
**When** Another CLI command is invoked in the same workspace
**Then** The second command detects the lock
**And** Returns a lock conflict error that is retryable

**Given** A stale lock exists (previous process didn't clean up)
**When** A new command is invoked
**Then** The lock metadata (pid/host/started_at) is checked
**And** Safe takeover rules are applied if appropriate

---

## Epic 7: Decision Log & Traceability

**Goal**: 实现完整的决策日志和可追溯性。

### Story 7.1: Query Decision History by Time

As a developer,
I want to view decisions and events sorted by time,
So that I can understand the workflow progression.

**Acceptance Criteria:**

**Given** Events exist in the log
**When** Running `ai-dev log` or `ai-dev events`
**Then** Events are displayed in chronological order (newest first by default)
**And** Each event shows: timestamp, event type, actor, details

### Story 7.2: Filter History by Stage, Gate, Decision

As a developer,
I want to filter history by stage, Gate, or decision result,
So that I can find specific events quickly.

**Acceptance Criteria:**

**Given** Events exist in the log
**When** Running `ai-dev events --stage REVIEW` or `ai-dev events --gate prd_freeze` or `ai-dev events --decision reject`
**Then** Only matching events are displayed
**And** Multiple filters can be combined

### Story 7.3: Export Decision History

As a developer,
I want to export the workflow decision history for review and playback,
So that I can share it with others or archive it.

**Acceptance Criteria:**

**Given** The developer wants to export
**When** Running `ai-dev export --format json` or `ai-dev export --format jsonl`
**Then** The decision history is exported to a file or stdout
**And** The export includes all required fields for audit

### Story 7.4: Append-Only Event Writing

As a developer,
I want the event log to be append-only,
So that the history cannot be tampered with.

**Acceptance Criteria:**

**Given** Events are written to the log
**When** Any attempt to modify or delete historical events
**Then** The operation is rejected
**And** Only new events can be appended

**Given** An event is appended
**When** The checksum is calculated
**Then** The checksum is stored with the event: `hash = sha256(prev_checksum + canonical_event_json)`
