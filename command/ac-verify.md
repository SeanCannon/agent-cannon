---
description: Run Agent Cannon verification against existing code
argument-hint: "[file-path]"
tools:
  read: true
  bash: true
  glob: true
  grep: true
---
<objective>
Run Agent Cannon verification against project files and generate a compliance report.

Accepts an optional file path. If omitted, scans all project source files.

**Output:** Compliance report with pass/fail summary, violation counts by severity, and per-file detail.
</objective>

<execution_context>
@~/.config/opencode/agent-cannon/workflows/verify.md
</execution_context>

<context>
**Input:** $ARGUMENTS (optional file path)
- If provided: Verify that single file
- If omitted: Scan all project source files (exclude node_modules, .git, dist, build, .planning)

**Tool reference:** `~/.config/opencode/agent-cannon/bin/ac-tools.cjs`
</context>

<process>
1. **Determine scope:**
   - If `$ARGUMENTS` is a file path, target that file only.
   - Otherwise, use `glob` to collect all source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.md`, `.yaml`, `.json`) excluding non-source directories.

2. **Run verification:**
   - For each file, execute: `node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs verify <file-path>`
   - Collect exit codes and stdout.

3. **Generate report:**
   Print a compliance report to the terminal:
   ```
   ═══════════════════════════════════════
    AGENT CANNON — COMPLIANCE REPORT
   ═══════════════════════════════════════

    Files scanned:   N
    Passed:          N
    Failed:          N

    CRITICAL:        N
    WARNING:         N
    INFO:            N

   ─── Per-file detail ───
    ✅ src/foo.ts
    ❌ src/bar.ts — 2 CRITICAL, 1 WARNING
       CRITICAL: hardcoded secret on line 42
       CRITICAL: eval() on line 87
       WARNING: missing input validation on line 15
   ──────────────────────────────────────
   ```

4. **Exit behavior:**
   - If any CRITICAL violations exist, exit with code 2.
   - If only WARNINGs, exit with code 1.
   - If all clean, exit with code 0.
</process>
