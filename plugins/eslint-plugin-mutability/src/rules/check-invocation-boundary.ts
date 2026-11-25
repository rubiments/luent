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
  nested: PackExpectation[];
};

type TupleExpectation = {
  index: number;
  expectation: Expectation;
};

type ThisThatKey = "this" | "that";

type ThisThatAnnotation = {
  escaped: boolean;
  range: [number, number];
};

type CallbackParameterInfo = {
  entries: Array<{ expectation: Expectation; node: TSESTree.Node | null }>;
  thisThat: Partial<Record<ThisThatKey, ThisThatAnnotation>>;
};

const MUTABILITY_COMMENT_RE = /^(mu|um)$/;
const THIS_MUTABILITY_COMMENT_RE = /\/\*(mu|um):this\*\//g;

const MESSAGE_IDS = {
  expectedAnnotation: "expectedAnnotation",
  expectedNoAnnotation: "expectedNoAnnotation",
  incompatibleMutabilityAnnotation: "incompatibleMutabilityAnnotation",
  expectedPackPropertyAnnotation: "expectedPackPropertyAnnotation",
  expectedTupleIndexAnnotation: "expectedTupleIndexAnnotation"
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
        "Expected no mutability annotation for this argument.",
      incompatibleMutabilityAnnotation:
        "Incompatible mutability annotation for this argument.",
      expectedPackPropertyAnnotation:
        "Expected mutability annotation /*{{expected}}*/ for `{{key}}` property in this argument.",
      expectedTupleIndexAnnotation:
        "Expected mutability annotation /*{{expected}}*/ for index {{index}} of this argument."
    }
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const sourceCode = context.sourceCode;
    const fileCheckCache = new Map<string, boolean>();

    const validateSignatureArguments = (
      signature: TsSignatureLike,
      argumentsList: readonly TSESTree.CallExpressionArgument[]
    ): void => {
      for (let i = 0; i < argumentsList.length; i += 1) {
        const argument = argumentsList[i];
        const parameter = getParameterSymbol(signature, i);
        if (!parameter) {
          continue;
        }

        const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0];
        if (!declaration || !isCheckedFile(declaration.getSourceFile(), fileCheckCache)) {
          continue;
        }

        const expectation = getParameterExpectation(declaration, services, sourceCode);
        validateCallbackArgumentParameterAnnotations(
          context,
          sourceCode,
          checker,
          services,
          declaration,
          argument,
          fileCheckCache
        );

        if (expectation !== "none") {
          validateArgument(
            context,
            sourceCode,
            checker,
            services,
            argument,
            expectation
          );
          continue;
        }

        const packExpectations = getPackExpectationsFromDeclaration(
          declaration,
          services,
          sourceCode
        );
        if (packExpectations.length > 0) {
          if (argument.type === "ObjectExpression") {
            validatePackArgument(
              context,
              sourceCode,
              argument,
              packExpectations,
              checker,
              services
            );
          } else {
            reportMissingPackExpectation(context, argument, packExpectations);
          }
          continue;
        }

        const tupleExpectations = getTupleExpectationsFromDeclaration(
          declaration,
          services,
          sourceCode
        );
        if (tupleExpectations.length > 0) {
          if (argument.type === "ArrayExpression") {
            validateTupleArgument(
              context,
              sourceCode,
              argument,
              tupleExpectations,
              checker,
              services
            );
          } else {
            reportMissingTupleExpectation(context, argument, tupleExpectations);
          }
          continue;
        }

        validateArgument(
          context,
          sourceCode,
          checker,
          services,
          argument,
          expectation
        );
      }
    };

    const checkInvocation = (node: TSESTree.CallExpression | TSESTree.NewExpression): void => {
      if (node.type === "CallExpression") {
        const applyOrCall = getApplyOrCallTargetSignature(node, checker, services);
        if (applyOrCall) {
          const thisExpectation = getThisExpectation(
            applyOrCall.signature,
            services,
            sourceCode,
            fileCheckCache
          );
          const thisArgument = node.arguments[0];
          if (thisArgument) {
            validateArgument(
              context,
              sourceCode,
              checker,
              services,
              thisArgument,
              thisExpectation
            );
          }

          if (applyOrCall.kind === "call") {
            validateSignatureArguments(
              applyOrCall.signature,
              node.arguments.slice(1)
            );
            return;
          }

          const applyArguments = node.arguments[1];
          if (applyArguments?.type === "ArrayExpression") {
            const callArgs: TSESTree.CallExpressionArgument[] = [];
            for (const element of applyArguments.elements) {
              if (!element) {
                continue;
              }
              callArgs.push(
                (element.type === "SpreadElement" ? element.argument : element) as
                  TSESTree.CallExpressionArgument
              );
            }
            validateSignatureArguments(applyOrCall.signature, callArgs);
          }
          return;
        }
      }

      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const signature = checker.getResolvedSignature(tsNode);
      if (!signature) {
        return;
      }

      validateSignatureArguments(signature, node.arguments);
    };

    return {
      CallExpression: checkInvocation,
      NewExpression: checkInvocation
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
    reportNestedAnnotationsWhenNoExpectation(context, sourceCode, argument);
    return;
  }

  if (!annotation) {
    reportExpectedAnnotation(context, argument, expectation);
    reportNestedAnnotationsWhenNoExpectation(context, sourceCode, argument);
    return;
  }

  if (annotation.annotation !== expectation) {
    reportExpectedAnnotation(context, argument, expectation);
  }

  reportNestedAnnotationsWhenNoExpectation(context, sourceCode, argument);
}

function validateTupleArgument(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  argument: TSESTree.ArrayExpression,
  tupleExpectations: TupleExpectation[],
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices
): void {
  const expectationByIndex = new Map<number, Expectation>();
  for (const entry of tupleExpectations) {
    expectationByIndex.set(entry.index, entry.expectation);
  }

  for (let i = 0; i < argument.elements.length; i += 1) {
    const element = argument.elements[i];
    if (!element) {
      continue;
    }

    const expected = expectationByIndex.get(i) ?? "none";
    const annotation = getNearestDirectPrefixAnnotation(sourceCode, element);
    const tsNode = services.esTreeNodeToTSNodeMap.get(element as never);
    const objectLike = isObjectLike(checker.getTypeAtLocation(tsNode), checker);

    if (!objectLike) {
      if (annotation) {
        reportExpectedNone(context, element);
      }
      continue;
    }

    if (expected === "none") {
      if (annotation) {
        reportExpectedNone(context, element);
      }
      continue;
    }

    if (!annotation || annotation.annotation !== expected) {
      reportExpectedAnnotation(context, element, expected);
    }
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
  const nestedExpectationsByKey = new Map<string, PackExpectation[]>();
  for (const entry of packExpectations) {
    expectationsByKey.set(entry.key, entry.expectation);
    nestedExpectationsByKey.set(entry.key, entry.nested);
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

    const nestedExpectations = nestedExpectationsByKey.get(key) ?? [];
    if (expected === "none") {
      if (annotation) {
        reportExpectedNone(context, property.key);
      }
    } else if (!annotation || annotation.annotation !== expected) {
      reportExpectedAnnotation(context, property.key, expected);
    }

    if (nestedExpectations.length === 0) {
      continue;
    }

    if (property.value.type === "ObjectExpression") {
      validatePackArgument(
        context,
        sourceCode,
        property.value,
        nestedExpectations,
        checker,
        services
      );
    } else {
      reportMissingPackExpectation(context, property.value, nestedExpectations);
    }
  }
}

function reportNestedAnnotationsWhenNoExpectation(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  argument: TSESTree.CallExpressionArgument
): void {
  if (argument.type === "ObjectExpression") {
    for (const property of argument.properties) {
      if (property.type !== "Property") {
        continue;
      }
      const annotation = getNearestDirectPrefixAnnotation(sourceCode, property.key);
      if (annotation) {
        reportExpectedNone(context, property.key);
      }
    }
    return;
  }

  if (argument.type === "ArrayExpression") {
    for (const element of argument.elements) {
      if (!element) {
        continue;
      }
      const annotation = getNearestDirectPrefixAnnotation(sourceCode, element);
      if (annotation) {
        reportExpectedNone(context, element);
      }
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

    const match = MUTABILITY_COMMENT_RE.exec(comment.value);
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

function getApplyOrCallTargetSignature(
  node: TSESTree.CallExpression,
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices
): { kind: "apply" | "call"; signature: TsSignatureLike } | null {
  if (node.callee.type !== "MemberExpression" || node.callee.computed) {
    return null;
  }

  if (node.callee.property.type !== "Identifier") {
    return null;
  }

  const kind = node.callee.property.name;
  if (kind !== "apply" && kind !== "call") {
    return null;
  }

  const targetTsNode = services.esTreeNodeToTSNodeMap.get(node.callee.object as never);
  const targetType = checker.getTypeAtLocation(targetTsNode);
  const signatures = checker.getSignaturesOfType(targetType, ts.SignatureKind.Call);
  const signature = signatures[0];
  if (!signature) {
    return null;
  }

  return {
    kind,
    signature
  };
}

function getThisExpectation(
  signature: TsSignatureLike,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>,
  fileCheckCache: Map<string, boolean>
): Expectation {
  const thisParameter = signature.thisParameter;
  if (thisParameter) {
    const declaration = thisParameter.valueDeclaration ?? thisParameter.declarations?.[0];
    if (!declaration || !isCheckedFile(declaration.getSourceFile(), fileCheckCache)) {
      return "none";
    }
    return getParameterExpectation(declaration, services, sourceCode);
  }

  const declaration = signature.getDeclaration();
  if (!declaration || !isCheckedFile(declaration.getSourceFile(), fileCheckCache)) {
    return "none";
  }

  return getDeclarationThisExpectation(declaration);
}

function getDeclarationThisExpectation(declaration: ts.SignatureDeclaration): Expectation {
  const sourceFile = declaration.getSourceFile();
  let headerEnd = declaration.end;
  if (declaration.parameters.length > 0) {
    headerEnd = declaration.parameters[0].getStart(sourceFile);
  } else if ("body" in declaration && declaration.body) {
    headerEnd = declaration.body.getStart(sourceFile);
  }

  const header = sourceFile.text.slice(
    declaration.getStart(sourceFile),
    headerEnd
  );

  let match: RegExpExecArray | null = null;
  let last: MutabilityAnnotation | null = null;
  while (true) {
    match = THIS_MUTABILITY_COMMENT_RE.exec(header);
    if (!match) {
      break;
    }
    last = match[1] as MutabilityAnnotation;
  }
  THIS_MUTABILITY_COMMENT_RE.lastIndex = 0;

  return last ?? "none";
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

  return getPackExpectationsFromTypeLiteral(
    declaration.type,
    declaration.getSourceFile(),
    services,
    sourceCode
  );
}

function getPackExpectationsFromTypeLiteral(
  typeLiteral: ts.TypeLiteralNode,
  sourceFile: ts.SourceFile,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>
): PackExpectation[] {
  const expectations: PackExpectation[] = [];
  for (const member of typeLiteral.members) {
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
        "none",
      nested: getNestedPackExpectations(member.type, sourceFile, services, sourceCode)
    });
  }

  return expectations;
}

function getNestedPackExpectations(
  typeNode: ts.TypeNode | undefined,
  sourceFile: ts.SourceFile,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>
): PackExpectation[] {
  if (!typeNode) {
    return [];
  }

  const nestedTypeLiteral = unwrapTypeLiteralNode(typeNode);
  if (!nestedTypeLiteral) {
    return [];
  }

  return getPackExpectationsFromTypeLiteral(
    nestedTypeLiteral,
    sourceFile,
    services,
    sourceCode
  );
}

function getTupleExpectationsFromDeclaration(
  declaration: ts.Declaration,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>
): TupleExpectation[] {
  if (!ts.isParameter(declaration) || !declaration.type) {
    return [];
  }

  const tupleType = unwrapTupleTypeNode(declaration.type);
  if (!tupleType) {
    return [];
  }

  const sourceFile = declaration.getSourceFile();
  const expectations: TupleExpectation[] = [];

  for (let i = 0; i < tupleType.elements.length; i += 1) {
    const element = tupleType.elements[i];
    const target =
      ts.isNamedTupleMember(element)
        ? element.type
        : element;

    const expectation =
      getAnnotationFromTsNode(target, services, sourceCode) ??
      getTsNodeDirectPrefixAnnotation(target, sourceFile) ??
      "none";

    expectations.push({ index: i, expectation });
  }

  return expectations.some((entry) => entry.expectation !== "none")
    ? expectations
    : [];
}

function unwrapTupleTypeNode(typeNode: ts.TypeNode): ts.TupleTypeNode | null {
  if (ts.isTupleTypeNode(typeNode)) {
    return typeNode;
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return unwrapTupleTypeNode(typeNode.type);
  }

  if (
    ts.isTypeOperatorNode(typeNode) &&
    typeNode.operator === ts.SyntaxKind.ReadonlyKeyword
  ) {
    return unwrapTupleTypeNode(typeNode.type);
  }

  return null;
}

function unwrapTypeLiteralNode(typeNode: ts.TypeNode): ts.TypeLiteralNode | null {
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode;
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return unwrapTypeLiteralNode(typeNode.type);
  }

  return null;
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
    const inner = match[1];
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

function reportIncompatibleMutabilityAnnotation(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  node: TSESTree.Node
): void {
  context.report({
    node,
    messageId: MESSAGE_IDS.incompatibleMutabilityAnnotation
  });
}

function reportMissingPackExpectation(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  node: TSESTree.Node,
  expectations: PackExpectation[]
): void {
  const missing = expectations.find((entry) => entry.expectation !== "none");
  if (!missing) {
    return;
  }

  context.report({
    node,
    messageId: MESSAGE_IDS.expectedPackPropertyAnnotation,
    data: { expected: missing.expectation, key: missing.key }
  });
}

function reportMissingTupleExpectation(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  node: TSESTree.Node,
  expectations: TupleExpectation[]
): void {
  const missing = expectations.find((entry) => entry.expectation !== "none");
  if (!missing) {
    return;
  }

  context.report({
    node,
    messageId: MESSAGE_IDS.expectedTupleIndexAnnotation,
    data: { expected: missing.expectation, index: `${missing.index + 1}` }
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

function validateCallbackArgumentParameterAnnotations(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices,
  expectedParameterDeclaration: ts.Declaration,
  argument: TSESTree.CallExpressionArgument,
  fileCheckCache: Map<string, boolean>
): void {
  validateCallbackArgumentAgainstExpectedNode(
    context,
    sourceCode,
    checker,
    services,
    expectedParameterDeclaration,
    argument,
    fileCheckCache
  );

  validateCallbackArgumentParameterPackAnnotations(
    context,
    sourceCode,
    checker,
    services,
    expectedParameterDeclaration,
    argument,
    fileCheckCache
  );
}

function validateCallbackArgumentAgainstExpectedNode(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices,
  expectedNode: ts.Node,
  argument: TSESTree.Node,
  fileCheckCache: Map<string, boolean>
): void {
  const expectedInfo = getCallbackParameterInfo(
    checker,
    services,
    sourceCode,
    expectedNode,
    fileCheckCache
  );
  if (!expectedInfo) {
    return;
  }

  const argumentTsNode = services.esTreeNodeToTSNodeMap.get(argument as never);
  const providedInfo = getCallbackParameterInfo(
    checker,
    services,
    sourceCode,
    argumentTsNode,
    fileCheckCache
  );
  if (!providedInfo) {
    return;
  }

  validateCallbackParameterCompatibility(
    context,
    sourceCode,
    argument,
    expectedInfo,
    providedInfo
  );
}

function validateCallbackParameterCompatibility(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  fallbackNode: TSESTree.Node,
  expectedInfo: CallbackParameterInfo,
  providedInfo: CallbackParameterInfo
): void {
  const count = Math.min(expectedInfo.entries.length, providedInfo.entries.length);
  for (let i = 0; i < count; i += 1) {
    const expected = expectedInfo.entries[i];
    const provided = providedInfo.entries[i];
    if (!provided || !expected) {
      continue;
    }

    if (provided.expectation === "none") {
      continue;
    }

    if (expected.expectation === "none") {
      reportExpectedNone(context, provided.node ?? fallbackNode);
      continue;
    }

    if (
      expected.expectation === "um" &&
      provided.expectation === "mu"
    ) {
      reportIncompatibleMutabilityAnnotation(context, provided.node ?? fallbackNode);
    }
  }

  validateThisThatCompatibility(
    context,
    sourceCode,
    expectedInfo.thisThat,
    providedInfo.thisThat
  );
}

function validateCallbackArgumentParameterPackAnnotations(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices,
  expectedParameterDeclaration: ts.Declaration,
  argument: TSESTree.Node,
  fileCheckCache: Map<string, boolean>
): void {
  if (
    !ts.isParameter(expectedParameterDeclaration) ||
    !expectedParameterDeclaration.type ||
    argument.type !== "ObjectExpression"
  ) {
    return;
  }

  const typeLiteral = unwrapTypeLiteralNode(expectedParameterDeclaration.type);
  if (!typeLiteral) {
    return;
  }

  validateCallbackArgumentParameterPackTypeLiteral(
    context,
    sourceCode,
    checker,
    services,
    typeLiteral,
    argument,
    fileCheckCache
  );
}

function validateCallbackArgumentParameterPackTypeLiteral(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices,
  typeLiteral: ts.TypeLiteralNode,
  argument: TSESTree.ObjectExpression,
  fileCheckCache: Map<string, boolean>
): void {
  const propertiesByKey = new Map<string, TSESTree.Property>();
  for (const property of argument.properties) {
    if (property.type !== "Property") {
      continue;
    }
    const key = getObjectPropertyName(property);
    if (!key) {
      continue;
    }
    propertiesByKey.set(key, property);
  }

  for (const member of typeLiteral.members) {
    if (!ts.isPropertySignature(member) || !member.type) {
      continue;
    }

    const key = getTsPropertyName(member.name);
    if (!key) {
      continue;
    }

    const property = propertiesByKey.get(key);
    if (!property) {
      continue;
    }

    validateCallbackArgumentAgainstExpectedNode(
      context,
      sourceCode,
      checker,
      services,
      member.type,
      property.value,
      fileCheckCache
    );

    if (property.value.type !== "ObjectExpression") {
      continue;
    }

    const nestedTypeLiteral = unwrapTypeLiteralNode(member.type);
    if (!nestedTypeLiteral) {
      continue;
    }

    validateCallbackArgumentParameterPackTypeLiteral(
      context,
      sourceCode,
      checker,
      services,
      nestedTypeLiteral,
      property.value,
      fileCheckCache
    );
  }
}

function validateThisThatCompatibility(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  expected: Partial<Record<ThisThatKey, ThisThatAnnotation>>,
  provided: Partial<Record<ThisThatKey, ThisThatAnnotation>>
): void {
  const hasExpectedThisThat = Boolean(expected.this || expected.that);

  for (const key of ["this", "that"] as const) {
    const providedAnnotation = provided[key];
    if (!providedAnnotation || providedAnnotation.escaped) {
      continue;
    }

    const expectedAnnotation = expected[key];
    if (expectedAnnotation && !expectedAnnotation.escaped) {
      continue;
    }

    if (hasExpectedThisThat) {
      reportIncompatibleMutabilityAnnotationAtRange(
        context,
        sourceCode,
        providedAnnotation.range
      );
      return;
    }

    reportExpectedNoneAtRange(
      context,
      sourceCode,
      providedAnnotation.range
    );
    return;
  }
}

function getCallbackParameterInfo(
  checker: ts.TypeChecker,
  services: ESLintUtils.ParserServices,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: ts.Node,
  fileCheckCache: Map<string, boolean>
): CallbackParameterInfo | null {
  const type = checker.getTypeAtLocation(node);
  const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
  const signature = signatures[0];
  if (!signature) {
    return null;
  }

  const entries: Array<{ expectation: Expectation; node: TSESTree.Node | null }> = [];
  for (const symbol of signature.getParameters()) {
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration || !ts.isParameter(declaration)) {
      entries.push({ expectation: "none", node: null });
      continue;
    }

    if (!isCheckedFile(declaration.getSourceFile(), fileCheckCache)) {
      entries.push({ expectation: "none", node: null });
      continue;
    }

    const estreeNode = services.tsNodeToESTreeNodeMap.has(declaration.name)
      ? services.tsNodeToESTreeNodeMap.get(declaration.name as never)
      : null;

    entries.push({
      expectation: getParameterExpectation(declaration, services, sourceCode),
      node: estreeNode
    });
  }

  const declaration = signature.getDeclaration();
  const thisThat = declaration
    ? getThisThatAnnotationFromDeclarationHeader(declaration)
    : {};

  return { entries, thisThat };
}

function getThisThatAnnotationFromDeclarationHeader(
  declaration: ts.SignatureDeclaration
): Partial<Record<ThisThatKey, ThisThatAnnotation>> {
  const sourceFile = declaration.getSourceFile();
  const headerStart = declaration.getStart(sourceFile);
  const headerEnd =
    "body" in declaration && declaration.body
      ? declaration.body.getStart(sourceFile)
      : declaration.end;

  const header = sourceFile.text.slice(headerStart, headerEnd);
  const commentRe = /\/\*([\s\S]*?)\*\//g;
  const thisThat: Partial<Record<ThisThatKey, ThisThatAnnotation>> = {};
  let match: RegExpExecArray | null = null;

  while (true) {
    match = commentRe.exec(header);
    if (!match) {
      break;
    }

    const inner = match[1];
    if (!inner.startsWith("mu:")) {
      continue;
    }

    const tokens = inner.slice(3);
    const tokenRe = /(this!?|that!?)/g;
    let tokenMatch: RegExpExecArray | null = null;
    while (true) {
      tokenMatch = tokenRe.exec(tokens);
      if (!tokenMatch) {
        break;
      }

      const raw = tokenMatch[1];
      const key = raw.startsWith("this") ? "this" : "that";
      const escaped = raw.endsWith("!");
      const start =
        headerStart +
        match.index +
        2 +
        3 +
        tokenMatch.index;
      const end = start + key.length;

      thisThat[key] = {
        escaped,
        range: [start, end]
      };
    }
  }

  return thisThat;
}

function reportExpectedNoneAtRange(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  range: [number, number]
): void {
  context.report({
    loc: {
      start: sourceCode.getLocFromIndex(range[0]),
      end: sourceCode.getLocFromIndex(range[1])
    },
    messageId: MESSAGE_IDS.expectedNoAnnotation
  });
}

function reportIncompatibleMutabilityAnnotationAtRange(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  range: [number, number]
): void {
  context.report({
    loc: {
      start: sourceCode.getLocFromIndex(range[0]),
      end: sourceCode.getLocFromIndex(range[1])
    },
    messageId: MESSAGE_IDS.incompatibleMutabilityAnnotation
  });
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