
# AI Dev System (BMAD + Claude + Codex)

## Overview

This document describes an **AI Dev Workflow System** designed to coordinate multiple AI models during software development to assist with:

- Requirement analysis
- Architecture design
- Task planning
- Code implementation
- Code review
- Fix decisions and release gating

### Core Components

| Component | Role |
|---|---|
| BMAD Method | Standardizes development structure and documentation |
| Claude Code | Planning, coding, and final decision making |
| Codex | Deep reasoning, repository context analysis, and code review |
| Workflow Engine | Orchestrates the AI workflow |

Goals:

- Reduce manual AI switching
- Use **file-driven context**
- Use **state machine driven workflow**
- Use **BMAD Method as development backbone**

---

# 1. System Workflow

```
Requirement Understanding
   ↓
Claude → Question Scan
   ↓
Codex → Deep Reasoning
   ↓
BMAD → PRD
   ↓
Codex → Context Scan
   ↓
Claude → Architecture
   ↓
Claude → Task Breakdown
   ↓
Claude → Code Implementation
        ↘
         Codex (Complex Logic)
   ↓
Codex → Code Review
   ↓
Claude → Final Decision
   ↓
Release Gate
```

---

# 2. Model Responsibilities

## Claude Responsibilities

Claude is responsible for:

- Requirement clarification
- PRD generation
- Architecture design
- Task planning
- Code implementation
- Review decision
- Release approval

Claude roles:

```
Planner
Architect
Coder
Decision Maker
```

---

## Codex Responsibilities

Codex is responsible for:

- Deep requirement reasoning
- Repository context scanning
- SQL / concurrency / algorithm analysis
- Code review
- Complex logic consultation

Codex roles:

```
Deep Reasoner
Context Analyzer
Reviewer
```

---

# 3. BMAD Method Integration

BMAD structures development into four layers.

| BMAD Layer | Output Documents |
|---|---|
| Business Context | PRD.md |
| Model | Context Report + Architecture |
| Action Plan | Tasks + Execution Log |
| Delivery Gate | Review + Release Gate |

### BMAD Commands

| Stage | Command |
|---|---|
PRD | /bmad:prd |
Architecture | /bmad:architect |
Tasks | /bmad:tasks |
Review | /bmad:review |

---

# 4. Project Structure

```
repo-root/
│
├─ ai-dev/
│
├─ config/
│  ├─ workflow.yaml
│  ├─ models.yaml
│  └─ gates.yaml
│
├─ scripts/
│  ├─ ai-dev.sh
│  ├─ intake.sh
│  ├─ reasoning.sh
│  ├─ context.sh
│  ├─ plan.sh
│  ├─ execute.sh
│  ├─ review.sh
│  └─ fix.sh
│
├─ sessions/
│  └─ feature_x/
│     ├─ 00_request.md
│     ├─ 01_claude_questions.md
│     ├─ 02_codex_reasoning.md
│     ├─ 03_context_report.md
│     ├─ 04_prd.md
│     ├─ 05_architecture.md
│     ├─ 06_tasks.md
│     ├─ 07_execution_log.md
│     ├─ 08_review_report.md
│     ├─ 09_fix_decision.md
│     └─ 10_release_gate.md
│
└─ memory/
   ├─ repo_map.md
   ├─ domain_terms.md
   └─ known_constraints.md
```

---

# 5. Workflow State Machine

```
INIT
 ↓
INTAKE
 ↓
REASONING
 ↓
CONTEXT_SCAN
 ↓
PLANNING
 ↓
EXECUTING
 ↓
REVIEWING
 ↓
FIXING
 ↓
RECHECK
 ↓
DONE
```

---

# 6. Workflow Configuration

Example `workflow.yaml`:

```yaml
workflow:

  intake:
    model: claude
    output:
      - questions.md

  reasoning:
    model: codex
    output:
      - reasoning.md

  prd:
    model: claude
    command: /bmad:prd
    output:
      - prd.md

  context:
    model: codex
    output:
      - context.md

  architecture:
    model: claude
    command: /bmad:architect
    output:
      - architecture.md

  tasks:
    model: claude
    command: /bmad:tasks
    output:
      - tasks.md

  execute:
    model: claude

  review:
    model: codex
    command: /bmad:review

  decision:
    model: claude
```

---

# 7. Requirement Understanding

## Claude Question Scan

Claude first identifies:

- Ambiguities
- Missing information
- Hidden constraints
- Potential risks

Output:

```
01_claude_questions.md
```

Structure:

```
Requirement Questions

Ambiguity
Missing Information
Hidden Constraints
Questions for Codex
```

---

# 8. Codex Deep Reasoning

Codex produces:

```
02_codex_reasoning.md
```

Includes:

- True objective
- Non-goals
- Data impact
- Architecture impact
- Compatibility concerns
- Risks

---

# 9. Context Scan

Codex analyzes repository context:

- Modules
- Related code
- Database schema
- APIs
- Dependencies

Output:

```
03_context_report.md
```

---

# 10. Planning Phase

Claude generates:

```
04_prd.md
05_architecture.md
06_tasks.md
```

Tasks must be executable.

Example:

```
1 Add column log_id BIGINT NULL
2 Implement backfill job
3 Batch update WHERE log_id IS NULL
4 Duplicate check
5 Add unique index
```

---

# 11. Code Execution

Claude executes tasks and logs actions.

```
07_execution_log.md
```

---

# 12. Complex Task Escalation

If encountering:

- SQL complexity
- Concurrency issues
- Algorithms
- Data migration

Claude escalates to Codex.

Example:

```
codex_subtask_001.md
```

Codex returns:

```
codex_solution_001.md
```

---

# 13. Code Review

Codex performs deep review.

```
08_review_report.md
```

Review dimensions:

- Correctness
- Performance
- Concurrency
- SQL index usage
- Rollback safety
- Test coverage

---

# 14. Final Decision

Claude decides based on review.

```
09_fix_decision.md
```

Decision types:

- Accept
- Reject
- Defer

---

# 15. Release Gate

Final release validation.

```
10_release_gate.md
```

Checks:

- PRD alignment
- Architecture consistency
- Test coverage
- Risk level

---

# 16. Workflow Runner

Entry command:

```
./ai-dev/scripts/ai-dev.sh new "feature"
```

Workflow execution:

```
intake
reasoning
context
plan
execute
review
fix
```

---

# 17. Context Memory

Persistent AI knowledge stored in:

```
ai-dev/memory/
```

Files:

```
repo_map.md
domain_terms.md
constraints.md
```

This improves model reasoning accuracy.

---

# 18. System Advantages

Before:

```
Manual Codex CLI
Manual Claude CLI
Copying context
```

After:

```
ai-dev runner
↓
automatic model switching
↓
BMAD structured workflow
↓
Claude + Codex collaboration
```

Benefits:

- Stable context
- Clear AI responsibilities
- Documentation-driven development
- Automated workflow
- Extensible system

---

# Conclusion

This system combines:

```
BMAD Method
+ Claude Code
+ Codex
+ Workflow Engine
```

Key features:

- Document-driven development
- Multi-model collaboration
- Automated orchestration
- Continuous evolution

The result is a **Personal AI Dev System**, conceptually similar to:

```
Mini Devin / Cursor Agent
```
