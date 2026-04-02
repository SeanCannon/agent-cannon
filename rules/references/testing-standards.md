# Testing Standards Reference

Source: *Succeed In Software* by Sean Cannon.
Verification agents: check against these examples when reviewing code.

---

<overview>

## Overview

Tests are proof of correctness. Untested code is unverified code. Target 100% coverage of exported functions, all branches, error paths, and edge cases. TDD (test-first) is preferred: write the test, watch it fail, write the code, watch it pass.

Tests must be deterministic, isolated, and fast. A test that depends on execution order, external services, or timing is a liability.

</overview>

<coverage_rules>

## Coverage Rules

Every code change must include tests covering:

1. **Every exported function** — no untested public API
2. **All branches** — every if/else, switch case, ternary, and strategy path
3. **Error paths** — invalid inputs, null, undefined, unexpected types
4. **Edge cases** — empty arrays, zero values, max values, boundary conditions
5. **Boundary values** — off-by-one, first/last element, single-element collections

Coverage is measured by branch coverage, not line coverage.

</coverage_rules>

<di_pattern>

## Dependency Injection for Testing

Never import side-effectful modules directly inside logic functions. Inject dependencies as parameters so tests can substitute mocks.

**WRONG:**
```typescript
import { database } from './database';

function getUser(id: string) {
  return database.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

**CORRECT:**
```typescript
function getUser(id: string, db: Database) {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

### Factory Functions

```typescript
function makeUserService(db: Database, emailer: Emailer) {
  return {
    getUser: (id: string) => db.query('SELECT * FROM users WHERE id = ?', [id]),
    notifyUser: (id: string, msg: string) => {
      const user = db.query('SELECT email FROM users WHERE id = ?', [id]);
      return emailer.send(user.email, msg);
    },
  };
}
```

</di_pattern>

<mock_services>

## Mock Services

| Dependency | Mock Strategy |
|---|---|
| Database | In-memory store or stub |
| HTTP APIs | Mock fetcher with canned responses |
| File system | In-memory path → content map |
| Time | Inject `now: () => Date` |
| Randomness | Inject `rng: () => number` |

```typescript
const mockDb = { query: jest.fn().mockResolvedValue({ id: '1', name: 'Alice' }) };
const mockEmailer = { send: jest.fn().mockResolvedValue(undefined) };
```

</mock_services>

<test_structure>

## Test Structure

### Arrange / Act / Assert

```typescript
describe('calculateTotal', () => {
  it('should sum item prices', () => {
    const items = [{ name: 'A', price: 10 }, { name: 'B', price: 20 }];
    const result = calculateTotal(items);
    expect(result).toBe(30);
  });
});
```

### Naming Convention

Use `should X when Y`:

```typescript
it('should return 0 when items list is empty', () => { ... });
it('should throw when tier is unknown', () => { ... });
it('should apply discount when quantity exceeds threshold', () => { ... });
```

### One Logical Assertion Per Test

**WRONG:**
```typescript
it('should process order', () => {
  const result = processOrder(order);
  expect(result.status).toBe('confirmed');
  expect(result.total).toBe(100);
  expect(sendEmail).toHaveBeenCalled();
});
```

**CORRECT:**
```typescript
it('should set status to confirmed when payment succeeds', () => {
  expect(processOrder(order).status).toBe('confirmed');
});

it('should calculate correct total with tax', () => {
  expect(processOrder(order).total).toBe(100);
});
```

</test_structure>

<examples>

## Examples

### Testing Pure Functions

```typescript
describe('addItem', () => {
  it('should append item without mutating original', () => {
    const original = ['a', 'b'];
    const result = addItem(original, 'c');
    expect(result).toEqual(['a', 'b', 'c']);
    expect(original).toEqual(['a', 'b']);
  });

  it('should handle empty list', () => {
    expect(addItem([], 'x')).toEqual(['x']);
  });
});
```

### Testing with Mocked Dependencies

```typescript
describe('getUser', () => {
  it('should return user when found', async () => {
    const mockDb = { query: jest.fn().mockResolvedValue({ id: '1', name: 'Alice' }) };
    const result = await getUser('1', mockDb);
    expect(result.name).toBe('Alice');
  });

  it('should return null when not found', async () => {
    const mockDb = { query: jest.fn().mockResolvedValue(null) };
    const result = await getUser('999', mockDb);
    expect(result).toBeNull();
  });
});
```

### Testing Error Paths

```typescript
describe('processOrder', () => {
  it('should throw when order type is unknown', () => {
    expect(() => processOrder('quantum', order)).toThrow('Unknown order type: quantum');
  });

  it('should propagate database errors', async () => {
    const mockDb = { query: jest.fn().mockRejectedValue(new Error('Connection lost')) };
    await expect(getUser('1', mockDb)).rejects.toThrow('Connection lost');
  });
});
```

</examples>

<anti_patterns>

## Anti-Patterns

### Testing Implementation Details

**WRONG:**
```typescript
it('should call internal helper', () => {
  processOrder(order);
  expect(internalHelper).toHaveBeenCalled();
});
```

**CORRECT:**
```typescript
it('should return confirmed status when payment succeeds', () => {
  const result = processOrder(order);
  expect(result.status).toBe('confirmed');
});
```

### Order-Dependent Tests

**WRONG:**
```typescript
let sharedState = 0;
it('sets state', () => { sharedState = 1; });
it('uses state', () => { expect(sharedState).toBe(1); });
```

**CORRECT:**
```typescript
it('should produce correct result from its own inputs', () => {
  expect(myFunction(1)).toBe(2);
});
```

### Skipped Tests

**WRONG:** `it.skip('edge case', () => { ... });`

**CORRECT:** Fix the test or remove it. If blocked, create a tracking issue.

</anti_patterns>

<quick_reference>

## Quick Reference

### Test Writing Checklist

- [ ] Name follows `should X when Y` pattern
- [ ] Arrange/Act/Assert structure
- [ ] One logical assertion per test
- [ ] Happy path tested
- [ ] Error path tested
- [ ] Edge cases tested (empty, null, boundary)
- [ ] No execution order dependencies
- [ ] No skipped tests without tracking issues

### DI Checklist

- [ ] Dependencies received as parameters
- [ ] No direct I/O imports in logic functions
- [ ] Tests inject mocks, not real implementations

### Mock Checklist

- [ ] External APIs mocked
- [ ] Database calls mocked
- [ ] Time/randomness injected
- [ ] Mocks reset between tests

</quick_reference>
