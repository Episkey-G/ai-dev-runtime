# Story 1.12: JSON Contract Tests

Status: ready-for-dev

## Story

As a developer using ai-dev runtime,
I want comprehensive `--json` contract tests,
so that the JSON envelope format is consistently correct across all commands.

## Acceptance Criteria

1. [AC1] Test all commands with --json flag
2. [AC2] Verify envelope structure (ok, data/error, meta)
3. [AC3] Verify meta includes timestamp and version
4. [AC4] Test both success and failure paths

## Tasks / Subtasks

- [ ] Task 1: Create Contract Tests (AC: #1-4)
  - [ ] Subtask 1.1: Test init --json
  - [ ] Subtask 1.2: Test next --json
  - [ ] Subtask 1.3: Test handoff --json
  - [ ] Subtask 1.4: Test approve/reject/other --json

## Dev Notes

- Add tests to tests/e2e/cli-smoke.test.ts or create new test file
- Verify structure matches src/cli/envelope.ts

### References

- Source: _bmad-output/planning-artifacts/gap-analysis-2026-03-07.md#phase-4-完善与增强
- Source: src/cli/envelope.ts

## File List

- tests/e2e/json-contract.test.ts (new)
