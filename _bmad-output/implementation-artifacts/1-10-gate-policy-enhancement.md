# Story 1.10: Gate Policy Naming & Enhancement

Status: ready-for-dev

## Story

As a developer using ai-dev runtime,
I want named Gate policies (e.g., prd_freeze, prd_review),
so that Gate stages have semantic meaning and can trigger different workflows.

## Acceptance Criteria

1. [AC1] Gate policies defined in config with name, description, required stages
2. [AC2] `gate_decision` events include `policy_name` field
3. [AC3] Policy can be specified via `--policy` flag on approve/reject/other commands
4. [AC4] Default policies: `default`, `prd_freeze`, `prd_review`, `hotfix`

## Tasks / Subtasks

- [ ] Task 1: Define Gate Policy Schema (AC: #1)
  - [ ] Subtask 1.1: Add GatePolicy type to gate-decision.ts
  - [ ] Subtask 1.2: Add default policies constant
- [ ] Task 2: Update Events (AC: #2)
  - [ ] Subtask 2.1: Add policy_name to gate_decision event metadata
- [ ] Task 3: Update Commands (AC: #3)
  - [ ] Subtask 3.1: Add --policy flag to approve.ts
  - [ ] Subtask 3.2: Add --policy flag to reject.ts
  - [ ] Subtask 3.3: Add --policy flag to other.ts

## Dev Notes

- Policies are optional metadata on Gate decisions
- If not specified, defaults to 'default' policy
- Future: policies can trigger different agent behaviors

### References

- Source: _bmad-output/planning-artifacts/gap-analysis-2026-03-07.md#phase-4-完善与增强

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- src/core/gate-decision.ts (modify)
- src/commands/approve.ts (modify)
- src/commands/reject.ts (modify)
- src/commands/other.ts (modify)
