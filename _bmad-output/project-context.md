---
project_name: 'episkey'
user_name: 'Episkey'
date: '2026-03-06T19:27:30+0800'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
existing_patterns_found: 16
status: 'complete'
rule_count: 64
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Runtime: Node.js 24 LTS（主验证基线）；Node Current 仅做兼容性验证，不作为发布基线。
- Language: TypeScript 5.9（严格类型优先，禁止绕过类型系统交付核心流程）。
- CLI Framework: oclif / @oclif/core 4.5.2（命令入口与参数解析统一走 oclif）。
- Validation: AJV（配置 schema 校验）+ Zod（运行时 Context Packet 校验）。
- Event Persistence: append-only JSONL（`.ai-dev/events/events.jsonl`）+ checksum chain。
- Recovery Model: snapshot anchor + deterministic replay + resume preflight（校验失败必须 hard-stop）。
- Agent Integration: Claude（default executor）+ Codex（deep analysis）通过统一 adapter contract 接入。

**Version/Compatibility Constraints (Critical):**
- 所有命令与集成测试必须在 Node 24 LTS 下通过；不允许只在 Current 版本通过。
- 事件与上下文结构必须带 `schema_version`；跨版本读取必须经 upcaster。
- checksum 计算必须使用 canonicalized payload，禁止非确定性序列化。

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript 中内部变量/函数使用 `camelCase`，对外 JSON/Event 字段使用 `snake_case`。
- 所有跨边界数据（CLI 输出、Event payload、Context packet）必须显式类型化，禁止 `any` 漫延。
- 异步流程统一 `async/await`；禁止未处理 Promise（必须显式 `await` 或集中错误处理）。
- 错误必须使用结构化错误对象并映射到标准错误码族（`CFG_* / EVT_* / RESUME_* / LOCK_* / CONNECTOR_*`）。
- 事件写入只允许通过 `event-writer`；禁止在任意模块直接写 `.ai-dev/events/events.jsonl`。
- checksum 相关逻辑只能调用统一 canonicalization + hash 工具，禁止分散实现。
- `resume` 路径中，任何 preflight 校验失败都必须 `hard-stop`，不得“带病继续”。
- 文件锁必须走统一 `workspace-lock` 模块，禁止局部 in-memory mutex 替代。

### Framework-Specific Rules

- 所有 CLI 命令必须位于 `src/commands/**`，命令行为由 oclif 生命周期统一管理。
- 命令输入参数统一 kebab-case（如 `--session-id`），避免同义参数并存。
- 命令输出遵循统一 envelope：
  - success: `{ ok: true, data, meta }`
  - failure: `{ ok: false, error: { code, message, details }, meta }`
- `--json` 输出为稳定 contract；面向机器消费的字段禁止破坏性重命名。
- 外部 Agent 调用统一通过 `src/adapters/*`，禁止命令层直接请求 Claude/Codex。
- adapter 调用必须产生两阶段事件：
  - 成功：`agent_intent -> agent_result`
  - 失败：`agent_intent -> agent_compensation`
- 每个 `agent_result/agent_compensation` 必须关联同一 `intent_id`。
- 连接器失败需返回可恢复路径（retry/fallback/reroute），且记录对应错误码。

### Testing Rules

- 测试目录固定分层：`tests/unit`、`tests/integration`、`tests/e2e`，禁止混放。
- 事件与恢复链路必须有 fixture 驱动测试（`tests/fixtures/events`、`tests/fixtures/snapshots`）。
- `resume` 相关改动必须覆盖三类场景：
  1. checksum chain 通过
  2. snapshot anchor 不匹配（应 hard-stop）
  3. schema/upcaster 升级回放
- Gate 流程改动必须覆盖 `approve/reject/other` 与升级路径收敛测试。
- connector 流程必须验证 `agent_intent -> agent_result/agent_compensation` 的完整性与幂等键关联。
- 多进程相关改动必须包含锁冲突与 stale-lock 接管测试。
- `--json` 输出改动必须配 contract 测试，确保字段稳定与错误码可机读。
- CI 必须至少执行：lint + unit + integration（e2e 可按阶段门禁执行）。

### Code Quality & Style Rules

- 文件命名统一 kebab-case（如 `resume-engine.ts`），类型/类 PascalCase，函数/变量 camelCase。
- 事件与 JSON 对外字段一律 `snake_case`，禁止同一 payload 混用 `camelCase`。
- 配置与数据结构校验必须集中在 `src/schemas/*`，禁止模块内私有 schema 漂移。
- 命令层（`src/commands/*`）禁止直接读写 `.ai-dev/*` 文件，必须经 core service。
- 单一职责：`commands` 负责入口编排，`core` 负责业务规则，`adapters` 负责外部连接。
- 所有关键分支都要返回明确错误信息与标准错误码，不允许“静默失败”。
- 变更事件模型时必须同步更新：schema、upcaster、fixture、replay 测试。
- 规则变更必须通过 ADR 文档留痕，不接受隐式口头约定。

### Development Workflow Rules

- 实现前必须先读取：
  1. `_bmad-output/planning-artifacts/architecture.md`
  2. `_bmad-output/project-context.md`
- 新命令或新模块先落结构，再落逻辑，最后补测试与 contract。
- 所有实现按“小步可验证”推进：每步改动都应可 lint + test。
- 涉及 Stage/Gate/Resume/Replay 的改动，必须先定义失败路径再实现成功路径。
- 涉及 adapter 的改动，必须先定义 `intent_id` 与补偿事件策略。
- 输出协议改动（`--json`）必须先更新 contract 文档再改代码。
- 发现规则冲突时，以 architecture 文档为准，并同步更新 project-context/ADR。
- 禁止跳过 preflight 校验路径来“临时通过”功能验证。

### Critical Don't-Miss Rules

- 绝对禁止修改或覆盖历史 `events.jsonl`；事件流只能 append-only。
- 绝对禁止在 checksum 计算中使用非 canonical JSON 序列化。
- 绝对禁止绕过 `resume preflight`（checksum chain / snapshot anchor / schema compatibility）。
- 绝对禁止用 in-memory mutex 替代 `.ai-dev/.lock` 文件锁处理多进程 CLI。
- 绝对禁止在 adapter 失败时不写 `agent_compensation` 就直接返回错误。
- 绝对禁止出现无错误码异常；所有失败都必须落入标准错误码族。
- 绝对禁止在未更新 upcaster 的情况下引入新的 `schema_version`。
- 绝对禁止破坏 `--json` 输出字段稳定性（会破坏自动化与回放工具链）。
- 绝对禁止“修复功能但不补测试”：尤其是 replay/resume/gate/adapter 关键路径。
- 绝对禁止同时存在两套命名语义（如 `sessionId` 与 `session_id` 并存）。

---

## Usage Guidelines

**For AI Agents:**
- 开始实现前先完整阅读本文件与 architecture 文档。
- 严格遵循本文件全部规则；冲突时选择更严格约束。
- 任何 schema、事件、错误码变更都必须同步更新测试与文档。
- 遇到不确定性优先保持可恢复性与一致性，不做隐式假设。

**For Humans:**
- 本文件保持精简，只保留“模型容易遗漏但高影响”的规则。
- 技术栈或关键约束变更后，立即更新本文件。
- 定期清理已过时或已成为显性常识的规则。
- 新增规则必须可执行、可验证、可追溯。

Last Updated: 2026-03-06T19:27:30+0800
