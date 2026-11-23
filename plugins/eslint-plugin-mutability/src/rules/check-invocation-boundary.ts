import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/rubiments/luent/tree/main/plugins/eslint-plugin-mutability#${name}`
);

type MutabilityAnnotation = "mu" | "um";
type Expectation = MutabilityAnnotation | "none";

type TsDeclarationLike = ts.Declaration & { dotDotDotToken?: ts.DotDotDotToken };
type TsSymbolLike = ts.Symbol;
type TsSignatureLike = ts.Signature;

type ParsedAnnotation = {
  annotation: MutabilityAnnotation;
  comment: TSESTree.Comment;
};

type PackExpectation = {
  key: string;
  expectation: Expectation;
};

const MUTABILITY_COMMENT_RE = /^(mu|um)$/;

const MESSAGE_IDS = {
  expectedAnnotation: "expectedAnnotation",
  expectedNoAnnotation: "expectedNoAnnotation"
} as const;

type MessageId = (typeof MESSAGE_IDS)[keyof typeof MESSAGE_IDS];

export const checkInvocationBoundary = createRule({
  name: "check-invocation-boundary",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce mutability invocation-boundary contracts for /*mu*/ and /*um*/."
    },
    schema: [],
    messages: {
      expectedAnnotation:
        "Expected mutability annotation /*{{expected}}*/ for this argument.",
      expectedNoAnnotation:
        "Expected no mutability annotation for this argument."
    }
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const sourceCode = context.sourceCode;
    const fileCheckCache = new Map<string, boolean>();

    return {
      CallExpression(node) {
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        const signature = checker.getResolvedSignature(tsNode);
        if (!signature) {
          return;
        }

        for (let i = 0; i < node.arguments.length; i += 1) {
          const argument = node.arguments[i];
          const parameter = getParameterSymbol(signature, i);
          if (!parameter) {
            continue;
          }

          const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0];
          if (!declaration || !isCheckedFile(declaration.getSourceFile(), fileCheckCache)) {
            continue;
          }

          const packExpectations = getPackExpectationsFromDeclaration(
            declaration,
            services,
            sourceCode
          );
          if (packExpectations.length > 0 && argument.type === "ObjectExpression") {
            validatePackArgument(
              context,
              sourceCode,
              argument,
              packExpectations,
              checker,
              services
            );
            continue;
          }

          const expectation = getParameterExpectation(declaration, services, sourceCode);
          validateArgument(
            context,
            sourceCode,
            checker,
            services,
            argument,
            expectation
          );
        }
      }
    };
  }
});

function validateArgument(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices,
  argument: TSESTree.CallExpressionArgument,
  expectation: Expectation
): void {
  const annotation = getNearestDirectPrefixAnnotation(sourceCode, argument);
  const tsNode = services.esTreeNodeToTSNodeMap.get(argument as never);
  const objectLike = isObjectLike(checker.getTypeAtLocation(tsNode), checker);

  if (!objectLike) {
    if (annotation) {
      reportExpectedNone(context, argument);
    }
    return;
  }

  if (expectation === "none") {
    if (annotation) {
      reportExpectedNone(context, argument);
    }
    return;
  }

  if (!annotation) {
    reportExpectedAnnotation(context, argument, expectation);
    return;
  }

  if (annotation.annotation !== expectation) {
    reportExpectedAnnotation(context, argument, expectation);
  }
}

function validatePackArgument(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  argument: TSESTree.ObjectExpression,
  packExpectations: PackExpectation[],
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices
): void {
  const expectationsByKey = new Map<string, Expectation>();
  for (const entry of packExpectations) {
    expectationsByKey.set(entry.key, entry.expectation);
  }

  for (const property of argument.properties) {
    if (property.type !== "Property") {
      continue;
    }

    const key = getObjectPropertyName(property);
    if (!key) {
      continue;
    }

    const expected = expectationsByKey.get(key) ?? "none";
    const annotation = getNearestDirectPrefixAnnotation(sourceCode, property.key);

    const tsNode = services.esTreeNodeToTSNodeMap.get(property.value as never);
    const objectLike = isObjectLike(checker.getTypeAtLocation(tsNode), checker);

    if (!objectLike) {
      if (annotation) {
        reportExpectedNone(context, property.key);
      }
      continue;
    }

    if (expected === "none") {
      if (annotation) {
        reportExpectedNone(context, property.key);
      }
      continue;
    }

    if (!annotation || annotation.annotation !== expected) {
      reportExpectedAnnotation(context, property.key, expected);
    }
  }
}

function getNearestDirectPrefixAnnotation(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node
): ParsedAnnotation | null {
  const firstToken = sourceCode.getFirstToken(node);
  const targetStart = firstToken?.range[0] ?? node.range[0];

  const comments = sourceCode.getCommentsBefore(node);
  let best: ParsedAnnotation | null = null;

  for (const comment of comments) {
    if (comment.type !== "Block") {
      continue;
    }

    const trimmed = comment.value.trim();
    const match = MUTABILITY_COMMENT_RE.exec(trimmed);
    if (!match) {
      continue;
    }

    const between = sourceCode.text.slice(comment.range[1], targetStart);
    if (between.trim().length > 0) {
      continue;
    }

    if (!best || comment.range[1] > best.comment.range[1]) {
      best = {
        annotation: match[1] as MutabilityAnnotation,
        comment
      };
    }
  }

  return best;
}

function getParameterSymbol(signature: TsSignatureLike, argumentIndex: number): TsSymbolLike | null {
  const params = signature.getParameters();
  if (params.length === 0) {
    return null;
  }

  if (argumentIndex < params.length) {
    return params[argumentIndex] ?? null;
  }

  const last = params.at(-1);
  if (!last) {
    return null;
  }

  const declaration = (last.valueDeclaration ?? last.declarations?.[0]) as
    | TsDeclarationLike
    | undefined;
  if (declaration?.dotDotDotToken) {
    return last;
  }

  return null;
}

function getParameterExpectation(
  declaration: ts.Declaration,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>
): Expectation {
  if (!ts.isParameter(declaration)) {
    return "none";
  }

  const direct =
    getAnnotationFromTsNode(declaration.name, services, sourceCode) ??
    getTsNodeDirectPrefixAnnotation(declaration.name, declaration.getSourceFile());
  if (direct) {
    return direct;
  }

  if (declaration.dotDotDotToken && declaration.type && ts.isArrayTypeNode(declaration.type)) {
    const textFallback = getAnnotationFromArrayElementText(
      declaration.type.elementType,
      declaration.getSourceFile()
    );
    return (
      getAnnotationFromTsNode(declaration.type.elementType, services, sourceCode) ??
      getTsNodeDirectPrefixAnnotation(
        declaration.type.elementType,
        declaration.getSourceFile()
      ) ??
      textFallback ??
      "none"
    );
  }

  return "none";
}

function getPackExpectationsFromDeclaration(
  declaration: ts.Declaration,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>
): PackExpectation[] {
  if (!ts.isParameter(declaration) || !declaration.type || !ts.isTypeLiteralNode(declaration.type)) {
    return [];
  }

  const sourceFile = declaration.getSourceFile();
  const expectations: PackExpectation[] = [];
  for (const member of declaration.type.members) {
    if (!ts.isPropertySignature(member)) {
      continue;
    }

    const key = getTsPropertyName(member.name);
    if (!key) {
      continue;
    }

    expectations.push({
      key,
      expectation:
        getAnnotationFromTsNode(member.name, services, sourceCode) ??
        getTsNodeDirectPrefixAnnotation(member.name, sourceFile) ??
        "none"
    });
  }

  return expectations;
}

function getAnnotationFromTsNode(
  node: ts.Node,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>
): MutabilityAnnotation | null {
  const map = services.tsNodeToESTreeNodeMap;
  if (!map.has(node)) {
    return null;
  }

  const estreeNode = map.get(node as never);
  const annotation = getNearestDirectPrefixAnnotation(sourceCode, estreeNode);
  return annotation?.annotation ?? null;
}

function getTsPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) {
    return name.expression.text;
  }

  return null;
}

function getObjectPropertyName(property: TSESTree.Property): string | null {
  if (property.computed) {
    if (property.key.type === "Literal" && typeof property.key.value === "string") {
      return property.key.value;
    }
    return null;
  }

  if (property.key.type === "Identifier") {
    return property.key.name;
  }

  if (property.key.type === "Literal" && typeof property.key.value === "string") {
    return property.key.value;
  }

  return null;
}

function getTsNodeDirectPrefixAnnotation(
  node: ts.Node,
  sourceFile: ts.SourceFile
): MutabilityAnnotation | null {
  const nodeStart = node.getStart(sourceFile);
  const prefix = sourceFile.text.slice(node.getFullStart(), nodeStart);
  return getLastSimpleAnnotationInPrefix(prefix);
}

function getAnnotationFromArrayElementText(
  elementType: ts.TypeNode,
  sourceFile: ts.SourceFile
): MutabilityAnnotation | null {
  const text = elementType.getFullText(sourceFile);
  return getLastSimpleAnnotationInPrefix(text);
}

function getLastSimpleAnnotationInPrefix(prefix: string): MutabilityAnnotation | null {
  const commentRe = /\/\*([\s\S]*?)\*\//g;
  let match: RegExpExecArray | null = null;
  let best: MutabilityAnnotation | null = null;

  while (true) {
    match = commentRe.exec(prefix);
    if (!match) {
      break;
    }
    const inner = match[1].trim();
    if (inner === "mu" || inner === "um") {
      best = inner;
    }
  }

  return best;
}

function reportExpectedAnnotation(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  node: TSESTree.Node,
  expected: MutabilityAnnotation
): void {
  context.report({
    node,
    messageId: MESSAGE_IDS.expectedAnnotation,
    data: { expected }
  });
}

function reportExpectedNone(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  node: TSESTree.Node
): void {
  context.report({
    node,
    messageId: MESSAGE_IDS.expectedNoAnnotation
  });
}

function isObjectLike(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (type.isUnion()) {
    return type.types.some((part) => isObjectLike(part, checker));
  }

  if (type.flags & ts.TypeFlags.Null) {
    return false;
  }
  if (type.flags & ts.TypeFlags.Undefined) {
    return false;
  }
  if (type.flags & ts.TypeFlags.Void) {
    return false;
  }
  if (type.flags & ts.TypeFlags.StringLike) {
    return false;
  }
  if (type.flags & ts.TypeFlags.NumberLike) {
    return false;
  }
  if (type.flags & ts.TypeFlags.BooleanLike) {
    return false;
  }
  if (type.flags & ts.TypeFlags.BigIntLike) {
    return false;
  }
  if (type.flags & ts.TypeFlags.ESSymbolLike) {
    return false;
  }

  if (type.flags & ts.TypeFlags.Any) {
    return true;
  }
  if (type.flags & ts.TypeFlags.Unknown) {
    return true;
  }
  if (type.flags & ts.TypeFlags.TypeParameter) {
    return true;
  }

  const apparent = checker.getApparentType(type);
  return (apparent.flags & ts.TypeFlags.Object) !== 0;
}

function isCheckedFile(
  sourceFile: ts.SourceFile,
  cache: Map<string, boolean>
): boolean {
  const path = sourceFile.fileName;
  const cached = cache.get(path);
  if (cached !== undefined) {
    return cached;
  }

  const text = sourceFile.text;
  const isDts = path.endsWith(".d.ts");
  const checked = isDts
    ? hasTopDirective(text, "@mu-checked")
    : !hasTopDirective(text, "@mu-nocheck");

  cache.set(path, checked);
  return checked;
}

function hasTopDirective(text: string, directive: "@mu-checked" | "@mu-nocheck"): boolean {
  const withoutBom = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const trimmedStart = withoutBom.trimStart();
  return trimmedStart.startsWith(`//${directive}`);
}