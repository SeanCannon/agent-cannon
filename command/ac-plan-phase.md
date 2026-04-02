---
description: Create phase plan with Agent Cannon enforcement
argument-hint: "<phase-number> [--skip-research]"
tools:
  read: true
  write: true
  bash: true
  task: true
  webfetch: true
---
<objective>
Create executable phase plans (PLAN.md files) with Agent Cannon enforcement.

**Default flow:** Research (if needed) → Plan → Verify rules compliance → Done
</objective>

<execution_context>
@/Users/seancannon/.config/opencode/agent-cannon/workflows/plan-phase.md
</execution_context>

<context>
Phase number: $ARGUMENTS (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--skip-research` — Skip research, go straight to planning
- `--skip-verify` — Skip verification loop
</context>

<process>
Execute the plan-phase workflow from @/Users/seancannon/.config/opencode/agent-cannon/workflows/plan-phase.md end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
