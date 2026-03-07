# Story 1.8: Two-Phase Event Protocol

Status: ready-for-dev

## Story

As a developer using ai-dev runtime,
I want Agent calls to produce consistent two-phase events (intent → result/compensation),
so that audit trails are complete and idempotent even on failure.

## Acceptance Criteria

1. [AC1] `agent_intent` event written before each Agent call (intent_id, agent_id, task, timestamp)
2. [AC2] `agent_result` event written on success, linked to same intent_id
3. [AC3] `agent_compensation` event written on failure, linked to same intent_id with error details
4. [AC4] Intent ID acts as idempotency key - duplicate intents return cached result
5. [AC5] Adapter layer exports helper functions for writing events

## Tasks / Subtasks

- [ ] Task 1: Add Event Types (AC: #1-3)
  - [ ] Subtask 1.1: Add `agent_intent` event type to event-log
  - [ ] Subtask 1.2: Add `agent_result` event type to event-log
  - [ ] Subtask 1.3: Add `agent_compensation` event type to event-log
- [ ] Task 2: Implement Event Writing Helpers (AC: #5)
  - [ ] Subtask 2.1: Create `writeAgentIntent()` helper in adapters
  - [ ] Subtask 2.2: Create `writeAgentResult()` helper in adapters
  - [ ] Subtask 2.3: Create `writeAgentCompensation()` helper in adapters
- [ ] Task 3: Wire Events into Adapters (AC: #1-3)
  - [ ] Subtask 3.1: Update ClaudeAdapter to write intent/result/compensation
  - [ ] Subtask 3.2: Update CodexAdapter to write intent/result/compensation
- [ ] Task 4: Implement Idempotency (AC: #4)
  - [ ] Subtask 4.1: Check for existing intent_id before executing
  - [ ] Subtask 4.2: Return cached result if duplicate intent

## Dev Notes

- Architecture constraint: Each adapter call must produce two events (success: intent+result, failure: intent+compensation)
- All events must include: intent_id, schema_version, timestamp
- Use existing event-log.ts patterns for consistency

### References

- Source: _bmad-output/planning-artifacts/gap-analysis-2026-03-07.md#phase-2-两阶段事件协议
- Source: src/core/event-log.ts (existing patterns)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- src/core/event-log.ts (modify, add event types)
- src/adapters/claude-adapter.ts (modify, wire events)
- src/adapters/codex-adapter.ts (modify, wire events)
- src/adapters/event-helpers.ts (new)
