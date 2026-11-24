# eslint-plugin-mutability

Typed ESLint rules for mutability safety checks.

## Rules

- `mutability/check-invocation-boundary`  
  Enforces the declaration/argument annotation model:
  - Declaration annotation is `/*mu*/` or `/*um*/`, directly prefixing the declared parameter name.
  - Calls into `/*mu*/` or `/*um*/` parameters require matching argument annotations.
  - Constructor invocations (`new`) and `super(...)` calls follow the same annotation checks as regular calls.
  - Calls into unannotated parameters reject argument mutability annotations.
  - Invocation annotations are invalid for non-object arguments.
  - For parameter-pack object arguments, key-prefix annotations are checked against annotated type-literal properties.
  - Nested parameter-pack object literals are checked recursively.
  - Declarations from unchecked modules (`//@mu-nocheck`, or `.d.ts` without `//@mu-checked`) are treated as any-mutability at invocation boundaries.

- `mutability/no-illegal-mutations`  
  Placeholder rule for mutation-operation enforcement by mutability brand.

## Typed setup

These rules require TypeScript parser services.

```ts
// eslint.config.mjs
import tseslint from "typescript-eslint";
import mutability from "@luently/eslint-plugin-mutability";

export default tseslint.config({
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: {
      projectService: true
    }
  },
  plugins: {
    mutability
  },
  rules: {
    "mutability/check-invocation-boundary": "error",
    "mutability/no-illegal-mutations": "error"
  }
});
```
