# Story 1.2: Initialize Workspace with Zero-Config Defaults

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a AI-first 开发者,  
I want 在项目目录执行 `ai-dev init` 自动初始化运行时工作区与默认配置,  
so that 我可以不做复杂配置就进入首个编排流程。

## Acceptance Criteria

1. **Given** 当前项目尚未初始化（不存在 `.ai-dev/`）  
   **When** 我执行 `ai-dev init`  
   **Then** 系统创建 `.ai-dev/` 及必要子目录（`events/`、`snapshots/`、`context/`）和默认配置文件  
   **And** 命令返回成功并明确列出已创建的关键文件与目录
2. **Given** 当前项目已存在 `.ai-dev/`  
   **When** 我再次执行 `ai-dev init`  
   **Then** 系统不得破坏已有事件与快照数据  
   **And** 返回明确结果（幂等成功或需显式确认的提示），说明如何继续
3. **Given** 目标目录无写权限或路径非法  
   **When** 我执行 `ai-dev init`  
   **Then** 系统返回明确错误信息与错误码  
   **And** 提供可恢复动作（切换目录、修复权限、重试）
4. **Given** 标准本地环境  
   **When** 我执行 `ai-dev init`  
   **Then** 初始化在 `<= 60s` 内完成  
   **And** 输出下一步指引（例如执行 `ai-dev next` 启动首个编排）

## Tasks / Subtasks

- [x] 实现 Workspace 初始化核心服务（AC: 1,2,3,4）
  - [x] 新增 `src/core/workspace/workspace-layout.ts`，集中定义 `.ai-dev` 路径与文件布局（SSOT）
  - [x] 新增 `src/core/workspace/workspace-initializer.ts`，实现目录/文件初始化与幂等汇总结果
  - [x] 目录初始化使用递归创建；已存在资源必须标记为 `skipped` 而不是覆盖
- [x] 实现默认配置落盘与读取契约（AC: 1,2）
  - [x] 新增 `src/config/defaults.ts` 生成零配置默认值（含 gate policy 与 routing 默认项）
  - [x] 新增 `src/config/config-writer.ts` 负责 `.ai-dev/config.yaml` 首次写入
  - [x] 当配置文件已存在时，保持内容不变并在结果中标记 `kept_existing`
- [x] 接入 `init` 命令与统一输出（AC: 1,2,3,4）
  - [x] `src/commands/init.ts` 调用 core service，不在命令层直接操作 `.ai-dev/*`
  - [x] 沿用 `src/cli/envelope.ts` + `src/cli/output.ts` 输出 human / `--json` 双模式结果
  - [x] 成功结果至少包含：`created_paths`、`skipped_paths`、`config_path`、`next_step`
- [x] 实现错误分类与可恢复动作（AC: 3）
  - [x] 在 `src/cli/error-codes.ts` 扩展 `CFG_*` 错误码：路径非法、写权限不足、初始化失败
  - [x] 保证 `error.code` 机读稳定，`error.recovery` 给出明确下一步动作
  - [x] 对空路径/非法路径/写失败返回明确错误，禁止 silent failure
- [x] 增加测试覆盖（AC: 1,2,3,4）
  - [x] `tests/unit`: workspace initializer 的 created/skipped/error 分支
  - [x] `tests/integration`: `init` 与 `init --json` 的结构化输出与幂等行为
  - [x] `tests/e2e`: 首次初始化、重复初始化、权限失败场景（临时目录 + 只读目录）
  - [x] 增加性能断言：初始化耗时字段可观测（不做硬编码机器依赖阈值）

### Review Follow-ups (AI)

- [x] [AI-Review][Critical] 修复 Story 声称”79 tests 通过”但当前测试失败（4 个 e2e 失败）的问题，并在通过后再更新完成声明 [tests/e2e/init-workspace.e2e.test.ts:98]
- [x] [AI-Review][High] 消除 e2e 并发构建竞争：避免测试并行时 `npm run build` 清空 `dist` 导致 `command init not found` [tests/e2e/cli-smoke.test.ts:46]
- [x] [AI-Review][High] 修复 `config.yaml` 写入的 TOCTOU 竞态（existsSync + writeFile）以确保并发初始化幂等不覆盖 [src/config/config-writer.ts:47]
- [x] [AI-Review][Medium] 调整 `--json` 失败路径退出码策略，避免 `ok:false` 仍返回退出码 0 干扰自动化 [src/cli/output.ts:21]
- [x] [AI-Review][Medium] 同步 Story File List 与实际变更，补充 `sprint-status.yaml` 的变更记录 [/_bmad-output/implementation-artifacts/1-2-initialize-workspace-with-zero-config-defaults.md:212]
- [x] [AI-Review][Medium] 增加可机读耗时字段（如 `duration_ms`）以满足”耗时可观测”子任务，不仅依赖 `meta.timestamp` [src/cli/envelope.ts:14]

### Review Follow-ups (PR Round 2 - Codex)

- [x] [P1] 用 `mkdir({recursive:true})` 返回值替代 `existsSync` 消除非目录碰撞漏检 [src/core/workspace/workspace-initializer.ts]
- [x] [P2] 拒绝符号链接工作区目录 — 新增 `rejectSymlink()` 辅助函数 [src/core/workspace/workspace-initializer.ts]
- [x] [P2] 拒绝符号链接数据文件（events.jsonl/state.json）[src/core/workspace/workspace-initializer.ts]
- [x] [P2] 拒绝符号链接配置文件 — config-writer EEXIST 路径增加 lstat 检测 [src/config/config-writer.ts]
- [x] 重构提取 `ensureDirectory()` 和 `ensureFile()` 消除 max-depth lint warnings

## Dev Notes

### Developer Context Section

- 本故事目标是把 `init` 从“占位命令”升级为“可重复执行且不破坏数据”的工作区初始化入口。
- 这是 Epic 1 的第二个故事，必须复用 Story 1.1 已建立的 CLI 契约（envelope、错误码、preflight、测试分层）。
- 严格避免“命令层直接读写工作区文件”，初始化逻辑应收敛在 `src/core/**`。

### Technical Requirements

- 必须创建并维护统一工作区布局：
  - `.ai-dev/events/events.jsonl`
  - `.ai-dev/snapshots/state.json`
  - `.ai-dev/context/`
  - `.ai-dev/config.yaml`
- `ai-dev init` 二次执行必须幂等：不得覆盖/清空既有 `events.jsonl`、`state.json` 与 `config.yaml`。
- 错误处理必须结构化：
  - `ok: false`
  - `error.code`（`CFG_*`）
  - `error.message`
  - `error.recovery`
- 初始化结果需要明确可读：
  - 新建路径列表
  - 已存在并保留的路径列表
  - 下一步命令（`ai-dev next`）
- 所有路径与文件操作需处理空值/异常分支并返回明确错误信息。

### Architecture Compliance

- 命令入口保留在 `src/commands/init.ts`，业务逻辑放在 `src/core/workspace/*`。
- 输出协议必须继续使用统一 envelope（成功 `ok/data/meta`；失败 `ok/error/meta`）。
- 命名一致性：
  - TS 内部 `camelCase`
  - 对外 JSON 字段 `snake_case`
- 禁止引入与现有目录边界冲突的新层级；按既有 `commands/core/config/schemas/cli` 分层扩展。

### Library & Framework Requirements

- `@oclif/core@4.5.2`（已在 `package.json` 锁定）：命令定义与 flags 解析保持 `Command + Flags + this.parse(...)` 方式。
- `@oclif/plugin-help@^6`：不修改帮助系统行为，确保 `--help` 输出稳定。
- Node.js 运行时基线：`>=24.0.0`（项目 engines）。
- 文件系统实现优先使用 Node `fs/promises` 官方推荐 API，保证递归建目录和可预期错误处理。

### File Structure Requirements

- 允许新增（建议）：
  - `src/core/workspace/workspace-layout.ts`
  - `src/core/workspace/workspace-initializer.ts`
  - `src/config/defaults.ts`
  - `src/config/config-writer.ts`
  - `src/schemas/config.schema.json`（若本故事同步做配置结构校验）
- 必须修改：
  - `src/commands/init.ts`
  - `src/cli/error-codes.ts`（扩展 `CFG_*`）
- 必须补测：
  - `tests/unit/*`
  - `tests/integration/commands.test.ts`
  - `tests/e2e/cli-smoke.test.ts` 或新增 `init-workspace.e2e.test.ts`

### Testing Requirements

- 单元测试覆盖：
  - 首次初始化创建完整目录/文件
  - 重复初始化不覆盖已有数据
  - 非法路径与权限失败返回正确错误码
- 集成测试覆盖：
  - `init` human-readable 输出包含创建/跳过摘要
  - `init --json` 输出包含稳定字段（`ok/data/meta`）
- 端到端覆盖：
  - 干净目录首次执行成功
  - 第二次执行幂等成功
  - 只读目录或非法路径失败并带可恢复动作
- 现有 Story 1.1 经验沿用：E2E 执行前先构建 `dist`，避免 `bin/run.js` 在干净环境失败。

### Previous Story Intelligence

- `preflight` 依赖检查已从 `process.cwd()` 修正为 CLI 安装目录推导；新实现不得回退为 cwd 相对路径。
- 版本号已统一从 `package.json` 读取；`init` 新增输出不得引入第二套版本来源。
- `@oclif/test` 与 vitest + ESM 存在已知兼容性限制；命令集成测试仍以 `bin/dev.js` 子进程方案为主。
- Story 1.1 已把 lint / test / tsc 基线打通；本故事必须维持零回归。

### Git Intelligence Summary

- 最近实现型提交集中在三类：CLI 契约稳定性、preflight 路径正确性、E2E 可复现性。
- 已验证有效的实践：
  - 关键路径修复后立即补对应测试（unit + e2e）
  - story 文档与 sprint-status 同步更新，避免状态漂移
- 本故事应继续沿用“先契约、后实现、再补全测试”的提交策略。

### Latest Tech Information

- Node.js 官方发布页显示 v24 线处于 Active LTS，当前条目为 `v24.14.0`（用于确认本项目 `>=24` 基线仍有效）。
- oclif v4 官方文档确认：
  - 命令 flags 推荐 `Flags.boolean(...)` + `this.parse(...)`。
  - `init` hook 可通过 `options.context.exit(...)` / `options.context.error(...)` 提前终止执行。
- Node `fsPromises.mkdir` 官方文档支持 `recursive`，适合幂等目录初始化；返回语义需按文档处理，避免手写竞态逻辑。

### Project Context Reference

- 必须遵守 `_bmad-output/project-context.md` 关键约束：
  - 命令层禁止直接读写 `.ai-dev/*`
  - 错误码必须落在标准错误码族并提供恢复动作
  - `--json` 字段契约保持稳定
  - 禁止引入 silent failure 和临时绕过规则

### Project Structure Notes

- 本故事只实现“工作区初始化与默认配置”，不提前实现 Stage/Gate/Replay 的完整业务逻辑。
- 若需要为后续故事预留结构，可新增 core/config 模块，但禁止超出 AC 范围引入复杂状态机逻辑。

### References

- `_bmad-output/planning-artifacts/epics.md`（Epic 1 / Story 1.2）
- `_bmad-output/planning-artifacts/prd.md`（NFR3: `init <= 60s`，Day-1 可用性目标）
- `_bmad-output/planning-artifacts/architecture.md`（工作区布局、分层边界、错误码族、`--json` 契约）
- `_bmad-output/project-context.md`（实现禁令与一致性规则）
- `package.json`（`@oclif/core@4.5.2`、Node engines `>=24.0.0`）
- oclif 文档（v4 命令 flags 与 hook 行为）：https://oclif.io/docs/flags/ , https://oclif.io/docs/hooks/
- Node.js 发布与 API 文档：https://nodejs.org/en/about/previous-releases , https://nodejs.org/api/fs.html

## Dev Agent Record

### Agent Model Used

gpt-5-codex (SM create-story yolo)

### Debug Log References

- Step 1: 从 `sprint-status.yaml` 自动选中首个 backlog story：`1-2-initialize-workspace-with-zero-config-defaults`
- Step 2: 完整分析 `epics/prd/architecture/project-context` 与 Story 1.1 实施记录
- Step 3: 补充 oclif/Node 官方文档要点与当前版本基线信息

### Implementation Plan

- 建立 workspace 初始化核心服务并集中路径常量
- 实现 `.ai-dev` 目录与默认配置首建逻辑，确保重复执行幂等
- 将 `init` 命令从占位改为调用核心服务，输出统一 envelope
- 扩展错误码与恢复动作，覆盖路径与权限失败
- 补齐 unit/integration/e2e 测试并保持 lint/test/tsc 通过

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status is set to `ready-for-dev`.
- Story file includes architecture guardrails, previous-story learnings, git intelligence, and latest tech references.
- ✅ Task 1: 实现 workspace-layout.ts（SSOT 路径定义）和 workspace-initializer.ts（幂等初始化服务）
- ✅ Task 2: 实现 defaults.ts（零配置默认值含 gate_policy/routing）和 config-writer.ts（首次写入，幂等保持）
- ✅ Task 3: 重写 init.ts 命令，调用 core service，输出 human/--json 双模式结果（created_paths/skipped_paths/config_path/next_step）
- ✅ Task 4: 扩展 error-codes.ts 新增 CFG_PATH_INVALID/CFG_WRITE_PERMISSION/CFG_INIT_FAILED，均有 recovery 动作
- ✅ Task 5: 新增 4 个单元测试文件（18 tests）、1 个集成测试文件（4 tests）、1 个 e2e 测试文件（12 tests），全套 80 tests 通过
- output.ts 增强：失败时输出 recovery 信息
- ✅ Resolved review finding [Critical]: e2e 测试失败根因为并发构建竞争，通过 fileParallelism:false 修复
- ✅ Resolved review finding [High]: 消除并发构建竞争，vitest.config.ts 设置 fileParallelism:false
- ✅ Resolved review finding [High]: config-writer.ts 和 workspace-initializer.ts 文件创建改用 wx flag 消除 TOCTOU 竞态
- ✅ Resolved review finding [Medium]: output.ts --json 失败路径设置 process.exitCode = 1
- ✅ Resolved review finding [Medium]: File List 已同步补全 sprint-status.yaml 和 vitest.config.ts
- ✅ Resolved review finding [Medium]: InitResult 新增 duration_ms 字段，可机读耗时观测

### Change Log

- 2026-03-07: Story 1-2 全部 tasks/subtasks 实现完成，80 tests 通过，lint/tsc 零错误
- 2026-03-07: Addressed code review findings — 6 items resolved (1 Critical, 2 High, 3 Medium)
- 2026-03-07: PR round 2 — 修复 Codex 1×P1 + 3×P2 评论（非目录碰撞、符号链接安全），重构降低嵌套深度

### File List

- _bmad-output/implementation-artifacts/1-2-initialize-workspace-with-zero-config-defaults.md
- _bmad-output/implementation-artifacts/sprint-status.yaml (修改)
- src/core/workspace/workspace-layout.ts (新增)
- src/core/workspace/workspace-initializer.ts (新增)
- src/config/defaults.ts (新增)
- src/config/config-writer.ts (新增)
- src/commands/init.ts (修改)
- src/cli/error-codes.ts (修改)
- src/cli/output.ts (修改)
- vitest.config.ts (修改)
- tests/unit/workspace-layout.test.ts (新增)
- tests/unit/workspace-initializer.test.ts (新增)
- tests/unit/config-defaults.test.ts (新增)
- tests/unit/config-writer.test.ts (新增)
- tests/integration/init-command.test.ts (新增)
- tests/e2e/init-workspace.e2e.test.ts (新增)
