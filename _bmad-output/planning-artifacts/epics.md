---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/product-brief-episkey-2026-03-06.md
---

# episkey - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for episkey, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: 开发者可以在本地安装并初始化 AI-DEV Runtime。  
FR2: 开发者可以为项目自动生成初始编排配置。  
FR3: 开发者可以查看与修改项目级编排配置。  
FR4: 开发者可以在初始化后直接启动首个编排工作流。  
FR5: 开发者可以在单项目范围内管理独立的编排工作区。  
FR6: 开发者可以按定义的阶段推进工作流。  
FR7: 系统可以基于阶段规则判断下一步允许动作。  
FR8: 开发者可以触发当前阶段的下一步建议生成。  
FR9: 系统可以阻止不合法的阶段跳转。  
FR10: 开发者可以查看当前阶段状态与最近一次迁移结果。  
FR11: 系统可以在阶段迁移时记录迁移原因与上下文引用。  
FR12: 开发者可以配置哪些阶段必须经过人工 Gate 决策。  
FR13: 决策者可以在 Gate 上执行 `approve`。  
FR14: 决策者可以在 Gate 上执行 `reject` 并附带理由。  
FR15: 决策者可以在 Gate 上执行 `other` 并给出替代方向。  
FR16: 系统可以在连续 `reject` 后触发预定义升级路径。  
FR17: 系统可以为每次 Gate 决策保留证据与决策理由。  
FR18: 开发者可以为当前任务生成可复用的 Context Packet。  
FR19: 系统可以从当前工作区状态组装执行上下文。  
FR20: 开发者可以在执行前查看将被交接的上下文内容。  
FR21: 开发者可以在流程中更新任务约束与上下文说明。  
FR22: 系统可以在跨 Agent 切换时保持上下文连续性。  
FR23: 开发者可以定义默认执行 Agent 与深度分析 Agent。  
FR24: 系统可以按路由策略选择目标 Agent 执行当前步骤。  
FR25: 开发者可以显式触发跨 Agent handoff。  
FR26: 系统可以将 Agent 输出回写到当前阶段上下文。  
FR27: 开发者可以在 handoff 后继续同一工作流而无需重建任务状态。  
FR28: 开发者可以从中断状态恢复工作流执行。  
FR29: 系统可以在恢复前执行一致性校验。  
FR30: 开发者可以回放历史事件序列用于排障与复盘。  
FR31: 系统可以在恢复校验失败时阻断流程并给出明确错误态。  
FR32: 开发者可以在恢复成功后继续后续阶段推进。  
FR33: 开发者可以查看按时间排序的决策与事件历史。  
FR34: 开发者可以按阶段、Gate、决策结果检索历史记录。  
FR35: 系统可以维持事件记录的追加式写入语义。  
FR36: 开发者可以导出工作流决策历史用于审阅与复盘。  
FR37: 开发者可以获取“当日可上手”的快速启动指引。  
FR38: 开发者可以获取 Gate 决策流与恢复回放的示例流程。  
FR39: 开发者可以通过引导初始化从手工多 Agent 切换迁移到 AI-DEV。  
FR40: 开发者可以在受限接口边界内配置支持的 Agent 连接器。  
FR41: 系统必须在每个关键动作时写入事件记录，至少包括 `workspace_initialized`、`stage_transition`、`gate_decision`、`agent_handoff`、`resume`。  
FR42: 系统必须在阶段迁移时生成上下文快照，用于确定恢复点并支撑一致性恢复。  
FR43: 系统必须提供 Runtime 可观测性命令入口，用于支持 `ai-dev log`、`ai-dev events`、`ai-dev stage` 等运行时诊断。  
FR44: 开发者可以通过命令检查 Event Log，按时间与关键维度查看事件记录。  
FR45: 开发者可以通过命令查看当前 Stage 状态与阶段上下文摘要。

### NonFunctional Requirements

NFR1: Gate 决策处理延迟在正常负载下 p95 <= 2s。  
NFR2: `ai-dev next` 从触发到可执行建议返回在标准本地环境下 p95 <= 5s。  
NFR3: `ai-dev init` 在标准本地环境下应在 <= 60s 内完成。  
NFR4: Day-1 上手路径（安装到首个工作流）在理想场景下 <= 30 分钟完成。  
NFR5: `resume` 成功率应 >= 95%（按 MVP 验证窗口统计）。  
NFR6: 事件日志完整率应 >= 99%（无缺失且可顺序回放）。  
NFR7: 恢复前必须执行一致性校验；校验失败时必须 hard-stop，禁止继续执行。  
NFR8: 系统中断后应支持 deterministic replay 重建最近可用状态。  
NFR9: Context Vault 默认本地存储，不得默认上传云端。  
NFR10: 云同步（若启用）必须为明确 opt-in 行为。  
NFR11: Event Log 必须 append-only，并支持事件 checksum 校验。  
NFR12: MVP 阶段允许本地明文 JSONL 存储；后续阶段可引入可选静态加密。  
NFR13: 单用户本地场景下，系统应稳定支持每日 10-30 次跨 Agent 切换工作负载。  
NFR14: 在 MVP 负载范围内，事件量增长时核心命令性能退化应可观测且可控。  
NFR15: 首发仅要求本地集成 Claude（默认执行）与 Codex（深度分析）通道稳定可用。  
NFR16: 集成失败必须返回明确错误信息与可恢复路径（重试、回退、改路由）。  
NFR17: 跨 Agent handoff 过程中必须保持上下文包结构一致性与可追溯性。

### Additional Requirements

- Starter 模板固定为 oclif；首个实现故事必须从 CLI 基座初始化开始。  
- 运行时基线：Node.js 24 LTS + TypeScript 5.9 + `@oclif/core` 4.5.2。  
- CLI 命令面需覆盖：`init/next/approve/reject/other/replay/resume/handoff`。  
- 数据落盘结构固定：`.ai-dev/events/events.jsonl`、`.ai-dev/snapshots/state.json`、`.ai-dev/context/context-*.json`。  
- Event Log 必须 append-only，且使用 checksum chain（基于 canonical event JSON）保证完整性。  
- 事件结构需包含 `schema_version`，并支持 `schemaVersion + upcaster` 兼容升级。  
- 状态机固定 7 个状态（`IDLE/RESEARCH/PLAN/IMPLEMENT/REVIEW/EXECUTE/RECOVER`），非法迁移必须阻断并返回机读错误。  
- MVP 默认 Gate 策略必须内建并可覆盖：`prd_freeze`、`architecture_freeze`、`high_complexity`、`release`、`fix_loop`。  
- `resume` 前置校验为强制流程：checksum chain 校验、snapshot anchor 校验、schema/upcaster 兼容校验。  
- 恢复校验失败必须 hard-stop，禁止继续执行，并返回明确可恢复路径。  
- Connector 交互需遵循两阶段事件：`agent_intent -> agent_result` 或 `agent_intent -> agent_compensation`。  
- `intent_id` 必须作为补偿幂等键，result/compensation 必须回链同一 intent。  
- 必须有工作区文件锁 `.ai-dev/.lock`，并支持 stale-lock 安全接管（`pid/host/started_at`）。  
- CLI 必须提供统一 `--json` 输出契约（`ok/data/meta` 或 `ok/error/meta`）。  
- 错误码需分族（`CFG_*`, `EVT_*`, `RESUME_*`, `LOCK_*`, `CONNECTOR_*`）并附带恢复动作提示。  
- 配置优先级固定为 `CLI flags > ENV vars > .ai-dev/config.yaml`。  
- 分发策略：npm 全局安装优先，Homebrew 作为次选渠道。  
- CI 最低要求覆盖 Node 24 LTS 主验证，并执行 lint/test/integration/replay fixtures。  
- MVP 运行闭环不可断裂：`next -> handoff -> gate -> events -> snapshot -> resume`。  
- 11 天 MVP 验证窗口内，闭环可运行性与恢复稳定性是和功能并列的验收门槛。  
- UX 文档当前未提供，后续若补充需并入响应式/可访问性/交互错误态要求。

### FR Coverage Map

FR1: Epic 1 - 本地安装并初始化 Runtime  
FR2: Epic 1 - 自动生成初始编排配置  
FR3: Epic 1 - 查看与修改项目级配置  
FR4: Epic 1 - 初始化后启动首个编排工作流  
FR5: Epic 1 - 管理单项目独立编排工作区  
FR6: Epic 2 - 按阶段推进工作流  
FR7: Epic 2 - 基于阶段规则判断允许动作  
FR8: Epic 2 - 触发当前阶段下一步建议生成  
FR9: Epic 2 - 阻止不合法阶段跳转  
FR10: Epic 2 - 查看当前阶段状态与最近迁移结果  
FR11: Epic 2 - 记录阶段迁移原因与上下文引用  
FR12: Epic 3 - 配置需要人工 Gate 的阶段  
FR13: Epic 3 - Gate 执行 approve  
FR14: Epic 3 - Gate 执行 reject 并附理由  
FR15: Epic 3 - Gate 执行 other 并给替代方向  
FR16: Epic 3 - 连续 reject 后触发升级路径  
FR17: Epic 3 - 保留 Gate 证据与决策理由  
FR18: Epic 4 - 为任务生成可复用 Context Packet  
FR19: Epic 4 - 从工作区状态组装执行上下文  
FR20: Epic 4 - 执行前查看交接上下文内容  
FR21: Epic 4 - 流程中更新任务约束与上下文说明  
FR22: Epic 4 - 跨 Agent 切换保持上下文连续  
FR23: Epic 4 - 定义默认执行 Agent 与深度分析 Agent  
FR24: Epic 4 - 按路由策略选择目标 Agent  
FR25: Epic 4 - 显式触发跨 Agent handoff  
FR26: Epic 4 - 将 Agent 输出回写到当前阶段上下文  
FR27: Epic 4 - handoff 后继续同一工作流无需重建状态  
FR28: Epic 5 - 从中断状态恢复执行  
FR29: Epic 5 - 恢复前执行一致性校验  
FR30: Epic 5 - 回放历史事件序列用于排障复盘  
FR31: Epic 5 - 恢复校验失败阻断并给出明确错误态  
FR32: Epic 5 - 恢复成功后继续后续阶段推进  
FR33: Epic 6 - 查看按时间排序的决策与事件历史  
FR34: Epic 6 - 按阶段/Gate/结果检索历史  
FR35: Epic 6 - 维持事件记录追加式写入语义  
FR36: Epic 6 - 导出决策历史用于审阅与复盘  
FR37: Epic 1 - 提供 Day-1 快速上手指引  
FR38: Epic 6 - 提供 Gate 决策流与恢复回放示例流程  
FR39: Epic 1 - 提供从手工多 Agent 切换迁移引导  
FR40: Epic 4 - 在受限边界内配置支持的 Agent 连接器  
FR41: Epic 6 - 关键动作写入标准事件记录  
FR42: Epic 5 - 阶段迁移生成上下文快照支撑恢复  
FR43: Epic 6 - 提供 Runtime 可观测性命令入口  
FR44: Epic 6 - 支持 Event Log 检查命令能力  
FR45: Epic 6 - 支持当前 Stage 可见性命令能力

## Epic List

### Epic 1: CLI Runtime Initialization & First Orchestration
开发者可以在 Day-1 完成安装、初始化、配置与首个编排启动，建立可运行的 runtime 基座。  
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR37, FR39

### Epic 2: Stage-based Orchestration & Transition Control
开发者可以按阶段推进流程，获取下一步建议，并由系统保证迁移合法与可追踪。  
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11

### Epic 3: Human Gate Governance & Decision Escalation
决策者可以在关键节点执行 approve/reject/other，并在反复拒绝时触发治理升级。  
**FRs covered:** FR12, FR13, FR14, FR15, FR16, FR17

### Epic 4: Multi-Agent Context Handoff & Adapter Routing
开发者可以进行跨 Agent 协作与路由，确保上下文连续、结果可回写、连接器可管理。  
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR40

### Epic 5: Recovery, Resume & Deterministic Replay
开发者可以在异常中断后恢复与回放，系统以一致性校验和快照锚点保障恢复正确性。  
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR42

### Epic 6: Runtime Observability & Decision Audit
开发者可以检查事件与阶段状态、检索导出审计轨迹，形成运行时可观测与复盘闭环。  
**FRs covered:** FR33, FR34, FR35, FR36, FR38, FR41, FR43, FR44, FR45

## Epic 1: CLI Runtime Initialization & First Orchestration

开发者可以在 Day-1 完成安装、初始化、配置与首个编排启动，建立可运行的 runtime 基座。

### Story 1.1: Set Up Initial Project from oclif Starter Template and Verify CLI Availability

**Implements:** FR1, FR37


As a AI-first 开发者,  
I want 从 oclif starter template 初始化项目并立即验证 CLI 可执行,  
So that 我可以在本地开始受控编排而不是手工多 Agent 切换。

**Acceptance Criteria:**

**Given** 本机具备 Node.js 与 npm 的最低运行条件  
**When** 我执行 `npm install --global oclif` 并运行 `oclif generate ai-dev-runtime`  
**Then** 系统从 starter template 生成初始项目骨架（含标准命令与工程结构）  
**And** 该初始化过程可作为后续实现的唯一起点

**Given** starter 项目已生成  
**When** 我在项目中运行 `ai-dev --help`  
**Then** CLI 成功输出命令帮助，且进程退出码为 0  
**And** 帮助中至少包含 `init`、`next`、`handoff`、`approve`、`reject`、`other`、`resume`

**Given** 安装过程中依赖缺失或版本不满足  
**When** 我执行安装或首次运行命令  
**Then** 系统返回明确错误信息（缺失项、最低版本要求）  
**And** 提供可恢复动作（升级 Node、重装依赖、重试命令）

**Given** CLI 已安装  
**When** 我执行 `ai-dev --version`  
**Then** 返回语义化版本号  
**And** 版本信息可用于后续排障记录

### Story 1.2: Initialize Workspace with Zero-Config Defaults

**Implements:** FR1, FR2, FR5


As a AI-first 开发者,  
I want 在项目目录执行 `ai-dev init` 自动初始化运行时工作区与默认配置,  
So that 我可以不做复杂配置就进入首个编排流程。

**Acceptance Criteria:**

**Given** 当前项目尚未初始化（不存在 `.ai-dev/`）  
**When** 我执行 `ai-dev init`  
**Then** 系统创建 `.ai-dev/` 及必要子目录（`events/`、`snapshots/`、`context/`）和默认配置文件  
**And** 命令返回成功并明确列出已创建的关键文件与目录

**Given** 当前项目已存在 `.ai-dev/`  
**When** 我再次执行 `ai-dev init`  
**Then** 系统不得破坏已有事件与快照数据  
**And** 返回明确结果（幂等成功或需显式确认的提示），说明如何继续

**Given** 目标目录无写权限或路径非法  
**When** 我执行 `ai-dev init`  
**Then** 系统返回明确错误信息与错误码  
**And** 提供可恢复动作（切换目录、修复权限、重试）

**Given** 标准本地环境  
**When** 我执行 `ai-dev init`  
**Then** 初始化在 `<= 60s` 内完成  
**And** 输出下一步指引（例如执行 `ai-dev next` 启动首个编排）

### Story 1.3: View and Update Project Orchestration Config

**Implements:** FR3


As a AI-first 开发者,  
I want 查看并按需更新项目级编排配置,  
So that 我可以在不破坏默认可用性的前提下调整路由与治理策略。

**Acceptance Criteria:**

**Given** 项目已完成 `ai-dev init`  
**When** 我执行 `ai-dev config show`  
**Then** 系统返回当前生效配置  
**And** 输出包含关键项（默认执行 Agent、深度分析 Agent、Gate 策略、配置来源优先级）

**Given** 我需要修改部分配置  
**When** 我执行配置更新命令（如 `ai-dev config set`）  
**Then** 系统只更新目标配置项，不影响未变更项  
**And** 更新后可再次查询到新值并标记生效来源

**Given** 我提交了非法配置（未知字段、类型错误、值越界）  
**When** 我执行 `ai-dev config validate`  
**Then** 系统返回机读错误码与可读错误说明（指向具体字段）  
**And** 阻止非法配置进入运行时

**Given** CLI flags、ENV 与配置文件同时存在  
**When** 我执行配置解析或查看生效配置  
**Then** 系统按 `CLI flags > ENV vars > .ai-dev/config.yaml` 解析  
**And** 在输出中显示最终生效值及其来源（flag/env/file）以便排障

### Story 1.4: Start First Orchestration from Initialized Workspace

**Implements:** FR4


As a AI-first 开发者,  
I want 在初始化完成后直接启动首个编排流程,  
So that 我可以从“准备环境”进入“实际推进任务”的受控循环。

**Acceptance Criteria:**

**Given** 项目已完成 `ai-dev init` 且配置有效  
**When** 我执行 `ai-dev next`  
**Then** 系统基于当前阶段与上下文生成可执行的下一步建议  
**And** 输出包含阶段信息、建议摘要与建议来源（规则/路由）

**Given** 首次运行尚无历史事件  
**When** 我执行 `ai-dev next`  
**Then** 系统按初始事件定义写入首批运行事件（至少包含 `workspace_initialized` 与首个 `stage_transition`）  
**And** 事件写入遵循 append-only 语义并可被后续审计检索

**Given** 项目处于首轮编排起点  
**When** 我触发首个 `ai-dev next`  
**Then** 系统进入并显示预期的 initial stage  
**And** 阶段状态可与当前事件记录一致对应

**Given** 工作区已被其他进程占用  
**When** 我执行 `ai-dev next`  
**Then** 系统通过 workspace lock 机制阻止并发冲突写入  
**And** 返回明确锁冲突错误与可恢复动作（重试或安全接管）

**Given** 当前上下文不完整（缺少必要约束或任务目标）  
**When** 我执行 `ai-dev next`  
**Then** 系统返回明确错误与补充指引  
**And** 不进入不确定执行态

**Given** 用户以 `--json` 调用命令  
**When** `ai-dev next` 成功或失败返回  
**Then** 输出遵循统一 envelope（`ok/data/meta` 或 `ok/error/meta`）  
**And** 错误场景包含可恢复动作（retry/fallback/reroute/stop）

### Story 1.5: Deliver Day-1 Quickstart and Migration Guide

**Implements:** FR37, FR39


As a 手工多 Agent 切换的开发者,  
I want 获得可直接执行的 Day-1 快速上手与迁移指引,  
So that 我可以在 30 分钟内从旧流程迁移到 AI-DEV 的首个可运行编排闭环。

**Acceptance Criteria:**

**Given** 我是首次接触 AI-DEV 的用户  
**When** 我查看 Quickstart 文档或运行引导命令  
**Then** 我能按步骤完成 `install -> doctor -> init -> config validate -> next`  
**And** 每一步都包含预期输出示例与失败时的恢复动作

**Given** 我当前使用手工多 Agent 协作流程  
**When** 我查看迁移指南  
**Then** 指南明确说明“旧流程动作”到“AI-DEV 命令”的映射关系  
**And** 至少覆盖 `手工切换 -> handoff`、`聊天补上下文 -> Context Packet`、`中断后重开 -> resume`

**Given** 我在 Day-1 路径中遇到常见问题  
**When** 我执行文档中的排障步骤  
**Then** 可以定位问题类别（环境、配置、锁冲突、连接器）  
**And** 能获得对应命令与下一步动作建议

**Given** 产品要求 Day-1 可用性  
**When** 参考 Quickstart 执行首轮流程  
**Then** 在理想场景下可于 30 分钟内完成首个 orchestration cycle 起步  
**And** 文档中明确该目标及前置条件

### Story 1.6: Establish CI/CD Baseline and Runtime Doctor Diagnostics

**Implements:** FR37


As a AI-first 开发者,  
I want 建立最小可运行的 CI/CD 基线并提供 `ai-dev doctor` 诊断命令,  
So that 我可以在实施早期快速发现环境与质量问题，确保 Day-1 路径稳定可用。

**Acceptance Criteria:**

**Given** starter 项目已初始化  
**When** 我配置并触发 CI 流程  
**Then** CI 必须在 Node 24 LTS 环境执行基础质量流水线  
**And** 至少包含 `lint`、`test`、`integration`、`replay fixtures` 检查

**Given** 代码变更提交到主干或 PR  
**When** CI 执行  
**Then** 任一关键检查失败必须阻断合并  
**And** 输出清晰失败阶段与可重试建议

**Given** 本地环境可能存在版本或依赖漂移  
**When** 我执行 `ai-dev doctor`  
**Then** 命令返回运行时诊断结果，至少包含 Node 版本、npm 可用性、CLI 安装状态  
**And** 当 Node 版本不满足最低要求时，输出明确校验失败原因与升级建议

**Given** 我以 `--json` 运行 `ai-dev doctor`  
**When** 系统返回  
**Then** 输出遵循统一 envelope（`ok/data/meta` 或 `ok/error/meta`）  
**And** 返回字段稳定可机读，便于后续自动化环境校验

## Epic 2: Stage-based Orchestration & Transition Control

开发者可以按阶段推进流程，获取下一步建议，并由系统保证迁移合法与可追踪。

### Story 2.1: Define and Persist Fixed Stage Set with Legal Transition Matrix

**Implements:** FR6, FR7, FR9


As a AI-first 开发者,  
I want 系统使用固定的阶段集合与显式合法迁移矩阵,  
So that 工作流推进有确定规则且不会出现隐式或非法状态跳转。

**Acceptance Criteria:**

**Given** Runtime 初始化完成  
**When** Stage Engine 加载阶段定义  
**Then** 系统只接受固定 stage 集：`IDLE`、`RESEARCH`、`PLAN`、`IMPLEMENT`、`REVIEW`、`EXECUTE`、`RECOVER`  
**And** 任何未定义 stage 在校验阶段即被拒绝

**Given** 我请求阶段迁移  
**When** `from -> to` 命中合法迁移矩阵  
**Then** 系统判定为合法迁移并允许进入目标阶段  
**And** 迁移判定结果可被后续命令（如 `next`）直接复用

**Given** 我请求阶段迁移  
**When** `from -> to` 不在合法迁移矩阵中  
**Then** 系统阻断迁移且当前阶段不变  
**And** 返回机读错误码 `EVT_INVALID_STAGE_TRANSITION` 与可恢复动作提示

**Given** 系统重启或中断恢复后  
**When** 重新加载阶段模型  
**Then** 固定 stage 集与合法迁移矩阵保持一致（不可漂移）  
**And** 当前阶段可从快照状态稳定恢复

**Given** 架构定义了合法迁移关系  
**When** Stage Engine 完成初始化  
**Then** 合法迁移矩阵至少包含以下边：`IDLE->RESEARCH`、`RESEARCH->PLAN`、`PLAN->IMPLEMENT`、`IMPLEMENT->REVIEW`、`REVIEW->EXECUTE`、`REVIEW->IMPLEMENT`、`EXECUTE->IDLE`、`EXECUTE->RECOVER`、`RECOVER->IMPLEMENT`、`RECOVER->REVIEW`、`RECOVER->IDLE`  
**And** 非上述边默认视为非法

**Given** 代码库中存在 stage 与迁移定义  
**When** 系统完成构建与启动  
**Then** Stage enum 与 transition map 必须来自同一个单一真相源（Single Source of Truth）  
**And** 不允许在命令层、引擎层或测试中出现平行手写矩阵导致漂移

### Story 2.2: Enforce Transition Guards and Block Illegal Stage Jumps

**Implements:** FR7, FR9


As a AI-first 开发者,  
I want 系统在每次阶段迁移前执行 guard 校验并阻断非法跳转,  
So that 工作流不会进入不一致状态并且错误可恢复、可诊断。

**Acceptance Criteria:**

**Given** 我触发任意会导致阶段变化的命令  
**When** 系统执行迁移前校验  
**Then** 必须先校验当前阶段、目标阶段、触发条件是否满足  
**And** 仅在 guard 通过时才允许写入 `stage_transition` 事件

**Given** 迁移 guard 失败  
**When** 系统处理该请求  
**Then** 当前阶段保持不变且不写入新的阶段迁移事件  
**And** 返回机读错误码（如 `EVT_INVALID_STAGE_TRANSITION` 或对应 guard 错误）与可恢复动作

**Given** 命令在并发或锁冲突条件下触发迁移  
**When** workspace lock 未获取成功  
**Then** 系统不得执行迁移 guard 的落盘副作用  
**And** 返回明确锁冲突错误并指示重试或安全接管

**Given** 用户使用 `--json` 调用  
**When** guard 通过或失败返回  
**Then** 输出遵循统一 envelope（`ok/data/meta` 或 `ok/error/meta`）  
**And** `meta` 中包含结构化 `guard_result`，至少包含 `from_stage`、`to_stage`、`guard_type`、`guard_passed`、`failed_reasons`

**Given** guard 规则升级或新增  
**When** 系统加载规则  
**Then** 所有 guard 必须可追溯到已定义的阶段与迁移矩阵  
**And** 不允许出现脱离单一真相源的临时判定逻辑

**Given** 系统实现 guard 机制  
**When** 我查看 guard 定义  
**Then** guard 必须有明确类型体系（至少包含 `state_guard`、`policy_guard`、`integrity_guard`、`lock_guard`）  
**And** 每类 guard 的输入、判定与失败输出字段保持一致且可测试

### Story 2.3: Generate Next Allowed Actions and Recommendations by Stage Rules

**Implements:** FR7, FR8


As a AI-first 开发者,  
I want 系统根据当前阶段规则生成“允许动作”和“下一步建议”,  
So that 我可以在不猜流程的情况下持续推进任务。

**Acceptance Criteria:**

**Given** 当前会话存在有效阶段状态  
**When** 我执行 `ai-dev next`  
**Then** 系统基于阶段规则计算当前允许动作集合  
**And** 输出至少包含 `allowed_actions` 与 `recommended_action`

**Given** 系统定义了标准动作集合  
**When** 我查看 `allowed_actions` 输出  
**Then** 候选动作必须来自标准集合：`next`、`approve`、`reject`、`other`、`handoff`、`resume`、`replay`  
**And** 不允许输出未注册或歧义动作名

**Given** 当前阶段有多个可行动作  
**When** 系统生成建议  
**Then** 按已定义优先级规则返回 Top 建议  
**And** 给出建议理由（规则命中、约束满足、阻塞解除）

**Given** 当前阶段受 Gate 或策略约束  
**When** 我执行 `ai-dev next`  
**Then** 系统不得建议被策略禁止的动作  
**And** 若无可执行动作，返回明确阻塞原因与解锁路径

**Given** 当前上下文缺少生成建议的必要信息  
**When** 系统尝试生成推荐  
**Then** 返回结构化错误（含缺失字段与修复建议）  
**And** 不输出虚假推荐结果

**Given** 用户以 `--json` 调用  
**When** `ai-dev next` 返回建议  
**Then** `data` 至少包含 `current_stage`、`allowed_actions`、`recommended_action`、`recommendation_reasons`  
**And** `recommendation_reasons` 采用结构化数组，元素至少包含 `reason_code`、`message`、`evidence_refs`

### Story 2.4: Expose Current Stage and Last Transition Result

**Implements:** FR10


As a AI-first 开发者,  
I want 随时查看当前阶段状态与最近一次迁移结果,  
So that 我可以快速判断流程位置、最近动作是否成功以及下一步是否可执行。

**Acceptance Criteria:**

**Given** 工作流已初始化并产生阶段事件  
**When** 我执行 `ai-dev stage`  
**Then** 系统返回当前 `stage` 与 `stage_entered_at`  
**And** 显示最近一次迁移结果摘要（`from_stage`、`to_stage`、`transition_status`、`transition_reason`）

**Given** 最近一次迁移失败或被阻断  
**When** 我执行 `ai-dev stage`  
**Then** 返回失败类型与错误码  
**And** 提供可恢复动作（重试、回退、补充条件、改路由）

**Given** 还未发生任何迁移（仅初始化）  
**When** 我执行 `ai-dev stage`  
**Then** 系统返回初始阶段状态与“暂无迁移记录”的明确标识  
**And** 不返回空语义或模糊默认值

**Given** 用户以 `--json` 调用  
**When** `ai-dev stage --json` 返回  
**Then** `data` 至少包含 `session_id`、`current_stage`、`stage_entered_at`、`allowed_actions`、`last_transition`  
**And** `last_transition` 结构固定包含 `from_stage`、`to_stage`、`status`、`reason_code`、`event_id`

**Given** 系统定义迁移状态  
**When** 我读取 `transition_status`  
**Then** 状态值必须来自枚举集合：`succeeded`、`blocked`、`failed`  
**And** 不允许返回未定义或自由文本状态值

**Given** 当前事件链存在一致性异常  
**When** 系统读取最近迁移结果  
**Then** 必须返回明确错误而不是不可信状态  
**And** 提示使用 `ai-dev replay` 或 `ai-dev resume` 进行恢复

### Story 2.5: Record Stage Transition Events with Reason and Context Reference

**Implements:** FR11


As a AI-first 开发者,  
I want 系统在每次阶段迁移时写入标准化 `stage_transition` 事件,  
So that 我可以追溯“为什么迁移、基于什么上下文迁移、迁移结果是什么”。

**Acceptance Criteria:**

**Given** 阶段迁移 guard 通过  
**When** 系统执行迁移动作  
**Then** 必须写入 `stage_transition` 事件到 append-only event log  
**And** 事件至少包含 `event_id`、`session_id`、`from_stage`、`to_stage`、`transition_status`、`reason_code`、`context_ref`、`trigger_command`、`ts`、`checksum`

**Given** 阶段迁移被阻断或失败  
**When** 系统处理迁移请求  
**Then** 必须写入可审计的迁移结果事件（同一事件类型，`transition_status=blocked|failed`）  
**And** 记录失败原因、guard 结果摘要与可恢复动作提示

**Given** 系统定义迁移原因  
**When** 写入 `reason_code`  
**Then** 值必须来自受控枚举（如 `rule_matched`、`gate_required`、`guard_blocked`、`policy_denied`、`recovered_transition`）  
**And** 不允许自由文本替代枚举值

**Given** 事件成功写入  
**When** 我执行事件查询（如 `ai-dev events`）  
**Then** 可以按 `stage`、`transition_status`、时间范围检索迁移事件  
**And** 查询结果可回溯到对应 `context_ref` 与 `trigger_command`

**Given** 迁移事件写入后  
**When** 系统进行完整性校验  
**Then** 该事件参与 checksum chain 计算并可通过校验  
**And** 若校验失败，系统进入明确错误态并阻断后续不安全推进

**Given** 用户以 `--json` 读取迁移记录  
**When** 返回事件数据  
**Then** 字段命名保持稳定且符合 `snake_case`  
**And** `transition_status` 仅允许 `succeeded`、`blocked`、`failed`

## Epic 3: Human Gate Governance & Decision Escalation

决策者可以在关键节点执行 approve/reject/other，并在反复拒绝时触发治理升级。

### Story 3.1: Define Gate Policy Model with Required Stages and Gate State Machine

**Implements:** FR12


As a AI-first 开发者,  
I want 系统定义可配置的 Gate 策略模型并绑定必须人工决策的阶段,  
So that 关键阶段迁移必须经过可追溯的人类治理而不是自动放行。

**Acceptance Criteria:**

**Given** Runtime 完成初始化并加载默认策略  
**When** 系统构建 Gate policy  
**Then** 必须包含 `required stages` 规则（至少覆盖 `RESEARCH->PLAN`、`PLAN->IMPLEMENT`、`REVIEW->EXECUTE`）  
**And** 每条规则都绑定明确的 gate 名称与触发条件

**Given** 用户通过配置覆盖 Gate 策略  
**When** 系统执行策略校验  
**Then** 仅允许引用已定义 stage 与合法迁移边  
**And** 对非法 stage、重复规则、冲突规则返回结构化校验错误

**Given** 系统定义 Gate 决策输入  
**When** 我查看 `decision` 字段约束  
**Then** 决策值必须来自受控枚举：`approve`、`reject`、`other`  
**And** 不允许自由文本作为决策类型

**Given** Gate 被触发后进入生命周期  
**When** 系统更新 Gate 进度  
**Then** Gate 必须按状态模型流转（至少包含 `pending`、`decided`、`escalated`、`closed`）  
**And** 不允许跳过状态或出现未定义状态值

**Given** 系统加载 Gate 策略  
**When** 策略生效  
**Then** 必须输出并记录 `gate_policy_version`  
**And** 策略版本变化可被审计追踪

**Given** 新 Gate 实例被创建  
**When** 系统生成 `gate_id`  
**Then** `gate_id` 必须遵循稳定生成规则（例如 `session_id + stage + gate_name + sequence`）  
**And** 在同一会话内保持唯一且可追溯

**Given** 系统记录 Gate 决策原因  
**When** 写入 `reason_code`  
**Then** 值必须来自受控枚举（如 `policy_required`、`manual_override`、`risk_high`、`insufficient_evidence`、`scope_change`）  
**And** 不允许自由文本替代枚举值

**Given** Gate 状态发生变化  
**When** 系统写入记录  
**Then** 记录至少包含 `gate_id`、`session_id`、`stage`、`required`、`status`、`decision`、`reason_code`、`decided_by`、`ts`  
**And** 字段命名保持 `snake_case` 且可用于后续审计查询

### Story 3.2: Implement `approve` / `reject` / `other` Gate Decision Commands with Validation

**Implements:** FR13, FR14, FR15


As a Gate 决策者,  
I want 通过标准命令提交 `approve`、`reject`、`other` 决策并完成严格校验,  
So that Gate 决策可执行、可追溯且不会因输入歧义导致治理失效。

**Acceptance Criteria:**

**Given** 当前会话存在 `pending` Gate  
**When** 我执行 `ai-dev approve`  
**Then** 系统将该 Gate 决策写为 `decision=approve` 并更新 Gate 状态  
**And** 返回标准结果（含 `decision_id`、`gate_id`、`session_id`、`decision`、`status`）

**Given** 当前会话存在 `pending` Gate  
**When** 我执行 `ai-dev reject --reason <reason_code> --comment <text>`  
**Then** 系统将决策写为 `decision=reject` 且必须包含有效 `reason_code`  
**And** 若缺少必填理由则拒绝提交并返回结构化校验错误

**Given** 当前会话存在 `pending` Gate  
**When** 我执行 `ai-dev other --proposal <alternative> --reason <reason_code>`  
**Then** 系统将决策写为 `decision=other` 并记录替代方向  
**And** 决策结果可被后续路由与建议生成消费

**Given** 决策命令提交  
**When** 系统校验 `decision`  
**Then** 决策值必须来自枚举：`approve`、`reject`、`other`  
**And** 非枚举值一律拒绝并返回机读错误码

**Given** 决策写入事件  
**When** 系统生成决策元数据  
**Then** 必须生成全局可追踪 `decision_id` 并记录 `decided_by`  
**And** `decided_by` 不可为空且可回溯到执行主体

**Given** 我提交 `decision_comment`  
**When** 系统执行输入校验  
**Then** `decision_comment` 长度必须满足约束（例如 `1..2000` 字符）  
**And** 超出长度时返回字段级校验错误并拒绝写入

**Given** Gate 已是 `decided` 或 `closed`  
**When** 我再次提交任意决策命令  
**Then** 系统拒绝重复决策  
**And** 返回明确错误与可恢复动作（查看状态或进入下一步）

**Given** 用户以 `--json` 调用决策命令  
**When** 命令成功或失败返回  
**Then** 输出遵循统一 envelope（`ok/data/meta` 或 `ok/error/meta`）  
**And** `data/meta` 至少包含 `decision_id`、`gate_id`、`session_id`、`decision`、`decided_by`、`previous_status`、`current_status`、`reason_code`

### Story 3.3: Trigger Escalation Path on Repeated `reject` Decisions

**Implements:** FR16


As a Gate 决策者,  
I want 系统在连续 `reject` 达到阈值时自动触发升级路径,  
So that 高风险或反复争议决策不会在同一层级无限循环。

**Acceptance Criteria:**

**Given** Gate 策略定义了 `reject` 升级阈值（如 `max_reject_count=2`）  
**When** 同一 Gate 或同一阶段在同一会话内连续发生 `reject`  
**Then** 系统在达到阈值时自动触发 escalation  
**And** 该 Gate 状态从 `decided` 进入 `escalated`

**Given** escalation 被触发  
**When** 系统写入事件与状态  
**Then** 必须生成并记录 `escalation_id`，并记录升级原因、触发阈值、累计拒绝次数与升级目标  
**And** 生成可追踪升级记录（含 `gate_id`、`session_id`、`stage`、`decision_id` 引用链）

**Given** escalation 状态下用户继续提交普通决策  
**When** 决策命令执行  
**Then** 系统按策略限制普通路径（阻止或重定向）  
**And** 返回明确动作指引（例如需人工升级审批或指定 `other` 路径）

**Given** 系统定义升级目标  
**When** 我读取 `escalation_target`  
**Then** 值必须来自受控枚举（如 `higher_reviewer`、`owner_override`、`architecture_review`、`manual_intervention`）  
**And** 不允许未定义目标值

**Given** 不同 Gate 或阶段并存  
**When** 系统统计 `reject` 次数  
**Then** 必须按 `reject_counter_scope` 规则计数（默认 `session_id + gate_id`，可配置为 `session_id + stage`）  
**And** 不允许跨无关 Gate 误累计

**Given** 用户以 `--json` 调用相关命令  
**When** escalation 触发或未触发  
**Then** 返回结构化 `escalation_result`  
**And** 至少包含 `escalation_id`、`escalated`、`reject_count`、`threshold`、`escalation_target`、`next_required_action`

### Story 3.4: Persist Gate Evidence Chain and Auditable Decision Records

**Implements:** FR17


As a 合规与治理导向的开发者,  
I want 系统为每次 Gate 决策保存完整证据链与审计记录,  
So that 我可以在复盘、排障与审阅时准确还原“谁在什么上下文下做了什么决策、为何这样做”。

**Acceptance Criteria:**

**Given** 任一 Gate 决策命令执行（`approve`、`reject`、`other`）  
**When** 系统完成决策写入  
**Then** 必须写入决策审计事件并关联 `decision_id`、`gate_id`、`session_id`、`stage`、`decision`、`reason_code`、`decided_by`、`ts`  
**And** 审计事件以 append-only 方式持久化并可检索

**Given** 决策依赖上下文材料  
**When** 系统记录证据  
**Then** 必须保存 `evidence_refs`（如 context packet、上游事件、相关命令输出引用）  
**And** 证据引用可追溯到具体 `event_id` 或 `context_ref`

**Given** 决策从 `pending` 进入 `decided`、`escalated` 或 `closed`  
**When** 状态变化发生  
**Then** 系统记录状态转移链并保留 `previous_status -> current_status`  
**And** 同时记录触发动作与操作者信息，避免审计断链

**Given** 我需要审阅某次 Gate 决策  
**When** 我执行查询（如 `ai-dev events` 或后续 audit 视图命令）  
**Then** 可以按 `gate_id`、`decision`、`reason_code`、时间范围检索  
**And** 查询结果包含最小可审计字段集与证据引用摘要

**Given** 用户以 `--json` 获取决策审计数据  
**When** 系统返回结果  
**Then** 输出字段稳定且符合 `snake_case`  
**And** 至少包含 `decision_id`、`gate_id`、`status_transition`、`evidence_refs`、`checksum_valid`

## Epic 4: Multi-Agent Context Handoff & Adapter Routing

开发者可以进行跨 Agent 协作与路由，确保上下文连续、结果可回写、连接器可管理。

### Story 4.1: Define Agent Roles, Adapter Capability Schema, and Default Routing Config

**Implements:** FR23, FR24, FR40


As a AI-first 开发者,  
I want 配置默认执行 Agent 与深度分析 Agent，并让系统按统一能力契约识别可用适配器,  
So that 我可以稳定地把任务路由到正确 Agent 且保证上下文交接契约一致。

**Acceptance Criteria:**

**Given** 项目已初始化并存在运行时配置  
**When** 我查看或设置 Agent 角色配置  
**Then** 系统仅接受 `agent_role` 枚举值：`default_executor`、`deep_analyzer`  
**And** 每个角色必须绑定且仅绑定一个已注册 adapter（MVP 可为 Claude/Codex）

**Given** 系统加载 adapter 注册信息  
**When** 执行能力校验  
**Then** 每个 adapter 必须符合 `adapter_capability_schema`  
**And** schema 至少包含：`adapter_id`、`adapter_version`、`provider`、`supported_roles`、`supported_commands`、`context_packet_versions`、`routing_priority`、`json_output_supported`、`adapter_status`

**Given** 系统定义 adapter 状态  
**When** 我读取 `adapter_status`  
**Then** 值必须来自受控枚举：`active`、`inactive`、`degraded`  
**And** 不允许未定义状态值参与路由

**Given** 我将某 adapter 绑定到角色  
**When** schema 校验失败（字段缺失、类型错误、版本不兼容）  
**Then** 绑定必须被拒绝  
**And** 返回字段级错误与可恢复动作（修正 schema、切换 adapter、回退配置）

**Given** 系统准备执行跨 Agent 路由  
**When** 加载上下文契约  
**Then** 必须声明并校验 `context_packet_contract`（至少含 `schema_version`、`session_id`、`stage`、`constraints`、`task_intent`、`evidence_refs`）  
**And** 仅允许向声明兼容 `context_packet_versions` 的 adapter 分发请求

**Given** 系统计算候选 adapter  
**When** 存在多个可用适配器  
**Then** 必须根据 `routing_priority` 决定默认选择顺序  
**And** 选择结果可解释且可在输出中追踪

**Given** 用户以 `--json` 查看配置  
**When** 返回路由与角色信息  
**Then** 输出至少包含 `default_executor_adapter`、`deep_analyzer_adapter`、`agent_roles`、`capability_validation`、`context_packet_contract_version`  
**And** 所有字段命名保持 `snake_case` 且稳定可机读

### Story 4.2: Route Requests via Strategy and Priority-Aware Adapter Router

**Implements:** FR24


As a AI-first 开发者,  
I want 系统按路由策略与优先级在可用 adapter 间做确定性选择,  
So that 每次执行都能落到正确 Agent 且路由结果可解释、可复现。

**Acceptance Criteria:**

**Given** 当前请求已声明目标 `agent_role`  
**When** Router 选择 adapter  
**Then** 必须只在支持该 role 的 adapter 中选择  
**And** 若无候选，返回明确错误与可恢复动作（改 role、启用 adapter、回退默认）

**Given** 系统定义路由策略  
**When** Router 执行决策  
**Then** 必须使用受控 `routing_strategy`（如 `role_first`、`priority_first`、`policy_driven`）  
**And** 输出中记录本次实际使用的 `routing_strategy_used`

**Given** 存在多个候选 adapter  
**When** Router 执行排序  
**Then** 必须按 `routing_priority` 从高到低选择  
**And** 同优先级时使用稳定 tie-break 规则（例如按 `adapter_id` 字典序）

**Given** 某候选 adapter 状态非可用  
**When** `adapter_status` 为 `inactive` 或 `degraded`  
**Then** Router 不得将其作为首选执行目标  
**And** 应按策略选择下一可用 adapter 或返回降级提示

**Given** 首选 adapter 不可用且存在备用  
**When** Router 执行降级  
**Then** 必须切换到配置的 `fallback_adapter`（若存在且可用）  
**And** 输出中标记为 fallback 路由并给出原因码

**Given** 路由策略要求深度分析  
**When** 请求类型命中深度分析条件  
**Then** Router 必须优先选择 `deep_analyzer` 绑定 adapter  
**And** 在策略输出中注明命中规则与原因码

**Given** 用户以 `--json` 调用  
**When** Router 返回路由结果  
**Then** `data/meta` 至少包含 `routing_decision_id`、`selected_adapter_id`、`agent_role`、`candidate_adapters`、`routing_priority_snapshot`、`routing_strategy_used`、`routing_reason_code`  
**And** 字段命名保持 `snake_case` 且可用于后续审计

### Story 4.3: Execute Cross-Agent Handoff via `ai-dev handoff`

**Implements:** FR25


As a AI-first 开发者,  
I want 使用 `ai-dev handoff` 将当前任务从一个 Agent 交接给另一个 Agent,  
So that 我可以在不重述背景的情况下切换执行与深度分析通道。

**Acceptance Criteria:**

**Given** 当前会话存在有效上下文与目标路由  
**When** 我执行 `ai-dev handoff --to <agent_role|adapter_id>`  
**Then** 系统创建 handoff 请求并绑定 `routing_decision_id`  
**And** 返回 `handoff_id`、`handoff_chain_id`、源/目标 adapter、触发命令与当前阶段信息

**Given** handoff 目标不可用或不兼容  
**When** 系统执行目标校验  
**Then** handoff 必须被阻断且不改变当前执行状态  
**And** 返回明确错误（能力不兼容、目标不可用、策略禁止）与恢复动作

**Given** handoff 请求创建成功  
**When** 系统写入事件  
**Then** 必须生成 `agent_handoff` 事件并记录 `handoff_id`、`handoff_chain_id`、`session_id`、`from_adapter`、`to_adapter`、`agent_role`、`handoff_direction`、`handoff_phase`、`context_packet_version`、`trigger_command`、`ts`  
**And** 事件遵循 append-only 与 checksum 规则

**Given** 系统定义 handoff 生命周期  
**When** 我读取 `handoff_phase`  
**Then** 值必须来自受控枚举（如 `prepared`、`dispatched`、`acknowledged`、`completed`、`failed`）  
**And** 不允许未定义阶段值

**Given** 系统定义 handoff 方向  
**When** 我读取 `handoff_direction`  
**Then** 值必须来自受控枚举（如 `executor_to_analyzer`、`analyzer_to_executor`、`peer_to_peer`）  
**And** 方向值必须与 `from_adapter/to_adapter` 关系一致

**Given** 用户在 handoff 时要求说明理由  
**When** 我传入 handoff 注释或原因  
**Then** 系统记录 `handoff_reason_code` 与可选 `handoff_comment`  
**And** 注释长度与字段格式通过校验后才允许写入

**Given** 用户以 `--json` 调用 handoff  
**When** 命令成功或失败返回  
**Then** 输出遵循统一 envelope，且 `data/meta` 至少包含 `handoff_id`、`handoff_chain_id`、`routing_decision_id`、`from_adapter`、`to_adapter`、`context_packet_version`、`handoff_status`  
**And** `handoff_status` 仅允许受控枚举值（如 `initiated`、`completed`、`failed`）

### Story 4.4: Assemble and Validate Context Packet Contract for Handoff

**Implements:** FR18, FR19, FR20, FR22


As a AI-first 开发者,  
I want 系统在 handoff 前组装并校验标准化 Context Packet,  
So that 目标 Agent 能在一致契约下理解任务状态、约束与证据而无需重复解释。

**Acceptance Criteria:**

**Given** 我触发 `ai-dev handoff` 或需要跨 Agent 执行  
**When** 系统组装 Context Packet  
**Then** 必须包含契约必填字段：`context_packet_id`、`schema_version`、`context_packet_version`、`session_id`、`stage`、`task_intent`、`constraints`、`evidence_refs`、`recent_events`、`source_adapter`、`packet_created_at`  
**And** 字段命名统一为 `snake_case`

**Given** Context Packet 组装完成  
**When** 系统执行契约校验  
**Then** 必须按 `context_packet_contract` 做结构与类型校验  
**And** 任一必填字段缺失或类型错误必须阻断 handoff

**Given** 系统准备分发 Context Packet  
**When** 写入或发送 packet  
**Then** 必须计算并携带 `packet_checksum`  
**And** 接收端可据此验证 packet 未被篡改

**Given** 目标 adapter 声明支持的 `context_packet_versions`  
**When** 当前 `context_packet_version` 不兼容  
**Then** 系统拒绝分发并返回版本不兼容错误  
**And** 提供恢复动作（切换 adapter、降级或升级 packet 版本）

**Given** Context Packet 中包含证据引用  
**When** 系统写入或发送 packet  
**Then** `evidence_refs` 必须可追溯到有效 `event_id/context_ref`  
**And** 不允许悬空引用进入下游 Agent

**Given** 当前会话尚未产生 Gate 相关证据事件（Epic 3 能力未启用或尚未触发）  
**When** 系统组装 Context Packet  
**Then** `evidence_refs` 允许为空数组但字段必须存在  
**And** 后续一旦存在可用证据事件，必须按契约回填可追溯引用

**Given** 用户以 `--json` 调用并查看 packet 校验结果  
**When** 系统返回  
**Then** `data/meta` 至少包含 `context_packet_id`、`context_packet_version`、`contract_version`、`packet_checksum`、`validation_status`、`validation_errors`  
**And** `validation_status` 仅允许受控枚举（如 `passed`、`failed`）

### Story 4.5: Write Back Agent Output to Current Stage Context

**Implements:** FR21, FR26


As a AI-first 开发者,  
I want 系统把目标 Agent 的执行结果回写到当前阶段上下文,  
So that 我可以在同一会话中持续推进而不丢失跨 Agent 产出。

**Acceptance Criteria:**

**Given** handoff 后目标 Agent 返回执行结果  
**When** 系统接收结果载荷  
**Then** 必须写入标准回写记录并关联 `session_id`、`stage`、`handoff_id`、`routing_decision_id`、`source_adapter`、`target_adapter`  
**And** 结果可在当前阶段上下文中直接读取

**Given** 系统执行回写  
**When** 写入事件链  
**Then** 必须产生 `agent_result` 事件（或失败时 `agent_compensation`）  
**And** 事件需关联同一 `intent_id`，满足两阶段协议一致性

**Given** 回写内容包含结构化建议与证据  
**When** 系统持久化上下文  
**Then** 必须保存 `result_schema_version`、`result_summary`、`result_payload_ref`、`evidence_refs`、`result_created_at`、`result_origin`  
**And** 任何大体积内容采用引用方式落盘而非内联膨胀事件

**Given** 回写结果准备持久化  
**When** 系统执行完整性处理  
**Then** 必须生成并记录 `result_checksum`  
**And** 后续读取可据此验证结果未被篡改

**Given** 下游流程消费回写结果  
**When** 消费动作完成  
**Then** 系统更新 `result_consumed` 状态  
**And** 可追溯首次消费时间与消费命令

**Given** 回写失败（解析错误、schema 不兼容、写入失败）  
**When** 系统处理异常  
**Then** 返回明确错误码与恢复动作  
**And** 不得污染当前阶段的已确认上下文

**Given** 用户以 `--json` 查询回写结果  
**When** 系统返回  
**Then** `data/meta` 至少包含 `result_id`、`intent_id`、`stage`、`writeback_status`、`result_checksum`、`result_schema_version`、`result_consumed`、`result_origin`、`source_adapter`、`target_adapter`  
**And** `writeback_status` 仅允许受控枚举（如 `written`、`compensated`、`failed`）

### Story 4.6: Continue Same Workflow After Handoff Without Rebuilding State

**Implements:** FR22, FR27


As a AI-first 开发者,  
I want 在 handoff 完成后继续同一工作流会话,  
So that 我无需重建任务状态或重复配置就能直接进入下一步执行。

**Acceptance Criteria:**

**Given** handoff 已成功并完成结果回写  
**When** 我继续执行 `ai-dev next` 或相关命令  
**Then** 系统沿用原 `session_id`、当前 `stage` 与上下文快照  
**And** 不要求重新初始化或手动重建上下文

**Given** handoff 形成链路  
**When** 系统恢复会话上下文  
**Then** 必须基于 `handoff_chain_id` 关联最近一次交接与结果  
**And** 保证链路在事件查询中可追溯

**Given** 存在多个连续 handoff  
**When** 我在同一会话继续推进  
**Then** 系统按 `result_sequence` 顺序消费最近有效结果  
**And** 避免旧结果覆盖新结果导致状态倒退

**Given** 继续执行时发现上下文不一致（checksum/contract 不匹配）  
**When** 系统执行 preflight  
**Then** 必须阻断继续并返回明确错误  
**And** 提示进入 `resume/replay` 或重新 handoff 的恢复路径

**Given** 系统记录连续执行切换点  
**When** continuation 被建立  
**Then** 必须生成并记录 `continuation_event_id`、`continuation_source`、`continuation_checkpoint`  
**And** 字段可用于后续恢复与审计回溯

**Given** 用户以 `--json` 查询会话连续性状态  
**When** 系统返回  
**Then** `data/meta` 至少包含 `session_id`、`handoff_chain_id`、`continuation_event_id`、`continuation_source`、`continuation_checkpoint`、`result_sequence`、`continuation_status`、`last_result_id`、`current_stage`  
**And** `continuation_status` 仅允许受控枚举（如 `ready`、`blocked`、`recover_required`）

### Story 4.7: Manage Restricted Adapter Connectors (Register, Enable, Disable, Declare Capabilities)

**Implements:** FR40


As a AI-first 开发者,  
I want 在受限边界内管理 adapter 连接器（注册、启停、能力声明）,  
So that 我可以安全扩展 Agent 接入而不破坏运行时一致性与治理规则。

**Acceptance Criteria:**

**Given** 我尝试注册新 adapter  
**When** 执行注册命令或配置加载  
**Then** 系统仅允许受支持提供方与受控字段集  
**And** 必须通过 `adapter_capability_schema` 与版本兼容校验后才注册成功

**Given** 注册动作成功  
**When** 系统写入注册记录  
**Then** 必须生成并返回 `adapter_registration_id`  
**And** 注册记录可与后续启停与健康检查关联

**Given** 连接器启停管理被执行  
**When** 我执行 enable 或 disable  
**Then** 系统更新 `adapter_status`（`active`、`inactive`、`degraded`）并写入审计事件  
**And** 被停用 adapter 不得参与新路由决策

**Given** 连接器声明作用域  
**When** 我查看或更新 `adapter_scope`  
**Then** 值必须来自受控范围（如 `project_local`、`workspace_shared`）  
**And** 不允许超出策略边界的跨作用域调用

**Given** adapter 声明能力发生变化  
**When** 我更新 capability 声明  
**Then** 必须重新校验 `supported_roles`、`supported_commands`、`context_packet_versions`、`routing_priority`  
**And** 输出 `capability_validation_status`（`passed`、`failed`），失败时保持旧配置不变并返回字段级错误

**Given** 系统执行连接器健康检查  
**When** 健康检查完成  
**Then** 必须更新 `adapter_last_healthcheck`  
**And** 健康异常可触发状态降级为 `degraded`

**Given** 连接器管理动作执行  
**When** 系统记录审计  
**Then** 必须写入 `adapter_management` 事件，至少包含 `adapter_id`、`adapter_version`、`adapter_registration_id`、`adapter_scope`、`action`、`actor`、`ts`、`reason_code`  
**And** 事件遵循 append-only 与 checksum 规则

**Given** 用户以 `--json` 查询连接器状态  
**When** 系统返回  
**Then** 输出至少包含 `adapter_id`、`adapter_version`、`adapter_status`、`adapter_scope`、`supported_roles`、`routing_priority`、`capability_validation_status`、`adapter_last_healthcheck`  
**And** 字段命名稳定为 `snake_case`，便于自动化管理与审计

## Epic 5: Recovery, Resume & Deterministic Replay

开发者可以在异常中断后恢复与回放，系统以一致性校验和快照锚点保障恢复正确性。

### Story 5.1: Enforce Preflight Validation Pipeline Before Recovery

**Implements:** FR29, FR31


As a AI-first 开发者,  
I want 系统在执行恢复前强制通过 preflight 校验流水线,  
So that 只有一致且可验证的状态才能进入 `resume/replay`，避免错误恢复污染工作流。

**Acceptance Criteria:**

**Given** 我触发 `ai-dev resume` 或 `ai-dev replay`  
**When** 系统进入 preflight  
**Then** 必须按固定顺序执行校验：`checksum_chain -> snapshot_anchor -> schema_compatibility`  
**And** 任一步失败立即 hard-stop，不得继续后续步骤

**Given** preflight 正在执行  
**When** 系统进入每个校验阶段  
**Then** 必须记录当前 `preflight_stage`  
**And** 阶段值必须与固定顺序一致且可追溯

**Given** checksum chain 校验执行  
**When** 系统遍历事件链  
**Then** 必须按 canonical event JSON 规则逐条重算并比对 checksum  
**And** 检测到不一致时返回明确错误码与首个失败事件位置（`failed_event_id`、`failed_event_index`）

**Given** snapshot anchor 校验执行  
**When** 系统读取最新快照  
**Then** 必须验证 `last_event_id` 与 `last_event_checksum` 和事件链一致  
**And** 锚点不一致时阻断恢复，并返回 `snapshot_event_index` 与可选恢复路径

**Given** schema 兼容校验执行  
**When** 系统加载事件与上下文版本  
**Then** 必须验证 `schema_version` 与 upcaster 可用性  
**And** 不兼容且不可升级时返回结构化错误并停止恢复

**Given** preflight 通过并进入 replay  
**When** 系统执行回放  
**Then** 必须满足 replay determinism 约束（同一输入事件序列 + 同一快照锚点 => 同一恢复状态）  
**And** 若检测到非确定性结果，系统标记为恢复失败并禁止提交恢复状态

**Given** snapshot 被用于恢复  
**When** 系统检查 snapshot 生命周期  
**Then** 必须识别并处理状态：`created`、`active`、`superseded`、`invalidated`、`archived`  
**And** 仅允许 `active` 快照作为默认恢复锚点

**Given** 用户以 `--json` 运行 preflight  
**When** 系统返回结果  
**Then** `data/meta` 至少包含 `preflight_id`、`preflight_runtime_version`、`validation_order`、`checksum_status`、`anchor_status`、`schema_status`、`determinism_status`、`snapshot_lifecycle_state`  
**And** 所有状态字段使用受控枚举并保持 `snake_case`

### Story 5.2: Resume Safely with Hard-Stop on Validation Failure

**Implements:** FR28, FR29, FR31, FR32


As a AI-first 开发者,  
I want 通过 `ai-dev resume` 在中断后安全恢复会话,  
So that 我可以在通过校验后继续推进流程，并在失败时得到明确阻断与恢复指引。

**Acceptance Criteria:**

**Given** 会话处于中断或待恢复状态  
**When** 我执行 `ai-dev resume`  
**Then** 系统必须先执行完整 preflight 校验  
**And** 仅在 preflight 全部通过后才允许进入恢复流程

**Given** preflight 任一阶段失败  
**When** `ai-dev resume` 处理结果  
**Then** 系统必须 hard-stop，保持当前会话状态不变  
**And** 返回结构化错误（含 `preflight_stage`、失败原因、恢复建议）

**Given** preflight 通过  
**When** 系统执行 resume  
**Then** 必须从 `active` snapshot 锚点恢复到可继续阶段  
**And** 生成 `resume` 事件并关联 `session_id`、`resume_id`、`snapshot_id`、`resume_status`

**Given** 恢复流程开始执行  
**When** 系统选定恢复锚点  
**Then** 必须记录 `resume_checkpoint_event_index` 与 `resume_source`  
**And** `resume_source` 必须明确标识来源（如 `snapshot_anchor` 或 `replay_checkpoint`）

**Given** 恢复过程中检测到状态漂移或结果不确定  
**When** 系统比对恢复后状态与回放预期  
**Then** 必须终止恢复并标记失败  
**And** 提示用户使用 `ai-dev replay` 或指定 checkpoint 重新恢复

**Given** 用户以 `--json` 调用 `ai-dev resume`  
**When** 系统返回结果  
**Then** `data/meta` 至少包含 `resume_id`、`session_id`、`resume_status`、`resumed_stage`、`snapshot_id`、`preflight_id`、`resume_runtime_version`、`resume_duration_ms`、`resume_checkpoint_event_index`、`resume_source`  
**And** `resume_status` 仅允许受控枚举（如 `resumed`、`blocked`、`failed`）

### Story 5.3: Replay Events Deterministically with Checkpoint Segmentation

**Implements:** FR30


As a AI-first 开发者,  
I want 使用 `ai-dev replay` 对事件流进行确定性回放并支持 checkpoint 分段,  
So that 我可以在排障与恢复时重建可信状态且控制回放范围。

**Acceptance Criteria:**

**Given** 会话存在可回放事件链  
**When** 我执行 `ai-dev replay`  
**Then** 系统必须按事件顺序回放并重建状态  
**And** 回放结果与同输入条件下历史重建结果一致（deterministic）

**Given** 我指定回放起止点或 checkpoint  
**When** 系统执行分段回放  
**Then** 必须仅回放指定区间事件  
**And** 分段边界与 `checkpoint_event_index` 一致且可审计

**Given** 用户选择回放模式  
**When** 系统执行 replay  
**Then** 必须明确记录 `replay_mode`（如 `full`、`checkpoint_segment`）  
**And** 回放结果中可追溯实际模式

**Given** 回放过程中存在 schema 版本差异  
**When** 系统处理旧版本事件  
**Then** 必须通过 upcaster 进行兼容转换  
**And** 转换失败时立即停止并返回结构化错误

**Given** 回放期间检测到 checksum 异常  
**When** 系统校验事件完整性  
**Then** 必须终止回放并标记失败  
**And** 返回首个异常 `event_id/index` 与建议恢复动作

**Given** 回放完成  
**When** 系统汇总结果  
**Then** 必须返回 `replayed_event_count` 与 `state_hash_after_replay`  
**And** 该状态哈希可用于验证 replay determinism

**Given** 用户以 `--json` 调用 `ai-dev replay`  
**When** 系统返回  
**Then** `data/meta` 至少包含 `replay_id`、`session_id`、`replay_status`、`replay_runtime_version`、`replay_mode`、`replay_start_event_index`、`replay_end_event_index`、`checkpoint_event_index`、`replayed_event_count`、`state_hash_after_replay`、`determinism_status`  
**And** `replay_status` 仅允许受控枚举（如 `completed`、`partial`、`failed`）

### Story 5.4: Manage Snapshot Lifecycle and Recovery Checkpoints

**Implements:** FR42


As a AI-first 开发者,  
I want 系统在阶段迁移与关键动作时生成并管理 snapshot 生命周期,  
So that 我可以基于稳定恢复点进行快速恢复并避免使用失效快照。

**Acceptance Criteria:**

**Given** 系统发生关键阶段迁移或恢复锚点更新  
**When** 触发 snapshot 生成  
**Then** 必须创建新 snapshot 并记录 `snapshot_id`、`snapshot_parent_id`、`session_id`、`stage`、`snapshot_event_index`、`last_event_checksum`、`snapshot_checksum`、`snapshot_size_bytes`、`created_at`  
**And** 新 snapshot 默认进入 `created` 状态，完成校验后转为 `active`

**Given** 系统创建 snapshot  
**When** snapshot 完成写入  
**Then** 必须记录 `snapshot_runtime_version`  
**And** 该版本号可用于后续兼容性与审计分析

**Given** 新 snapshot 被激活  
**When** 系统更新生命周期  
**Then** 上一个 `active` snapshot 必须转为 `superseded`  
**And** 同一会话任一时刻最多一个 `active` snapshot

**Given** snapshot 完整性校验失败或锚点失效  
**When** 系统处理生命周期  
**Then** 必须将该 snapshot 标记为 `invalidated`  
**And** 禁止其作为 `resume` 默认恢复源

**Given** 历史 snapshot 超过保留策略  
**When** 系统执行归档  
**Then** 必须将其转为 `archived` 并保持可审计元数据  
**And** 归档策略不得删除当前 `active` 或最近 `superseded` 的最小恢复集

**Given** 用户以 `--json` 查询 snapshot 状态  
**When** 系统返回  
**Then** `data/meta` 至少包含 `snapshot_id`、`snapshot_parent_id`、`snapshot_checksum`、`snapshot_size_bytes`、`snapshot_runtime_version`、`snapshot_lifecycle_state`、`snapshot_event_index`、`is_active_recovery_anchor`、`superseded_by_snapshot_id`  
**And** `snapshot_lifecycle_state` 仅允许 `created`、`active`、`superseded`、`invalidated`、`archived`

### Story 5.5: Classify Recovery Failures and Return Actionable Error Paths

**Implements:** FR31


As a AI-first 开发者,  
I want 系统对恢复失败进行标准化错误分类并给出可执行恢复动作,  
So that 我能快速定位失败原因并选择正确的下一步（重试、回放、回退、人工介入）。

**Acceptance Criteria:**

**Given** `resume`、`replay`、`preflight` 任一步失败  
**When** 系统生成错误结果  
**Then** 必须映射到受控错误码族（至少 `RESUME_*`、`EVT_*`、`LOCK_*`、`CFG_*`）  
**And** 每个错误码都绑定明确 `recovery_action`（如 `retry`、`replay`、`reroute`、`manual_stop`）

**Given** 错误由 preflight 引发  
**When** 系统返回失败信息  
**Then** 必须包含 `preflight_stage`、`failed_event_id`、`failed_event_index`（若适用）  
**And** 提供对应阶段的修复建议（checksum 修复、anchor 重选、schema upcast）

**Given** 错误由 resume 引发  
**When** 系统写入失败事件  
**Then** 必须记录 `resume_id`、`resume_source`、`resume_checkpoint_event_index`、`resume_status`、`error_code`  
**And** 失败事件可与同一次恢复链路关联查询

**Given** 错误由 replay 引发  
**When** 系统返回失败结果  
**Then** 必须记录 `replay_id`、`replay_mode`、`replay_start_event_index`、`replay_end_event_index`、`determinism_status`  
**And** 给出“缩小区间重放”或“切换 checkpoint”建议路径

**Given** 系统返回恢复错误  
**When** 组织错误元数据  
**Then** 必须包含 `error_severity`、`error_origin`、`related_event_id`、`suggested_command`  
**And** 这些字段必须可用于自动化告警、分级处理与快速修复

**Given** 用户以 `--json` 查询失败详情  
**When** 系统返回  
**Then** `data/error/meta` 至少包含 `error_code`、`error_family`、`error_severity`、`error_origin`、`related_event_id`、`recovery_action`、`recovery_steps`、`suggested_command`、`correlation_id`  
**And** 输出字段稳定、`snake_case`、可用于自动化告警与回放脚本

## Epic 6: Runtime Observability & Decision Audit

开发者可以检查事件与阶段状态、检索导出审计轨迹，形成运行时可观测与复盘闭环。

### Story 6.1: Provide Unified Observability Query Contract for `log/events/stage`

**Implements:** FR43, FR44, FR45


As a AI-first 开发者,  
I want 使用统一查询契约访问 `ai-dev log`、`ai-dev events`、`ai-dev stage`,  
So that 我能以一致方式查看运行态信息并让工具链稳定消费输出。

**Acceptance Criteria:**

**Given** 我执行 `ai-dev log`、`ai-dev events`、`ai-dev stage` 任一命令  
**When** 系统返回数据  
**Then** 必须遵循统一 Query Contract（统一请求参数与响应 envelope）  
**And** 合约至少包含：`query_id`、`query_contract_version`、`session_id`、`time_range`、`filters`、`sort`、`pagination`、`observability_scope`

**Given** 我使用分页查询  
**When** 返回结果超过单页限制  
**Then** 系统必须使用 cursor pagination 返回 `next_cursor` 与 `prev_cursor`  
**And** 同一查询条件下 cursor 翻页结果顺序稳定、无重复、无漏项

**Given** 我指定观测范围  
**When** 设置 `observability_scope`  
**Then** 系统仅返回该范围内数据（如 `runtime`、`workflow`、`gate`、`adapter`）  
**And** 未授权或超范围 scope 必须被拒绝并返回结构化错误

**Given** 我以 `--json` 调用三类命令  
**When** 系统返回  
**Then** `data/meta` 字段结构一致（命令差异只体现在 `data.items` 类型）  
**And** 至少包含 `query_contract_version`、`result_count`、`total_estimate`、`query_latency_ms`、`query_source` 且字段命名保持 `snake_case`

**Given** 查询条件非法（时间范围反转、无效 cursor、未知过滤字段）  
**When** 系统校验参数  
**Then** 返回字段级错误与修复建议  
**And** 不执行部分查询或隐式降级查询

### Story 6.2: Support Rich Filtering and Retrieval for Events and Decisions

**Implements:** FR33, FR34, FR44


As a AI-first 开发者,  
I want 按 stage、gate、decision、status、time、session 等条件检索事件与决策,  
So that 我可以快速定位关键行为与异常链路，而不是手动扫描全量日志。

**Acceptance Criteria:**

**Given** 我执行 `ai-dev events` 或 `ai-dev log` 查询  
**When** 提供过滤条件  
**Then** 系统必须支持组合过滤：`session_id`、`stage`、`gate_id`、`decision`、`status`、`event_type`、`time_range`  
**And** 多条件过滤结果满足 AND 语义并保持可预测排序

**Given** 系统暴露查询能力  
**When** 我查看可过滤元信息  
**Then** 必须返回 `filterable_fields` 清单  
**And** 清单字段与后端实际可过滤字段保持一致

**Given** 我需要检索 Gate 决策历史  
**When** 指定 `decision` 与 `reason_code` 过滤  
**Then** 系统返回匹配的决策记录与关联事件链  
**And** 每条记录包含最小审计字段（`decision_id`、`gate_id`、`decided_by`、`ts`）

**Given** 我按时间窗口查询  
**When** 设置 `time_range`  
**Then** 系统仅返回窗口内数据，边界行为明确（含起止）  
**And** 超范围或非法时间参数返回字段级错误

**Given** 我指定排序  
**When** 提供 `sort_field` 与 `sort_direction`  
**Then** 系统按受控排序字段执行稳定排序  
**And** 非法排序字段或方向必须返回校验错误

**Given** 我指定 `event_type` 过滤  
**When** 执行查询  
**Then** 系统仅返回匹配的事件类型集合  
**And** 未知事件类型应返回结构化错误而非空结果掩盖问题

**Given** 我启用 `partial_match`（用于文本/标签字段）  
**When** 执行查询  
**Then** 系统仅在允许部分匹配的字段上执行模糊匹配  
**And** 不允许把 `partial_match` 应用于精确字段（如 `event_id`、`session_id`）

**Given** 查询结果较大  
**When** 使用 cursor pagination 翻页  
**Then** 系统保持过滤条件与排序稳定  
**And** 不出现跨页重复或漏项

**Given** 用户以 `--json` 查询  
**When** 系统返回  
**Then** `data/meta` 至少包含 `query_id`、`observability_scope`、`applied_filters`、`applied_filter_count`、`sort_field`、`sort_direction`、`page_size`、`next_cursor`  
**And** 输出字段稳定为 `snake_case`，可供自动化审计脚本直接消费

### Story 6.3: Export Events and Decisions with Stable Audit Contract

**Implements:** FR36


As a AI-first 开发者,  
I want 将事件与决策历史按稳定契约导出,  
So that 我可以用于审阅、复盘、合规归档与自动化分析，而不受命令输出波动影响。

**Acceptance Criteria:**

**Given** 我执行导出命令（如 `ai-dev events --export` 或 `ai-dev log --export`）  
**When** 系统生成导出结果  
**Then** 导出格式必须遵循稳定 JSON 合约  
**And** 合约至少包含 `export_id`、`export_contract_version`、`export_format`、`session_id`、`time_range`、`applied_filters`、`items`

**Given** 导出数据包含事件与决策记录  
**When** 系统序列化输出  
**Then** 每条记录必须保留审计关键字段（如 `event_id`、`event_type`、`ts`、`stage`、`decision_id`、`gate_id`、`reason_code`）  
**And** 字段命名必须保持 `snake_case` 且向后兼容

**Given** 我指定导出范围  
**When** 设置 `observability_scope`、`time_range`、过滤条件  
**Then** 导出结果只包含匹配数据  
**And** 导出元数据中必须回显 `applied_filter_count` 与 `result_count`

**Given** 导出数据量较大  
**When** 系统执行导出  
**Then** 必须支持分页游标串联导出或流式导出模式  
**And** 最终导出总量与查询总量一致（可由 `total_estimate` 对照验证）

**Given** 系统执行导出作业  
**When** 导出完成  
**Then** 必须记录 `export_item_count`、`export_mode`、`export_source_query_id`、`exported_by`  
**And** 同时生成并返回 `export_checksum` 用于完整性校验

**Given** 用户以 `--json` 获取导出执行结果  
**When** 系统返回  
**Then** `data/meta` 至少包含 `export_id`、`export_status`、`export_format`、`export_mode`、`export_item_count`、`result_count`、`total_estimate`、`query_latency_ms`、`query_source`、`export_source_query_id`、`exported_by`、`export_checksum`、`exported_at`  
**And** `export_status` 仅允许受控枚举（如 `completed`、`partial`、`failed`）

### Story 6.4: Enforce Mandatory Audit Trail for Critical Runtime Actions

**Implements:** FR35, FR38, FR41


As a AI-first 开发者,  
I want 系统对关键动作强制留痕并保持可验证审计链,  
So that 无论运行成功或失败，我都能完整追溯关键决策与执行路径。

**Acceptance Criteria:**

**Given** 发生关键动作（`workspace_initialized`、`stage_transition`、`gate_decision`、`agent_handoff`、`resume`）  
**When** 系统处理该动作  
**Then** 必须写入对应标准事件  
**And** 任一关键动作写入失败时必须阻断当前流程并返回错误

**Given** 关键事件被写入  
**When** 系统构建审计链  
**Then** 每条事件必须包含 `event_id`、`session_id`、`event_type`、`stage`、`actor`、`ts`、`checksum`、`context_ref`、`previous_event_checksum`  
**And** 事件按 append-only 顺序可验证链接（chain integrity）

**Given** 系统执行关键动作审计检查  
**When** 审计规则加载  
**Then** 必须记录 `critical_event_set_version` 与 `audit_chain_version`  
**And** 版本变化必须可追溯并可复现审计结果

**Given** 我查询某会话关键动作覆盖情况  
**When** 执行审计检查  
**Then** 系统必须返回关键事件覆盖结果（哪些动作已记录、哪些缺失）  
**And** 缺失项必须标记为审计风险并给出修复建议

**Given** 关键事件链存在完整性异常  
**When** 系统执行审计验证  
**Then** 必须返回 `checksum_valid=false` 与异常定位信息  
**And** 禁止将该链路标记为可审计通过

**Given** 用户以 `--json` 获取关键审计结果  
**When** 系统返回  
**Then** `data/meta` 至少包含 `audit_check_id`、`session_id`、`audit_actor`、`audit_checked_at`、`critical_event_coverage`、`missing_critical_events`、`checksum_valid`、`audit_chain_version`、`critical_event_set_version`、`audit_status`  
**And** `audit_status` 仅允许受控枚举（如 `passed`、`warning`、`failed`）
