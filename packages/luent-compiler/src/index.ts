import { Cursor, traverse } from "@luently/tree-squirl";
import { generateTSX } from "@luently/scribe"
import { parseSync } from "oxc-parser";
import type {
  Node as ASTNode,
  CallExpression,
  ArrowFunctionExpression,
  ArrayExpression,
  Expression,
  JSXFragment,
  JSXElement,
  JSXExpression,
  JSXChild,
  IdentifierReference,
  JSXText,
  Argument,
  ArrayExpressionElement,
  JSXExpressionContainer,
  StringLiteral,
  JSXSpreadChild,
  SpreadElement
} from "oxc-parser";

type Context = { jsx: boolean }

export function compileLuent(source: string, file: string) {
  const ast = parseSync(file, source, {
    astType: 'ts',
    lang: 'tsx',
    preserveParens: true,
    sourceType: 'module'
  })

  const result = traverse(ast.program as ASTNode, { jsx: false }, {
    CallExpression(node, context) { // QUESTION: Not sure if I should allow flow expressions outside of JSX.
      if (context.jsx) transformFlowExpressions(node, this)
      this.visitChildren(node, { ...context })
    },
    JSXFragment(node, context) {
      transformJSXFragment(node, this) // transform series
      this.visitChildren(node, { ...context, jsx: true })
    },
    JSXElement(node, context) {
      transformJSXAttributes(node, this, {
        transformRenderTag: true
      })
      transformJSXSlot(node, this) // transforms series
      this.visitChildren(node, { ...context, jsx: true })
    }
  })

  return generateTSX(result.ast, {
    sourceMap: {
      sourceFile: file,
      generatedFile: file.replace(/(\.[^./]+)$/, '.virtual$1'),
      source
    }
  })
}

function transformFlowExpressions(node: CallExpression, squirl: Cursor<ASTNode, Context>) {
  const callee = node.callee
  if (callee.type !== 'Identifier') {
    return;
  }
  const name = callee.name
  if (isFlowFunction(name)) {
    FlowTransforms[name](node, squirl)
  }
  // squirl.traverse(node, {}, {
  //   CallExpression(node) {
  //     // if (visited.has(node)) return;
  //     // visited.add(node)
  //     const callee = node.callee
  //     if (callee.type !== 'Identifier') {
  //       this.visitChildren(node)
  //       return;
  //     }
  //     const name = callee.name
  //     if (isFlowFunction(name)) {
  //       FlowTransforms[name](node, this)
  //     }
  //     this.visitChildren(node)
  //   }
  // })
}



const FlowTransforms: { [key: string]: (node: CallExpression, squirl: Cursor<ASTNode, Context>) => void } = {
  If: transformFlowSlot,
  ElseIf: transformFlowSlot,
  Else: transformFlowSlot,
  Try: transformFlowSlot,
  Await: transformFlowSlot,
  Meanwhile: transformFlowSlot,
  For: transformFlowSlot,
  Portal: transformFlowSlot,
  Default: transformFlowSlot,
  As: transformFlowSlot,
  Case: (node, squirl) => {
    if (node.arguments.length > 1)
      transformFlowSlot(node, squirl)
  }
}


function isFlowFunction(name: string) {
  return name in FlowTransforms;
}

const flowSlotFragments = new Set()

function transformFlowSlot(node: CallExpression, squirl: Cursor<ASTNode, Context>) {
  const args = node.arguments
  const lastIndex = args.length - 1;
  const templateArg = args[lastIndex]
  if (t.isJSXFragment(templateArg) || t.isJSXElement(templateArg)) {
    if (t.isJSXFragment(templateArg)) flowSlotFragments.add(templateArg)
    squirl.willMutate(() => {
      args[lastIndex] = createRenderFunction(flowSlotToArrayExpression(templateArg))
    })
  }
}




function transformJSXAttributes(node: JSXElement, squirl: Cursor<ASTNode, Context>, options: { transformRenderTag?: boolean } = {}) {
  const attributes = node.openingElement.attributes;
  for (const attribute of attributes) {
    if (!t.isJSXAttribute(attribute)) continue; // Spread Attribute
    const identifier = attribute.name
    identifier.type === 'JSXNamespacedName'
    const key = t.isJSXNamespacedName(identifier) ? identifier.name.name : identifier.name
    const value = attribute.value;
    if (!value || !t.isJSXExpressionContainer(value)) continue;
    if (options.transformRenderTag) {
      const firstLetter = key[0]
      // TODO: FromTag types should require render function if attribute name is not Pascal-cased
      if (firstLetter && firstLetter.toUpperCase() === firstLetter) {
        const expression = value.expression
        if (t.isJSXElement(expression)) {
          squirl.willMutate(() => {
            attribute.value = slotToRenderFunction([expression])
          })
        }
        else if (t.isJSXFragment(expression)) {
          squirl.willMutate(() => {
            attribute.value = slotToRenderFunction(expression.children)
          })
        }
      }
    }
  }
}



function transformJSXFragment(node: JSXFragment, squirl: Cursor<ASTNode, Context>) {
  if (flowSlotFragments.has(node)) return;
  squirl.willReplace(node, slotToArrayExpression(node.children))
}

function transformJSXSlot(node: JSXElement, squirl: Cursor<ASTNode, Context>) {
  const children = node.children
  if (children.length === 0) return;
  squirl.willMutate(() => {
    node.children = [slotToRenderFunction(children)]
  })
}


function slotToRenderFunction(nodes: JSXChild[]) {
  return JSXExpressionContainer(
    createRenderFunction(
      slotToArrayExpression(nodes)
    )
  );
}

function slotToArrayExpression(nodes: JSXChild[]) {
  const array: ArrayExpressionElement[] = []
  let series: null | Expression[];
  let seriesType: null | string = null;

  function closeSeries() {
    if (series) {
      switch (seriesType) {
        case 'If':
          array.push(createIfSeries(series))
          break;

        case 'Try':
          array.push(createTrySeries(series))
          break;

        case 'As':
          array.push(createAsSeries(series)) // TODO:
          break;

        case 'Await':
          array.push(createAwaitSeries(series))
          break;

        default:
          break;
      }
      series = null;
      seriesType = null;
    }
  }

  for (const node of nodes) {
    if (t.isJSXText(node)) {
      const stringLiteral = JSXTextToStringLiteral(node)
      if (stringLiteral) {
        closeSeries()
        array.push(stringLiteral)
      }
    }
    else if (t.isJSXExpressionContainer(node)) {
      const expression = node.expression;
      if (t.isJSXEmptyExpression(expression))
        continue;
      if (isNamedCallExpression(expression)) {
        const name = expression.callee.name;
        if (name === 'If' || name === 'Try' || name === 'As' || name === 'Await') {
          closeSeries()
          seriesType = name
          series = [expression]
        }
        else if (name === 'ElseIf') {
          if (seriesType !== 'If') throw new Error(`Unexpected flow series opener: ${name}`)
          series!.push(expression)
        }
        else if (name === 'Meanwhile') {
          if (seriesType !== 'Await') throw new Error(`Unexpected flow series opener: ${name}`)
          series!.push(expression)
        }
        else if (name === 'Else') {
          if (seriesType !== 'If') throw new Error(`Unexpected flow series opener: ${name}`)
          series!.push(expression)
          closeSeries()
        }
        else if (name === 'Catch') {
          if (seriesType !== 'Await' && seriesType !== 'Try') throw new Error(`Unexpected flow series opener: ${name}`)
          series!.push(expression)
          closeSeries()
        }
        else if (name === 'Default') {
          if (seriesType !== 'As') throw new Error(`Unexpected flow series opener: ${name}`)
          series!.push(expression)
          closeSeries()
        }
        else {
          closeSeries()
          array.push(expression)
        }
        continue;
      }
      closeSeries()
      array.push(expression)
    }
    else if (t.isJSXSpreadChild(node)) {
      closeSeries()
      array.push(JSXSpreadChildToSpreadElement(node))
    }
    else {
      closeSeries()
      array.push(node)
    }
  }
  closeSeries()
  return ArrayExpression(array)
}

function JSXTextToStringLiteral(node: JSXText) {
  const value = node.value.replace(/\n\s*/g, '')
  return value === '' ? null : StringLiteral(value)
}

function JSXSpreadChildToSpreadElement(node: JSXSpreadChild): SpreadElement {
  return {
    type: 'SpreadElement',
    argument: node.expression,
    start: node.start,
    end: node.end
  }
}

function isNamedCallExpression(node: ASTNode): node is Expression & { type: 'Identifier', callee: IdentifierReference } {
  if (!t.isCallExpression(node)) return false;
  const callee = node.callee
  if (callee.type !== 'Identifier') return false;
  return true;
}


function createIfSeries(series: Expression[]) {
  return CallExpression(Identifier('_$$IfSeries'), [ArrayExpression(series)])
}

function createTrySeries(series: Expression[]) {
  return CallExpression(Identifier('_$$TrySeries'), series)
}

function createAsSeries(series: Expression[]) {
  return CallExpression(Identifier('_$$AsSeries'), series)
}

function createAwaitSeries(series: Expression[]) {
  return CallExpression(Identifier('_$$AwaitSeries'), [ArrayExpression(series)])
}



const t = {
  isJSXFragment: (node: ASTNode) => node.type === 'JSXFragment',
  isJSXElement: (node: ASTNode) => node.type === 'JSXElement',
  isJSXSpreadChild: (node: ASTNode) => node.type === 'JSXSpreadChild',
  isArrayExpression: (node: ASTNode) => node.type === 'ArrayExpression',
  isCallExpression: (node: ASTNode) => node.type === 'CallExpression',
  isSequenceExpression: (node: ASTNode) => node.type === 'SequenceExpression',
  isJSXExpressionContainer: (node: ASTNode) => node.type === 'JSXExpressionContainer',
  isJSXAttribute: (node: ASTNode) => node.type === 'JSXAttribute',
  isJSXNamespacedName: (node: ASTNode) => node.type === 'JSXNamespacedName',
  isJSXText: (node: ASTNode) => node.type === 'JSXText',
  isJSXEmptyExpression: (node: ASTNode) => node.type === 'JSXEmptyExpression'
}

function CallExpression(callee: Expression, args: Argument[]): CallExpression {
  return {
    type: 'CallExpression',
    arguments: args,
    callee,
    start: NaN,
    end: NaN,
    optional: false
  }
}

function Identifier(name: string): IdentifierReference {
  return {
    type: 'Identifier',
    name,
    start: NaN,
    end: NaN
  }
}

function ArrayExpression(elements: ArrayExpressionElement[]): ArrayExpression {
  return {
    type: 'ArrayExpression',
    elements,
    start: NaN,
    end: NaN
  }
}

function JSXExpressionContainer(expression: JSXExpression): JSXExpressionContainer {
  return {
    type: 'JSXExpressionContainer',
    expression,
    start: NaN,
    end: NaN
  }
}

function StringLiteral(value: string): StringLiteral {
  return {
    type: 'Literal',
    value,
    raw: JSON.stringify(value),
    start: NaN,
    end: NaN
  }
}


function createRenderFunction(body: ArrayExpression | JSXFragment): ArrowFunctionExpression {
  return {
    type: 'ArrowFunctionExpression',
    expression: true,
    async: false,
    generator: false,
    id: null,
    params: [],
    body,
    start: NaN, // QUESTION: not sure if I should use node.start
    end: NaN
  }
}


function flowSlotToArrayExpression(node: Expression): ArrayExpression {
  if (t.isArrayExpression(node)) return node;
  if (t.isJSXFragment(node)) {
    return slotToArrayExpression(node.children);
  }
  if (t.isSequenceExpression(node)) {
    const expression = node.expressions.at(-1)
    if (!expression) throw new Error('Invalid Node: Empty sequence expression')
    return flowSlotToArrayExpression(expression)
  }
  return {
    type: 'ArrayExpression',
    elements: [node],
    start: NaN,
    end: NaN
  }
}