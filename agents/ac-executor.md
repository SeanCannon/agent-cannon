---
description: Execute Agent Cannon tasks with verification gate
argument-hint: "<task-description>"
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  task: true
  todowrite: true
  question: true
---
<objective>
Execute a task with Agent Cannon verification gate. After every code write, verification agents check compliance against the rules. The developer decides what to do with findings.
</objective>

<required_reading>
Read ~/.config/opencode/agent-cannon/rules/agent-cannon-rules.md before starting.
</required_reading>

<context>
Agent Cannon rules apply to ALL code decisions. The developer decides, you surface findings and recommendations.
</context>

<process>

## 1. Parse Task

Parse task description from arguments or prompt user:

```
question(
  header: "Quick Task",
  question: "What needs to be done?",
)
```

## 2. Analyze Task

Break the task into:
- **Utility logic** (additive, safe): new pure functions, strategy map entries, type definitions, utility modules
- **Application logic** (integration): modifying existing code, wiring utilities into flows

Present the breakdown:
```
## Task Breakdown

### Utility Logic (safe, additive)
1. {what}
2. {what}

### Application Logic (integration)
1. {what}

Execute utility first. Application last. Pause without unwinding.
```

## 3. Execute Utility Logic

For each utility task:
1. Write the code
2. Run deterministic checks (lint, build, test)
3. Surface findings to developer

## 4. Execute Application Logic

For each application task:
1. Write the code
2. Run verification agents
3. Surface findings to developer

## 5. Final Verification

**Step 5a: Verify git diff shows actual changes**
```
bash
node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs verify-git-diff HEAD
```

If claimed files are NOT in git diff output → **HALLUCINATION DETECTED**

**Step 5b: If claims were made about specific content (e.g., "added make verify target"), verify those claims**
```
bash
node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs verify-claims '{"Makefile": ["verify:", "test:"]}'
```

If HALLUCINATION_DETECTED → report immediately, do not proceed.

**Step 5c: Run deterministic verification**
```
bash
node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs verify [modified files]
```

**Step 5d: Run build verification (Rule 8)**
```
bash
npx tsc --noEmit || cargo build || python -m py_compile *.py || go build ./...
```

Present summary:
```
## Task Complete

{summary}
Git diff: {files changed}
Claims verified: {pass/fail}
Build: {pass/fail}
Verification: {clean/issues found}
```

</process>

<success_criteria>
- [ ] Task parsed
- [ ] Utility/Application breakdown presented
- [ ] Utility logic executed first
- [ ] Application logic executed last
- [ ] Deterministic checks run
- [ ] Verification agents invoked
- [ ] Findings surfaced to developer
- [ ] Final verification run
- [ ] Summary presented
</success_criteria>
