# Code Quality Reference

Source: *Succeed In Software* by Sean Cannon.
Verification agents: check against these examples when reviewing code.

---

<overview>

## Overview

Code quality is measured by clarity, consistency, and separation of concerns. Self-documenting code expresses intent through names and structure, not comments. Consistency means the codebase reads as if one person wrote it, enforced by tooling rather than human review.

</overview>

<naming>

## Naming

### Intent via Function Names

A function name should tell you what it does without reading its body. Use verb-noun patterns. No abbreviations.

**WRONG:**
```typescript
function proc(d: Data) {
  return d.items.filter((i) => i.a).map((i) => ({ ...i, t: Date.now() }));
}

function handle(data: any) { ... }

function f(x: number) { return x * 1.08; }
```

**CORRECT:**
```typescript
function filterActiveItems(items: Item[]): Item[] {
  return items.filter((item) => item.active);
}

function calculateTotalWithTax(subtotal: number, taxRate: number): number {
  return subtotal + subtotal * taxRate;
}

function findUserByEmail(email: string, db: Database): User | null { ... }
```

### Verb-Noun Patterns

| Pattern | Example |
|---|---|
| `get` + noun | `getUserById(id)` |
| `find` + noun | `findActiveUsers(db)` |
| `calculate` + noun | `calculateTotal(items)` |
| `is`/`has`/`can` | `isValid(input)`, `hasPermission(user)` |
| `create`/`build` | `createResponse(data)`, `buildUrl(base, path)` |

### Naming Rules

- No abbreviations: `usr` → `user`, `cfg` → `config`
- No single-letter vars except loop indices: `i`, `j`, `k`
- Booleans use `isActive`, `hasAccess`, `canEdit` prefix
- Collections are plural: `users`, `items`, `errors`

</naming>

<structure>

## Structure

### Separation of Concerns

Each module does one thing. Separate data transformation from I/O. Separate validation from processing.

**WRONG: Mixed concerns**
```typescript
function fetchAndProcessAndSave(url: string) {
  const response = fetch(url);
  const data = JSON.parse(response);
  const filtered = data.filter(isValid);
  database.save(filtered);
  emailService.notify('Done');
  return filtered.length;
}
```

**CORRECT: Separated**
```typescript
function parseResponse(raw: string): Item[] {
  return JSON.parse(raw);
}

function filterValidItems(items: Item[]): Item[] {
  return items.filter(isValid);
}

async function processAndSave(url: string, fetcher: Fetcher, db: Database): Promise<number> {
  const raw = await fetcher(url);
  const valid = filterValidItems(parseResponse(raw));
  await db.save(valid);
  return valid.length;
}
```

### One Responsibility Per Module

| Module | Responsibility |
|---|---|
| `validators.ts` | Input validation |
| `calculators.ts` | Pure computation |
| `formatters.ts` | Display formatting |
| `users.ts` | User business logic |

</structure>

<consistency>

## Consistency

Match the existing codebase style. If it uses `camelCase`, use `camelCase`. If error handling uses `Result<T, E>`, use it.

Linters enforce style, not code reviews. If a style rule matters, add it to the linter config. Never deviate without written justification.

</consistency>

<examples>

## Examples

### Renaming for Clarity

**Before:**
```typescript
function calc(items: Item[]) {
  let t = 0;
  for (const i of items) { t += i.p * i.q; }
  return t;
}
```

**After:**
```typescript
function calculateSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

### Extracting Utilities

**Before:**
```typescript
function process(data: string) {
  const trimmed = data.trim();
  const lower = trimmed.toLowerCase();
  const normalized = lower.replace(/\s+/g, '-');
  // ... 30 more lines
}
```

**After:**
```typescript
function normalizeString(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-');
}

function process(data: string) {
  const normalized = normalizeString(data);
  // ... 30 more lines
}
```

### Splitting God Function

**Before:**
```typescript
function register(email: string, password: string) {
  if (!email.includes('@')) throw new Error('Invalid email');
  if (password.length < 8) throw new Error('Password too short');
  const hash = bcrypt.hashSync(password, 10);
  const user = { email, hash, createdAt: Date.now() };
  database.insert('users', user);
  emailService.send(email, 'Welcome!', 'Thanks for registering');
  return { id: user.id, email };
}
```

**After:**
```typescript
function validateRegistration(email: string, password: string): void {
  if (!email.includes('@')) throw new Error('Invalid email');
  if (password.length < 8) throw new Error('Password too short');
}

async function register(email: string, password: string, db: Database, hasher: Hasher, emailer: Emailer) {
  validateRegistration(email, password);
  const hash = hasher.hash(password, 10);
  const user = { email, hash, createdAt: Date.now() };
  await db.insert('users', user);
  await emailer.send(email, 'Welcome!', 'Thanks for registering');
  return { id: user.id, email };
}
```

</examples>

<anti_patterns>

## Anti-Patterns

### Clever Code

**WRONG:** `const result = arr.reduce((a, b) => a + (b & 1 ? b : 0), 0);`

**CORRECT:**
```typescript
const oddSum = arr.filter((n) => n % 2 !== 0).reduce((sum, n) => sum + n, 0);
```

### Deep Nesting (3+ Levels)

**WRONG:**
```typescript
function process(data: Data) {
  if (data) {
    if (data.items) {
      if (data.items.length > 0) {
        if (data.items[0].active) {
          return data.items[0].value;
        }
      }
    }
  }
  return null;
}
```

**CORRECT: Early returns**
```typescript
function process(data: Data | null): number | null {
  if (!data?.items?.length) return null;
  const first = data.items[0];
  return first.active ? first.value : null;
}
```

### Premature Abstraction

Creating a generic `BaseProcessor` before having 3+ concrete processors. Write the concrete implementation first. Extract shared code only when duplication is proven.

</anti_patterns>

<quick_reference>

## Quick Reference

### Naming Checklist

- [ ] Function uses verb-noun pattern
- [ ] No abbreviations
- [ ] Booleans use `is`/`has`/`can` prefix
- [ ] Collections are plural
- [ ] Name explains intent without reading body

### Structure Checklist

- [ ] One responsibility per module
- [ ] Data transformation separated from I/O
- [ ] Validation separated from processing
- [ ] Functions under 30 lines
- [ ] No god functions (>50 lines)

### Consistency Rules

- [ ] Matches existing naming conventions
- [ ] Matches existing import style
- [ ] Style enforced by linter
- [ ] Deviations documented and justified

</quick_reference>
