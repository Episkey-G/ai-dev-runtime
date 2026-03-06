# Story 2.3: Stage Snapshot for Recovery

Status: done

## Story

As a AI-first 开发者,  
I want 系统定期保存阶段状态快照,  
so that 我可以在中断后恢复工作进度。

## Acceptance Criteria

1. **Given** 状态发生变化  
   **When** 阶段转换或重要操作执行  
   **Then** 快照保存到 .ai-dev/snapshots/state.json

2. **Given** 需要恢复工作区  
   **When** 执行 ai-dev resume  
   **Then** 从快照恢复完整状态

## Implementation Notes

### 已实现

- 状态快照保存在 `.ai-dev/snapshots/state.json`
- ai-dev resume 命令可以恢复状态

### 待实现

- 完整的快照生命周期管理
