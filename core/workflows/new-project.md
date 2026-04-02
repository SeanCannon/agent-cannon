<purpose>
Initialize a new project through unified flow: questioning, research (optional), requirements, roadmap.
Agent Cannon rules context is loaded during questioning and research to enforce design principles from the start.
One workflow takes you from idea to ready-for-planning with Agent Cannon standards baked in.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
Read ~/.config/opencode/rules/agent-cannon-rules.md — rules apply to ALL code decisions.
</required_reading>

<process>

## 1. Setup

**MANDATORY FIRST STEP — Execute these checks before ANY user interaction:**

```bash
INIT=$(node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs init new-project)
```

Parse JSON for: `project_exists`, `has_codebase_map`, `planning_exists`, `has_existing_code`, `has_git`.

**If `project_exists` is true:** Error — project already initialized.
**If `has_git` is false:** Initialize git: `git init`

## 2. Deep Questioning

**Display stage banner:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► QUESTIONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Open the conversation:**

Ask inline (freeform, NOT question):

"What do you want to build?"

Wait for their response.

**Load Agent Cannon rules context:**

Read `~/.config/opencode/rules/agent-cannon-rules.md` into context. Use these rules to inform questioning:

- Ask about data flow patterns (pure functions vs side effects)
- Probe testing expectations (100% coverage target, DI requirements)
- Surface mutation risks early (immutable data patterns)
- Explore branching strategy (strategy pattern vs conditionals)

**Follow the thread:**

Based on what they said, ask follow-up questions. Consult `questioning.md` for techniques:
- Challenge vagueness
- Make abstract concrete
- Surface assumptions
- Find edges
- Reveal motivation

**Agent Cannon–specific questions to weave in:**
- "Will this code need to be highly testable with mocked dependencies?"
- "Are there complex business rules that should use strategy objects?"
- "Is immutability important for your data transformations?"

**Decision gate:**

When you could write a clear PROJECT.md:

- header: "Ready?"
- question: "I think I understand what you're after. Ready to create PROJECT.md?"
- options:
  - "Create PROJECT.md" — Let's move forward
  - "Keep exploring" — I want to share more

## 3. Write PROJECT.md

Synthesize all context into `.planning/PROJECT.md`.

Include Agent Cannon design principles section:

```markdown
## Design Standards

This project follows Agent Cannon rules:
- Strategy Pattern for business logic branching
- Pure functions with dependency injection
- 100% test coverage target
- No input mutation, no side effects in pure functions
- No commented-out code, no hardcoded secrets
```

Initialize requirements as hypotheses:

```markdown
## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] [Requirement 1]
- [ ] [Requirement 2]

### Out of Scope

- [Exclusion 1] — [why]
```

**Commit PROJECT.md:**

```bash
mkdir -p .planning
node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs commit "docs: initialize project" --files .planning/PROJECT.md
```

## 4. Workflow Configuration

Ask configuration questions:

```
questions: [
  {
    header: "Depth",
    question: "How thorough should planning be?",
    options: [
      { label: "Quick", description: "Ship fast (3-5 phases, 1-3 plans each)" },
      { label: "Standard", description: "Balanced (5-8 phases, 3-5 plans each)" },
      { label: "Comprehensive", description: "Thorough (8-12 phases, 5-10 plans each)" }
    ]
  },
  {
    header: "Execution",
    question: "Run plans in parallel?",
    options: [
      { label: "Parallel (Recommended)", description: "Independent plans run simultaneously" },
      { label: "Sequential", description: "One plan at a time" }
    ]
  },
  {
    header: "Verification",
    question: "Enforce Agent Cannon rules on every code write?",
    options: [
      { label: "Yes (Recommended)", description: "Verification gate blocks on CRITICAL violations" },
      { label: "Advisory only", description: "Log violations but don't block" }
    ]
  }
]
```

Create `.planning/config.json`:

```json
{
  "depth": "quick|standard|comprehensive",
  "parallelization": true|false,
  "verification": "blocking|advisory",
  "rules": "agent-cannon-rules.md",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

```bash
node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs commit "chore: add project config" --files .planning/config.json
```

## 5. Research Decision

Use question:
- header: "Research"
- question: "Research the domain ecosystem before defining requirements?"
- options:
  - "Research first (Recommended)" — Discover standard stacks, expected features, patterns
  - "Skip research" — I know this domain well, go straight to requirements

**If "Research first":**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► RESEARCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Researching [domain] ecosystem...
```

Create research directory:
```bash
mkdir -p .planning/research
```

Spawn 4 parallel researchers. Each receives Agent Cannon rules context:

```
Task(prompt="
<objective>
Research {dimension} for [domain].
</objective>

<agent_cannon_context>
This project follows Agent Cannon rules. When recommending patterns:
- Prefer pure functions and functional composition
- Recommend strategy pattern over conditional branching
- Identify DI patterns for testability
- Flag mutation risks in recommended approaches
Reference: ~/.config/opencode/rules/agent-cannon-rules.md
</agent_cannon_context>

<output>
Write to: .planning/research/{dimension}.md
</output>
", subagent_type="general", model="{researcher_model}", description="{dimension} research")
```

Dimensions: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

After all 4 complete, spawn synthesizer to create SUMMARY.md.

## 6. Define Requirements

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► DEFINING REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Load PROJECT.md + research/FEATURES.md. Present features by category.

For each category, use question to scope v1/v2/out-of-scope.

**Generate REQUIREMENTS.md** with:
- v1 Requirements grouped by category (checkboxes, REQ-IDs)
- v2 Requirements (deferred)
- Out of Scope (explicit exclusions with reasoning)
- Traceability section (empty, filled by roadmap)

**REQ-ID format:** `[CATEGORY]-[NUMBER]` (AUTH-01, CONTENT-02)

```bash
node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs commit "docs: define v1 requirements" --files .planning/REQUIREMENTS.md
```

## 7. Create Roadmap

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► CREATING ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning roadmapper...
```

Spawn roadmapper with full context:

```
Task(prompt="
<planning_context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/research/SUMMARY.md
@.planning/config.json
</planning_context>

<agent_cannon_rules>
@/Users/seancannon/.config/opencode/rules/agent-cannon-rules.md

Phase plans MUST account for:
- Test infrastructure setup (DI, mocking)
- Strategy pattern implementation patterns
- Pure function boundaries
- Verification gate compliance
</agent_cannon_rules>

<instructions>
1. Derive phases from requirements
2. Map every v1 requirement to exactly one phase
3. Derive 2-5 success criteria per phase
4. Validate 100% coverage
5. Write files: ROADMAP.md, STATE.md, update REQUIREMENTS.md traceability
</instructions>
", subagent_type="ac-roadmapper", model="{roadmapper_model}", description="Create roadmap")
```

**Present roadmap. Get approval. Commit.**

```bash
node /Users/seancannon/.config/opencode/agent-cannon/bin/ac-tools.cjs commit "docs: create roadmap ([N] phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## 8. Done

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT CANNON ► PROJECT INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]**

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Config         | `.planning/config.json`     |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |

**[N] phases** | **[X] requirements** | Ready to build ✓
```

Next: plan-phase for Phase 1.

</process>

<success_criteria>
- [ ] .planning/ directory created
- [ ] Git repo initialized
- [ ] Agent Cannon rules loaded during questioning
- [ ] PROJECT.md captures full context + design standards → committed
- [ ] config.json has depth, parallelization, verification mode → committed
- [ ] Research completed (if selected) with Agent Cannon context → committed
- [ ] Requirements gathered with REQ-IDs → committed
- [ ] Roadmap created accounting for Agent Cannon patterns → committed
- [ ] STATE.md initialized
- [ ] User knows next step
</success_criteria>
