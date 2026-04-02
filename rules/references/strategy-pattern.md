# Strategy Pattern Reference

Source: *Succeed In Software* by Sean Cannon.
Verification agents: check against these examples when reviewing code.

---

<overview>

## Overview

The Strategy Pattern replaces condition-based branching (if/else chains, switch statements) with a map of pluggable behaviors. Each branch becomes a named strategy function stored in an object. A dispatcher selects and invokes the correct strategy at runtime.

**Why it matters:** Condition chains grow unpredictably. Adding a new case means modifying existing code, risking regressions. Strategy maps are open for extension — add a new key — closed for modification.

</overview>

<when_to_use>

## When to Use

Use the strategy pattern when ANY of the following are true:

1. **3 or more branches** — if/else with 3+ conditions is a signal
2. **Type-based selection** — dispatching on a string/enum discriminant
3. **Expected growth** — new cases will be added over time
4. **Complex branch logic** — each branch contains more than 2-3 lines
5. **Repeated dispatch** — the same condition tree appears in multiple places

Do NOT use when:
- Exactly 2 branches with trivial logic
- The condition is a one-off that will never expand
- The "strategy" is a single expression

</when_to_use>

<implementation>

## Implementation

### Structure

```typescript
// 1. Define individual strategy functions
const strategies: Record<string, (input: any) => any> = {
  A: (data) => ({ ...data, type: 'A' }),
  B: (data) => ({ ...data, type: 'B' }),
  default: (data) => ({ ...data, type: 'unknown' }),
};

// 2. Dispatcher selects and invokes
function dispatch(type: string, data: any) {
  const strategy = strategies[type] || strategies.default;
  return strategy(data);
}
```

### WRONG/CORRECT Examples

**WRONG: If/else chain**
```typescript
function processOrder(type: string, order: Order) {
  if (type === 'standard') {
    validateStandard(order);
    chargeFullPrice(order);
    shipGround(order);
  } else if (type === 'express') {
    validateExpress(order);
    chargePremium(order);
    shipAir(order);
  } else if (type === 'overnight') {
    validateOvernight(order);
    chargeOvernight(order);
    shipNextDay(order);
  } else {
    throw new Error('Unknown order type');
  }
}
```

**CORRECT: Strategy map**
```typescript
const orderStrategies: Record<string, (order: Order) => void> = {
  standard: (order) => {
    validateStandard(order);
    chargeFullPrice(order);
    shipGround(order);
  },
  express: (order) => {
    validateExpress(order);
    chargePremium(order);
    shipAir(order);
  },
  overnight: (order) => {
    validateOvernight(order);
    chargeOvernight(order);
    shipNextDay(order);
  },
};

function processOrder(type: string, order: Order) {
  const strategy = orderStrategies[type];
  if (!strategy) throw new Error(`Unknown order type: ${type}`);
  strategy(order);
}
```

**WRONG: Switch with logic**
```typescript
function calculateDiscount(tier: string, amount: number): number {
  switch (tier) {
    case 'bronze':
      return amount * 0.05;
    case 'silver':
      return amount * 0.10;
    case 'gold':
      return amount * 0.15;
    case 'platinum':
      return amount * 0.20;
    default:
      return 0;
  }
}
```

**CORRECT: Strategy map**
```typescript
const discountStrategies: Record<string, (amount: number) => number> = {
  bronze: (amount) => amount * 0.05,
  silver: (amount) => amount * 0.10,
  gold: (amount) => amount * 0.15,
  platinum: (amount) => amount * 0.20,
};

function calculateDiscount(tier: string, amount: number): number {
  return (discountStrategies[tier] ?? (() => 0))(amount);
}
```

</implementation>

<examples>

## Examples

### Notification Dispatcher

```typescript
type NotificationType = 'email' | 'sms' | 'push' | 'slack';

const notifiers: Record<NotificationType, (msg: string, to: string) => Promise<void>> = {
  email: (msg, to) => emailService.send(to, msg),
  sms: (msg, to) => smsService.send(to, msg),
  push: (msg, to) => pushService.send(to, msg),
  slack: (msg, to) => slackService.post(to, msg),
};

async function notify(type: NotificationType, message: string, recipient: string) {
  const notifier = notifiers[type];
  if (!notifier) throw new Error(`Unknown notification type: ${type}`);
  return notifier(message, recipient);
}
```

### Pricing Calculator

```typescript
type PricingModel = 'flat' | 'per_unit' | 'tiered' | 'volume';

const calculators: Record<PricingModel, (qty: number, base: number) => number> = {
  flat: (_qty, base) => base,
  per_unit: (qty, base) => qty * base,
  tiered: (qty, base) => {
    if (qty <= 10) return qty * base;
    if (qty <= 100) return qty * base * 0.9;
    return qty * base * 0.8;
  },
  volume: (qty, base) => {
    const discount = qty >= 100 ? 0.2 : qty >= 50 ? 0.1 : 0;
    return qty * base * (1 - discount);
  },
};

function calculatePrice(model: PricingModel, quantity: number, basePrice: number) {
  return calculators[model](quantity, basePrice);
}
```

### Form Validator

```typescript
type FieldValidator = (value: string) => string | null;

const validators: Record<string, FieldValidator> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email',
  phone: (v) => /^\d{10}$/.test(v.replace(/\D/g, '')) ? null : 'Invalid phone',
  required: (v) => v.trim().length > 0 ? null : 'Field is required',
  url: (v) => /^https?:\/\/.+/.test(v) ? null : 'Invalid URL',
};

function validateField(type: string, value: string): string | null {
  const validator = validators[type];
  return validator ? validator(value) : null;
}
```

</examples>

<anti_patterns>

## Anti-Patterns

### Over-Engineering: Strategy for 2 Trivial Branches

**WRONG:**
```typescript
const strategies = {
  yes: () => true,
  no: () => false,
};
const result = strategies[input]();
```

**CORRECT:**
```typescript
const result = input === 'yes';
```

### Strategy-Per-Line: Wrapping Single Expressions

**WRONG:**
```typescript
const add = (a: number, b: number) => a + b;
const subtract = (a: number, b: number) => a - b;
const operations = { add, subtract };
```
This is acceptable only if the operations are passed around or composed. If you just call `operations[op](a, b)` once, inline the expression.

### Nested Strategies: Composing Condition Trees

**WRONG:**
```typescript
if (type === 'A') {
  if (subtype === 'X') { ... } else { ... }
} else if (type === 'B') {
  if (subtype === 'Y') { ... } else { ... }
}
```

**CORRECT: Composed strategies**
```typescript
const strategies = {
  A: { X: handleAX, default: handleADefault },
  B: { Y: handleBY, default: handleBDefault },
};
function dispatch(type: string, subtype: string, data: any) {
  const group = strategies[type] ?? {};
  const handler = group[subtype] ?? group.default;
  return handler(data);
}
```

</anti_patterns>

<quick_reference>

## Quick Reference

### Detection Rule
- Grep for `if (.*===.*)` with 3+ matches in a single function
- Grep for `switch (` with 4+ cases
- Functions with 3+ `else if` blocks

### Transformation Steps
1. Identify the discriminant (the value being compared)
2. Extract each branch body into a named function
3. Create a `Record<Discriminant, Function>` map
4. Replace the condition chain with map lookup + invocation
5. Handle unknown discriminants with a default or throw

### Checklist
- [ ] 3 or more branches exist
- [ ] Each branch extracted to a named function
- [ ] Strategy map uses the discriminant as key
- [ ] Default/unknown case is handled
- [ ] No logic remains in the dispatcher beyond lookup + call

</quick_reference>
