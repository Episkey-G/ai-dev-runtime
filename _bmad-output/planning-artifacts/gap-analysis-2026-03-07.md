# AI-DEV Runtime 差距分析与新需求总结

**日期:** 2026-03-07
**作者:** Episkey
**范围:** 原始设计未实现项 + 新增交互式 REPL 需求

---

## 一、回顾修正

Epic 1-7 回顾文档（`epic-1-7-retro-2026-03-07.md`）中部分判断与实际代码不符，以下为修正：

| 回顾判断 | 实际状态 | 说明 |
|----------|----------|------|
| `reject`/`other` 为 stub 实现 | **已完整实现** | 两者均有完整 Gate 决策逻辑、事件写入、阶段迁移 |
| `resume` preflight 缺少核心校验 | **已实现三重校验** | checksum chain + snapshot anchor + schema/upcaster 均已实现并 hard-stop |
| `replay` 缺少 checkpoint 分段 | **已实现** | `buildReplayCheckpoints` + `selectReplayEvents` + schema/checksum 校验 + hard-stop |
| 工作区文件锁未实现 | **已实现** | `workspace-lock.ts` 完整实现 `O_CREAT\|O_EXCL` + stale-lock 接管 + pid/host 校验 |
| Config 优先级解析未实现 | 需确认 | 有 `config show`/`set`/`validate` 命令，但 CLI > ENV > file 优先级逻辑需验证 |

**结论：** 回顾中列出的 P0 技术债务大部分已解决，实际遗留问题集中在 adapter 层和部分架构规范。

---

## 二、原始设计中已规划但未实现的功能

### 2.1 Adapter 层（架构核心缺口）

**来源:** architecture.md 目录结构、project-context.md、Epic 5 Story 5.4/5.5

架构设计明确规划了以下文件，但目前 `src/adapters/` 仅有 `.gitkeep` 占位：

| 规划文件 | 职责 | 状态 |
|----------|------|------|
| `src/adapters/types.ts` | Adapter 统一接口定义 | 未实现 |
| `src/adapters/claude-adapter.ts` | Claude Agent 连接器 | 未实现 |
| `src/adapters/codex-adapter.ts` | Codex Agent 连接器 | 未实现 |
| `src/adapters/adapter-router.ts` | 策略路由器（根据阶段/配置选择 Agent） | 未实现 |

**架构约束（来自 project-context.md）：**
- 外部 Agent 调用统一通过 `src/adapters/*`，禁止命令层直接请求 Claude/Codex
- adapter 调用必须产生两阶段事件：
  - 成功：`agent_intent -> agent_result`
  - 失败：`agent_intent -> agent_compensation`
- 每个 `agent_result/agent_compensation` 必须关联同一 `intent_id`
- 连接器失败需返回可恢复路径（retry/fallback/reroute）

**当前 handoff 命令的问题：**
- `handoff.ts` 中 Agent 定义（`AGENTS`）和 `ContextPacket` 接口应抽取到 adapter 层共享
- `handoff` 仅记录状态变更和事件，不触发任何真实 Agent 调用

### 2.2 Connector 两阶段协议

**来源:** architecture.md "Failure Mode Hardening"、project-context.md

| 事件对 | 说明 | 状态 |
|--------|------|------|
| `agent_intent` | 记录调用意图（intent_id、目标 agent、任务描述） | 未实现 |
| `agent_result` | 记录成功结果（关联 intent_id） | 未实现 |
| `agent_compensation` | 记录失败补偿（关联 intent_id、错误码、恢复路径） | 未实现 |

**幂等要求：** `intent_id` 作为幂等键，result/compensation 必须关联同一 intent。

### 2.3 Gate 策略完整性

**来源:** architecture.md "Gate Policies"

| 策略 | 触发条件 | 状态 |
|------|----------|------|
| `prd_freeze` | `RESEARCH -> PLAN` | 未明确实现 |
| `architecture_freeze` | `PLAN -> IMPLEMENT` | 未明确实现 |
| `high_complexity` | 中途拦截 | 未实现 |
| `release` | `REVIEW -> EXECUTE` | 未明确实现 |
| `fix_loop` | `RECOVER -> IMPLEMENT` 循环限制 | 未实现 |

当前 Gate 实现为通用的 approve/reject/other 三态决策，未按策略名称区分触发逻辑。

### 2.4 Context Vault / Context Packet 完善

**来源:** architecture.md 目录结构

| 规划文件 | 职责 | 状态 |
|----------|------|------|
| `src/context/context-packet.ts` | Context Packet 结构与 Zod 校验 | 未实现（定义内联在 handoff.ts） |
| `src/context/context-vault.ts` | 本地 Context 存储管理 | 未实现 |

### 2.5 Schema 集中管理

**来源:** project-context.md

| 规划文件 | 职责 | 状态 |
|----------|------|------|
| `src/schemas/*` | AJV/Zod 集中校验 | 目录未创建 |

当前校验逻辑分散在各命令和 core 模块中。

### 2.6 CONNECTOR_* 错误码族

**来源:** architecture.md 错误码分类

已定义的错误码族：`CFG_*`、`EVT_*`、`RESUME_*`、`LOCK_*` 均已实现。
`CONNECTOR_*` 族（用于 adapter 调用失败）尚未定义。

### 2.7 测试覆盖

| 领域 | 状态 |
|------|------|
| adapter intent/result/compensation 事件对测试 | 未实现（无 adapter） |
| `--json` contract 测试（字段稳定性） | 部分覆盖 |
| Gate 升级路径收敛测试（fix_loop 等） | 未实现 |

---

## 三、新增需求：交互式 REPL + CLI Agent 调用

### 3.1 需求背景

当前 `ai-dev` 是纯命令式 CLI——每次执行一个命令返回 JSON，用户需要手动决定下一步。这与 Claude Code 的交互式体验有很大差距。

**用户期望：** 启动 `ai-dev` 后进入持续对话模式，AI 根据当前编排阶段自动执行任务，用户可以自然语言交互。

### 3.2 核心设计

#### 3.2.1 调用方式

不接入 API，直接通过子进程调用已安装的 CLI 工具：

- **Claude Code CLI:** `claude -p "<prompt>"` — 非交互模式，流式输出
- **Codex CLI:** `codex exec "<prompt>"` — 非交互执行

```
用户输入 -> REPL 循环
  -> agent-router 根据当前 stage 选择 agent
  -> 组装 context prompt（stage、recent events、session info）
  -> spawn 子进程调用 claude/codex CLI
  -> 流式输出结果到终端
  -> 记录 agent_intent / agent_result 事件
  -> 等待下一次输入
```

#### 3.2.2 Agent 路由规则

| 阶段 | 默认 Agent | CLI 命令 | 原因 |
|------|-----------|---------|------|
| RESEARCH | codex | `codex exec` | 深度分析、需求收集 |
| PLAN | codex | `codex exec` | 架构设计、方案制定 |
| IMPLEMENT | claude | `claude -p` | 代码实现、重构 |
| EXECUTE | claude | `claude -p` | 执行部署任务 |
| REVIEW | codex | `codex exec` | 代码审查、质量分析 |
| RECOVER | claude | `claude -p` | 恢复执行 |

用户可通过 REPL 内命令 `/handoff <agent>` 手动覆盖路由。

#### 3.2.3 REPL 入口与内置命令

**入口：** `ai-dev chat` 或 `ai-dev`（无参数时默认进入）

**内置斜杠命令：**

| 命令 | 说明 |
|------|------|
| `/quit` 或 `/exit` | 退出 REPL |
| `/stage` | 显示当前阶段和会话信息 |
| `/handoff <agent>` | 手动切换当前 Agent（claude/codex） |
| `/approve [reason]` | 执行 Gate approve |
| `/reject <reason>` | 执行 Gate reject |
| `/other <direction>` | 执行 Gate other 决策 |
| `/next` | 推进到下一阶段 |
| `/replay [n]` | 回放最近 N 条事件 |
| `/history` | 显示当前会话对话历史 |
| `/help` | 显示可用命令 |

非斜杠开头的输入视为对话消息，发送给当前 Agent。

#### 3.2.4 Context Prompt 组装

每次调用 Agent 时，自动组装上下文信息注入 prompt：

```
[系统上下文]
- 当前阶段: {stage}
- 会话 ID: {sessionId}
- 当前 Agent: {agentId}
- 最近事件: {recentEvents}（最近 5 条）
- 工作区路径: {workspacePath}

[用户消息]
{userInput}
```

#### 3.2.5 事件记录

每次 Agent 调用产生两阶段事件（与架构约束对齐）：

1. 调用前写入 `agent_intent` 事件
2. 调用成功写入 `agent_result` 事件（关联同一 intent_id）
3. 调用失败写入 `agent_compensation` 事件（关联同一 intent_id + 错误信息）

---

## 四、实现优先级建议

### Phase 1: Adapter 层基础（实现原始设计）

1. `src/adapters/types.ts` — 统一接口定义（AgentAdapter 接口、调用参数、返回结构）
2. `src/adapters/claude-adapter.ts` — Claude CLI 子进程调用 + 流式输出
3. `src/adapters/codex-adapter.ts` — Codex CLI 子进程调用 + 流式输出
4. `src/adapters/adapter-router.ts` — 阶段路由 + 手动覆盖
5. 从 `handoff.ts` 抽取 `AGENTS`、`ContextPacket` 到 adapter 层
6. `CONNECTOR_*` 错误码族定义

### Phase 2: 两阶段事件协议

7. `agent_intent` / `agent_result` / `agent_compensation` 事件类型与写入
8. `intent_id` 幂等键关联
9. 集成测试覆盖

### Phase 3: 交互式 REPL

10. `src/commands/chat.ts` — REPL 命令入口
11. readline/prompt 交互循环
12. 斜杠命令解析与分发
13. Context prompt 组装
14. 流式输出管道（子进程 stdout -> 终端）
15. 对话历史管理

### Phase 4: 完善与增强

16. Gate 策略名称化（prd_freeze 等）
17. Context Packet Zod 校验集中化
18. `--json` contract 测试补齐
19. 错误恢复路径（Agent 调用超时、进程崩溃等）

---

## 五、依赖与前置条件

| 条件 | 状态 |
|------|------|
| Node.js >= 24 LTS | 已满足（v24.3.0） |
| Claude Code CLI 已安装 | 已满足（v2.1.71） |
| Codex CLI 已安装 | 已满足（v0.111.0） |
| 两个 CLI 均已认证可用 | 需确认 |

---

## 六、新增文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/adapters/types.ts` | 新增 | Adapter 统一接口 |
| `src/adapters/claude-adapter.ts` | 新增 | Claude CLI 连接器 |
| `src/adapters/codex-adapter.ts` | 新增 | Codex CLI 连接器 |
| `src/adapters/adapter-router.ts` | 新增 | 阶段路由器 |
| `src/commands/chat.ts` | 新增 | REPL 交互命令 |
| `src/cli/error-codes.ts` | 修改 | 新增 CONNECTOR_* 错误码 |
| `src/commands/handoff.ts` | 修改 | 抽取共享定义到 adapter 层 |
| `tests/unit/adapters/` | 新增 | Adapter 单元测试 |
| `tests/integration/adapter-flow/` | 新增 | 两阶段协议集成测试 |

---

*本文档作为后续 Epic/Story 拆分和实施的输入。*
