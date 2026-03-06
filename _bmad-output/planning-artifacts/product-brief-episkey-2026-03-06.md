---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowCompleted: true
inputDocuments:
  - _bmad-output/analysis/brainstorming-session-2026-03-06.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - AI_DEV_SYSTEM.md
  - claude-code-codex-workflow.md
  - bmad-fullstack-guide.html
  - guide-cn.html
  - guide-updev-cn.html
date: 2026-03-06
author: Episkey
---

# Product Brief: episkey

## Executive Summary

AI-DEV Runtime 是面向 AI-first 开发者的状态化编排运行时。

当开发者开始高频使用多个 AI Agent（Claude、Codex、Cursor 等）进行软件开发时，最大的瓶颈已经从"代码生成"转向了"上下文管理、决策连续性和流程治理"。开发者沦为多 AI 之间的人工中间件——不断重复解释背景、手工传递约束、凭记忆维护流程状态。

AI-DEV Runtime 通过 Stage Engine、Human Gates、Decision Log 和 Context Vault，将 AI 辅助开发从"对话工具阶段"推进到"运行时阶段"。它不是更强的 coding model，也不是更好的 prompt 工具，而是多 Agent 软件工程协作的编排与治理基础设施。

MVP 聚焦 CLI-only 执行平面，在 11 天验证窗口内优先验证上下文切换时间降低 >= 70% 与恢复稳定性 >= 95%。

---

## Core Vision

### Problem Statement

AI 辅助开发已经进入多 Agent 协作阶段。开发者日常在 Claude、Codex、Cursor、ChatGPT 之间频繁切换，每次切换都必须重新解释：项目背景、分支改动、设计原因、约束条件、当前卡点。这种上下文重建每次耗时 3-10 分钟，一天发生 10-30 次，构成高频、持续的效率损耗。

更严重的是，切换不仅带来时间成本，还引发结果漂移——新 Agent 不了解前一个 Agent 的隐含假设，可能给出偏离方向的建议，开发者再切回时又要解释"为什么不能那么做"。最终，人不是在开发，而是在充当多 AI 之间的人工中间件。

### Problem Impact

- **效率损耗**：每天 30-300 分钟消耗在上下文重建上，而非创造性工作。
- **质量风险**：跨 Agent 的隐含假设丢失导致决策不一致，代码方向漂移。
- **治理缺失**：没有决策留痕、没有状态持久化、没有恢复机制——中断即丢失。
- **认知过载**：开发者必须同时充当 PM、Architect、Developer、Reviewer，还要手工维护所有 Agent 之间的协调状态。

### Why Existing Solutions Fall Short

| 现有方案 | 能力边界 | 根本缺失 |
|---------|---------|---------|
| Cursor / Windsurf | 编辑器内 prompt 自动化 | 没有跨 Agent 编排、没有状态机、没有治理层 |
| LangGraph / CrewAI | AI 应用内的 Agent 编排 | 面向构建 AI 产品，不是治理软件开发工作流 |
| BMAD Method | 结构化规划与开发流程 | 依赖人工切换 Agent，没有运行时 |
| 手工 Claude+Codex | 灵活，覆盖面广 | 全靠人肉编排，上下文断裂、不可恢复 |

核心空白：**目前没有人专门解决"多 Agent 协作开发的编排与治理"问题。** 市面上的工具要么在做单 Agent 更强，要么在做 AI 应用编排，但没有人在做 AI software engineering runtime。

### Proposed Solution

AI-DEV Runtime 是一个本地优先的 CLI 编排运行时，通过四个核心原语将 AI 开发工作流从手工对话升级为可治理的工程系统：

- **Stage Engine**：FSM 状态机驱动阶段推进，消除手工流程管理。
- **Human Gates**：关键节点三态决策（approve / reject / other），人做拍板、系统做推进。
- **Decision Log / Event Flow**：append-only JSONL 事件流，决策留痕、可回放、可审计。
- **Context Vault / Context Packet**：跨 Agent 切换时自动组装上下文包，消除重复解释。

开发者的体验从"不断解释"变为"持续推进"：`ai-dev next` 继续工作、`ai-dev handoff` 无缝切换、`ai-dev resume` 中断恢复。

### Key Differentiators

1. **范式定义者**：不是更好的 AI 工具，而是第一个"AI 软件工程治理运行时"——新品类。
2. **可控自治**：不追求全自动，而是"建议模式默认 + 人工可控自治"，开发者始终握有决策权。
3. **可恢复性**：基于事件溯源的状态管理，支持 deterministic replay 和一致性恢复，中断不再意味着丢失。
4. **本地优先**：Context Vault 默认本地存储，数据主权归开发者，不依赖云端。
5. **时机窗口**：多 Agent 开发已经是现实，但编排层还是空白——正是建立标准的最佳时机。

## Target Users

### Primary Users

#### 1. Indie Builder（最核心用户）

**画像：** 单人开发产品的独立开发者，每天使用多个 AI 工具（Claude、Codex、Cursor、ChatGPT、Windsurf），技术栈灵活，追求开发速度最大化。

**典型工作流：** Claude 设计 -> Cursor 写代码 -> Codex debug -> ChatGPT 解释文档，日均 AI 切换 10-30 次。

**核心痛点：** 每次换 AI 都要重新解释项目背景、约束和当前状态，是最先感知到上下文断裂问题的群体。

**为什么是核心用户：** 切换最频繁、痛感最强、adoption 最快。他们也是最可能成为早期 adopter、开源贡献者和社区传播者（HN、Twitter、Discord）的人。

#### 2. AI-Native Engineer（第二核心）

**画像：** 在公司工作的工程师，已经 AI-native，大量使用 AI 但工具链是个人搭建。常见组合：Cursor + Claude + ChatGPT + GitHub Copilot。

**核心痛点：** 公司没有统一 AI 工作流，个人效率依赖自建流程，缺乏编排层。

**产品角色：** 个人效率工具用户，同时是团队内部的传播者——"我最近在用一个 runtime 管 AI workflow"。

#### 3. Open Source Maintainer（第三梯队）

**画像：** 维护开源项目，日常涉及 PR review、issue triage，使用 AI 写 patch、解释 bug、重构代码。

**核心痛点：** AI 建议经常忘记之前的讨论上下文。

**最看重的能力：** Decision Log——决策可追溯，PR 审查有据可查。

**Primary User 优先级：** Indie Builder > AI-Native Engineer > OSS Maintainer。Indie Builder 切换最频繁、痛感最强，是 MVP 验证的首选人群。

### Secondary Users

MVP 阶段不做功能支持，但需要理解他们未来会来：

- **Tech Lead**：关心团队 AI workflow governance（审计、可追溯、统一流程），对应 Decision Log 和 Stage Engine，但团队 adoption 节奏慢，属于 Phase 2+。
- **DevEx / Platform Engineer**：关心团队 AI 工具治理和 AI coding policies，属于 Phase 2 范畴。

不在 MVP 考虑团队用户的原因：单人 adoption 更快，验证闭环更短。

### User Journey

**典型 Indie Builder 的一天（理想状态）：**

| 时段 | 动作 | 体验 |
|------|------|------|
| 早上 | `ai-dev resume` | 恢复昨天的完整工作状态，无需重建上下文 |
| 上午 | `ai-dev next` | 从当前工程状态继续推进，系统知道 stage、约束和待办 |
| 下午 | `ai-dev handoff` | 换 Agent 时自动打包 Context Packet，无需重新解释 |
| 晚上 | 查看 Decision Log | 回顾一天的 AI 决策记录，确认方向一致性 |

**Aha Moment 层次结构：**

1. **第一层（Magic Moment）：** `ai-dev handoff` —— "我不用再解释了，它知道刚才发生了什么。" 这是用户第一次感受到 runtime 价值的瞬间。
2. **第二层（信任建立）：** `ai-dev resume` —— 电脑关机，第二天继续，系统记得所有上下文。
3. **第三层（系统认知）：** Decision Log —— 用户看到所有 AI 决策记录时，意识到"这是一个系统，不是脚本"。

**North Star 行为指标：** Daily Agent Handoffs —— 代表 runtime 被真正使用。

## Success Metrics

### North Star Metric

**Context Switch Time Reduction >= 70%**

这是产品核心假设的直接验证：AI 开发的最大瓶颈是上下文管理，而非代码生成。

- **基线测量**：3-5 名 AI-first 开发者，10-15 个开发任务，3 天基线窗口，记录手工 Agent 切换的上下文重建时间（预期 3-10 分钟/次）。
- **目标**：使用 AI-DEV Runtime 后，上下文切换时间降至 10-30 秒（通过 Context Packet + handoff）。
- **判定逻辑**：如果 CST Reduction >= 70%，核心假设成立，产品方向正确；如果不成立，产品价值不存在。

### Behavioral Metrics

证明 runtime 被真正使用，而非仅被安装。

| 指标 | 目标 | 说明 |
|------|------|------|
| Median Daily Agent Handoffs | >= 3 | Active User 定义：每天 >= 3 次 handoff。用中位数而非平均值，避免 power user 扭曲。< 3 次说明可能只是测试工具。 |
| Orchestration Cycle Completion | >= 20 users in first 30 days | 完整 cycle = init -> next -> handoff -> gate decision -> resume。20 人完成至少 1 次完整 cycle 即验证产品方向基本成立。 |

### Technical Reliability

保证 runtime 基础可用性，是用户信任的底线。

| 指标 | 目标 | 说明 |
|------|------|------|
| Resume Success Rate | >= 95% | 中断恢复必须可靠，否则用户不敢依赖 runtime |
| Gate p95 Latency | <= 2s | 决策交互必须流畅，不能成为流程瓶颈 |
| Decision Log Completeness | >= 99% | 事件不丢失是可追溯和可恢复的基础 |

### Business Objectives

| 时间窗口 | 指标 | 目标 | 说明 |
|----------|------|------|------|
| MVP（11 天） | CST Reduction | >= 70% | 核心假设验证 |
| First 30 days | Orchestration Cycles | >= 20 users | 产品方向验证 |
| 3 个月 | WAU | >= 200 | 增长信号，激进但可达 |

### Key Performance Indicators

**MVP 成功判定（必须全部满足）：**
- Context Switch Time Reduction >= 70%
- Resume Success Rate >= 95%
- Technical reliability thresholds met

**Phase 2 入场条件（必须全部满足）：**
- CST Reduction >= 70%
- Resume Success Rate >= 95%
- 至少一个 adoption 信号：WAU >= 50 或连续两周 WAU 增长

**单一最重要指标：** Context Switch Time Reduction —— 如果这个指标不达标，其他一切都不重要，因为产品核心价值不存在。

## MVP Scope

### Core Features

MVP 必须包含 6 个核心能力，形成完整的 runtime 闭环：`next -> handoff -> gate -> events -> snapshot -> resume`。缺任何一个，runtime loop 会断。

| 能力 | 功能 | 对应价值 |
|------|------|---------|
| Stage Engine (FSM) | 状态机驱动阶段推进，合法迁移校验 | `ai-dev next` 持续推进 |
| Human Gates | 三态决策（approve/reject/other）+ 升级路径 | 人做拍板、系统做推进 |
| Decision Log (JSONL) | append-only 事件流，checksum 校验 | 决策留痕、可回放、可审计 |
| Context Vault / Packet | 跨 Agent 切换时自动组装上下文包 | `ai-dev handoff` Magic Moment |
| Resume / Replay | 基于 snapshot + events 恢复一致性状态 | `ai-dev resume` 中断恢复 |
| CLI Command Surface | init / next / handoff / approve / reject / other / resume | 完整执行面 |

**Agent Connector Scope（MVP）：**
- **Claude**：default execution agent（reasoning / planning）
- **Codex**：deep analysis / code agent（code generation / debugging）
- 两个 Agent 已覆盖 design -> implementation 核心开发链路
- Cursor / ChatGPT / OpenAI / local models 归入 Phase 2，因为每增加一个 agent 意味着 adapter、auth、context format mapping、rate limit、error handling 全套工程量

**Configuration Strategy（Zero-Config by Default）：**
- `ai-dev init` 自动生成 `.ai-dev/config.yaml`，用户无需编辑即可运行 `ai-dev next`
- 配置复杂度分层：Level 0 = zero config（MVP default），Level 1 = optional config edits，Level 2 = advanced policies
- MVP 只实现 Level 0，保障 Day-1 onboarding <= 30 分钟

### Out of Scope for MVP

| 明确排除 | 原因 | 归属阶段 |
|----------|------|---------|
| Web 控制面板 | CLI-first（git/docker/terraform/kubectl 皆如此），UI 会把 11 天 MVP 拖到 6 周 | Phase 2 |
| Cursor / ChatGPT / OpenAI connectors | 每增加一个 agent 工程量翻倍，MVP 两个已覆盖核心链路 | Phase 2 |
| 多用户协作 / 团队治理 | 单人 adoption 更快，验证闭环更短 | Phase 2+ |
| 云同步 | 本地优先是硬约束，云同步必须 opt-in | Phase 2 |
| 高级可视化 | CLI `ai-dev log` / `ai-dev events` / `ai-dev stage` 已够用 | Phase 2 |
| IDE 集成 | 不是 runtime 核心 | Phase 3 |
| 高级配置（gate policy / routing rules） | MVP zero-config 优先 | Phase 2 |

### MVP Success Criteria

MVP 在 11 天验证窗口内必须满足：

1. **核心假设验证**：Context Switch Time Reduction >= 70%
2. **Runtime 可靠性**：Resume Success Rate >= 95%，Gate p95 <= 2s，Decision Log >= 99%
3. **闭环可运行**：至少 1 个完整 orchestration cycle（init -> next -> handoff -> gate -> resume）可端到端跑通
4. **Day-1 可上手**：从安装到首个 workflow <= 30 分钟，zero-config

### Future Vision

**Phase 2（Growth）：**
- 最小 Web 控制面板（Timeline、Gate evidence、Decision Log viewer）
- 可选云同步（opt-in）
- 扩展 Connector 覆盖（Cursor、OpenAI、local models）
- 轻量协作能力

**Phase 3（Expansion）：**
- 多租户云编排
- 高级分析与可视化
- 深度 IDE 集成
- 组织级治理与策略控制

**终极愿景：** 从个人开发者的 AI 工程治理系统，扩展到小团队的 AI workflow 编排层，最终成为组织级的 AI software delivery runtime。
