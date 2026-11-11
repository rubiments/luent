import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/rubiments/luent/tree/main/plugins/eslint-plugin-mutability#${name}`
);

export const requireMutabilityCommentRule = createRule({
  name: "require-mutability-comment",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a mutability block comment annotation on arguments mapped to mutability-branded parameters."
    },
    schema: [],
    messages: {
      missingComment:
        "Expected a mutability block comment annotation (for example /*~mu*/) for this argument."
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

