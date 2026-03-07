# Story 3.2: Implement Approve/Reject/Other Commands

Status: done

## Story

As a AI-first 开发者,  
I want 使用 approve/reject/other 命令做 Gate 决策,  
so that 我可以控制工作流走向。

## Acceptance Criteria

1. **Given** 当前阶段需要 Gate  
   **When** 执行 ai-dev approve  
   **Then** 批准当前决策并推进到下一阶段

2. **Given** 当前阶段需要 Gate  
   **When** 执行 ai-dev reject  
   **Then** 拒绝当前决策并回退到上一阶段

3. **Given** 当前阶段需要 Gate  
   **When** 执行 ai-dev other  
   **Then** 记录其他类型决策

## Implementation Notes

### 已实现

- `ai-dev approve` 命令：批准 Gate 决策并推进阶段
- `ai-dev reject` 命令：占位实现
- `ai-dev other` 命令：占位实现

## Tasks / Subtasks

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] 完整实现 `reject/other` Gate 决策（含理由/替代方向、状态迁移与持久化），移除占位返回[`src/commands/reject.ts:1`]
