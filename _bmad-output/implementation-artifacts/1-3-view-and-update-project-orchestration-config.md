# Story 1.3: View and Update Project Orchestration Config

Status: done

## Story

As a AI-first 开发者,  
I want 查看并按需更新项目级编排配置,  
so that 我可以在不破坏默认可用性的前提下调整路由与治理策略。

## Acceptance Criteria

1. **Given** 项目已完成 `ai-dev init`  
   **When** 执行 `ai-dev config show`  
   **Then** 系统返回当前生效配置  
   **And** 输出包含关键项（默认执行 Agent、深度分析 Agent、Gate 策略、配置来源优先级）

2. **Given** 我需要修改部分配置  
   **When** 执行配置更新命令（如 `ai-dev config set`）  
   **Then** 系统只更新目标配置项，不影响未变更项  
   **And** 更新后可再次查询到新值并标记生效来源

3. **Given** 我提交了非法配置（未知字段、类型错误、值越界）  
   **When** 执行 `ai-dev config validate`  
   **Then** 系统返回机读错误码与可读错误说明（指向具体字段）  
   **And** 阻止非法配置进入运行时

4. **Given** CLI flags、ENV 与配置文件同时存在  
   **When** 执行配置解析或查看生效配置  
   **Then** 系统按 `CLI flags > ENV vars > .ai-dev/config.yaml` 解析  
   **And** 在输出中显示最终生效值及其来源（flag/env/file）以便排障

## Implementation Notes

### 已实现

- `src/commands/config.ts`: Config 命令组入口
- `src/commands/config/show.ts`: `ai-dev config show` - 查看配置
- `src/commands/config/set.ts`: `ai-dev config set --key xxx --value yyy` - 更新配置
- `src/commands/config/validate.ts`: `ai-dev config validate` - 校验配置

### 功能

- `config show`: 显示当前配置，包含版本、默认值、路径信息
- `config set`: 支持点号路径（如 `defaults.executor`）设置值
- `config validate`: 校验必填字段和值合法性（executor/deepAnalyzer 必须是 claude 或 codex）

### 待验证

- 需要 Node.js 24 LTS 环境验证
- 配置优先级（ENV > CLI flags > config.yaml）尚未完全实现

## Tasks / Subtasks

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] 落实配置解析优先级 `CLI flags > ENV vars > .ai-dev/config.yaml`，并在输出中标注真实来源[`src/commands/config/show.ts:1`] — 已实现 `config:show` 优先级解析与来源追踪

## Dev Notes

- Story 1.2 建立了 workspace 初始化
- Story 1.3 在此基础上实现配置查看/更新/校验
