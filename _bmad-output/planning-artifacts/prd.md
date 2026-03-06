---
project: episkey
workflowType: prd
projectType: greenfield
createdAt: 2026-03-06T18:09:04+0800
lastUpdated: 2026-03-06T18:41:40+0800
stepsCompleted:
- step-01-init
- step-02-discovery
- step-03-success
- step-04-journeys
- step-05-domain
- step-06-innovation
- step-07-project-type
- step-08-scoping
- step-09-functional
- step-10-nonfunctional
- step-11-polish
inputDocuments:
- _bmad-output/analysis/brainstorming-session-2026-03-06.md
- AI_DEV_SYSTEM.md
- bmad-fullstack-guide.html
- claude-code-codex-workflow.md
- guide-cn.html
- guide-updev-cn.html
documentCounts:
  brief: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
  referenceDocs: 5
  total: 6
classification:
  projectType: developer_tool
  domain: general
  complexity: high
  projectContext: greenfield
---

# Product Requirements Document - episkey

**Author:** Episkey
**Date:** 2026-03-06

## Executive Summary

AI-DEV Runtime 是面向 AI-first 开发者的状态化编排运行时，目标是把多 Agent 手工协作从“聊天驱动”升级为“可编排、可治理、可恢复”的交付流程。

产品通过 Stage Engine、Human Gates、Decision Log 与 Context Vault/Packet，降低跨 Agent 上下文切换成本并提供可追溯决策链。

MVP 聚焦 CLI-only 执行平面，在 11 天验证窗口内优先验证 Context Switch Time Reduction（>=70%）与恢复稳定性（resume >=95%）。

## Success Criteria

### User Success

- Context Switch Time Reduction >= 70%.
- Manual agent switching baseline: 3-10 minutes due to context re-explanation.
- Target switching time with AI-DEV Runtime: 10-30 seconds via Context Packet + Local Context Vault.
- User task coverage in validation: feature implementation, bug fixing, refactoring, API integration.

### Business Success

- 3-month primary metric: WAU >= 200 (effective active users only).
- Effective active user definition: complete at least one orchestration cycle per week, including Stage progression, Gate decision, and Decision Log events.
- Supporting signal: weekly orchestrations >= 3 per user.

### Technical Success

- Gate p95 latency <= 2s.
- Resume success rate >= 95%.
- Decision log completeness >= 99%.

### Measurable Outcomes

- Baseline study: 3-5 AI-first developers, 10-15 development tasks, 3-day baseline window.
- MVP experiment window: 11 days.
- MVP success criteria: if Context Switch Time Reduction >= 70% and stability thresholds are met, MVP is successful even if business adoption is not yet significant.
- Core hypothesis to validate: the primary AI development bottleneck is context management across agents.

## Product Scope

### MVP - Minimum Viable Product

- Stage Engine.
- Human Gates.
- Decision Log / Event Flow.
- Context Packet + Local Context Vault.
- CLI execution plane with next / approve / reject / other / replay / resume.
- CLI-only first release scope; Web control plane enters Phase 2.

### Growth Features (Post-MVP)

- Multi-user collaboration and shared governance.
- Deeper integration across Claude, Codex, Cursor, and additional tools.
- Advanced analytics and optimization recommendations.
- Stronger recovery and exception diagnosis capabilities.

### Vision (Future)

- A general AI development orchestration runtime that is observable, controllable, auditable, and recoverable.
- Expansion from solo developer governance to team/organization-level engineering governance.

## User Journeys

### Journey 1: Primary User - Success Path

- **Persona:** Leo, an AI-first indie developer.
- **Opening Scene:** Leo is implementing a feature. Claude completed most of the path, but complex logic requires deeper reasoning from Codex. He wants to avoid re-explaining context.
- **Rising Action:** Leo runs `ai-dev next`. Runtime assembles a Context Packet from Local Context Vault, including stage state, constraints, code delta, and pending decisions.
- **Climax:** Codex returns context-aware recommendations that can be reviewed at a Gate. Leo approves.
- **Resolution:** Agent handoff drops from minutes to seconds and keeps development flow uninterrupted.

### Journey 2: Primary User - Edge Case (Repeated Reject)

- **Persona:** Leo under high-complexity task constraints.
- **Opening Scene:** AI suggestion is rejected twice (`reject` -> v2 -> `reject`) because constraints/priority are still misunderstood.
- **Rising Action:** The system detects repeated rejection, escalates with preserved decision rationale, and supports `other` for explicit constraints.
- **Climax:** A constrained v3 recommendation is generated and passes Gate review.
- **Resolution:** The workflow recovers without context loss and preserves a traceable correction path.

### Journey 3: Admin/Ops Initialization

- **Persona:** Maya, governance maintainer (in MVP this role may be the same person as the primary user).
- **Opening Scene:** She needs to turn ad hoc AI usage into a governed runtime.
- **Rising Action:** She completes initial setup: `ai-dev init`, Gate policies, and agent routing (Claude default executor, Codex deep analysis).
- **Climax:** First real orchestration runs with expected stage transitions and policy-triggered Gate checks.
- **Resolution:** The system becomes policy-driven and repeatable rather than memory-driven.

### Journey 4: Support/Troubleshooting Recovery

- **Persona:** Noah, troubleshooting operator (MVP may be same person).
- **Opening Scene:** A workflow is interrupted and appears blocked.
- **Rising Action:** Noah inspects Decision Log and Stage Timeline, executes `resume`, and restores `stage_snapshot`.
- **Climax:** Runtime resumes with consistent context and can generate the next action.
- **Resolution:** Recovery is successful because progress can continue without semantic drift.

### Journey 5: API/Integration - Claude First

- **Persona:** Iris, integration developer.
- **Opening Scene:** She must integrate Claude Code as default execution agent and Codex as deep-analysis lane.
- **Rising Action:** She configures connector registration, default routing rules, and deep-analysis trigger conditions.
- **Climax:** A cross-agent task is automatically routed and fully logged in Decision Log.
- **Resolution:** Integration becomes controlled runtime behavior, not ad hoc scripting.

### Journey Requirements Summary

- Context handoff requires `Context Packet + Local Context Vault`.
- Stage progression requires `Stage Engine/FSM` with replayable state.
- Governance requires 3-state Human Gates and escalation rules.
- Auditability requires complete `Decision Log/Event Flow`.
- Recoverability requires `resume` and consistent `stage_snapshot` restoration.
- Orchestration requires configurable agent routing (Claude default execution, Codex deep analysis).
- Control plane visibility requires Stage Timeline, Gate evidence, recovery traces, and operational metrics.

## Domain-Specific Requirements

### Compliance & Regulatory

- SOC2 / ISO27001 are not near-term MVP targets.
- Certification readiness becomes relevant in team/multi-tenant SaaS stage, estimated 18-24 months after PMF validation.
- Current phase focuses on engineering integrity and recoverability as operational governance baseline.

### Technical Constraints

- Local-first by default: Context Vault data remains on developer machine.
- Event log must be append-only with event checksum validation.
- Full tamper-proof cryptographic chain is not required for MVP.
- Resume must restore stage and context consistency before workflow can continue.

### Integration Requirements

- MVP supports local-only execution plane:
  - CLI runtime
  - local JSONL event store
  - local context vault
- No multi-tenant remote orchestration in MVP.

### Risk Mitigations

- Primary domain risk: incorrect recovery causing corrupted workflow state.
- Mitigation controls:
  - validate event sequence and checksums before resume
  - validate stage snapshot consistency after resume
  - support deterministic replay for recovery correctness checks
  - hard-stop execution with explicit error state when consistency checks fail

## Innovation & Novel Patterns

### Detected Innovation Areas

- AI-DEV Runtime shifts AI development from chat-driven interaction to a stateful orchestration runtime.
- Stage Engine + Human Gates + Decision Log introduce state, governance, and recoverability as first-class workflow primitives.
- The innovation focus is governing AI collaboration process itself, not only automating commands/prompts.

### Market Context & Competitive Landscape

- Cursor workflows: strong on in-editor prompt automation, limited governance over multi-agent development flow.
- LangGraph: strong on orchestrating agents for building AI applications, not specifically for governing developer-centric software delivery workflows.
- AI-DEV differentiator: orchestration runtime for AI-assisted software engineering governance.

### Validation Approach

- Primary innovation validation: Context Switch Time Reduction >= 70% in two-week MVP experiment.
- Runtime stability validation thresholds:
  - Gate p95 latency <= 2s
  - Resume success rate >= 95%
  - Decision log completeness >= 99%
- Business scale validation follows after innovation-value validation.

### Risk Mitigation

- If orchestration-paradigm hypothesis underperforms, fallback to cross-agent context management layer.
- Preserve value through Context Vault + Context Packet + Decision Log even without full governance adoption.
- This fallback still reduces repeated context re-explanation across agents.

## Developer Tool Specific Requirements

### Project-Type Overview

AI-DEV Runtime is a developer tool for governing AI-assisted software delivery workflows.
The product focus is not replacing coding tools, but orchestrating multi-agent collaboration with state, governance, and recoverability.

### Technical Architecture Considerations

#### Language Matrix

- CLI runtime: Node.js.
- User project language: language-agnostic (any language).
- Configuration: YAML (`.ai-dev/config.yaml`).
- Event store: JSONL.

#### Installation Methods

- Default: `npm install -g ai-dev`.
- Alternative: Homebrew.
- Later: standalone binary distribution.

#### API Surface

- CLI commands (MVP):
  - `ai-dev init`
  - `ai-dev next`
  - `ai-dev approve`
  - `ai-dev reject`
  - `ai-dev other`
  - `ai-dev replay`
  - `ai-dev resume`
  - `ai-dev handoff`
- Config layer: `.ai-dev/config.yaml` for routing and gate policy.
- Plugin layer: limited connector API for Claude and Codex.

#### Code Examples

- Quick start workflow.
- Gate decision flow (`approve` / `reject` / `other`).
- Resume and replay recovery flow.

#### Migration Guide

- Day 0: install CLI.
- Day 1: run `ai-dev init`.
- Day 1: execute first workflow via `ai-dev next`.
- First visible benefit: first cross-agent handoff without context re-explanation.

### Implementation Considerations

- Prioritize the minimum governed loop: init -> next/handoff -> gate decision -> resume/replay.
- Keep plugin surface constrained in MVP for runtime stability.
- Keep docs and examples aligned to the core value: reducing cross-agent context switching cost.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP focused on validating cross-agent context orchestration value.
**Resource Requirements:** 1-person team.
**First Release Form:** CLI-only.

### Day-1 Usability Constraint

- A developer must be able to install, initialize, and run the first orchestration workflow within the same day.
- Target onboarding experience: ideally within 30 minutes.
- Product implication: keep CLI interface minimal and generate configuration automatically by default.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Primary cross-agent handoff success path.
- Repeated reject correction path.
- Resume/replay recovery path.

**Must-Have Capabilities:**
- Stage Engine
- Human Gates
- Decision Log
- Context Vault / Context Packet
- CLI core commands
- resume / replay

**Out-of-Scope (Phase 1):**
- multi-tenant cloud runtime
- default cloud sync
- advanced visualization
- broad third-party connectors
- team collaboration
- IDE integrations

### Post-MVP Features

**Phase 2 (Growth):**
- Introduce minimal Web control plane (timeline, gate evidence, decision log view).
- Optional cloud sync (opt-in).
- Expand connector coverage beyond initial targets.
- Introduce lightweight collaboration capabilities.

**Phase 3 (Expansion):**
- Multi-tenant cloud orchestration.
- Advanced analytics and visualization.
- Deep IDE integrations.
- Organization-level governance and policy control.

### Phase 2 Entry Trigger

All must hold:
- Context Switch Time Reduction >= 70%.
- Resume Success Rate >= 95%.
- At least one adoption signal:
  - WAU >= 50, or
  - WAU growth for two consecutive weeks.

### Risk Mitigation Strategy

**Technical Risks:** recovery inconsistency and corrupted workflow state.
Mitigation: checksum validation, stage snapshot consistency checks, deterministic replay, hard-stop on failed consistency validation.

**Market Risks:** CLI-only may limit broader early audience.
Mitigation: focus initial validation on AI-first developers with high context-switch pain.

**Resource Risks:** single-person delivery constraints.
Mitigation: enforce strict MVP boundary and defer non-core capabilities to later phases.

## Functional Requirements

### Onboarding & Workspace

- FR1: 开发者可以在本地安装并初始化 AI-DEV Runtime。
- FR2: 开发者可以为项目自动生成初始编排配置。
- FR3: 开发者可以查看与修改项目级编排配置。
- FR4: 开发者可以在初始化后直接启动首个编排工作流。
- FR5: 开发者可以在单项目范围内管理独立的编排工作区。

### Stage Orchestration

- FR6: 开发者可以按定义的阶段推进工作流。
- FR7: 系统可以基于阶段规则判断下一步允许动作。
- FR8: 开发者可以触发当前阶段的下一步建议生成。
- FR9: 系统可以阻止不合法的阶段跳转。
- FR10: 开发者可以查看当前阶段状态与最近一次迁移结果。
- FR11: 系统可以在阶段迁移时记录迁移原因与上下文引用。

### Human Gates & Decision Control

- FR12: 开发者可以配置哪些阶段必须经过人工 Gate 决策。
- FR13: 决策者可以在 Gate 上执行 `approve`。
- FR14: 决策者可以在 Gate 上执行 `reject` 并附带理由。
- FR15: 决策者可以在 Gate 上执行 `other` 并给出替代方向。
- FR16: 系统可以在连续 `reject` 后触发预定义升级路径。
- FR17: 系统可以为每次 Gate 决策保留证据与决策理由。

### Context Management

- FR18: 开发者可以为当前任务生成可复用的 Context Packet。
- FR19: 系统可以从当前工作区状态组装执行上下文。
- FR20: 开发者可以在执行前查看将被交接的上下文内容。
- FR21: 开发者可以在流程中更新任务约束与上下文说明。
- FR22: 系统可以在跨 Agent 切换时保持上下文连续性。

### Agent Routing & Handoff

- FR23: 开发者可以定义默认执行 Agent 与深度分析 Agent。
- FR24: 系统可以按路由策略选择目标 Agent 执行当前步骤。
- FR25: 开发者可以显式触发跨 Agent handoff。
- FR26: 系统可以将 Agent 输出回写到当前阶段上下文。
- FR27: 开发者可以在 handoff 后继续同一工作流而无需重建任务状态。

### Recovery & Replay

- FR28: 开发者可以从中断状态恢复工作流执行。
- FR29: 系统可以在恢复前执行一致性校验。
- FR30: 开发者可以回放历史事件序列用于排障与复盘。
- FR31: 系统可以在恢复校验失败时阻断流程并给出明确错误态。
- FR32: 开发者可以在恢复成功后继续后续阶段推进。
- FR42: 系统必须在阶段迁移时生成上下文快照，用于确定恢复点并支撑一致性恢复。

### Decision Log & Traceability

- FR33: 开发者可以查看按时间排序的决策与事件历史。
- FR34: 开发者可以按阶段、Gate、决策结果检索历史记录。
- FR35: 系统可以维持事件记录的追加式写入语义。
- FR36: 开发者可以导出工作流决策历史用于审阅与复盘。
- FR41: 系统必须在每个关键动作时写入事件记录，至少包括 `workspace_initialized`、`stage_transition`、`gate_decision`、`agent_handoff`、`resume`。

### Runtime Observability

- FR43: 系统必须提供 Runtime 可观测性命令入口，用于支持 `ai-dev log`、`ai-dev events`、`ai-dev stage` 等运行时诊断。
- FR44: 开发者可以通过命令检查 Event Log，按时间与关键维度查看事件记录。
- FR45: 开发者可以通过命令查看当前 Stage 状态与阶段上下文摘要。

### Developer Adoption Support

- FR37: 开发者可以获取“当日可上手”的快速启动指引。
- FR38: 开发者可以获取 Gate 决策流与恢复回放的示例流程。
- FR39: 开发者可以通过引导初始化从手工多 Agent 切换迁移到 AI-DEV。
- FR40: 开发者可以在受限接口边界内配置支持的 Agent 连接器。

## Non-Functional Requirements

### Performance

- NFR1: Gate 决策处理延迟在正常负载下 p95 <= 2s。
- NFR2: `ai-dev next` 从触发到可执行建议返回在标准本地环境下 p95 <= 5s。
- NFR3: `ai-dev init` 在标准本地环境下应在 <= 60s 内完成。
- NFR4: Day-1 上手路径（安装到首个工作流）在理想场景下 <= 30 分钟完成。

### Reliability

- NFR5: `resume` 成功率应 >= 95%（按 MVP 验证窗口统计）。
- NFR6: 事件日志完整率应 >= 99%（无缺失且可顺序回放）。
- NFR7: 恢复前必须执行一致性校验；校验失败时必须 hard-stop，禁止继续执行。
- NFR8: 系统中断后应支持 deterministic replay 重建最近可用状态。

### Security & Data Handling

- NFR9: Context Vault 默认本地存储，不得默认上传云端。
- NFR10: 云同步（若启用）必须为明确 opt-in 行为。
- NFR11: Event Log 必须 append-only，并支持事件 checksum 校验。
- NFR12: MVP 阶段允许本地明文 JSONL 存储；后续阶段可引入可选静态加密。

### Scalability

- NFR13: 单用户本地场景下，系统应稳定支持每日 10-30 次跨 Agent 切换工作负载。
- NFR14: 在 MVP 负载范围内，事件量增长时核心命令性能退化应可观测且可控。

### Integration

- NFR15: 首发仅要求本地集成 Claude（默认执行）与 Codex（深度分析）通道稳定可用。
- NFR16: 集成失败必须返回明确错误信息与可恢复路径（重试、回退、改路由）。
- NFR17: 跨 Agent handoff 过程中必须保持上下文包结构一致性与可追溯性。
