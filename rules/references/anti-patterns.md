# Anti-Patterns Reference

Source: *Succeed In Software* by Sean Cannon.
Verification agents: check against these examples when reviewing code.

---

<overview>

## Overview

Anti-patterns are recurring code structures that appear useful but introduce bugs, reduce maintainability, and increase technical debt. Agent Cannon detects these patterns and flags them for correction. Every anti-pattern has a clear transformation to its correct form.

Allowing anti-patterns to persist causes: unpredictable behavior from mutation, untestable code from side effects, unmanageable complexity from condition chains, and security breaches from hardcoded secrets.

</overview>

<anti_patterns>

## Mutation

### Array Mutation

**WRONG:**
```typescript
function removeItem(list: string[], index: number): string[] {
  list.splice(index, 1);
  return list;
}
```

**CORRECT:**
```typescript
function removeItem(list: string[], index: number): string[] {
  return list.filter((_, i) => i !== index);
}
```

**WRONG:**
```typescript
function sortItems(list: number[]): number[] {
  list.sort((a, b) => a - b);
  return list;
}
```

**CORRECT:**
```typescript
function sortItems(list: number[]): number[] {
  return [...list].sort((a, b) => a - b);
}
```

### Object Mutation

**WRONG:**
```typescript
function setStatus(record: Record, status: string): Record {
  record.status = status;
  record.updatedAt = Date.now();
  return record;
}
```

**CORRECT:**
```typescript
function setStatus(record: Record, status: string, now: number): Record {
  return { ...record, status, updatedAt: now };
}
```

### Nested Structure Mutation

**WRONG:**
```typescript
function updatePermission(user: User, perm: string, value: boolean): User {
  user.permissions[perm] = value;
  return user;
}
```

**CORRECT:**
```typescript
function updatePermission(user: User, perm: string, value: boolean): User {
  return {
    ...user,
    permissions: { ...user.permissions, [perm]: value },
  };
}
```

## Side Effects

**WRONG:**
```typescript
function calculate(x: number): number {
  console.log(`Calculating ${x}`);
  return x * 2;
}
```

**CORRECT:**
```typescript
function calculate(x: number): number {
  return x * 2;
}
```

**WRONG:**
```typescript
function getConfig(): Config {
  return JSON.parse(fs.readFileSync('config.json', 'utf8'));
}
```

**CORRECT:**
```typescript
function parseConfig(raw: string): Config {
  return JSON.parse(raw);
}
```

## Condition-Heavy Code

**WRONG:**
```typescript
function getDiscount(tier: string, amount: number): number {
  if (tier === 'bronze') {
    return amount * 0.05;
  } else if (tier === 'silver') {
    return amount * 0.10;
  } else if (tier === 'gold') {
    return amount * 0.15;
  } else if (tier === 'platinum') {
    return amount * 0.20;
  } else {
    return 0;
  }
}
```

**CORRECT:**
```typescript
const discounts: Record<string, (amount: number) => number> = {
  bronze: (a) => a * 0.05,
  silver: (a) => a * 0.10,
  gold: (a) => a * 0.15,
  platinum: (a) => a * 0.20,
};

function getDiscount(tier: string, amount: number): number {
  return (discounts[tier] ?? (() => 0))(amount);
}
```

## Commented-Out Code

Always wrong. Use git history instead.

**WRONG:**
```typescript
function calculate(input: number) {
  const doubled = input * 2;
  // const tripled = input * 3;
  // if (tripled > 100) { return tripled; }
  return doubled;
}
```

**CORRECT:**
```typescript
function calculate(input: number) {
  return input * 2;
}
```

## Hardcoded Secrets

**WRONG:**
```typescript
const API_KEY = 'sk-live-abc123def456';
const DB_PASSWORD = 'supersecret123';
```

**CORRECT:**
```typescript
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
```

## God Functions

**WRONG:**
```typescript
function processOrder(order: Order) {
  if (!order.items || order.items.length === 0) throw new Error('No items');
  for (const item of order.items) {
    if (!item.sku) throw new Error('Missing SKU');
    if (item.quantity <= 0) throw new Error('Invalid quantity');
  }
  let subtotal = 0;
  for (const item of order.items) { subtotal += item.price * item.quantity; }
  const total = subtotal + subtotal * 0.08;
  database.insert({ ...order, total });
  emailService.send(order.email, 'Order confirmed', `Total: $${total}`);
  return { orderId: order.id, total };
}
```

**CORRECT:**
```typescript
function validateOrder(order: Order): void {
  if (!order.items?.length) throw new Error('No items');
  for (const item of order.items) {
    if (!item.sku) throw new Error('Missing SKU');
    if (item.quantity <= 0) throw new Error('Invalid quantity');
  }
}

function calculateTotal(items: Item[]): number {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return subtotal + subtotal * 0.08;
}
```

</anti_patterns>

<detection>

## Detection

| Anti-Pattern | Detection Method |
|---|---|
| Array mutation | Grep for `.push(`, `.splice(`, `.sort(` on parameters |
| Object mutation | Grep for `param.prop = ` on parameter properties |
| Side effects | Grep for `console.`, `fs.`, `fetch(` in pure functions |
| Condition-heavy | Count `else if` (3+) or `switch` cases (4+) |
| Commented code | Grep for `// function`, `// const`, `// if` |
| Hardcoded secrets | Grep for secret-like string literals |
| God functions | Line count per function (>50) |

</detection>

<quick_reference>

## Quick Reference

### Detection Checklist

- [ ] No `.push()`, `.splice()`, `.sort()` on function parameters
- [ ] No `console.*`, `fs.*`, `fetch()` inside pure functions
- [ ] No `else if` chains with 3+ branches
- [ ] No commented-out code blocks
- [ ] No string literals matching secret patterns
- [ ] No functions exceeding 50 lines
- [ ] No functions doing more than one logical thing

### Fix Patterns

| Anti-Pattern | Fix |
|---|---|
| `arr.push(x)` | `[...arr, x]` |
| `arr.splice(i,1)` | `arr.filter((_,idx)=>idx!==i)` |
| `obj.key = val` | `{ ...obj, key: val }` |
| `if/else if/else if` | Strategy map |
| `// old code` | Delete it |
| `const KEY = 'secret'` | `process.env.KEY` |
| 80-line function | Split into focused functions |

</quick_reference>
