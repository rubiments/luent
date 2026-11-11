import { noIllegalMutabilityOpsRule } from "./rules/no-illegal-mutability-ops.ts";
import { requireMutabilityCommentRule } from "./rules/require-mutability-comment.ts";

const plugin = {
  meta: {
    name: "@luently/eslint-plugin-mutability"
  },
  rules: {
    "require-mutability-comment": requireMutabilityCommentRule,
    "no-illegal-mutability-ops": noIllegalMutabilityOpsRule
  }
};

export default plugin;

export const rules = plugin.rules;

