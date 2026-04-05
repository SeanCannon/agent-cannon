#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const destBase = path.join(homeDir, '.config', 'opencode');
const repoDir = path.resolve(__dirname, '..');

console.log("Agent Cannon Installer (Node.js)");
console.log(`  Source: ${repoDir}`);
console.log(`  Target: ${destBase}\n`);

// 1. Create directory structure
console.log("Creating directory structure...");
const dirs = [
  'rules/references',
  'agents',
  'command',
  'agent-cannon/bin',
  'agent-cannon/workflows'
];

for (const d of dirs) {
  fs.mkdirSync(path.join(destBase, d), { recursive: true });
}
console.log("  ✓ Directories ready");

// 2. Copy files safely
console.log("Copying Agent Cannon files...");
const copySafe = (src, dest) => {
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
};

copySafe(path.join(repoDir, 'rules', 'agent-cannon-rules.md'), path.join(destBase, 'rules', 'agent-cannon-rules.md'));
copySafe(path.join(repoDir, 'rules', 'references'), path.join(destBase, 'rules', 'references'));

const copyByPrefix = (srcFolder, destFolder, prefix) => {
  const dirPath = path.join(repoDir, srcFolder);
  if (!fs.existsSync(dirPath)) return;
  fs.readdirSync(dirPath)
    .filter(f => f.startsWith(prefix))
    .forEach(f => {
      copySafe(path.join(dirPath, f), path.join(destBase, destFolder, f));
    });
};

copyByPrefix('agents', 'agents', 'ac-');
copyByPrefix('command', 'command', 'ac-');

copySafe(path.join(repoDir, 'core', 'bin', 'ac-tools.cjs'), path.join(destBase, 'agent-cannon', 'bin', 'ac-tools.cjs'));
copySafe(path.join(repoDir, 'core', 'config.json'), path.join(destBase, 'agent-cannon', 'config.json'));
copySafe(path.join(repoDir, 'core', 'workflows'), path.join(destBase, 'agent-cannon', 'workflows'));

console.log("  ✓ Files copied");

// 3. Make ac-tools.cjs executable
const binDest = path.join(destBase, 'agent-cannon', 'bin', 'ac-tools.cjs');
if (fs.existsSync(binDest)) {
  fs.chmodSync(binDest, 0o755);
  console.log("  ✓ ac-tools.cjs is executable");
}

// 4. Update opencode.json
const opencodeJsonPath = path.join(destBase, 'opencode.json');

const acPrefixes = [
  '~/.config/opencode/agent-cannon/', 
  '~/.config/opencode/agents/ac-', 
  '~/.config/opencode/command/ac-', 
  '~/.config/opencode/rules/'
];

const acPaths = {
  read: [
    '~/.config/opencode/agent-cannon/*',
    '~/.config/opencode/agents/ac-*',
    '~/.config/opencode/command/ac-*',
    '~/.config/opencode/rules/*'
  ],
  external_directory: [
    '~/.config/opencode/agent-cannon/*',
    '~/.config/opencode/agents/ac-*',
    '~/.config/opencode/command/ac-*'
  ]
};

if (fs.existsSync(opencodeJsonPath)) {
  let cfg = {};
  try {
    cfg = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf8'));
  } catch (e) {
    console.error("  ⚠ Failed to parse opencode.json, backing up and creating new.");
    fs.copyFileSync(opencodeJsonPath, opencodeJsonPath + '.bak');
  }
  
  // Clean and update permissions
  const permissions = cfg.permission || {};
  for (const scope of ['read', 'external_directory']) {
    if (permissions[scope]) {
      const normalized = {};
      for (const [k, v] of Object.entries(permissions[scope])) {
        const normKey = k.replace('/Users/seancannon', '~');
        if (!acPrefixes.some(p => normKey.startsWith(p.replace('*', '')))) continue;
        if (!normalized[normKey]) normalized[normKey] = v;
      }
      permissions[scope] = normalized;
    }
  }

  for (const [scope, paths] of Object.entries(acPaths)) {
    if (!permissions[scope]) permissions[scope] = {};
    for (const p of paths) {
      permissions[scope][p] = 'allow';
    }
  }
  cfg.permission = permissions;

  // Clean and update instructions
  let instructions = cfg.instructions || [];
  const cleaned = [];
  for (const entry of instructions) {
    const normalized = entry.replace(destBase, '~/.config/opencode');
    if (!normalized.startsWith('~/.config/opencode/rules/') && !normalized.startsWith('~/.config/opencode/agent-cannon/')) continue;
    if (!cleaned.includes(normalized)) cleaned.push(normalized);
  }
  const tildeEntry = '~/.config/opencode/rules/agent-cannon-rules.md';
  if (!cleaned.includes(tildeEntry)) cleaned.push(tildeEntry);
  cfg.instructions = cleaned;

  fs.writeFileSync(opencodeJsonPath, JSON.stringify(cfg, null, 2) + '\n');
  console.log("  ✓ opencode.json updated (permissions and instructions set)");
} else {
  console.log("  ⚠ opencode.json not found — creating default");
  const cfg = {
    "$schema": "https://opencode.ai/config.json",
    "instructions": ["~/.config/opencode/rules/agent-cannon-rules.md"],
    "permission": {
      "read": {
        "~/.config/opencode/agent-cannon/*": "allow",
        "~/.config/opencode/agents/ac-*": "allow",
        "~/.config/opencode/command/ac-*": "allow",
        "~/.config/opencode/rules/*": "allow"
      },
      "external_directory": {
        "~/.config/opencode/agent-cannon/*": "allow",
        "~/.config/opencode/agents/ac-*": "allow",
        "~/.config/opencode/command/ac-*": "allow"
      }
    }
  };
  fs.writeFileSync(opencodeJsonPath, JSON.stringify(cfg, null, 2) + '\n');
  console.log("  ✓ opencode.json created");
}

console.log("\nAgent Cannon installed successfully! 🚀");
