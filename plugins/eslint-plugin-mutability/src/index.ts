import { checkInvocationBoundary } from "./rules/check-invocation-boundary.ts";

const plugin = {
  meta: {
    name: "eslint-plugin-mutability"
  },
  rules: {
    "check-invocation-boundary": checkInvocationBoundary,
  }
};

export default plugin;

export const rules = plugin.rules;


// - No incompatible invocation annotations
// - No missing invocation annotations
// - No invalid invocation annotations