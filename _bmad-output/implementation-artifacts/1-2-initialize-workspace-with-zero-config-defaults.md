# Story 1.2: Initialize Workspace with Zero-Config Defaults

Status: in-progress

## Story

As a AI-first 开发者,  
I want 在项目目录执行 `ai-dev init` 自动初始化运行时工作区与默认配置,  
so that 我可以不做复杂配置就进入首个编排流程。

## Acceptance Criteria

1. **Given** 当前项目尚未初始化（不存在 `.ai-dev/`）  
   **When** 执行 `ai-dev init`  
   **Then** 系统创建 `.ai-dev/` 及必要子目录（`events/`、`snapshots/`、`context/`）和默认配置文件  
   **And** 命令返回成功并明确列出已创建的关键文件与目录

2. **Given** 当前项目已存在 `.ai-dev/`  
   **When** 再次执行 `ai-dev init`  
   **Then** 系统不得破坏已有事件与快照数据  
   **And** 返回明确结果（幂等成功或需显式确认的提示），说明如何继续

3. **Given** 目标目录无写权限或路径非法  
   **When** 执行 `ai-dev init`  
   **Then** 系统返回明确错误信息与错误码  
   **And** 提供可恢复动作（切换目录、修复权限、重试）

4. **Given** 标准本地环境  
   **When** 执行 `ai-dev init`  
   **Then** 初始化在 `<= 60s` 内完成  
   **And** 输出下一步指引（例如执行 `ai-dev next` 启动首个编排）

## Implementation Notes

### 已实现

- `src/lib/workspace.ts`: 工作区初始化核心逻辑
  - `initializeWorkspace()`: 创建 .ai-dev/ 目录结构
  - `getDefaultConfig()`: 生成零配置默认设置
  - 支持幂等初始化（已存在时返回 idempotent=true）
  - 支持 --force 强制覆盖

- `src/commands/init.ts`: 更新为实际实现
  - 支持 `--workspace-path` 指定路径
  - 支持 `--force` 强制重新初始化
  - 输出包含 created 文件列表
  - 60s 超时检查

- `src/cli/error-codes.ts`: 新增错误码
  - `CFG_WORKSPACE_PERMISSION`: 权限错误
  - `CFG_WORKSPACE_EXISTS`: 已存在
  - `CFG_WORKSPACE_PATH_INVALID`: 路径无效

### 待验证

- 需要 Node.js 24 LTS 环境验证（当前环境为 22.22.0，被 preflight 拦截）
- 需要补充单元测试和集成测试

### 创建的文件/目录结构

```
.ai-dev/
├── config.json      # 工作区配置
├── meta.json        # 元数据
├── events/
│   └── events.jsonl # 事件日志
├── snapshots/
│   └── state.json   # 状态快照
├── context/         # 上下文存储
└── locks/           # 文件锁
```

## Dev Notes

- Story 1.1 建立了 CLI 骨架
- Story 1.2 在此基础上实现 init 命令的实际功能
- 遵循架构约束：命令层不直接读写 .ai-dev/，由 lib/workspace.ts 处理
