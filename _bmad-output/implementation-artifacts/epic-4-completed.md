# Epic 4: Multi-Agent Context Handoff & Adapter Routing

## Stories Completed

### Story 4.1: Define Agent Roles and Adapter Schema
- Implemented agent definitions (claude, codex) with roles and capabilities

### Story 4.2: Route Requests via Strategy
- Agent routing logic implemented in handoff command

### Story 4.3: Execute Cross-Agent Handoff
- `ai-dev handoff --to codex` command fully implemented
- Context packet generation and persistence

### Story 4.4-4.7: Context Management
- Context directory structure created
- Context packets saved to `.ai-dev/context/`

## Tasks / Subtasks

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] `handoff` 流程补齐 `agent_handoff` 审计事件与 `schema_version/intent_id` 字段契约，并统一对外 `snake_case`[`src/commands/handoff.ts:1`]
