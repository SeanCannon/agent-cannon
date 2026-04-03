---
description: Execute a quick task with Agent Cannon verification
argument-hint: "<task-description>"
tools:
  read: true
  write: true
  bash: true
  task: true
  question: true
---
<objective>
Execute a quick task with Agent Cannon rules enforcement. Spawn ac-executor to handle the task with verification gate.
</objective>

<process>

**Parse task description from $ARGUMENTS**

If empty, prompt user:
```
question(
  header: "Quick Task",
  question: "What needs to be done?",
)
```

**Spawn ac-executor:**

```
Task(
  prompt="Execute this task with Agent Cannon verification: {task_description}

  Read ~/.config/opencode/agent-cannon/rules/agent-cannon-rules.md for the rules.
  Read ~/.config/opencode/agent-cannon/references/linter-configs.md for lint configuration.
  
  After every code write, run deterministic checks.
  Surface findings to the developer. Let them decide.",
  subagent_type="ac-executor",
  description="Quick task: {task_description}"
)
```

</process>
