# Story 1.13: Error Recovery Paths

Status: ready-for-dev

## Story

As a developer using ai-dev runtime,
I want robust error recovery paths for Agent invocation failures,
so that the system can handle timeouts, process crashes, and partial failures gracefully.

## Acceptance Criteria

1. [AC1] Agent timeout handling with configurable timeout and retry logic
2. [AC2] Process crash detection and recovery (checkpoint-based)
3. [AC3] Partial failure handling - save intermediate state before risky operations
4. [AC4] Recovery commands: resume, replay work correctly with error states

## Tasks / Subtasks

- [ ] Task 1: Timeout Handling (AC: #1)
  - [ ] Subtask 1.1: Configurable timeout in adapter options
  - [ ] Subtask 1.2: Timeout event logging
- [ ] Task 2: Crash Recovery (AC: #2)
  - [ ] Subtask 2.1: Checkpoint before Agent call
  - [ ] Subtask 2.2: Recovery from last checkpoint on crash
- [ ] Task 3: Partial Failure (AC: #3)
  - [ ] Subtask 3.1: Save state before risky operations
  - [ ] Subtask 3.2: Resume from last valid state

## Dev Notes

- Extend existing adapter interfaces with timeout options
- Use event-log checkpoint mechanism for recovery
- Ensure idempotency with intent_id

### References

- Source: _bmad-output/planning-artifacts/gap-analysis-2026-03-07.md#phase-4-完善与增强

## File List

- src/adapters/types.ts (modify)
- src/adapters/claude-adapter.ts (modify)
- src/adapters/codex-adapter.ts (modify)
