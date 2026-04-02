<purpose>
Tackle a new issue by breaking it into utility logic (additive, safe) and application logic (integration, riskier). Execute utility logic first so application logic can be paused or pivoted without unwinding work.
</purpose>

<process>

## 1. Ingest the Issue

Parse $ARGUMENTS:
- If it looks like a URL (starts with http), fetch it with webfetch
  - GitHub issue: extract title, body, labels, comments
  - Jira ticket: extract summary, description, acceptance criteria
- If it's raw text, use it as-is

Present the issue summary to the user:
```
## Issue

{title/summary}

{description/body}

Labels: {if any}
```

## 2. Align on Definition of Done

Ask the user to confirm or clarify what "done" looks like:

```
question:
  header: "Done?"
  question: "What does done look like for this issue? Here's what I understood:"
  options:
    - "That's correct, proceed"
    - "Let me clarify"
```

If "Let me clarify" — capture their explanation, restate, confirm again.

Lock the definition of done before proceeding.

## 3. Analyze and Break Down

Read the current codebase to understand what exists. Then categorize all work into two buckets:

### Utility Logic (Execute First)

Things that are additive and safe:
- New pure functions
- New strategy map entries (extending behavior, not replacing)
- New type definitions, interfaces, structs
- New utility/helper modules
- Deprecation notices on legacy functions (mark old path, add new path)
- New test files for new functions

Why first: Utility logic is additive. It doesn't break existing code. If you need to pause or pivot, nothing needs unwinding. The new code sits there, ready.

### Application Logic (Execute Last)

Things that wire new utility into existing flows:
- Modifying existing functions to call new utilities
- Updating routes, handlers, controllers
- Changing existing data flows
- Modifying existing tests for new behavior
- Database migrations that existing code depends on

Why last: Application logic touches existing code. If you pause mid-issue, the utility functions are done but not wired in. No unwinding needed. Resume later and wire them in.

Present the breakdown:

```
## Breakdown

### Utility Logic (safe, additive)
1. {what}
2. {what}
3. {what}

### Application Logic (integration)
1. {what}
2. {what}

Utility first. Application last. This lets us pause at any point without unwinding.
```

## 4. Execute Utility Logic

For each utility task:
1. Write the code
2. Run Agent Cannon verification (ac-tools.cjs verify)
3. Run build verification (cargo build / tsc --noEmit / etc.)
4. If clean, commit atomically

After all utility tasks:
```
## Utility Logic Complete

{x} utility functions added. Build passes. Verification clean.

Ready to wire into application logic, or pause here.
```

## 5. Execute Application Logic

For each application task:
1. Write the code
2. Run Agent Cannon verification
3. Run build verification
4. If clean, commit atomically

After all application tasks:
```
## Issue Complete

{definition of done met}
{x} commits. Build passes. Verification clean.
```

## 6. Final Verification

Run full verification:
```bash
node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs verify [modified files]
```

Run build:
```
{detected build command}
```

Present summary:

```
## Issue Complete

**Issue:** {title}
**Definition of done:** {met}
**Commits:** {count}
**Build:** {pass}
**Verification:** {pass}
```

</process>

<success_criteria>
- [ ] Issue ingested (fetched if URL, captured if text)
- [ ] Definition of done aligned with user
- [ ] Work broken into utility logic and application logic
- [ ] Utility logic executed first (additive, no risk)
- [ ] Application logic executed last (integration, pausable)
- [ ] Each task verified by Agent Cannon
- [ ] Build verified after changes
- [ ] No claims made without verification
- [ ] All commits atomic
</success_criteria>
