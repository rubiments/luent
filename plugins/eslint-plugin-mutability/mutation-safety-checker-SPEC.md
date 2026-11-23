Mutation Safety Checker Specification

## 1) Purpose

The mutability safety checker is a boundary-contract system.

Its goal is to make mutation intent explicit at module and function boundaries while keeping local mutation ergonomic.

---

## 2) Scope

The checker is concerned with:

- module boundaries (imports/exports)
- function boundaries
- class/object method boundaries
- context-key boundaries

The checker is **not** a full ownership/borrow checker for every local expression. It enforces boundary contracts and how those contracts are used in lexical scope.

---

## 3) Core model and terminology

### 3.1 Object local status

- **Owned object** (default mutable unless typed read-only)
  - created in current lexical/module scope
  - examples: object literal, array literal, class instance constructed in scope

- **Borrowed object** (must be branded at egress)
  - created outside current returning/exporting scope, then exposed through a boundary
  - represented as `v(...)` / `v<T>`

- **Escaped object** (unknown mutability aliasing risk)
  - intentionally stored/passed into unknown lifetime/channel
  - represented with `/*um*/` at boundary points

- **Read-only object**
  - TypeScript read-only forms such as `Readonly<T>` / `readonly[]`

### 3.2 Boundary names

- **Declaration boundary**: where a function/method/context key declares mutability requirements.
- **Invocation boundary**: where arguments are passed.
- **Return/export boundary**: where values leave scope or module.

### 3.3 Compiler-recognized mutation

Mutation is recognized by:

- assignment/update operators to object properties/elements
- known mutating operations
- methods declared with mutating receiver intent (for example `/*mu:this*/`)
- mutability annotations that explicitly declare mutation capability at boundaries

---

## 4) Annotation systems

There are two annotation systems:

1. **Compile-time annotation system**
2. **Runtime annotation system** (mu-pack + context-key annotations)

### 4.1 Compatibility rule

These systems are **incompatible**:

- A declaration uses **either** compile-time annotations **or** runtime annotations.
- A single boundary contract must not mix both systems.
- Invocation must match the declaration’s chosen system.
- Mixed usage on the same contract is an error.

This avoids ambiguous precedence and conflicting diagnostics.

---

## 5) Module trust model (`//@mu-checked` / `//@mu-nocheck`)

### 5.1 Checked modules

- A file is mutability-checked if it is project-owned.
- A `.d.ts` file is mutability-checked only if it has `//@mu-checked` at the top (before any code).

### 5.2 Unchecked modules

- Any `.d.ts` without `//@mu-checked` is **unchecked**.
- Any project-owned file with `//@mu-nocheck` at the top (before any code) is **unchecked**.
- Anything imported from an unchecked module is treated as **any mutability**:
  - mutability annotations are not required
  - checker behavior is analogous to TypeScript `any` for mutability safety

### 5.3 Opt-out marker

- `//@mu-nocheck` explicitly disables mutability checking for a `.ts` file.

---

## 6) Annotation semantics

### 6.1 `mu` and `um`

- `mu`: mutable capability granted for boundary object and reachable nested objects in scope.
- `um`: unknown mutability for escaped/aliased values.

### 6.2 Flow constraints

- `mu` can flow to `mu` or `um`.
- `um` cannot satisfy a `mu` requirement unless re-authorized at declaration boundary.
- Direct mutation of `um` is disallowed.

---

## 7) Syntax

### 7.1 Compile-time comment syntax

Allowed forms:

- `/*mu*/`
- `/*um*/`
- `/*mu:this*/`
- `/*mu:that*/`
- `/*mu:th*/`
- `/*mu:thth*/`

Rules:

- single-line block comment
- annotation token is sole content
- no spaces (for example `/* mu */` is invalid)

### 7.2 Runtime annotation syntax (mu-pack + context-key)

Mu-pack examples:

- `Mu<{ user: User }>`
- `MuOr<{ user: User }>`
- `{ mu: { user }, ... }`
- JSX forms such as `mu:key` and `'mu:key'`

Context-key example:

- `MU(KEY)`

### 7.3 Borrowed branding syntax

- wrapper helper: `v(expr)`
- branded type: `v<T>`

Example brand:

```ts
type v<T> = T & { "~accessed"?: true };
```

---

## 8) Boundary behavior

### 8.1 Declaration boundary rules

Mutability annotations are valid on object-typed values including:

- object/array/collection-like values
- generics that may be object-like
- `any` and `unknown`

Invalid on non-object-typed values.

Declaration boundary establishes the mutability contract that invocation must satisfy.

### 8.2 Invocation boundary rules

Invocation checks enforce declaration contracts.

#### 8.2.1 Contract matching

At invocation:

- argument annotation must match mutable declaration requirement
- missing required annotation is invalid
- incompatible annotation is invalid (`/*um*/` where `/*mu*/` is required, and vice versa)
- annotating where no mutable capability is declared is invalid

#### 8.2.2 Placement and shape rules (compile-time annotations)

Compile-time annotations at invocation are valid only when they are:

- **inline with the argument**
- and **prefix the relevant portion of that argument**

This includes:

- simple argument expression: `f(/*mu*/user)`
- spread argument operand: `f(/*mu*/...users)`
- object-literal argument fields (parameter-pack shape): annotation prefixes the **key**, not the value:
  - valid form: `f({/*mu*/user: user, count: 2})`
  - required contract form is key-prefix annotation (`/*mu*/user:`), not value-prefix annotation (`user: /*mu*/...`)

#### 8.2.3 Object-type validity at call-site

Invocation annotations are invalid for non-object-typed arguments (for example number/string/boolean/null/undefined/symbol literals and values).

For unions and generics, validity is based on the argument expression at call-site:

- annotation is valid when the argument is object-typed for that call
- annotation is invalid when the argument is non-object-typed for that call

#### 8.2.4 Rest and spread correspondence

For rest declarations and spread invocations:

- required mutability on rest element type applies to each supplied element
- spread operand annotation must satisfy the declared rest contract
- missing/incompatible spread annotation is diagnosed at invocation boundary

#### 8.2.5 Call-site origin consistency

The same invocation contract enforcement applies regardless of callable origin, including:

- local functions
- imported functions
- global functions
- callbacks
- higher-order function returns
- class methods
- object literal methods
- synthetic methods (including imported synthetic methods)

#### 8.2.6 Callback rules

- callback mutability is inferred for inline callbacks
- named callbacks must satisfy the callee’s declared mutability contract

#### 8.2.7 Checked vs unchecked invocation boundaries

For unchecked declarations/modules (including unchecked `.d.ts` and `//@mu-nocheck`):

- invocation mutability annotations are not required
- checker behaves as any-mutability at that boundary

### 8.3 Return/export boundary rules

At return/export:

- Owned values may be returned/exported without `v` branding.
- Borrowed values must be branded (`v(...)` or `v<T>` in explicit typing).
- Read-only values remain non-mutable regardless of boundary annotations.

### 8.4 Context-key boundaries

- Context keys may define boundary contracts.
- `MU(KEY)` is part of the runtime annotation system and indicates mutable contract/key path.
- Retrieval/provision behavior must follow the chosen annotation system for that boundary (compile-time vs runtime) and must not mix systems on one contract.

---

## 9) Escape behavior

The checker enforces **no illegal escape of non-local object**.

An escape includes sending a value to a sink that outlives/aliases current reasoning scope (for example unknown storage channels, context/provider channels, long-lived containers, unknown external callbacks).

Rules:

- escaping value must be explicitly marked as `um` where required by contract
- escaped (`um`) values cannot be directly mutated unless re-authorized through a valid mutable declaration boundary

---

## 10) Lint rule set

### 10.1 Declaration boundary lint rules

- No extraneous mutability annotations at declaration boundary
- No invalid mutability annotations at declaration boundary
- No illegal mutation of non-local object
- No illegal escape of non-local object

### 10.2 Invocation boundary lint rules

- No incompatible mutability annotations at invocation boundary
- No missing mutability annotations at invocation boundary
- No invalid mutability annotations at invocation boundary

### 10.3 Return/export boundary lint rules

- No missing borrowed-value branding (`v`)

---

## 11) Operational model

### 11.1 Owned objects

- Locally created objects are mutable by default (unless read-only typed).
- Local aliases of owned mutable values remain mutable in lexical scope.

### 11.2 Borrowed objects

- Borrowed values require mutable declaration annotation before mutation.
- Imports/returned borrowed values can be read without annotation, but mutation requires mutable declaration annotation.

### 11.3 Nested objects

- When a root binding has mutable capability, reachable nested objects are mutable in scope.
- Without mutable capability on the root, nested mutation is disallowed.

### 11.4 Receiver and closure targets

- `/*mu:this*/`: receiver (`this`) is mutable.
- `/*mu:that*/`: captured outer target is mutable.
- `/*mu:th*/`: either receiver or captured target may be mutable.
- `/*mu:thth*/`: both receiver and captured target are mutable.

---

## 12) Practical examples

### 12.1 Borrowed return must be branded

```ts
class App {
  private counter = { value: 0 };

  getCounter() {
    return v(this.counter);
  }

  getCounterTyped(): v<{ value: number }> {
    return this.counter;
  }
}
```

### 12.2 Mutable declaration required for borrowed mutation

```ts
function f(filter: () => v<Item>[]) {
  const item = filter().pop();
  if (item) item.name = ""; // disallowed
}

function g(/*mu*/ filter: () => v<Item>[]) {
  const item = filter().pop();
  if (item) item.name = ""; // allowed
}
```

### 12.3 Invocation placement in parameter packs and spread

```ts
declare function reset(pack: { /*mu*/user: User; count: number }, n: number): void;
declare function store(n: number, ...users: /*um*/User[]): void;

reset({/*mu*/user: user, count: 2}, 1); // valid key-prefix annotation form
store(0, /*um*/...users); // spread operand prefix
```

---

## 13) Non-goals and guardrails

- Do not infer global ownership semantics beyond boundary contracts.
- Do not silently merge compile-time and runtime annotation systems.
- Prefer explicit boundary diagnostics over implicit fallback behavior in checked modules.

---

## 14) Summary

The checker is a boundary-contract mutability system with:

- explicit mutable (`mu`) and escaped/unknown (`um`) capability
- strict borrowed branding at return/export boundaries via `v`
- trust gating via `//@mu-checked` for third-party `.d.ts`
- strict separation of compile-time and runtime annotation systems

This keeps mutability intent explicit at boundaries while preserving practical local mutation ergonomics.
