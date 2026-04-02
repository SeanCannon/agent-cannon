<purpose>
Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research, planning, and verification.
Passes Agent Cannon rules and references to all agents to ensure plans enforce compliance from the design stage.
Default flow: Research → Plan → Verify → Done.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
Read ~/.config/opencode/rules/agent-cannon-rules.md before spawning any agent.
</required_reading>

<process>

## 1. Initialize

Load all context in one call:

```bash
INIT=$(node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs init plan-phase "$PHASE")
```

Parse JSON for: `planner_model`, `researcher_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`.

**If `planning_exists` is false:** Error — initialize project first.
**If `phase_found` is false:** Create directory:
```bash
mkdir -p "${phase_dir}"
```

## 2. Parse Arguments

Extract from $ARGUMENTS: phase number, flags (`--research`, `--skip-research`, `--gaps`, `--skip-verify`).

**If no phase number:** Detect next unplanned phase from roadmap.

## 3. Validate Phase

```bash
PHASE_INFO=$(node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs roadmap get-phase "${PHASE}")
```

Extract: `phase_number`, `phase_name`, `goal`, `requirements`.

## 4. Load Agent Cannon Rules Context

**CRITICAL:** Rules MUST be loaded and passed to every agent spawn.

```bash
RULES_CONTENT=$(cat ~/.config/opencode/rules/agent-cannon-rules.md)
```

Rules context for agent prompts:

```
<agent_cannon_rules>
CRITICAL RULES — non-negotiable for all generated code:
1. NEVER mutate input data — clone before modifying
2. NEVER use if/else chains for business logic — use Strategy Pattern
3. NEVER introduce side effects in pure functions
4. NEVER commit commented-out code
5. NEVER hardcode secrets
6. ALWAYS write tests for new code (100% coverage target)
7. ALWAYS use dependency injection for testability

DESIGN PRINCIPLES:
- Pure functions, functional composition
- Strategy pattern for branching
- Separation of concerns
- Self-documenting code

Reference: ~/.config/opencode/rules/agent-cannon-rules.md
Reference docs: ~/.config/opencode/rules/references/strategy-pattern.md
                ~/.config/opencode/rules/references/pure-functions.md
                ~/.config/opencode/rules/references/testing-standards.md
                ~/.config/opencode/rules/references/anti-patterns.md
                ~/.config/opencode/rules/references/code-quality.md
</agent_cannon_rules>
```

## 5. Load Phase Context

Use `context_content` from init JSON.

**If `context_content` is null (no CONTEXT.md):**

Use question:
- header: "No context"
- question: "No CONTEXT.md found for Phase {X}. Continue without design preferences?"
- options:
  - "Continue without context" — Plan using research + requirements only
  - "Run discuss-phase first" — Capture design decisions before planning

## 6. Handle Research

**Skip if:** `--gaps` flag, `--skip-research` flag, or `research_enabled` is false.

**If `has_research` is true AND no `--research` flag:** Use existing, skip to step 7.

**If research needed:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► RESEARCHING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning researcher...
```

Spawn researcher with Agent Cannon rules context:

```
Task(
  prompt="
    <objective>
    Research how to implement Phase {phase_number}: {phase_name}.
    Answer: 'What do I need to know to PLAN this phase well?'
    </objective>

    <phase_context>
    IMPORTANT: If CONTEXT.md exists, it contains user decisions.
    - Decisions = Locked — research THESE deeply
    - Claude's Discretion = Freedom areas — research options, recommend
    - Deferred Ideas = Out of scope — ignore

    {context_content}
    </phase_context>

    <agent_cannon_rules>
    {rules_content}

    When recommending implementation approaches:
    - Favor pure functions over stateful classes
    - Recommend strategy pattern over conditional branching
    - Identify where dependency injection is needed
    - Flag mutation risks in any suggested approach
    - Consider testability of every recommendation
    </agent_cannon_rules>

    <additional_context>
    Phase description: {phase_description}
    Phase requirement IDs: {phase_req_ids}
    Requirements: {requirements}
    </additional_context>

    <output>
    Write to: {phase_dir}/{phase_num}-RESEARCH.md
    </output>
  ",
  subagent_type="general",
  model="{researcher_model}",
  description="Research Phase {phase}"
)
```

## 7. Check Existing Plans

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**If exists:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.

## 8. Spawn Planner Agent

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► PLANNING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning planner...
```

Planner prompt with rules and references:

```
Task(
  prompt="
    <planning_context>
    Phase: {phase_number}
    Project State: {state_content}
    Roadmap: {roadmap_content}
    Phase requirement IDs: {phase_req_ids}
    Requirements: {requirements_content}

    Phase Context:
    IMPORTANT: If context exists, it contains USER DECISIONS.
    - Decisions = LOCKED — honor exactly
    - Claude's Discretion = Freedom — make choices
    - Deferred Ideas = Out of scope — do NOT include

    {context_content}

    Research: {research_content}
    </planning_context>

    <agent_cannon_rules>
    {rules_content}

    Plans MUST account for Agent Cannon enforcement:
    - Every code task must produce pure functions where applicable
    - Business logic tasks must use strategy pattern
    - Every feature task must include corresponding test tasks
    - Dependency injection must be specified for testable functions
    - Files_modified must list ALL files (so verification gate can check them)
    </agent_cannon_rules>

    <downstream_consumer>
    Output consumed by execute-phase workflow. Plans need:
    - Frontmatter (wave, depends_on, files_modified, autonomous)
    - Tasks in XML format with type attribute
    - Verification criteria per task
    - must_haves for goal-backward verification
    - Each code task paired with its test task
    </downstream_consumer>

    <quality_gate>
    - [ ] PLAN.md files created in phase directory
    - [ ] Each plan has valid frontmatter
    - [ ] Tasks are specific and actionable
    - [ ] Dependencies correctly identified
    - [ ] Waves assigned for parallel execution
    - [ ] must_haves derived from phase goal
    - [ ] Agent Cannon rules compliance designed into plans
    - [ ] Test tasks paired with feature tasks
    </quality_gate>
  ",
  subagent_type="general",
  model="{planner_model}",
  description="Plan Phase {phase}"
)
```

## 9. Handle Planner Return

- **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` is false: skip to step 12. Otherwise: step 10.
- **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation.
- **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual.

## 10. Spawn Plan Checker Agent

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► VERIFYING PLANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning plan checker...
```

```
Task(
  prompt="
    <verification_context>
    Phase: {phase_number}
    Phase Goal: {goal from ROADMAP}

    Plans to verify: {plans_content}
    Phase requirement IDs (MUST ALL be covered): {phase_req_ids}
    Requirements: {requirements_content}

    Phase Context:
    Plans MUST honor user decisions. Flag if plans contradict.
    - Decisions = LOCKED — plans must implement exactly
    - Claude's Discretion = Freedom areas — plans can choose approach
    - Deferred Ideas = Out of scope — plans must NOT include
    {context_content}
    </verification_context>

    <agent_cannon_verification>
    {rules_content}

    CHECK these specific rule compliance items:
    - [ ] No plan tasks use if/else chains — strategy pattern specified?
    - [ ] No plan tasks mutate inputs — immutable patterns specified?
    - [ ] No plan tasks introduce side effects in pure functions?
    - [ ] Test tasks exist for every feature task?
    - [ ] Dependency injection specified where needed?
    - [ ] No hardcoded secrets in any plan?
    - [ ] files_modified lists complete so verification gate can check?
    </agent_cannon_verification>

    <expected_output>
    - ## VERIFICATION PASSED — all checks pass
    - ## ISSUES FOUND — structured issue list with Agent Cannon rule references
    </expected_output>
  ",
  subagent_type="ac-plan-checker",
  model="{checker_model}",
  description="Verify Phase {phase} plans"
)
```

## 11. Handle Checker Return

- **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 12.
- **`## ISSUES FOUND`:** Display issues, check iteration count, proceed to revision loop.

## 12. Revision Loop (Max 3 Iterations)

Track `iteration_count` (starts at 1 after initial plan + check).

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

```
Task(
  prompt="
    <revision_context>
    Phase: {phase_number}
    Mode: revision

    Existing plans: {plans_content}
    Checker issues: {structured_issues_from_checker}

    Agent Cannon Rules — revisions must still comply:
    {rules_content}
    {context_content}
    </revision_context>

    <instructions>
    Make targeted updates to address checker issues.
    Do NOT replan from scratch unless issues are fundamental.
    Return what changed.
    </instructions>
  ",
  subagent_type="general",
  model="{planner_model}",
  description="Revise Phase {phase} plans"
)
```

After planner returns → spawn checker again (step 10), increment iteration_count.

**If iteration_count >= 3:**

Display: `Max iterations reached. {N} issues remain:` + issue list

Offer: 1) Force proceed, 2) Provide guidance and retry, 3) Abandon.

## 13. Present Final Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► PHASE {X} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {X}: {Name}** — {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives] |
| 2    | 03     | [objective]  |

Research: {Completed | Used existing | Skipped}
Verification: {Passed | Passed with override | Skipped}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute Phase {X}** — run all {N} plans with verification gate

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```

</process>

<success_criteria>
- [ ] .planning/ directory validated
- [ ] Phase validated against roadmap
- [ ] Phase directory created if needed
- [ ] Agent Cannon rules loaded and passed to ALL agents
- [ ] Research completed (unless --skip-research or --gaps or exists)
- [ ] Planner spawned with rules context
- [ ] Plans account for strategy pattern, pure functions, DI, tests
- [ ] Plan checker verified Agent Cannon compliance
- [ ] Verification passed OR user override OR max iterations
- [ ] User sees status between agent spawns
- [ ] User knows next steps
</success_criteria>
