<div align="center">
  <h1>Agent Cannon</h1>
  <img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/dbdd6c68-3f37-45d1-b950-29f3852f7297" />
</div>

<br/>

<div align="center" style="color:#999; font-family:Georgia,serif; font-size:15px; line-height:1.8;">
  An open-source AI coding agent that automates best practices during pair-programming.<br/>
  Built on <em><a href="https://github.com/succeedinsoftware/book" target="_blank">Succeed In Software</a></em> by Sean Cannon. 
  30 years of industry experience, automated.
<br /><br />
<em>Inspired by <a href="https://github.com/gsd-build/get-shit-done" target="_blank">GSD</a> 🙏</em>
</div>

<br/>

<table width="100%" style="border:none; border-collapse:collapse;">
<tr>
<td align="center" style="border:1px solid #333; padding:14px 24px; background:#111; color:#aaa; font-family:monospace; font-size:14px;">
  git clone https://github.com/seancannon/agent-cannon.git && cd agent-cannon && bash core/install.sh
</td>
</tr>
</table>

---

### What It Does

Every time the AI writes code, Agent Cannon runs checks. Strategy pattern violations get flagged. Missing tests get flagged. Mutation, side effects, hardcoded secrets, commented-out code. All reported. Verification agents run against the actual code and surface findings. The developer decides what to do with them.

CRITICAL violations are surfaced with recommendations. The developer can override or fix.

### What Makes It Different

| Other Tools | Agent Cannon |
|-------------|-------------|
| Generic suggestions | Book-backed rules from *Succeed In Software* |
| Passive rules in prompt | Active agents that read the actual code |
| Hope AI remembers | Verification agents that check and report |
| No build verification | Runs build and tests before claiming done |

---

### Tool-Agnostic Checks

Agent Cannon assesses project requirements and researches stack options based on industry adoption, ecosystem maturity, and what fits the problem. It offers options with tradeoffs and lets the developer decide.

Paradigms shift across languages. Currying for DI is idiomatic in JavaScript but weird in Rust, where trait bounds do the job. Mutation is a bug in JavaScript but idiomatic in Rust when you own the data. The checks adapt to the language, not the other way around.

Supported languages include JavaScript/TypeScript, Rust, Python, Go, and others.

### Paradigm by Language

Examples. Agent Cannon adapts to the language.

| Paradigm | JS/TS | Rust | Python | Go |
|----------|-------|------|--------|-----|
| Mutation | Clone first | Fine if you own it | Clone first | Fine if you own it |
| DI pattern | Inject via params | Trait bounds | Inject via params | Inject via params |
| Strategy | Strategy maps | Match expressions | Strategy maps/classes | Match expressions |
| Composition | Function chains | Iterator chains | Function chains | Function chains |
| Error handling | Throw or Result | Result/Option | Exceptions or Result | Error returns |

---

## Core Principles

From *Succeed In Software* by Sean Cannon. Agent Cannon runs automated checks for all of them.

### 1. Strategy Pattern

Logic that branches on a type doesn't belong in if/else chains. Create a strategy map. Each key is a behavior, each value is the function. The dispatcher looks up the key and runs it. Two lines replace fifty.

**Checks:** Flags 3+ else-if branches or 4+ switch/case blocks. Two branches are fine. Three means consider a strategy map.

### 2. Pure Functions

Same input, same output, every time. No file reads, no API calls, no global state, no modifying what was passed in. If your function takes an array and pushes to it, the caller's data just changed. Clone it first.

**Checks:** Reports mutation of input parameters (e.g., .push/.pop in JS/TS, list.append in Python, vector.push in Rust).

### 3. Functional Programming

Currying lets you partially apply dependencies. Write a function that takes the database as a parameter and returns the actual function. Real database in production, mock in tests. No monkey-patching.

Composition chains small functions together. Output of one becomes input of the next.

### 4. Unit Testing

Every exported function gets tested. Every branch, every error path, every edge case. Untested code is unverified code.

Inject dependencies. Pass the database as a parameter. Every function becomes testable by passing mocks. Tests become proof, not hope.

### 5. Separation of Concerns

Data transformation is separate from I/O. Utility functions separate from application logic. A function that validates, queries, formats, and sends email has four jobs. Split them.

### 6. Self-Documenting Code

Comments explain why, not what. If you need a comment to explain what a function does, rename it. processPayment() doesn't need a comment. doStuff() does. That means doStuff() is the wrong name.

### 7. Consistency

Tabs vs spaces. Not a decision for humans during code review. Set up a linter, commit the config, let machines enforce it. Code reviews focus on logic and architecture. Not style.

### 8. Security: Three Laws

1. Assume users are smarter than you.
2. Never leave a back door.
3. Assume breach means lose everything.

Least privilege. RBAC. One-way hash passwords. MFA.

### 9. Stability

Well-maintained dependencies with LTS versions. No bleeding-edge libraries in production without a damn good reason. Tested code is certain code.

### 10. Technical Debt

Debt is inevitable. Pretending it doesn't exist is the mistake. Track it. Pay it off in sprints. Tell stakeholders what deferring costs.

### 11. Scalability

Stateless architecture so you add servers without coordination. Horizontal over vertical. Behavior driven by data, not code changes.

---

## Installation

### Prerequisites

**Required:**
- [OpenCode](https://opencode.ai) installed
- Node.js 18+ (runs the ac-tools CLI)

**For language-specific checks (install based on your project):**

| Language | Tools |
|----------|-------|
| TypeScript/JavaScript | ESLint, TypeScript, Jest/Vitest |
| Python | Ruff, Mypy, Pytest |
| Rust | Clippy, Cargo |
| Go | golangci-lint, Go toolchain |

Agent Cannon configures linting per-project during `/ac-new-project`. Tool installation is deferred until then.

### Steps

```bash
git clone https://github.com/seancannon/agent-cannon.git
cd agent-cannon
bash core/install.sh
```

The install script copies rules, agents, commands, and workflows to `~/.config/opencode/` and updates `opencode.json` to load Agent Cannon rules at session start.

### Verify

```bash
node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs help
```

---

## Usage

<table style="border-collapse:collapse; width:100%;">
<tr style="background:#111; color:#999;">
<th style="border:1px solid #333; padding:10px; text-align:left;">Command</th>
<th style="border:1px solid #333; padding:10px; text-align:left;">What It Does</th>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>/ac-new-project</code></td>
<td style="border:1px solid #333; padding:10px;">Initialize a new project with Agent Cannon checks configured</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>/ac-plan-phase &lt;N&gt;</code></td>
<td style="border:1px solid #333; padding:10px;">Create a phase plan. Research, plan, verify.</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>/ac-execute-phase &lt;N&gt;</code></td>
<td style="border:1px solid #333; padding:10px;">Execute plans with the verification gate</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>/ac-verify [file]</code></td>
<td style="border:1px solid #333; padding:10px;">Run standalone verification against existing code</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>/ac-new-issue &lt;text or URL&gt;</code></td>
<td style="border:1px solid #333; padding:10px;">Tackle an issue. Accepts raw text or a Jira/GitHub URL. Breaks work into utility logic (additive, safe) and application logic (integration). Utility first so you can pause without unwinding.</td>
</tr>
</table>

<br/>

<table style="border-collapse:collapse; width:100%;">
<tr style="background:#111; color:#999;">
<th style="border:1px solid #333; padding:10px; text-align:left;">CLI Command</th>
<th style="border:1px solid #333; padding:10px; text-align:left;">What It Does</th>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>ac-tools verify &lt;file&gt;</code></td>
<td style="border:1px solid #333; padding:10px;">Run all verification agents against a file</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>ac-tools verify-pattern</code></td>
<td style="border:1px solid #333; padding:10px;">Pattern checks only (strategy, SoC, pure functions)</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>ac-tools verify-test</code></td>
<td style="border:1px solid #333; padding:10px;">Test coverage only (existence, passing, DI, mocks)</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;"><code>ac-tools verify-anti-pattern</code></td>
<td style="border:1px solid #333; padding:10px;">Anti-patterns only (mutation, side effects, secrets)</td>
</tr>
</table>

### How the Verification Gate Works

```
AI writes code
  > Verification agents run against the actual code
  > Surface findings: what passed, what flagged
  > CRITICAL issues? Report them with recommendations
  > Developer decides: fix or override with documentation
```

30-second timeout per agent. A hung agent reports as warning, not failure.

---

## Verification Agents

<table style="border-collapse:collapse; width:100%;">
<tr style="background:#111; color:#999;">
<th style="border:1px solid #333; padding:10px; text-align:left;">Agent</th>
<th style="border:1px solid #333; padding:10px; text-align:left;">Checks</th>
<th style="border:1px solid #333; padding:10px; text-align:center;">Severity</th>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;">Pattern Checker</td>
<td style="border:1px solid #333; padding:10px;">Strategy pattern, separation of concerns, pure functions, FP patterns, naming</td>
<td style="border:1px solid #333; padding:10px; text-align:center;">CRITICAL / WARNING</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;">Test Verifier</td>
<td style="border:1px solid #333; padding:10px;">Tests exist, tests pass, dependency injection, mocks</td>
<td style="border:1px solid #333; padding:10px; text-align:center;">CRITICAL / WARNING</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;">Anti-Pattern Detector</td>
<td style="border:1px solid #333; padding:10px;">Mutation, side effects, condition-heavy branching, commented code, hardcoded secrets</td>
<td style="border:1px solid #333; padding:10px; text-align:center;">CRITICAL / WARNING</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;">Code Quality</td>
<td style="border:1px solid #333; padding:10px;">Linter errors, formatter violations, codebase consistency</td>
<td style="border:1px solid #333; padding:10px; text-align:center;">CRITICAL / WARNING</td>
</tr>
<tr>
<td style="border:1px solid #333; padding:10px;">Orchestrator</td>
<td style="border:1px solid #333; padding:10px;">Spawns all agents in parallel, aggregates findings, surfaces to developer</td>
<td style="border:1px solid #333; padding:10px; text-align:center;">Decision layer</td>
</tr>
</table>

---

## Architecture

```
~/.config/opencode/
├── rules/
│   ├── agent-cannon-rules.md         Primary rules (loaded at session start)
│   └── references/
│       ├── strategy-pattern.md
│       ├── pure-functions.md
│       ├── testing-standards.md
│       ├── anti-patterns.md
│       ├── code-quality.md
│       └── linter-configs.md         Stack-specific lint configs
├── agents/
│   ├── ac-pattern-checker.md
│   ├── ac-test-verifier.md
│   ├── ac-anti-pattern-detector.md
│   ├── ac-orchestrator.md
│   └── ac-code-quality.md
├── command/
│   ├── ac-new-project.md
│   ├── ac-plan-phase.md
│   ├── ac-execute-phase.md
│   ├── ac-verify.md
│   └── ac-new-issue.md
└── agent-cannon/
    ├── bin/ac-tools.cjs              CLI tool
    ├── config.json
    └── workflows/
        ├── execute-phase.md          Verification gate workflow
        ├── new-project.md
        ├── new-issue.md              Issue breakdown workflow
        └── plan-phase.md
```

---

<div align="center" style="color:#555; font-size:13px;">

Based on *Succeed In Software* by Sean Cannon. Published 2025. [Available on Amazon](https://www.amazon.com/Succeed-Software-Comprehensive-Career-Excellence/dp/B0BSP7NBJG/).

MIT License

</div>
