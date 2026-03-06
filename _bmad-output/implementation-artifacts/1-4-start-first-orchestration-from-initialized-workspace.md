# Story 1.4: Start First Orchestration from Initialized Workspace

Status: in-progress

## Story

As a AI-first 开发者,  
I want 在初始化完成后直接启动首个编排流程,  
so that 我可以从"准备环境"进入"实际推进任务"的受控循环。

## Acceptance Criteria

1. **Given** 项目已完成 `ai-dev init` 且配置有效  
   **When** 执行 `ai-dev next`  
   **Then** 系统基于当前阶段与上下文生成可执行的下一步建议  
   **And** 输出包含阶段信息、建议摘要与建议来源（规则/路由）

2. **Given** 首次运行尚无历史事件  
   **When** 执行 `ai-dev next`  
   **Then** 系统按初始事件定义写入首批运行事件（至少包含 `workspace_initialized` 与首个 `stage_transition`）  
   **And** 事件写入遵循 append-only 语义并可被后续审计检索

3. **Given** 项目处于首轮编排起点  
   **When** 触发首个 `ai-dev next`  
   **Then** 系统进入并显示预期的 initial stage  
   **And** 阶段状态可与当前事件记录一致对应

4. **Given** 工作区已被其他进程占用  
   **When** 执行 `ai-dev next`  
   **Then** 系统通过 workspace lock 机制阻止并发冲突写入  
   **And** 返回明确锁冲突错误与可恢复动作（重试或安全接管）

5. **Given** 当前上下文不完整（缺少必要约束或任务目标）  
   **When** 执行 `ai-dev next`  
   **Then** 系统返回明确错误与补充指引  
   **And** 不进入不确定执行态

6. **Given** 用户以 `--json` 调用命令  
   **When** `ai-dev next` 成功或失败返回  
   **Then** 输出遵循统一 envelope（`ok/data/meta` 或 `ok/error/meta`）  
   **And** 错误场景包含可恢复动作（retry/fallback/reroute/stop）

## Implementation Notes

### 已实现

- `src/commands/next.ts`: `ai-dev next` 命令
  - 加载/保存状态（`.ai-dev/snapshots/state.json`）
  - 阶段机：IDLE → RESEARCH → PLAN → IMPLEMENT → REVIEW → EXECUTE → RECOVER
  - 合法迁移校验
  - 允许动作列表
  - 推荐动作
  - Gate 决策检查

### 功能

- 首次运行自动创建 session 并推进到 RESEARCH 阶段
- 返回 allowedActions、recommendedAction、gateRequired
- 支持 `--workspace-path` 指定路径
- 统一 envelope 输出

### 待实现

- 事件日志写入（append-only）
- 工作区文件锁
- 并发冲突处理
