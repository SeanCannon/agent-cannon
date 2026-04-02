# Linter Configurations for Agent Cannon

Static checks that run without LLM involvement. Configure these per project.

Economics note: If LLM verification is being called often, the lint rules aren't tight enough. Fix the lint rules first.

---

# TypeScript / JavaScript

## Core Plugins

```bash
npm install --save-dev ramda ramda-eslint eslint-plugin-no-commented-code eslint-plugin-import
```

## Complete ESLint Configuration

```js
// eslint.config.js
import noCommentedCode from 'eslint-plugin-no-commented-code';
import importPlugin from 'eslint-plugin-import';
import ramdaPlugin from 'ramda-eslint';

export default [
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      'no-commented-code': noCommentedCode,
      'import': importPlugin,
      'ramda': ramdaPlugin,
    },
    rules: {
      // === Agent Cannon Rules ===

      // No commented-out code
      'no-commented-code': 'error',
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // No third-party HTTP clients in app/ directories
      'import/no-restricted-paths': ['error', {
        zones: [
          { target: './app', from: { pattern: './node_modules/axios/**' }},
          { target: './app', from: { pattern: './node_modules/node-fetch/**' }},
          { target: './app', from: { pattern: './node_modules/got/**' }},
          { target: './app', from: { pattern: './node_modules/request/**' }},
        ]
      }],

      // 3+ branch if/else chains → strategy map
      'no-complex-branching': {
        create(context) {
          return {
            IfStatement(node) {
              let branches = 1;
              let current = node;
              while (current.alternate) {
                branches++;
                current = current.alternate;
                if (current.type === 'IfStatement') current = current.test ? current : current.consequent;
              }
              if (branches >= 3) {
                context.report({ node, message: '3+ branch if/else chain. Refactor to strategy map.' });
              }
            }
          };
        }
      },

      // Side effects detection
      'no-sync': 'error',
      'no-await-in-loop': 'warn',
      'no-void': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // === Ramda / Functional Composition ===

      'ramda/always-satisfies': 'error',
      'ramda/any-pass-of-single-middleware': 'error',
      'ramda/avoid-accepted-predicates': 'error',
      'ramda/avoid-compose-and-flip': 'error',
      'ramda/avoid-pointfree': 'warn',
      'ramda/cond-assoc-in-suffix': 'error',
      'ramda/empty-list-after-compose': 'error',
      'ramda/extract-from-ramda-assertion': 'error',
      'ramda/filter-after-replaceall': 'error',
      'ramda/if-else-assoc-in-last-arg': 'error',
      'ramda/misplaced-try-catch': 'error',
      'ramda/no-compose-pipe-with-side-effects': 'error',
      'ramda/no-else-block-as-last-cond': 'error',
      'ramda/only-load-ramda': 'error',
      'ramda/otherwise-satisfies': 'error',
      'ramda/path-eq-assoc-in-last-arg': 'error',
      'ramda/prop-satisfies': 'error',
      'ramda/replace-over-prop-eq': 'error',
      'ramda/too-many-requires': 'error',
      'ramda/unexpected-iteratee-argument': 'error',
      'ramda/unnecessary-map': 'error',

      // === Import/Module Structure ===

      'import/order': ['error', {
        groups: [['external', 'builtin'], ['internal', 'parent', 'sibling']],
        pathGroups: [
          { pattern: 'ramda', group: 'external' },
          { pattern: 'lib/**', group: 'internal' },
          { pattern: 'app/**', group: 'internal' },
        ],
        'newlines-between': 'always',
      }],

      // === Type Safety ===

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-types': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // === Anti-Patterns ===

      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-param-reassign': 'error',
      'no-proto': 'error',
      'no-script-url': 'error',
      'no-with': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    }
  },
  {
    files: ['lib/**/*.ts', 'lib/**/*.js'],
    rules: {
      // Utility layer: no app imports
      'import/no-restricted-paths': ['error', {
        zones: [
          { target: './lib', from: { pattern: './app/**' }},
        ]
      }],
    }
  }
];
```

## TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": false
  }
}
```

## Verify Script

```bash
#!/bin/bash
# verify.sh
set -e
echo "Running ESLint..."
npx eslint .
echo "Running TypeScript..."
npx tsc --noEmit
echo "Running tests..."
npm test
echo "All checks passed"
```

---

# Python

## Core Tools

```bash
pip install flake8 mypy bandit ruff
# or: pip install ruff  # faster, written in Rust
```

## Ruff Configuration (Recommended - Faster)

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = [
  "E",     # pycodestyle errors
  "W",     # pycodestyle warnings
  "F",     # Pyflakes
  "I",     # isort (import order)
  "B",     # flake8-bugbear
  "C4",    # flake8-comprehensions
  "SIM",   # flake8-simplify
  "RUF",   # Ruff-specific rules
]
ignore = [
  "E203",  # whitespace before ':'
  "E501",  # line too long (handled by formatter)
]

[tool.ruff.lint.per-file-ignores]
"__init__.py" = ["F401"]  # imported but unused in __init__ is OK

[tool.ruff.lint.rules]
# Agent Cannon: No commented-out code
no-commented-code = "error"

[tool.ruff.lint.isort]
known-first-party = ["lib", "app"]
force-single-line = true

[tool.ruff.lint.flake8-bugbear]
max-function-complexity = 10

[tool.ruff.lint.flake8-simplify]
SIM102 = "error"  # collapsible if/else → single if
SIM103 = "error"  # simplify return
SIM108 = "error"  # use ternary instead of if/else
SIM112 = "error"  # use uppercase for constants
SIM117 = "error"  # simplify with statement
```

## Mypy Configuration (Strict Mode)

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.11"
strict = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_any_generics = true
check_untyped_defs = true
disallow_untyped_calls = true
no_implicit_optional = true
warn_return_any = true
warn_unreachable = true
show_error_codes = true
pretty = true
```

## Custom Rules for Agent Cannon

### No Commented-Out Code (Flake8 E265 custom)

```python
# .flake8 or flake8 config
[E265]
max_line_length = 100
exclude =
    .git,
    __pycache__,
    .venv,
    build,
    dist

[pyflakes]
max一线_complexity = 10
```

### Custom Flake8 Plugin for if/else Chains

```python
# setup.py or use flake8 plugin
# Check for 3+ branch if/elif chains

import ast
import flake8.api Legacy as flake8

class StrategyPatternChecker:
    name = 'strategy-pattern'
    version = '1.0.0'

    def __init__(self, tree, filename):
        self.tree = tree
        self.filename = filename

    def run(self):
        for node in ast.walk(self.tree):
            if isinstance(node, ast.If):
                count = self._count_branches(node)
                if count >= 3:
                    yield (node.lineno, 0,
                           f'AC001: 3+ branch if/elif chain. Consider strategy pattern.',
                           type(self))

    def _count_branches(self, node):
        count = 1
        while node.orelse:
            count += 1
            if len(node.orelse) == 1 and isinstance(node.orelse[0], ast.If):
                node = node.orelse[0]
            else:
                break
        return count
```

## Verify Script

```bash
#!/bin/bash
# verify.sh
set -e

echo "Running ruff..."
ruff check .

echo "Running mypy..."
mypy .

echo "Running tests..."
pytest

echo "All checks passed"
```

---

# Rust

## Core Tools

```bash
rustup component add clippy rustfmt
```

## rustfmt Configuration

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 2
newline_style = "Unix"
indent_style = "Block"
use_small_heuristics = "Default"
reorder_imports = true
reorder_modules = true
remove_nested_parens = true
format_strings = true
format_macro_matchers = true
format_macro_bodies = true
group_imports = "StdExternalCrate"
```

## Clippy Configuration

```toml
# clippy.toml
cognitive-complexity-threshold = 15
too-many-arguments-threshold = 6
type-complexity-threshold = 500
single-char-binding-names-threshold = 5
too-large-for-stack = 200
enum-variant-name-threshold = 3
literal-representation-threshold = 16384
trivial-copy-size-limit = 128
pass-by-value-size-limit = 256
too-many-lines-threshold = 100
array-size-threshold = 512000
vec-box-size-threshold = 4096
max-trait-bounds = 3
max-struct-bools = 3
max-fn-params-bools = 3
warn-on-all-wildcard-imports = true
disallow-names = ["temp_var", "temp_var_super"]
```

## Cargo Configuration

```toml
# Cargo.toml
[package.metadata.agent-cannon]
rules = [
    "strategy-pattern",
    "pure-functions", 
    "no-commented-code",
    "no-mutation-in-pure",
]

[lints.rust]
unsafe_code = "forbid"

[profile.release]
opt-level = 3
lto = true

[profile.dev]
debug = 0  # Faster builds
```

## Custom Clippy Lints

Create `clippy.toml` in project root with Agent Cannon rules:

```toml
# Agent Cannon specific clippy rules
cognitive-complexity-threshold = 15

# Warn on 3+ branch match expressions
too-many-match-arms = 3

# Enforce pure functions
# Mark functions that should be pure with #[must_use]
must-use-candidate = "lint"

# No commented-out code via rustfmt
edition = "2021"
normalize_comments = true
normalize_doc_attributes = true
```

## Verify Script

```bash
#!/bin/bash
# verify.sh
set -e

echo "Running rustfmt..."
cargo fmt --check

echo "Running clippy..."
cargo clippy --all-targets --all-features -- -D warnings

echo "Running tests..."
cargo test

echo "Running build..."
cargo build

echo "All checks passed"
```

---

# Go

## Core Tools

```bash
go install golang.org/lint/golint@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install github.com/go-vet/cmd/vet@latest
```

## golangci-lint Configuration

```yaml
# .golangci.yml
run:
  timeout: 5m
  modules-download-mode: readonly

linters:
  enable:
    - errcheck      # Check error handling
    - gosimple      # Simplify code
    - govet         # Reports suspicious constructs
    - ineffassign   # Detects unused assignments
    - staticcheck   # Static analysis checks
    - unused        # Checks for unused code
    - gomnd         # Detect magic numbers
    - noctx         # Flag async calls without context
    - context       # Enforce context.Background()
    - gosec         # Security vulnerabilities
    - prealloc      # Find preallocation opportunities
    - exportloopref # Export loop variables
    - dupl          # Code duplication detection
    - gocognit      # Cognitive complexity
    - goconst       # Find repeated constants
    - gofmt         # Format checking
    - goimports     # Import formatting
    - misspell      # Misspelled words

linters-settings:
  gomnd:
    min_occurrences = 3  # Flag 3+ case switches as needing strategy
  
  gocognit:
    min-complexity = 15  # Flag complex functions
  
  errcheck:
    check-type-assertions = true
    check-blank = true
  
  gosec:
    excludes = []
  
  govet:
    enable-all = true
  
  staticcheck:
    checks = ["all"]
  
  context:
    context-default-mode = "always"
    async-func-names = ["^Handle$", "^Process$", "^Execute$", "^Run$"]

  gofmt:
    simplify-range = true
  
  misspell:
    locale = "US"

issues:
  exclude-use-default = false
  max-issues-per-linter = 50
  max-same-issues = 10
```

## Custom Rules for Agent Cannon

### Magic Number Detection

```go
// Custom gomnd configuration
// In .golangci.yml:
linters-settings:
  gomnd:
    # Numbers that are allowed without justification
    ignored-numbers = "0,1,2,-1"
    # Ignore case statements
    ignore-case-clause = true
    # Ignore function/method names
    ignored-functions = "len,cap,make,new"
```

### No Commented-Out Code

Go doesn't have a direct linter for this. Add a pre-commit hook:

```bash
#!/bin/bash
# pre-commit hook
set -e

# Check for commented-out code
if git diff --cached | grep -E '^\+.*(//|/[*])\s*(func|var|const|return|if|for|switch)' > /dev/null; then
    echo "AC001: Commented-out code detected. Remove before committing."
    exit 1
fi
```

## Makefile for Verification

```makefile
# Makefile
.PHONY: verify build test lint

verify: lint test build

lint:
	golangci-lint run ./...

test:
	go test -v -race ./...

build:
	go build ./...

fmt:
	go fmt ./...
	goimports -w .

# Agent Cannon specific: check for strategy pattern candidates
check-complexity:
	@echo "Checking for complex branching..."
	@golangci-lint run --enable-only=gomnd ./... || true
	@echo "If gomnd flags issues, consider refactoring to strategy pattern"
```

## Verify Script

```bash
#!/bin/bash
# verify.sh
set -e

echo "Running golangci-lint..."
golangci-lint run ./...

echo "Running go vet..."
go vet ./...

echo "Running tests..."
go test -race ./...

echo "Running build..."
go build ./...

echo "All checks passed"
```

---

# Language-Agnostic Summary

| Check | TS/JS | Python | Rust | Go |
|-------|-------|--------|------|-----|
| No commented code | eslint-plugin-no-commented-code | ruff E265 | rustfmt normalize_comments | pre-commit hook |
| 3+ branch if/else → strategy | custom ESLint rule | ruff SIM102 | clippy too-many-match-arms | golangci-lint gomnd |
| No deps in app/ | import/no-restricted-paths | bandit | N/A (module system) | N/A |
| Pure functions | @typescript-eslint rules | mypy strict | #[pure] attribute | golangci-lint context |
| Type safety | TypeScript strict | mypy strict | Rust compiler | go vet |
| Build check | tsc --noEmit | mypy | cargo build | go build |
| Test check | jest/vitest | pytest | cargo test | go test |
| Hardcoded secrets | eslint-plugin-security | bandit | clippy hardcoded | gosec |
| Magic numbers | no-magic-numbers | ruff N802 | clippy | golangci-lint gomnd |
| FP composition | ramda-eslint | - | - | - |
| Cognitive complexity | eslint-complexity | ruff C901 | clippy cognitive_complexity | golangci-lint gocognit |

## Custom Rules by Language

### TS/JS
- `no-commented-code`: eslint-plugin-no-commented-code
- `no-complex-branching`: custom ESLint rule
- `ramda/*`: ramda-eslint rules

### Python
- `SIM102/103/108`: ruff flake8-simplify (collapsible if/else, simplify return, ternary)
- `B`: ruff flake8-bugbear (detect impure patterns)
- `C4`: ruff flake8-comprehensions ( FP patterns)

### Rust
- `too-many-match-arms`: clippy (flag 3+ match branches)
- `cognitive-complexity`: clippy
- `unsafe_code = forbid`: Cargo.toml

### Go
- `gomnd`: golangci-lint (magic numbers)
- `context`: golangci-lint (async without context)
- `errcheck`: golangci-lint (unchecked errors)

---

# Verification Scripts

## Universal Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running Agent Cannon verification..."

# Detect language and run appropriate checks
if [ -f "package.json" ]; then
    npm run verify
elif [ -f "Cargo.toml" ]; then
    cargo clippy -- -D warnings && cargo test
elif [ -f "go.mod" ]; then
    golangci-lint run ./... && go test ./...
elif [ -f "pyproject.toml" ]; then
    ruff check . && mypy . && pytest
else
    echo "No Agent Cannon config found. Skipping."
fi
```

LLM agents only needed for: rare judgment calls when lint flags something ambiguous. Most violations caught by lint.
