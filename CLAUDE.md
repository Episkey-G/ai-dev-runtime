# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Episkey** — a local-first CLI orchestration runtime for AI-assisted software development. It coordinates multiple AI models (Claude as default executor, Codex for deep analysis) through a state-machine-driven workflow with event sourcing, human gates, and deterministic replay/recovery.

This repository is currently in the **planning/solutioning phase** (BMAD Method). No source code exists yet — the repo contains design documents, BMAD framework files, and planning artifacts.

## Repository Structure

```
AI-DEV/
├── _bmad/                  # BMAD framework (agents, workflows, configs) — DO NOT MODIFY
│   ├── core/               # Core agents & workflows (bmad-master, brainstorming, party-mode)
│   ├── bmb/                # BMAD Meta Builder (agent/module/workflow builders)
│   ├── bmm/                # BMAD Meta Method (dev workflows, agents, tasks)
│   └── _config/            # Manifests, agent customizations, IDE configs
├── _bmad-output/           # Generated planning artifacts — working documents
│   ├── analysis/           # Brainstorming sessions
│   └── planning-artifacts/ # PRD, architecture, product brief, workflow status
├── AI_DEV_SYSTEM.md        # System design: Claude + Codex + BMAD workflow orchestration
├── claude-code-codex-workflow.md  # Claude-Codex collaboration workflow details (Chinese)
└── *.html                  # Reference guides (BMAD fullstack guide, Chinese guides)
```

## Key Planning Documents

Before any implementation work, always read these first:
1. `_bmad-output/planning-artifacts/architecture.md` — architectural decisions and component design
2. `_bmad-output/project-context.md` — critical rules and patterns for AI agents
3. `_bmad-output/planning-artifacts/prd.md` — product requirements

## BMAD Workflow Status

Track progress in `_bmad-output/planning-artifacts/bmm-workflow-status.yaml`. Current phase: architecture complete, next steps are epics/stories creation and implementation readiness check.

## Technology Stack (Target Implementation)

- **Runtime:** Node.js 24 LTS (primary baseline)
- **Language:** TypeScript 5.9 (strict types, no `any` in core flows)
- **CLI Framework:** oclif / @oclif/core 4.5.2
- **Validation:** AJV (config schemas) + Zod (runtime Context Packet validation)
- **Event Storage:** Append-only JSONL (`.ai-dev/events/events.jsonl`) with checksum chain
- **Recovery:** Snapshot anchor + deterministic replay + resume preflight (hard-stop on failure)

## Critical Architecture Constraints

- **Append-only events:** Never modify or overwrite `events.jsonl` history
- **Checksum integrity:** Must use canonicalized JSON for checksum calculation
- **Resume preflight:** All validation failures must hard-stop, never "continue with errors"
- **File locking:** Use unified `workspace-lock` module, no in-memory mutex substitutes
- **Agent adapters:** External agent calls go through `src/adapters/*`, never direct from commands
- **Adapter events:** Must produce `agent_intent -> agent_result` (success) or `agent_intent -> agent_compensation` (failure) pairs
- **Command output:** Unified envelope `{ ok, data/error, meta }`, `--json` output is stable contract

## Naming Conventions

- Files: `kebab-case` (e.g., `resume-engine.ts`)
- Types/Classes: `PascalCase`
- Internal variables/functions: `camelCase`
- External JSON/Event fields: `snake_case` (never mix with camelCase in same payload)
- CLI flags: `kebab-case` (e.g., `--session-id`)
- Error codes: prefixed families (`CFG_*`, `EVT_*`, `RESUME_*`, `LOCK_*`, `CONNECTOR_*`)

## Target Project Structure (When Implementation Begins)

```
src/
├── commands/    # oclif CLI commands (entry orchestration only)
├── core/        # Business rules (stage engine, gate engine, recovery, etc.)
├── adapters/    # External agent connectors (Claude, Codex)
└── schemas/     # Centralized validation schemas (AJV + Zod)
tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/    # events/ and snapshots/ for deterministic testing
```

## Test Requirements

- Resume/replay changes must cover: checksum pass, snapshot mismatch (hard-stop), schema upcaster replay
- Gate changes must cover: approve/reject/other + escalation path convergence
- Adapter changes must verify intent-result/compensation pairing and idempotency keys
- `--json` output changes require contract tests for field stability

## Language

All code comments and documentation must be in Simplified Chinese (简体中文).
