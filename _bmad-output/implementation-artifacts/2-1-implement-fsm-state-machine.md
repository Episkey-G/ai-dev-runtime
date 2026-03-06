# Story 2.1: Implement FSM State Machine

Status: done

## Story

As a AI-first 开发者,  
I want 系统使用有限状态机（FSM）驱动阶段流转,  
so that 我可以确保阶段迁移的合法性和可预测性。

## Acceptance Criteria

1. **Given** 系统定义了阶段集合  
   **When** 查看阶段定义  
   **Then** 包含 IDLE, RESEARCH, PLAN, IMPLEMENT, REVIEW, EXECUTE, RECOVER

2. **Given** 系统定义了合法迁移矩阵  
   **When** 查看迁移规则  
   **Then** 每个阶段有明确的允许下一阶段列表

3. **Given** 当前阶段为 IDLE  
   **When** 触发迁移  
   **Then** 只能迁移到 RESEARCH

4. **Given** 当前阶段为 RESEARCH  
   **When** 触发迁移  
   **Then** 只能迁移到 PLAN

5. **Given** 非法迁移尝试  
   **When** 执行不允许的阶段迁移  
   **Then** 抛出错误并阻止迁移

## Implementation Notes

### 已实现

- `src/lib/stage-engine.ts`: 状态机核心模块
  - STAGES: 阶段定义常量
  - LEGAL_TRANSITIONS: 合法迁移矩阵
  - STAGE_METADATA: 阶段元数据
  - isLegalTransition(): 验证迁移合法性
  - transition(): 执行状态转换
  - createInitialState(): 创建初始状态
