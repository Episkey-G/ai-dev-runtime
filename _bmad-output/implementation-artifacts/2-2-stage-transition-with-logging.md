# Story 2.2: Stage Transition with Logging

Status: done

## Story

As a AI-first 开发者,  
I want 每个阶段转换都被记录到事件日志,  
so that 我可以追溯完整的阶段流转历史。

## Acceptance Criteria

1. **Given** 状态转换发生  
   **When** 阶段从 A 迁移到 B  
   **Then** 写入 stage_transition 事件到 events.jsonl  
   **And** 事件包含 from, to, timestamp, reason 字段

2. **Given** 需要查看阶段历史  
   **When** 查询事件日志  
   **Then** 可以获取按时间排序的阶段转换记录

## Implementation Notes

### 已实现

- 阶段转换日志功能已集成到 `ai-dev next` 命令
- 使用 `.ai-dev/events/events.jsonl` 存储事件

### 待实现

- 专门的查询命令
