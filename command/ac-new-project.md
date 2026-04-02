---
description: Initialize a new project with Agent Cannon enforcement
argument-hint: "[--auto]"
tools:
  read: true
  write: true
  bash: true
  task: true
  question: true
  todowrite: true
---
<objective>
Initialize a new project through unified flow: questioning → research (optional) → requirements → roadmap.

With Agent Cannon rules loaded as system context for the entire session.

**Creates:**
- `.planning/PROJECT.md` — project context
- `.planning/config.json` — workflow preferences
- `.planning/research/` — domain research (optional)
- `.planning/REQUIREMENTS.md` — scoped requirements
- `.planning/ROADMAP.md` — phase structure
- `.planning/STATE.md` — project memory

**After this command:** Run `/ac-plan-phase 1` to start planning with enforcement.
</objective>

<execution_context>
@~/.config/opencode/agent-cannon/workflows/new-project.md
</execution_context>

<context>
**Flags:**
- `--auto` — Automatic mode. After config questions, runs research → requirements → roadmap without further interaction. Expects idea document via @ reference.
</context>

<process>
Execute the new-project workflow from @~/.config/opencode/agent-cannon/workflows/new-project.md end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
