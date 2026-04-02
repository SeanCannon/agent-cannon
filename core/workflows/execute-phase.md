<purpose>
Execute all plans in a phase using wave-based parallel execution.
After each code write, verification agents check compliance with Agent Cannon rules.
CRITICAL violations block acceptance. WARNING violations advise.
</purpose>

<core_principle>
Every code write is verified before acceptance. The verification gate is the differentiator between Agent Cannon and standard execution — it enforces the rules defined in agent-cannon-rules.md at write time, not review time.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
Read ~/.config/opencode/rules/agent-cannon-rules.md to understand CRITICAL rules enforced by verification.
</required_reading>

<process>

<step name="initialize" priority="first">
Load all context in one call:

```bash
INIT=$(node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs init execute-phase "${PHASE_ARG}")
```

Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`.

**If `phase_found` is false:** Error — phase directory not found.
**If `plan_count` is 0:** Error — no plans found in phase.
**If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.

When `parallelization` is false, plans within a wave execute sequentially.
</step>

<step name="handle_branching">
Check `branching_strategy` from init:

**"none":** Skip, continue on current branch.

**"phase" or "milestone":** Use pre-computed `branch_name` from init:
```bash
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
```

All subsequent commits go to this branch. User handles merging.
</step>

<step name="validate_phase">
From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.

Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
</step>

<step name="discover_and_group_plans">
Load plan inventory with wave grouping:

```bash
PLAN_INDEX=$(node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs phase-plan-index "${PHASE_NUMBER}")
```

Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number → plan IDs), `incomplete`, `has_checkpoints`.

**Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans.

Report:
```
## Execution Plan

**Phase {X}: {Name}** — {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
| 2 | 01-03 | ... |
```
</step>

<step name="execute_waves">
Execute each wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   Read each plan's `<objective>`. Extract what's being built and why.

   ```
   ---
   ## Wave {N}

   **{Plan ID}: {Plan Name}**
   {2-3 sentences: what this builds, technical approach, why it matters}

   Spawning {count} agent(s)...
   ---
   ```

2. **Spawn executor agents:**

   ```
   Task(
     subagent_type="ac-executor",
     model="{executor_model}",
     prompt="
       <objective>
       Execute plan {plan_number} of phase {phase_number}-{phase_name}.
       Commit each task atomically. Create SUMMARY.md. Update STATE.md.
       </objective>

       <execution_context>
       @/Users/seancannon/.config/opencode/agent-cannon/workflows/execute-plan.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - Plan: {phase_dir}/{plan_file}
       - State: .planning/STATE.md
       - Rules: ~/.config/opencode/rules/agent-cannon-rules.md
       </files_to_read>

       <rules_enforcement>
       You MUST follow ALL rules in agent-cannon-rules.md. Key enforcement:
       - NEVER mutate input data
       - NEVER use if/else chains for business logic
       - NEVER introduce side effects in pure functions
       - NEVER commit commented-out code
       - NEVER hardcode secrets
       - ALWAYS write tests for new code
       - ALWAYS use dependency injection
       </rules_enforcement>

       <success_criteria>
       - [ ] All tasks executed
       - [ ] Each task committed individually
       - [ ] SUMMARY.md created in plan directory
       - [ ] STATE.md updated with position and decisions
       - [ ] Code follows Agent Cannon rules
       </success_criteria>
     "
   )
   ```

3. **Wait for all agents in wave to complete.**

4. **VERIFICATION GATE — spawn ac-orchestrator for each modified file:**

   For each file listed in the plan's `files_modified`:
   ```
   Task(
     subagent_type="ac-orchestrator",
     model="{verifier_model}",
     description="Verify {file_path}",
     prompt="Verify the file at {file_path} for Agent Cannon rule compliance."
   )
   ```

5. **Collect verification results and enforce gate:**

   Parse ac-orchestrator reports for each file. Apply blocking logic:

   | Condition | Action | Description |
   |-----------|--------|-------------|
   | Any CRITICAL violation | **BLOCK** | Do NOT commit. Present violations to user. |
   | WARNING only | **LOG** | Continue with advisory. Log warnings. |
   | All clean | **COMMIT** | Commit and continue to next task. |

   **If BLOCKED (CRITICAL violations):**
   ```
   ---
   ## VERIFICATION GATE FAILED

   **Plan:** {plan_id}
   **File:** {file_path}
   **Status:** BLOCKED — {N} CRITICAL violations

   ### CRITICAL Violations
   | # | Agent | Line | Rule | Description |
   |---|-------|------|------|-------------|
   | 1 | {agent} | {line} | {rule} | {message} |

   **Action Required:** Fix violations before proceeding.
   Options: Fix now / Skip file / Abort plan
   ---
   ```

   **If WARNING only:**
   ```
   ---
   ## VERIFICATION GATE PASSED (with advisories)

   **Plan:** {plan_id}
   **File:** {file_path}
   **Status:** ACCEPTED — {N} advisory warnings

   ### Warnings
   | # | Agent | Line | Rule | Description |
   |---|-------|------|------|-------------|
   | 1 | {agent} | {line} | {rule} | {message} |
   ---
   ```

   **If clean:**
   ```
   ---
   ## VERIFICATION GATE PASSED

   **Plan:** {plan_id}
   **File:** {file_path}
   **Status:** ACCEPTED — all agents passed
   ---
   ```

6. **Commit verified changes (if not blocked):**

   ```bash
   node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs commit "feat(phase-{X}): {plan objective}" --files {verified_files}
   ```

7. **Report wave completion:**

   ```
   ---
   ## Wave {N} Complete

   **{Plan ID}: {Plan Name}**
   {What was built — from SUMMARY.md}
   Verification: {Passed | Passed with warnings | Blocked — N violations}

   {If more waves: what this enables for next wave}
   ---
   ```

8. **Handle failures:**

   For real failures: report which plan failed → ask "Continue?" or "Stop?"

9. **Proceed to next wave.**
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

1. Spawn agent for checkpoint plan
2. Agent runs until checkpoint task → returns structured state
3. **Present to user:**
   ```
   ## Checkpoint: [Type]

   **Plan:** {plan_id} {plan_name}
   **Progress:** {N}/{M} tasks complete

   [Checkpoint Details from agent return]
   ```
4. User responds: "approved"/"done" | issue description
5. Spawn continuation agent with user response
6. Continuation agent verifies previous commits, continues from resume point
</step>

<step name="aggregate_results">
After all waves:

```markdown
## Phase {X}: {Name} Execution Complete

**Waves:** {N} | **Plans:** {M}/{total} complete

| Wave | Plans | Status | Verification |
|------|-------|--------|--------------|
| 1 | plan-01, plan-02 | ✓ Complete | ✓ Clean |
| 2 | plan-03 | ✓ Complete | ⚠ 2 warnings |

### Plan Details
1. **03-01**: [one-liner from SUMMARY.md]
2. **03-02**: [one-liner from SUMMARY.md]

### Verification Summary
- Files verified: {N}
- Clean passes: {N}
- Passed with warnings: {N}
- Blocked (critical): {N}

### Issues Encountered
[Aggregate from verification reports, or "None"]
```
</step>

<step name="verify_phase_goal">
Verify phase achieved its GOAL, not just completed tasks.

```bash
PHASE_REQ_IDS=$(node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs roadmap get-phase "${PHASE_NUMBER}" | jq -r '.section' | grep -i "Requirements:" | sed 's/.*Requirements:\*\*\s*//' | sed 's/[\[\]]//g')
```

```
Task(
  prompt="Verify phase {phase_number} goal achievement.

Phase directory: {phase_dir}
Phase goal: {goal from ROADMAP.md}
Phase requirement IDs: {phase_req_ids}
Check must_haves against actual codebase.
Cross-reference requirement IDs from PLAN frontmatter against REQUIREMENTS.md — every ID MUST be accounted for.
Also verify Agent Cannon rules compliance across all generated code.
Create VERIFICATION.md.",
  subagent_type="ac-verifier",
  model="{verifier_model}"
)
```

Read status:
```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| Status | Action |
|--------|--------|
| `passed` | → update_roadmap |
| `human_needed` | Present items for human testing, get approval or feedback |
| `gaps_found` | Present gap summary, offer planning gap closure |
</step>

<step name="update_roadmap">
**Mark phase complete and update all tracking files:**

```bash
COMPLETION=$(node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs phase complete "${PHASE_NUMBER}")
```

The CLI handles:
- Marking phase checkbox `[x]` with completion date
- Updating Progress table (Status → Complete, date)
- Advancing STATE.md to next phase
- Updating REQUIREMENTS.md traceability

```bash
node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs commit "docs(phase-{X}): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md .planning/phases/{phase_dir}/*-VERIFICATION.md
```
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context. Subagents: fresh 200k each. No polling (Task blocks). No context bleed.
</context_efficiency>

<failure_handling>
- **Verification gate BLOCKED:** Present CRITICAL violations, do NOT commit, user decides fix/skip/abort
- **Agent fails mid-plan:** Missing SUMMARY.md → report, ask user how to proceed
- **Dependency chain breaks:** Wave 1 fails → Wave 2 dependents likely fail → user chooses attempt or skip
- **All agents in wave fail:** Systemic issue → stop, report for investigation
- **Verification timeout:** Agent timeout → WARNING (not BLOCKED), continue with advisory
</failure_handling>

<resumption>
Re-run execute-phase for same phase → discover_plans finds completed SUMMARYs → skips them → resumes from first incomplete plan → continues wave execution.

STATE.md tracks: last completed plan, current wave, pending checkpoints.
</resumption>

<success_criteria>
- [ ] All plans executed across waves
- [ ] Verification gate run after EACH code write (not batched)
- [ ] CRITICAL violations blocked acceptance (code not committed)
- [ ] WARNING violations logged and accepted
- [ ] All modified files verified by ac-orchestrator
- [ ] Phase must-haves verified against codebase
- [ ] ROADMAP.md and STATE.md updated
- [ ] All commits atomic and follow conventions
</success_criteria>
