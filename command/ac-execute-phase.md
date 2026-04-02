---
description: Execute phase plans with verification gate
argument-hint: "<phase-number> [--auto]"
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  task: true
  todowrite: true
---
<objective>
Execute all plans in a phase with Agent Cannon verification gate.

After every code write, verification agents check compliance:
- **CRITICAL violation** → BLOCK commit, present to user
- **WARNING violation** → Log, advise user, continue
- **Clean** → Commit and proceed
</objective>

<execution_context>
@~/.config/opencode/agent-cannon/workflows/execute-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS

**Flags:**
- `--auto` — Non-interactive. CRITICAL still blocks, WARNING auto-proceeds.

**Project state:**
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<process>
Execute the execute-phase workflow from @~/.config/opencode/agent-cannon/workflows/execute-phase.md end-to-end.
Preserve all workflow gates (wave execution, verification, state updates, routing).
</process>
