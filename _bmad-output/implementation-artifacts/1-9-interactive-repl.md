# Story 1.9: Interactive REPL

Status: ready-for-dev

## Story

As a developer using ai-dev runtime,
I want to interact with the runtime through a continuous REPL session,
so that I can have natural language conversations with AI agents without manually executing discrete commands.

## Acceptance Criteria

1. [AC1] `ai-dev chat` command enters interactive REPL mode
2. [AC2] REPL displays current stage, agent, session info as prompt prefix
3. [AC3] Slash commands work: `/quit`, `/stage`, `/handoff`, `/approve`, `/reject`, `/other`, `/next`, `/replay`, `/history`, `/help`
4. [AC4] Non-slash input routed to current agent via adapter layer
5. [AC5] Agent output streamed to terminal in real-time
6. [AC6] Context prompt assembled with stage, recent events, session info before each agent call

## Tasks / Subtasks

- [ ] Task 1: Create REPL Command (AC: #1)
  - [ ] Subtask 1.1: Create src/commands/chat.ts with OCLIF command
  - [ ] Subtask 1.2: Set up readline/prompt interaction loop
- [ ] Task 2: Implement Slash Commands (AC: #3)
  - [ ] Subtask 2.1: Parse and dispatch slash commands
  - [ ] Subtask 2.2: Implement each built-in command
- [ ] Task 3: Wire Agent Communication (AC: #4, #5)
  - [ ] Subtask 3.1: Use adapter-router to get current agent
  - [ ] Subtask 3.2: Stream agent output to terminal
  - [ ] Subtask 3.3: Handle agent errors gracefully
- [ ] Task 4: Context Assembly (AC: #6)
  - [ ] Subtask 4.1: Load recent events from workspace
  - [ ] Subtask 4.2: Build context prompt template

## Dev Notes

- Use Node.js `readline` module for REPL input
- Adapter layer already provides stage-based routing (from Story 1.7)
- Two-phase events already wired (from Story 1.8)
- REPL should handle Ctrl+C gracefully for exit

### References

- Source: _bmad-output/planning-artifacts/gap-analysis-2026-03-07.md#phase-3-交互式-repl

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- src/commands/chat.ts (new)
