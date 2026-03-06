# Repository Guidelines

## Project Structure & Module Organization
- `_bmad/`: BMAD framework assets (agents, workflows, manifests). Treat this as framework content; avoid edits unless explicitly syncing/customizing BMAD.
- `_bmad-output/`: generated and working project artifacts.
- `_bmad-output/analysis/`: brainstorming and analysis notes.
- `_bmad-output/planning-artifacts/`: active planning docs such as `prd.md`, `architecture.md`, and `bmm-workflow-status.yaml`.
- Root references: `CLAUDE.md`, `AI_DEV_SYSTEM.md`, `claude-code-codex-workflow.md`.
- Planned implementation layout (when coding starts): `src/{commands,core,adapters,schemas}` and `tests/{unit,integration,e2e,fixtures}`.

## Build, Test, and Development Commands
- This snapshot has no runnable app/toolchain yet (`package.json`, `go.mod`, and `pyproject.toml` are not present).
- Useful working commands:
  - `rg --files _bmad | head` - inspect framework files quickly.
  - `find _bmad-output/planning-artifacts -maxdepth 1 -type f` - list active planning deliverables.
  - `rg -n "TODO|FIXME" _bmad-output` - find unfinished planning items.
- BMAD planning commands used by agents: `/bmad:prd`, `/bmad:architect`, `/bmad:tasks`, `/bmad:review`.

## Coding Style & Naming Conventions
- Follow conventions captured in `CLAUDE.md`:
  - Files: `kebab-case` (example: `resume-engine.ts`)
  - Types/classes: `PascalCase`
  - Functions/variables: `camelCase`
  - External JSON/event fields: `snake_case`
  - CLI flags: `kebab-case` (example: `--session-id`)
- Use Simplified Chinese for code comments and contributor-facing documentation.
- For planned TypeScript implementation, keep strict typing and avoid `any` in core flows.

## Testing Guidelines
- No test framework is bootstrapped yet; add tests with any executable code you introduce.
- Planned structure: `tests/unit`, `tests/integration`, `tests/e2e`, `tests/fixtures`.
- Priority scenarios from current architecture docs:
  - replay/checksum integrity and hard-stop failures,
  - gate decision transitions,
  - adapter intent/result (or compensation) pairing,
  - stable `--json` output contracts.

## Commit & Pull Request Guidelines
- Git metadata is not available in this workspace snapshot (`.git` missing), so local history conventions cannot be derived.
- Use Conventional Commits by default (`feat:`, `fix:`, `docs:`, `chore:`) with small, focused changes.
- PRs should include: objective, changed paths, validation steps/results, linked task/issue, and migration or rollback notes for disruptive updates.

## Agent-Specific Notes
- During the current planning phase, prioritize edits in `_bmad-output/` and root planning docs.
- Do not modify `_bmad/` core framework files unless the task explicitly requires framework-level customization.
