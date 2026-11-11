import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/rubiments/luent/tree/main/plugins/eslint-plugin-mutability#${name}`
);

export const noIllegalMutabilityOpsRule = createRule({
  name: "no-illegal-mutability-ops",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow illegal mutation operations and mutating method calls based on mutability brands."
    },
    schema: [],
    messages: {
      disallowedMutation:
        "This mutation is not allowed for the current mutability brand."
    }
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    void checker;

    return {};
  }
});

