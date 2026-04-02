#!/usr/bin/env bash
set -e

# ── Detect script location ──────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

DEST_BASE="$HOME/.config/opencode"
RULES_ENTRY="$DEST_BASE/rules/agent-cannon-rules.md"

echo "Agent Cannon Installer"
echo "  Source: $REPO_DIR"
echo "  Target: $DEST_BASE"
echo ""

# ── 1. Create directory structure ──────────────────────────────────────────

echo "Creating directory structure..."

mkdir -p "$DEST_BASE/rules/references"
mkdir -p "$DEST_BASE/agents"
mkdir -p "$DEST_BASE/command"
mkdir -p "$DEST_BASE/agent-cannon/bin"
mkdir -p "$DEST_BASE/agent-cannon/workflows"

echo "  ✓ Directories ready"

# ── 2. Copy files ─────────────────────────────────────────────────────────

echo "Copying Agent Cannon files..."

# Rules
cp -f "$REPO_DIR/rules/agent-cannon-rules.md" "$DEST_BASE/rules/"

# Rule references
for f in "$REPO_DIR"/rules/references/*.md; do
  [ -f "$f" ] && cp -f "$f" "$DEST_BASE/rules/references/"
done

# Agents
for f in "$REPO_DIR"/agents/ac-*.md; do
  [ -f "$f" ] && cp -f "$f" "$DEST_BASE/agents/"
done

# Commands
for f in "$REPO_DIR"/command/ac-*.md; do
  [ -f "$f" ] && cp -f "$f" "$DEST_BASE/command/"
done

# Binary
cp -f "$REPO_DIR/core/bin/ac-tools.cjs" "$DEST_BASE/agent-cannon/bin/"

# Config
cp -f "$REPO_DIR/core/config.json" "$DEST_BASE/agent-cannon/"

# Workflows
for f in "$REPO_DIR"/core/workflows/*.md; do
  [ -f "$f" ] && cp -f "$f" "$DEST_BASE/agent-cannon/workflows/"
done

echo "  ✓ Files copied"

# ── 3. Make ac-tools.cjs executable ───────────────────────────────────────

chmod +x "$DEST_BASE/agent-cannon/bin/ac-tools.cjs"
echo "  ✓ ac-tools.cjs is executable"

# ── 4. Update opencode.json ───────────────────────────────────────────────

OPENCODE_JSON="$DEST_BASE/opencode.json"

if [ -f "$OPENCODE_JSON" ]; then
  python3 -c "
import json

with open('$OPENCODE_JSON') as f:
    cfg = json.load(f)

# Clean permissions: keep only AC and rules paths, normalize to tilde, deduplicate
permissions = cfg.get('permission', {})
ac_prefixes = ['~/.config/opencode/agent-cannon/', '~/.config/opencode/agents/ac-', '~/.config/opencode/command/ac-', '~/.config/opencode/rules/']
for scope in ['read', 'external_directory']:
    if scope in permissions:
        normalized = {}
        for k, v in permissions[scope].items():
            norm_key = k.replace('/Users/seancannon', '~')
            # Only keep AC-related paths
            if not any(norm_key.startswith(p.replace('*', '')) for p in ac_prefixes):
                continue
            if norm_key not in normalized:
                normalized[norm_key] = v
        permissions[scope] = normalized

# Add Agent Cannon permissions (tilde paths only)
ac_paths = {
    'read': [
        '~/.config/opencode/agent-cannon/*',
        '~/.config/opencode/agents/ac-*',
        '~/.config/opencode/command/ac-*',
        '~/.config/opencode/rules/*'
    ],
    'external_directory': [
        '~/.config/opencode/agent-cannon/*',
        '~/.config/opencode/agents/ac-*',
        '~/.config/opencode/command/ac-*'
    ]
}
for scope, paths in ac_paths.items():
    permissions.setdefault(scope, {})
    for path in paths:
        permissions[scope][path] = 'allow'

cfg['permission'] = permissions

# Clean instructions: keep only AC rules and known safe entries, normalize paths
instructions = cfg.get('instructions', [])
cleaned = []
for entry in instructions:
    # Normalize absolute paths to tilde
    normalized = entry.replace('$DEST_BASE', '~/.config/opencode')
    # Skip anything not AC or known safe rules
    if not (normalized.startswith('~/.config/opencode/rules/') or normalized.startswith('~/.config/opencode/agent-cannon/')):
        continue
    if normalized not in cleaned:
        cleaned.append(normalized)
# Add AC rules if not present
tilde_entry = '~/.config/opencode/rules/agent-cannon-rules.md'
if tilde_entry not in cleaned:
    cleaned.append(tilde_entry)
cfg['instructions'] = cleaned

with open('$OPENCODE_JSON', 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')
"
  echo "  ✓ opencode.json updated (permissions and instructions set)"
else
  echo "  ⚠ opencode.json not found — creating default"

  python3 -c "
import json
cfg = {
    '\$schema': 'https://opencode.ai/config.json',
    'instructions': ['~/.config/opencode/rules/agent-cannon-rules.md'],
    'permission': {
        'read': {
            '~/.config/opencode/agent-cannon/*': 'allow',
            '~/.config/opencode/agents/ac-*': 'allow',
            '~/.config/opencode/command/ac-*': 'allow',
            '~/.config/opencode/rules/*': 'allow'
        },
        'external_directory': {
            '~/.config/opencode/agent-cannon/*': 'allow',
            '~/.config/opencode/agents/ac-*': 'allow',
            '~/.config/opencode/command/ac-*': 'allow'
        }
    }
}
with open('$OPENCODE_JSON', 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')
"
  echo "  ✓ opencode.json created with Agent Cannon permissions"
fi

# ── 5. Done ───────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Agent Cannon installed successfully!"
echo ""
echo "  Rules:      $DEST_BASE/rules/agent-cannon-rules.md"
echo "  Agents:     $DEST_BASE/agents/ac-*.md (5 agents)"
echo "  Commands:   $DEST_BASE/command/ac-*.md (5 commands)"
echo "  Tools:      $DEST_BASE/agent-cannon/bin/ac-tools.cjs"
echo "  Config:     $DEST_BASE/agent-cannon/config.json"
echo ""
echo "  Usage:"
echo "    ac-tools verify <file>"
echo "    /ac-new-project"
echo "    /ac-plan-phase <N>"
echo "    /ac-execute-phase <N>"
echo "    /ac-verify [file]"
echo "    /ac-new-issue <text or URL>"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
