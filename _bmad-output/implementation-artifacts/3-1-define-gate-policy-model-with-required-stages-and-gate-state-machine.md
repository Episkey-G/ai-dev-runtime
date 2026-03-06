# Story 3.1: Define Gate Policy Model

Status: done

## Story

As a AI-first 开发者,  
I want 定义 Gate 策略模型和状态机,  
so that 我可以控制何时需要人工审批。

## Acceptance Criteria

1. **Given** Gate 策略模型已定义  
   **When** 查看模型  
   **Then** 包含 Gate 阶段列表、决策类型、状态机

2. **Given** 阶段为 RESEARCH/PLAN/REVIEW  
   **When** 需要 Gate 决策  
   **Then** 系统提示需要人工审批

## Implementation Notes

### 已实现

- GATE_STAGES 常量定义需要 Gate 的阶段
- Gate 决策已集成到 approve 命令
