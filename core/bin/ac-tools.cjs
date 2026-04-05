#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ============================================================
// Agent Cannon CLI Tool (ac-tools.cjs)
// Verification orchestration and state management
// Source: Succeed In Software by Sean Cannon
// ============================================================

const COMMANDS = {
  verify: 'Run all verification agents against a file',
  'verify-pattern': 'Run pattern checker only',
  'verify-test': 'Run test verifier only',
  'verify-anti-pattern': 'Run anti-pattern detector only',
  'verify-git-diff': 'Compare actual changes against planned files_modified',
  'verify-claims': 'Verify claimed content actually exists in files (catch hallucinations)',
  'verify-makefile-target': 'Verify a Makefile target exists',
  'state-update': 'Update STATE.md with plan completion',
  'state get': 'Read a specific key from STATE.md',
  'roadmap get-phase': 'Get phase info from ROADMAP.md',
  'requirements list': 'List requirements from REQUIREMENTS.md',
  'requirements update': 'Update a requirement status (REQ-ID status)',
  help: 'Show this help message',
};

function printHelp() {
  console.log('Agent Cannon CLI (ac-tools.cjs)\n');
  console.log('Usage: node ac-tools.cjs <command> [args]\n');
  console.log('Commands:');
  console.log('  verify <file>               Run all verification agents against a file');
  console.log('  verify-pattern <file>       Run pattern checker only');
  console.log('  verify-test <file>          Run test verifier only');
  console.log('  verify-anti-pattern <file>  Run anti-pattern detector only');
  console.log('  verify-git-diff <base> [head] Compare actual changes vs planned files');
  console.log('  verify-claims <json>        Verify claimed content exists in files');
  console.log('  verify-makefile-target <target> [makefile]  Verify a target exists');
  console.log('  state-update <planId> <status>  Update STATE.md with plan completion');
  console.log('  state get <key>             Read a specific key from STATE.md');
  console.log('  roadmap get-phase <N>       Get phase info from ROADMAP.md');
  console.log('  requirements list           List requirements from REQUIREMENTS.md');
  console.log('  requirements update <REQ-ID> <status>  Update a requirement status');
  console.log('  help                        Show this help message');
  console.log('\nExit codes: 0 = pass, 1 = violations found, 2 = error');
}

function ensureFile(filePath) {
  if (!filePath) {
    console.error(JSON.stringify({ error: 'No file path provided', exit_code: 2 }));
    process.exit(2);
  }
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(JSON.stringify({ error: `File not found: ${resolved}`, exit_code: 2 }));
    process.exit(2);
  }
  return resolved;
}

function runGrep(pattern, file, flags = '') {
  try {
    const args = ['-n'];
    if (flags) {
      args.push(...flags.split(' ').filter(Boolean));
    }
    args.push(pattern, file);
    
    const result = spawnSync('grep', args, { encoding: 'utf8' });
    if (!result.stdout) return [];
    
    return result.stdout.trim().split('\n').filter(Boolean).map(line => {
      const [num, ...rest] = line.split(':');
      return { line: parseInt(num, 10), match: rest.join(':').trim() };
    });
  } catch {
    return [];
  }
}

// ---- Pattern Checker ----
function checkPatterns(file) {
  const violations = [];

  // PATTERN-01: Strategy pattern — if/else chains
  const ifElseMatches = runGrep('(else\\s+if|else\\s*\\{)', file);
  let consecutiveIfElse = 0;
  ifElseMatches.forEach(m => {
    consecutiveIfElse++;
    if (consecutiveIfElse >= 3) {
      violations.push({
        file, line: m.line, rule: 'PATTERN-01', severity: 'WARNING',
        message: 'if/else chain detected — consider strategy pattern',
        suggestion: 'Replace with strategy map: const strategies = { A: handleA, B: handleB };',
      });
    }
  });

  // PATTERN-02: Pure function violations — mutation methods
  const mutationPatterns = ['\\.push\\(', '\\.pop\\(', '\\.shift\\(', '\\.unshift\\(', '\\.splice\\(', '\\.sort\\(', '\\.reverse\\('];
  mutationPatterns.forEach(pat => {
    runGrep(pat, file).forEach(m => {
      violations.push({
        file, line: m.line, rule: 'PATTERN-02', severity: 'CRITICAL',
        message: `Mutation detected: ${m.match}`,
        suggestion: 'Clone first: return [...arr, item]; or use spread operator',
      });
    });
  });

  // PATTERN-03: Separation of concerns — side effects in utility functions
  const sideEffectPatterns = ['console\\.', 'fs\\.', 'fetch\\(', 'document\\.', 'window\\.'];
  sideEffectPatterns.forEach(pat => {
    runGrep(pat, file).forEach(m => {
      violations.push({
        file, line: m.line, rule: 'PATTERN-03', severity: 'WARNING',
        message: `Possible side effect: ${m.match}`,
        suggestion: 'Extract side effect to caller, keep function pure',
      });
    });
  });

  // PATTERN-05: Self-documenting code — single-letter variables (except i,j,k in loops)
  runGrep('\\bconst\\s+[a-z]\\b\\|\\blet\\s+[a-z]\\b\\|\\bvar\\s+[a-z]\\b', file).forEach(m => {
    if (!/\b(const|let|var)\s+[ijk]\b/.test(m.match)) {
      violations.push({
        file, line: m.line, rule: 'PATTERN-05', severity: 'WARNING',
        message: `Single-letter variable: ${m.match}`,
        suggestion: 'Use descriptive names that convey intent',
      });
    }
  });

  return violations;
}

// ---- Test Verifier ----
function checkTests(file) {
  const violations = [];
  const dir = path.dirname(file);
  const basename = path.basename(file, path.extname(file));
  const ext = path.extname(file);

  // TEST-01: Test file existence
  const testPatterns = [
    path.join(dir, `${basename}.test${ext}`),
    path.join(dir, `${basename}.spec${ext}`),
    path.join(dir, '__tests__', `${basename}.test${ext}`),
    path.join(dir, '__tests__', `${basename}.spec${ext}`),
  ];
  const hasTest = testPatterns.some(p => fs.existsSync(p));
  if (!hasTest) {
    violations.push({
      file, line: 0, rule: 'TEST-01', severity: 'CRITICAL',
      message: `No test file found for ${basename}${ext}`,
      suggestion: `Create ${basename}.test${ext} with unit tests`,
    });
  }

  // TEST-03: DI check — look for direct imports of external modules in non-test files
  if (!file.includes('.test.') && !file.includes('.spec.')) {
    runGrep("require\\('.*service\\|require\\('.*api\\|require\\('.*db\\|import.*from.*service", file).forEach(m => {
      violations.push({
        file, line: m.line, rule: 'TEST-03', severity: 'WARNING',
        message: `Direct service import: ${m.match}`,
        suggestion: 'Inject dependency via function parameter for testability',
      });
    });
  }

  // TEST-02: Run tests if test file exists
  if (hasTest) {
    const testFile = testPatterns.find(p => fs.existsSync(p));
    try {
      execSync('npm test 2>/dev/null || npx jest --passWithNoTests 2>/dev/null', {
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe',
      });
    } catch (e) {
      violations.push({
        file: testFile, line: 0, rule: 'TEST-02', severity: 'CRITICAL',
        message: 'Tests failed or test runner errored',
        suggestion: 'Fix failing tests before accepting code',
      });
    }
  }

  return violations;
}

// ---- Anti-Pattern Detector ----
function checkAntiPatterns(file) {
  const violations = [];
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // BLOCK-04: Commented-out code
  const codeKeywords = /\/\/.*(function|const|let|var|if|return|import|export|class)\s/i;
  lines.forEach((line, idx) => {
    if (codeKeywords.test(line) && !line.trim().startsWith('*') && !line.trim().startsWith('/**')) {
      violations.push({
        file, line: idx + 1, rule: 'BLOCK-04', severity: 'CRITICAL',
        message: `Commented-out code: ${line.trim().substring(0, 60)}...`,
        suggestion: 'Delete it. Use git history for recovery.',
      });
    }
  });

  // BLOCK-05: Hardcoded secrets
  const secretPatterns = [
    /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/i,
    /(?:secret|api_key|apikey|token|credential)\s*[:=]\s*['"][^'"]+['"]/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /ghp_[a-zA-Z0-9]{36}/,
  ];
  lines.forEach((line, idx) => {
    secretPatterns.forEach(pat => {
      if (pat.test(line) && !line.includes('process.env')) {
        violations.push({
          file, line: idx + 1, rule: 'BLOCK-05', severity: 'CRITICAL',
          message: `Hardcoded secret detected on line ${idx + 1}`,
          suggestion: 'Use environment variables: process.env.SECRET_NAME',
        });
      }
    });
  });

  // BLOCK-03: Condition-heavy branching
  let elseIfCount = 0;
  let switchCaseCount = 0;
  lines.forEach(line => {
    if (/else\s+if/.test(line)) elseIfCount++;
    if (/case\s+/.test(line)) switchCaseCount++;
  });
  if (elseIfCount > 2) {
    violations.push({
      file, line: 0, rule: 'BLOCK-03', severity: 'CRITICAL',
      message: `${elseIfCount} else-if branches detected — condition-heavy`,
      suggestion: 'Refactor to strategy pattern: const strategies = { ... }; strategies[type]()',
    });
  }
  if (switchCaseCount > 3) {
    violations.push({
      file, line: 0, rule: 'BLOCK-03', severity: 'CRITICAL',
      message: `${switchCaseCount} switch cases detected — condition-heavy`,
      suggestion: 'Refactor to strategy pattern: const strategies = { ... }; strategies[type]()',
    });
  }

  return violations;
}

// ---- Git Diff Verifier ----
function verifyGitDiff(baseRef = 'HEAD', headRef = 'WORKDIR') {
  try {
    let result;
    if (headRef === 'WORKDIR') {
      result = spawnSync('git', ['diff', '--name-only', baseRef], { encoding: 'utf8' });
    } else {
      result = spawnSync('git', ['diff', '--name-only', baseRef, headRef], { encoding: 'utf8' });
    }
    
    if (result.error || result.status !== 0) {
      throw new Error(result.stderr || 'Git diff command failed');
    }

    const changedFiles = (result.stdout || '').trim().split('\n').filter(Boolean);

    return {
      status: 'SUCCESS',
      files_changed: changedFiles,
      count: changedFiles.length,
    };
  } catch (e) {
    return {
      status: 'ERROR',
      error: e.message,
      files_changed: [],
      count: 0,
    };
  }
}

// ---- Claims Verifier ----
// Verifies that claimed content actually exists in files.
// Input: JSON string like '{"Makefile": ["verify:", "test:"], "src/foo.ts": ["export function"]}'
// Output: For each file and claim, reports whether it was found.
function verifyClaims(claimsJson) {
  let claims;
  try {
    claims = JSON.parse(claimsJson);
  } catch (e) {
    console.error(JSON.stringify({ error: 'Invalid JSON', exit_code: 2 }));
    process.exit(2);
  }

  const results = [];
  let hasMisses = false;

  for (const [filePath, claimedItems] of Object.entries(claims)) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      results.push({
        file: filePath,
        status: 'FILE_NOT_FOUND',
        claimed: claimedItems,
        found: [],
        missing: claimedItems,
      });
      hasMisses = true;
      continue;
    }

    const content = fs.readFileSync(resolved, 'utf8');
    const found = [];
    const missing = [];

    for (const item of claimedItems) {
      if (content.includes(item)) {
        found.push(item);
      } else {
        missing.push(item);
        hasMisses = true;
      }
    }

    results.push({
      file: filePath,
      status: missing.length === 0 ? 'ALL_FOUND' : 'MISSING_CLAIMS',
      claimed: claimedItems,
      found,
      missing,
    });
  }

  return {
    status: hasMisses ? 'HALLUCINATION_DETECTED' : 'ALL_CLAIMS_VERIFIED',
    results,
    summary: {
      files_checked: results.length,
      files_with_missing_claims: results.filter(r => r.status === 'MISSING_CLAIMS' || r.status === 'FILE_NOT_FOUND').length,
    },
  };
}

// ---- Makefile Target Verifier ----
function verifyMakefileTarget(target, makefilePath = 'Makefile') {
  const resolved = path.resolve(makefilePath);
  if (!fs.existsSync(resolved)) {
    console.error(JSON.stringify({ error: `Makefile not found: ${resolved}`, exit_code: 2 }));
    process.exit(2);
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const targetPattern = new RegExp(`^${target}\\s*:`, 'm');
  const targetRegex = new RegExp(`^${target}\\s*:`);

  if (targetRegex.test(content)) {
    return {
      status: 'TARGET_FOUND',
      target,
      makefile: resolved,
    };
  } else {
    return {
      status: 'TARGET_NOT_FOUND',
      target,
      makefile: resolved,
      suggestion: `Add "${target}:" target to Makefile`,
    };
  }
}

// ---- State Update ----
function stateUpdate(planId, status) {
  const statePath = path.resolve('.planning/STATE.md');
  if (!fs.existsSync(statePath)) {
    console.error(JSON.stringify({ error: 'STATE.md not found', exit_code: 2 }));
    process.exit(2);
  }

  let content = fs.readFileSync(statePath, 'utf8');

  // Update last activity
  const now = new Date().toISOString().split('T')[0];
  content = content.replace(
    /Last activity:.*/,
    `Last activity: ${now} — Plan ${planId} ${status}`
  );

  // Update plan count
  const phaseMatch = content.match(/Plan:\s*(\d+)\s*of\s*(\d+)/);
  if (phaseMatch) {
    const current = parseInt(phaseMatch[1], 10);
    const total = parseInt(phaseMatch[2], 10);
    const next = Math.min(current + 1, total);
    content = content.replace(
      /Plan:\s*\d+\s*of\s*\d+/,
      `Plan: ${next} of ${total}`
    );
  }

  fs.writeFileSync(statePath, content, 'utf8');
  console.log(JSON.stringify({ updated: true, plan: planId, status }));
}

// ---- State Get ----
function stateGet(key) {
  const statePath = path.resolve('.planning/STATE.md');
  if (!fs.existsSync(statePath)) {
    console.error(JSON.stringify({ error: 'STATE.md not found', exit_code: 2 }));
    process.exit(2);
  }

  const content = fs.readFileSync(statePath, 'utf8');
  const lines = content.split('\n');
  const result = {};

  // Parse known keys from STATE.md format
  const keyPatterns = {
    current_focus: /\*\*Current focus:\*\*\s*(.*)/,
    phase: /Phase:\s*(.*)/,
    plan: /Plan:\s*(.*)/,
    status: /Status:\s*(.*)/,
    last_activity: /Last activity:\s*(.*)/,
    progress: /Progress:\s*(.*)/,
  };

  if (key && keyPatterns[key]) {
    const match = content.match(keyPatterns[key]);
    if (match) {
      result[key] = match[1].trim();
    } else {
      result[key] = null;
    }
  } else if (key) {
    // Generic key search — look for lines containing the key
    const found = lines.filter(l => l.toLowerCase().includes(key.toLowerCase()));
    if (found.length > 0) {
      result[key] = found.map(l => l.trim());
    } else {
      result[key] = null;
    }
  } else {
    // Return all parsed keys
    Object.keys(keyPatterns).forEach(k => {
      const match = content.match(keyPatterns[k]);
      result[k] = match ? match[1].trim() : null;
    });
  }

  console.log(JSON.stringify(result, null, 2));
}

// ---- Roadmap Get Phase ----
function roadmapGetPhase(phaseNum) {
  const roadmapPath = path.resolve('.planning/ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) {
    console.error(JSON.stringify({ error: 'ROADMAP.md not found', exit_code: 2 }));
    process.exit(2);
  }

  const content = fs.readFileSync(roadmapPath, 'utf8');
  const num = parseInt(phaseNum, 10);
  if (isNaN(num)) {
    console.error(JSON.stringify({ error: 'Invalid phase number', exit_code: 2 }));
    process.exit(2);
  }

  // Find the phase header: ### Phase N:
  const phaseRegex = new RegExp(`###\\s+Phase\\s+${num}:`, 'i');
  const lines = content.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (phaseRegex.test(lines[i])) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    console.error(JSON.stringify({ error: `Phase ${num} not found in ROADMAP.md`, exit_code: 2 }));
    process.exit(2);
  }

  // Collect phase details until next ### or ## or end
  const phaseLines = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (i > startIdx && /^#{1,3}\s/.test(lines[i])) break;
    phaseLines.push(lines[i]);
  }

  const phaseText = phaseLines.join('\n');

  // Extract fields
  const nameMatch = phaseLines[0].match(/###\s+Phase\s+\d+:\s*(.*)/i);
  const goalMatch = phaseText.match(/\*\*Goal\*\*:\s*(.*)/);
  const dependsMatch = phaseText.match(/\*\*Depends on\*\*:\s*(.*)/);
  const reqsMatch = phaseText.match(/\*\*Requirements\*\*:\s*(.*)/);
  const successMatch = phaseText.match(/\*\*Success Criteria\*\*/);

  // Extract success criteria lines
  const criteria = [];
  let inCriteria = false;
  for (const line of phaseLines) {
    if (/\*\*Success Criteria\*\*/.test(line)) { inCriteria = true; continue; }
    if (inCriteria && /^\s+\d+\./.test(line)) {
      criteria.push(line.replace(/^\s+\d+\.\s*/, '').trim());
    }
    if (inCriteria && /^\*\*Plans\*\*/.test(line)) break;
  }

  // Extract plan items
  const plans = [];
  let inPlans = false;
  for (const line of phaseLines) {
    if (/^Plans:/.test(line)) { inPlans = true; continue; }
    if (inPlans && /^\s*-\s*\[[ x]\]/.test(line)) {
      const planMatch = line.match(/^\s*-\s*\[([ x])\]\s*(\S+):\s*(.*)/);
      if (planMatch) {
        plans.push({
          id: planMatch[2].replace(/:$/, ''),
          done: planMatch[1] === 'x',
          description: planMatch[3].trim(),
        });
      }
    }
  }

  const result = {
    phase: num,
    name: nameMatch ? nameMatch[1].trim() : null,
    goal: goalMatch ? goalMatch[1].trim() : null,
    depends_on: dependsMatch ? dependsMatch[1].trim() : null,
    requirements: reqsMatch ? reqsMatch[1].split(',').map(r => r.trim()) : [],
    success_criteria: criteria,
    plans,
    completed_plans: plans.filter(p => p.done).length,
    total_plans: plans.length,
  };

  console.log(JSON.stringify(result, null, 2));
}

// ---- Requirements List ----
function requirementsList() {
  const reqPath = path.resolve('.planning/REQUIREMENTS.md');
  if (!fs.existsSync(reqPath)) {
    console.error(JSON.stringify({ error: 'REQUIREMENTS.md not found', exit_code: 2 }));
    process.exit(2);
  }

  const content = fs.readFileSync(reqPath, 'utf8');
  const lines = content.split('\n');
  const requirements = [];

  lines.forEach(line => {
    // Match: - [ ] **REQ-ID**: description  or  - [x] **REQ-ID**: description
    const match = line.match(/^\s*-\s*\[([ x])\]\s*\*\*(\S+?)\*\*:\s*(.*)/);
    if (match) {
      requirements.push({
        id: match[2],
        status: match[1] === 'x' ? 'completed' : 'pending',
        description: match[3].trim(),
      });
    }
  });

  console.log(JSON.stringify({
    total: requirements.length,
    completed: requirements.filter(r => r.status === 'completed').length,
    pending: requirements.filter(r => r.status === 'pending').length,
    requirements,
  }, null, 2));
}

// ---- Requirements Update ----
function requirementsUpdate(reqId, newStatus) {
  if (!reqId) {
    console.error(JSON.stringify({ error: 'No requirement ID provided', exit_code: 2 }));
    process.exit(2);
  }
  if (!newStatus) {
    console.error(JSON.stringify({ error: 'No status provided (use: completed, pending, in-progress)', exit_code: 2 }));
    process.exit(2);
  }

  const reqPath = path.resolve('.planning/REQUIREMENTS.md');
  if (!fs.existsSync(reqPath)) {
    console.error(JSON.stringify({ error: 'REQUIREMENTS.md not found', exit_code: 2 }));
    process.exit(2);
  }

  let content = fs.readFileSync(reqPath, 'utf8');
  const lines = content.split('\n');
  let found = false;

  const updatedLines = lines.map(line => {
    const match = line.match(/^(\s*-\s*\[)([ x])(\]\s*\*\*)(\S+?)(\*\*:.*)/);
    if (match && match[4] === reqId) {
      found = true;
      const checkbox = (newStatus === 'completed') ? 'x' : ' ';
      return `${match[1]}${checkbox}${match[3]}${match[4]}${match[5]}`;
    }
    // Also handle the traceability table at the bottom
    const tableMatch = line.match(/^(\|\s*)(\S+?)(\s*\|\s*Phase\s+\d+\s*\|\s*)(\S+?)(\s*\|)/);
    if (tableMatch && tableMatch[2] === reqId) {
      found = true;
      const statusText = newStatus === 'completed' ? 'Completed' : newStatus === 'in-progress' ? 'In Progress' : 'Pending';
      return `${tableMatch[1]}${tableMatch[2]}${tableMatch[3]}${statusText}${tableMatch[5]}`;
    }
    return line;
  });

  if (!found) {
    console.error(JSON.stringify({ error: `Requirement ${reqId} not found`, exit_code: 2 }));
    process.exit(2);
  }

  fs.writeFileSync(reqPath, updatedLines.join('\n'), 'utf8');
  console.log(JSON.stringify({ updated: true, requirement: reqId, status: newStatus }));
}

// ---- Main ----
const args = process.argv.slice(2);
const command = args[0];
const fileArg = args[1];

switch (command) {
  case 'verify': {
    const filePath = ensureFile(fileArg);
    const pattern = checkPatterns(filePath);
    const test = checkTests(filePath);
    const anti = checkAntiPatterns(filePath);
    const all = [...pattern, ...test, ...anti];
    const critical = all.filter(v => v.severity === 'CRITICAL');
    const warnings = all.filter(v => v.severity === 'WARNING');
    const result = {
      status: critical.length > 0 ? 'FAILED' : 'PASSED',
      file: filePath,
      agents: {
        'pattern-checker': { violations: pattern },
        'test-verifier': { violations: test },
        'anti-pattern-detector': { violations: anti },
      },
      summary: { total: all.length, critical: critical.length, warnings: warnings.length },
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(critical.length > 0 ? 1 : 0);
  }

  case 'verify-pattern': {
    const filePath = ensureFile(fileArg);
    const violations = checkPatterns(filePath);
    console.log(JSON.stringify({ file: filePath, violations }, null, 2));
    process.exit(violations.some(v => v.severity === 'CRITICAL') ? 1 : 0);
  }

  case 'verify-test': {
    const filePath = ensureFile(fileArg);
    const violations = checkTests(filePath);
    console.log(JSON.stringify({ file: filePath, violations }, null, 2));
    process.exit(violations.some(v => v.severity === 'CRITICAL') ? 1 : 0);
  }

  case 'verify-anti-pattern': {
    const filePath = ensureFile(fileArg);
    const violations = checkAntiPatterns(filePath);
    console.log(JSON.stringify({ file: filePath, violations }, null, 2));
    process.exit(violations.some(v => v.severity === 'CRITICAL') ? 1 : 0);
  }

  case 'verify-git-diff': {
    const baseRef = fileArg || 'HEAD';
    const headRef = args[2] || 'WORKDIR';
    const result = verifyGitDiff(baseRef, headRef);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'ERROR' ? 2 : 0);
  }

  case 'verify-claims': {
    if (!fileArg) {
      console.error(JSON.stringify({ error: 'No claims JSON provided', exit_code: 2 }));
      process.exit(2);
    }
    const result = verifyClaims(fileArg);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'HALLUCINATION_DETECTED' ? 1 : 0);
  }

  case 'verify-makefile-target': {
    if (!fileArg) {
      console.error(JSON.stringify({ error: 'No target provided', exit_code: 2 }));
      process.exit(2);
    }
    const makefile = args[2] || 'Makefile';
    const result = verifyMakefileTarget(fileArg, makefile);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'TARGET_NOT_FOUND' ? 1 : 0);
  }

  case 'state-update': {
    const planId = fileArg || 'unknown';
    const status = args[2] || 'completed';
    stateUpdate(planId, status);
    break;
  }

  case 'state': {
    const subcommand = fileArg;
    if (subcommand === 'get') {
      stateGet(args[2]);
    } else {
      console.error(JSON.stringify({ error: `Unknown state subcommand: ${subcommand}. Use: state get <key>`, exit_code: 2 }));
      process.exit(2);
    }
    break;
  }

  case 'roadmap': {
    const subcommand = fileArg;
    if (subcommand === 'get-phase') {
      roadmapGetPhase(args[2]);
    } else {
      console.error(JSON.stringify({ error: `Unknown roadmap subcommand: ${subcommand}. Use: roadmap get-phase <N>`, exit_code: 2 }));
      process.exit(2);
    }
    break;
  }

  case 'requirements': {
    const subcommand = fileArg;
    if (subcommand === 'list') {
      requirementsList();
    } else if (subcommand === 'update') {
      requirementsUpdate(args[2], args[3]);
    } else {
      console.error(JSON.stringify({ error: `Unknown requirements subcommand: ${subcommand}. Use: requirements list | requirements update <REQ-ID> <status>`, exit_code: 2 }));
      process.exit(2);
    }
    break;
  }

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;

  default:
    console.error(JSON.stringify({ error: `Unknown command: ${command}`, exit_code: 2 }));
    printHelp();
    process.exit(2);
}
