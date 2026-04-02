# Pure Functions Reference

Source: *Succeed In Software* by Sean Cannon.
Verification agents: check against these examples when reviewing code.

---

<overview>

## Overview

A pure function satisfies two conditions:
1. **Deterministic** — given the same inputs, it always returns the same output
2. **No side effects** — it does not modify external state, perform I/O, or mutate its arguments

Pure functions are predictable, testable without mocks, and safe to memoize. They are the foundation of functional programming and reliable software.

</overview>

<rules>

## Rules

1. **Deterministic** — No randomness, no timestamps, no external state reads
2. **No I/O** — No file reads, network calls, database queries, console output
3. **No mutation** — Never modify input arguments or external variables
4. **No external state** — Do not read from globals, environment, or closures that change
5. **Referential transparency** — A call can be replaced by its return value

</rules>

<examples>

## Examples

### Array Mutation

**WRONG:**
```typescript
function addItem(list: string[], item: string): string[] {
  list.push(item);
  return list;
}
```

**CORRECT:**
```typescript
function addItem(list: string[], item: string): string[] {
  return [...list, item];
}
```

### Object Mutation

**WRONG:**
```typescript
function updateUser(user: User, name: string): User {
  user.name = name;
  return user;
}
```

**CORRECT:**
```typescript
function updateUser(user: User, name: string): User {
  return { ...user, name };
}
```

### Nested Object Mutation

**WRONG:**
```typescript
function updateAddress(user: User, city: string): User {
  user.address.city = city;
  return user;
}
```

**CORRECT:**
```typescript
function updateAddress(user: User, city: string): User {
  return { ...user, address: { ...user.address, city } };
}
```

### Side Effects Inside Calculation

**WRONG:**
```typescript
function calculateTotal(items: Item[]): number {
  console.log('Calculating...');
  const total = items.reduce((sum, item) => sum + item.price, 0);
  console.log(`Total: ${total}`);
  return total;
}
```

**CORRECT:**
```typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

</examples>

<fp_patterns>

## FP Patterns

### Currying for Dependency Injection

```typescript
const makeFetcher = (fetcher: typeof fetch) =>
  (url: string) => fetcher(url);

const fetchUser = makeFetcher(globalFetch);
```

### Currying for Partial Application

```typescript
const makeAdder = (a: number) => (b: number) => a + b;

const add5 = makeAdder(5);
add5(3);  // 8
```

### Function Composition

```typescript
const compose = <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) => fns.reduceRight((acc, fn) => fn(acc), value);

const trim = (s: string) => s.trim();
const lower = (s: string) => s.toLowerCase();
const normalize = compose(lower, trim);
normalize('  Hello  '); // 'hello'
```

### Pipeline

```typescript
const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) => fns.reduce((acc, fn) => fn(acc), value);
```

</fp_patterns>

<immutability>

## Immutability

### Spread Operator

```typescript
const added = [...arr, newItem];
const removed = arr.filter((_, i) => i !== index);
const updated = { ...obj, key: newValue };
```

### Frozen Objects

```typescript
const config = Object.freeze({ apiUrl: 'https://api.example.com', timeout: 5000 });
```

### structuredClone (Deep Clone)

```typescript
const clone = structuredClone(original);
clone.nested.value = 99;
// original.nested.value is still 42
```

### Clone Strategy Selection

| Depth | Method | Use When |
|---|---|---|
| Shallow | `{ ...obj }` / `[...arr]` | Flat structures |
| Deep | `structuredClone(obj)` | Nested objects |
| Frozen | `Object.freeze(structuredClone(obj))` | Immutable config |

</immutability>

<anti_patterns>

## Anti-Patterns

### Hidden Mutation

**WRONG:**
```typescript
function processQueue(queue: Task[], task: Task): Task[] {
  queue.splice(0, 1);
  queue.push(task);
  return queue;
}
```

**CORRECT:**
```typescript
function processQueue(queue: Task[], task: Task): Task[] {
  return [...queue.slice(1), task];
}
```

### Impure Date in "Pure" Function

**WRONG:**
```typescript
function createTimestamp(): string {
  return new Date().toISOString();
}
```

**CORRECT:**
```typescript
function createTimestamp(now: Date): string {
  return now.toISOString();
}
```

### Impure Random in "Pure" Function

**WRONG:**
```typescript
function generateId(): string {
  return Math.random().toString(36).slice(2);
}
```

**CORRECT:**
```typescript
function generateId(rng: () => number): string {
  return rng().toString(36).slice(2);
}
```

### Side Effect as Return Value

**WRONG:**
```typescript
function saveAndReturn(data: Data): Data {
  database.insert(data);
  return data;
}
```

**CORRECT:**
```typescript
function prepareData(data: Data): Data {
  return { ...data, timestamp: Date.now() };
}
```

</anti_patterns>

<quick_reference>

## Quick Reference

### Purity Checklist

- [ ] Output depends ONLY on input arguments
- [ ] No `console.*`, `fs.*`, `fetch()`, `database.*`
- [ ] No `Date.now()`, `Math.random()` without injection
- [ ] No `.push`, `.splice`, `.sort`, direct assignment on inputs
- [ ] No reads from `process.env`, `window`, globals
- [ ] Referentially transparent

### Transformation Patterns

| Impure | Pure Replacement |
|---|---|
| `arr.push(x)` | `[...arr, x]` |
| `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| `obj.key = val` | `{ ...obj, key: val }` |
| `Date.now()` | Inject `now: number` |
| `Math.random()` | Inject `rng: () => number` |
| `fetch(url)` | Inject `fetcher` parameter |
| `console.log(x)` | Return value; log in caller |

</quick_reference>
