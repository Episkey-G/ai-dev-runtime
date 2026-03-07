# Story 1.7: Adapter Layer Foundation

Status: ready-for-dev

## Story

As a developer using ai-dev runtime,
I want a unified adapter layer for Agent communication,
so that external Agent calls (Claude/Codex) are centralized, testable, and produce consistent two-phase events.

## Acceptance Criteria

1. [AC1] `src/adapters/types.ts` defines `AgentAdapter` interface with `execute(intent)` method returning `AgentResult`
2. [AC2] `src/adapters/claude-adapter.ts` implements Claude CLI invocation via subprocess (`claude -p "<prompt>"`)
3. [AC3] `src/adapters/codex-adapter.ts` implements Codex CLI invocation via subprocess (`codex exec "<prompt>"`)
4. [AC4] `src/adapters/adapter-router.ts` implements stage-based routing (RESEARCH/PLAN → codex, IMPLEMENT/EXECUTE/RECOVER → claude, REVIEW → codex) with manual override support
5. [AC5] `handoff.ts` imports shared `AGENTS` and `ContextPacket` from adapter layer
6. [AC6] `CONNECTOR_*` error codes defined in `error-codes.ts` (CONNECTOR_CLI_NOT_FOUND, CONNECTOR_INVOCATION_FAILED, CONNECTOR_TIMEOUT, CONNECTOR_AUTH_FAILED)

## Tasks / Subtasks

- [ ] Task 1: Create Adapter Type Definitions (AC: #1)
  - [ ] Subtask 1.1: Define `AgentIntent` interface (agentId, task, sessionId, intentId)
  - [ ] Subtask 1.2: Define `AgentResult` interface (success, output, intentId, error?)
  - [ ] Subtask 1.3: Define `AgentAdapter` abstract class/interface
- [ ] Task 2: Implement Claude Adapter (AC: #2)
  - [ ] Subtask 2.1: Spawn subprocess with `claude -p` 
  - [ ] Subtask 2.2: Handle stdout streaming
  - [ ] Subtask 2.3: Implement error handling (CLI not found, timeout, auth)
- [ ] Task 3: Implement Codex Adapter (AC: #3)
  - [ ] Subtask 3.1: Spawn subprocess with `codex exec`
  - [ ] Subtask 3.2: Handle stdout streaming
  - [ ] Subtask 3.3: Implement error handling
- [ ] Task 4: Implement Adapter Router (AC: #4)
  - [ ] Subtask 4.1: Stage-to-agent default mapping
  - [ ] Subtask 4.2: Manual override via `/handoff` or config
- [ ] Task 5: Refactor handoff.ts (AC: #5)
  - [ ] Subtask 5.1: Move `AGENTS` constant to adapter layer
  - [ ] Subtask 5.2: Move `ContextPacket` interface to adapter layer
- [ ] Task 6: Add CONNECTOR Error Codes (AC: #6)
  - [ ] Subtask 6.1: Define CONNECTOR_* error codes
  - [ ] Subtask 6.2: Add RecoveryActions for each

## Dev Notes

- Architecture constraint: All external Agent calls must go through `src/adapters/*`, no direct subprocess calls in command layer
- Two-phase events (agent_intent/agent_result) will be implemented in Phase 2
- Adapter calls must produce structured output for event logging
- Use Node.js `child_process.spawn` with `stdio: ['ignore', 'pipe', 'pipe']`

### Project Structure Notes

- New directory: `src/adapters/` (currently only has `.gitkeep`)
- Align with existing patterns in `src/core/` and `src/commands/`
- Use ES modules, snake_case for external contracts, camelCase for internal

### References

- Source: _bmad-output/planning-artifacts/gap-analysis-2026-03-07.md#phase-1-adapter-层基础
- Source: _bmad-output/planning-artifacts/architecture.md#adapter-layer
- Source: src/commands/handoff.ts (current inline definitions)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- src/adapters/types.ts (new)
- src/adapters/claude-adapter.ts (new)
- src/adapters/codex-adapter.ts (new)
- src/adapters/adapter-router.ts (new)
- src/adapters/index.ts (new, barrel export)
- src/cli/error-codes.ts (modify, add CONNECTOR_*)
- src/commands/handoff.ts (modify, import from adapter)
