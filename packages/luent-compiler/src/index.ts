import { Cursor, traverse } from "@luently/tree-squirl";
import { parseSync } from "oxc-parser";
import type {
  Node as ASTNode,
  CallExpression,
  ArrowFunctionExpression,
  ArrayExpression,
  Expression,
  SequenceExpression,
  JSXFragment,
  JSXElement,
  JSXAttribute,
  JSXExpression
} from "oxc-parser";

type Context = {}

export function compileLuent(source: string, file: string) {

  const ast = parseSync(file, source, {
    astType: 'ts',
    lang: 'tsx',
    preserveParens: true,
    sourceType: 'module'
  })

  return traverse(ast.program as ASTNode, {}, {
    CallExpression(node) {
      transformFlowExpressions(node, this)
    },
    JSXFragment(node) {
      transformFlowExpressions(node, this)
      transformJSXFragment(node) // transform series
    },
    JSXElement(node) {
      transformFlowExpressions(node, this)
      transformJSXAttributes(node, this, {
        transformRenderTag: true
      })
      transformJSXSlot(node) // transforms series
    }
  })
}

function transformFlowExpressions(node: ASTNode, cursor: Cursor<ASTNode, Context>) {

  traverse(node, {}, {
    CallExpression(node) {
      const callee = node.callee
      if (callee.type !== 'Identifier') return;
      const name = callee.name
      if (isFlowFunction(name)) {
        FlowTransforms[name](node, cursor)
      }
    }
  })
}



const FlowTransforms: { [key: string]: (node: CallExpression, cursor: Cursor<ASTNode, Context>) => void } = {
  If: transformFlowSlot,
  ElseIf: transformFlowSlot,
  Else: transformFlowSlot,
  Try: transformFlowSlot,
  Await: transformFlowSlot,
  Awaits: transformFlowSlot,
  Meanwhile: transformFlowSlot,
  For: transformFlowSlot,
  Portal: transformFlowSlot,
  Default: transformFlowSlot,
  As: transformFlowSlot,
  Case: (node, cursor) => {
    if (node.arguments.length > 1)
      transformFlowSlot(node, cursor)
  }
}


function isFlowFunction(name: string) {
  return name in FlowTransforms;
}

function transformFlowSlot(node: CallExpression, cursor: Cursor<ASTNode, Context>) {
  const args = node.arguments
  const lastIndex = args.length - 1;
  const templateArg = args[lastIndex]
  if (t.isJSXFragment(templateArg) || t.isJSXElement(templateArg)) {
    cursor.willMutate(() => {
      args[lastIndex] = createRenderFunction(templateArg)
    })
  }
}

const t = {
  isJSXFragment: (node: ASTNode) => node.type === 'JSXFragment',
  isJSXElement: (node: ASTNode) => node.type === 'JSXElement',
  isArrayExpression: (node: ASTNode) => node.type === 'ArrayExpression',
  isCallExpression: (node: ASTNode) => node.type === 'CallExpression',
  isSequenceExpression: (node: ASTNode) => node.type === 'SequenceExpression',
  isJSXExpressionContainer: (node: ASTNode) => node.type === 'JSXExpressionContainer',
  isJSXAttribute: (node: ASTNode) => node.type === 'JSXAttribute',
  isJSXNamespacedName: (node: ASTNode) => node.type === 'JSXNamespacedName',
  isJSXText: (node: ASTNode) => node.type = 'JSXText',
  isJSXEmptyExpression: (node: ASTNode) => node.type === 'JSXEmptyExpression'
}

function createRenderFunction(node: Expression): ArrowFunctionExpression {
  return {
    type: 'ArrowFunctionExpression',
    expression: true,
    async: false,
    generator: false,
    id: null,
    params: [],
    body: toArrayExpression(node),
    start: NaN, // QUESTION: not sure if I should use node.start
    end: NaN
  }
}


function toArrayExpression(node: Expression): ArrayExpression | JSXFragment {
  if (t.isArrayExpression(node)) return node;
  if (t.isJSXFragment(node)) return node;
  if (t.isSequenceExpression(node)) {
    const expression = node.expressions.at(-1)
    if (!expression) throw new Error('Invalid Node: Empty sequence expression')
    return toArrayExpression(expression)
  }
  return {
    type: 'ArrayExpression',
    elements: [node],
    start: NaN,
    end: NaN
    // TODO: I need to mark as visited so it doesn't get transformed.
  }
}


function transformJSXAttributes(node: JSXElement, cursor: Cursor<ASTNode, Context>, options: { transformRenderTag?: boolean } = {}) {
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
        if (t.isJSXElement(value.expression)) {
          cursor.willMutate(() => {
            attribute.value = transformChildrenToRenderFunction([attribute.get('value.expression')])
          })
        }
        else if (t.isJSXFragment(value.expression)) {
          cursor.willMutate(() => {
            attribute.value = transformChildrenToRenderFunction(attribute.get('value.expression.children'))
          })
        }
      }
    }
  }
}



function transformJSXFragment(path) {
  const children = path.get('children')
  //  transformJSXChildren(children)
  path.replaceWith(transformJSXChildrenToArrayExpression(children))
}

function transformJSXSlot(path) {
  const children = path.get('children')
  if (children.length === 0) return;
  //  transformJSXChildren(children)
  path.node.children = [transformChildrenToRenderFunction(children)]
}


function transformChildrenToRenderFunction(paths) {
  return t.jsxExpressionContainer(
    t.arrowFunctionExpression(
      [],
      transformJSXChildrenToArrayExpression(paths)
    ));
}




function transformJSXChildrenToArrayExpression(nodes: ASTNode[]) {
  const array = []
  let series: null | JSXExpression[];
  let seriesType: null | string;

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
    if (t.isJSXExpressionContainer(node) && isIfSeriesElement(node.expression)) {
      if (node.expression.callee.name === 'If') {
        closeSeries()
        seriesType = 'If'
        series = [node.expression]
      }
      else if (node.expression.callee.name === 'Else') {
        series.push(node.expression)
        closeSeries()
      }
      else {
        series.push(node.expression)
      }
    }
    else if (t.isJSXExpressionContainer(node) && isAsSeriesElement(node.expression, seriesType)) {
      if (node.expression.callee.name === 'As') {
        closeSeries()
        seriesType = 'As'
        series = [node.expression]
      }
      else if (node.expression.callee.name === 'Default') {
        series.push(node.expression)
        closeSeries()
      }
    }
    else if (t.isJSXExpressionContainer(node) && isTrySeriesElement(node.expression, seriesType)) {
      if (node.expression.callee.name === 'Try') {
        closeSeries()
        seriesType = 'Try'
        series = [node.expression]
      }
      else if (node.expression.callee.name === 'Catch') {
        series.push(node.expression)
        closeSeries()
      }
    }
    else if (t.isJSXExpressionContainer(node) && isAwaitSeriesElement(node.expression, seriesType)) {
      if (node.expression.callee.name === 'Await'/*  || node.expression.callee.name === 'Awaits' */) {
        closeSeries()
        seriesType = node.expression.callee.name
        series = [node.expression]
      }
      else if (node.expression.callee.name === 'Catch') {
        series.push(node.expression)
        closeSeries()
      }
      else {
        series.push(node.expression)
      }
    }
    else if (t.isJSXText(node)) {
      const stringLiteral = transformJSXText(node)
      if (stringLiteral) {
        closeSeries()
        array.push(stringLiteral)
      }
    }
    else if (t.isJSXExpressionContainer(node)) {
      const expression = node.expression;
      if (t.isJSXEmptyExpression(expression))
        continue;
      closeSeries()
      array.push(expression)
    }
    else {
      closeSeries()
      array.push(node)
    }
  }
  closeSeries()
  const arrayExpression = t.arrayExpression(array)
  arrayExpression.visited = true;
  return arrayExpression
}

function transformJSXText(node) {
  const value = node.value.replace(/\n\s*/g, '')
  return value === '' ? null : t.stringLiteral(value)
}


const conditionalStatements = {
  If: true,
  ElseIf: true,
  Else: true
}


function isIfSeriesElement(node) {
  return t.isCallExpression(node) && node.callee.name in conditionalStatements
}

function isTrySeriesElement(node, seriesType) {
  return t.isCallExpression(node) && (node.callee.name === 'Try' || node.callee.name === 'Catch' && seriesType === 'Try')
}

function isAsSeriesElement(node, seriesType) {
  return t.isCallExpression(node) && (node.callee.name === 'As' || node.callee.name === 'Default' && seriesType === 'As')
}

function isAwaitSeriesElement(node, seriesType) {
  return t.isCallExpression(node) && (
    node.callee.name === 'Await'
    // || node.callee.name === 'Awaits'
    || node.callee.name === 'Meanwhile'
    || node.callee.name === 'Twiddle'
    || node.callee.name === 'Catch' && seriesType === 'Await'
  )
}


function createIfSeries(series) {
  return t.callExpression(t.identifier('_$$IfSeries'), [t.arrayExpression(series)])
}

function createTrySeries(series) {
  return t.callExpression(t.identifier('_$$TrySeries'), series)
}

function createAsSeries(series) {
  return t.callExpression(t.identifier('_$$AsSeries'), series)
}

function createAwaitSeries(series) {
  return t.callExpression(t.identifier('_$$AwaitSeries'), [t.arrayExpression(series)])
}
