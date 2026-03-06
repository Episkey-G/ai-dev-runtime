# Story 2.4: Runtime Observability Commands

Status: done

## Story

As a AI-first 开发者,  
I want 查看当前运行时状态,  
so that 我可以了解系统当前所处阶段和可执行操作。

## Acceptance Criteria

1. **Given** 需要查看当前状态  
   **When** 执行状态查询命令  
   **Then** 返回当前阶段、session ID、最近转换信息

2. **Given** 需要查看事件历史  
   **When** 执行事件查询命令  
   **Then** 返回按时间排序的事件列表

## Implementation Notes

### 已实现

- `ai-dev next` 命令返回当前阶段和建议
- 状态保存在 `.ai-dev/snapshots/state.json`

### 待实现

- 专门的状态查询命令
- 事件查询命令
