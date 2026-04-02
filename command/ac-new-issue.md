---
description: Tackle a new issue with structured breakdown and Agent Cannon enforcement
argument-hint: "<issue-text or URL>"
tools:
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  bash: true
  task: true
  question: true
  webfetch: true
  todowrite: true
---
<objective>
Take a new issue (raw text, Jira URL, or GitHub issue URL) and break it into executable work with Agent Cannon enforcement.

The approach:
1. Read and understand the issue (fetch if URL provided)
2. Align on definition of done
3. Break into two categories: utility logic and application logic
4. Utility logic is always additive (new functions, strategy pattern extensions, deprecation notices for legacy)
5. Application logic is done last (easier to pause and pivot without unwinding)
6. Execute utility logic first, verify, then tackle application logic
</objective>

<execution_context>
@~/.config/opencode/agent-cannon/workflows/new-issue.md
</execution_context>

<context>
$ARGUMENTS — Either raw text describing the issue, or a URL to a Jira ticket or GitHub issue.
</context>

<process>
Execute the new-issue workflow from @~/.config/opencode/agent-cannon/workflows/new-issue.md end-to-end.
</process>
