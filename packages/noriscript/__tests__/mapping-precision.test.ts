import { describe, expect, it } from 'vitest'
import { parseNSX } from '../src/2-parse'
import { generateTSX } from '../../scribe/src/index'

type DecodedSegment = {
  generatedColumn: number
  sourceIndex?: number
  sourceLine?: number
  sourceColumn?: number
}

type DecodedMap = DecodedSegment[][]

function parseProgram(code: string) {
  return parseNSX('mapping-precision.nsx', code).program
}

function offsetToLineColumn(text: string, offset: number) {
  let line = 0
  let lastLineStart = 0

  for (let i = 0; i < offset; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      lastLineStart = i + 1
    }
  }

  return {
    line,
    column: offset - lastLineStart,
  }
}

function indexOrThrow(text: string, needle: string) {
  const index = text.indexOf(needle)
  if (index < 0) {
    throw new Error(`Could not find substring: ${needle}`)
  }
  return index
}

function decodeVLQ(mappings: string): DecodedMap {
  const lines = mappings.split(';')
  const decoded: DecodedMap = []

  let source = 0
  let sourceLine = 0
  let sourceColumn = 0

  for (const line of lines) {
    const segments: DecodedSegment[] = []
    let generatedColumn = 0

    if (line.length > 0) {
      const rawSegments = line.split(',')
      for (const rawSegment of rawSegments) {
        if (!rawSegment) continue
        const values = decodeSegment(rawSegment)

        generatedColumn += values[0]
        const segment: DecodedSegment = { generatedColumn }

        if (values.length >= 4) {
          source += values[1]
          sourceLine += values[2]
          sourceColumn += values[3]
          segment.sourceIndex = source
          segment.sourceLine = sourceLine
          segment.sourceColumn = sourceColumn
        }

        segments.push(segment)
      }
    }

    decoded.push(segments)
  }

  return decoded
}

function decodeSegment(segment: string) {
  const values: number[] = []
  let index = 0

  while (index < segment.length) {
    let result = 0
    let shift = 0
    let continuation = true

    while (continuation) {
      const digit = fromBase64(segment.charCodeAt(index))
      index++
      continuation = (digit & 32) !== 0
      const value = digit & 31
      result += value << shift
      shift += 5
    }

    const isNegative = (result & 1) === 1
    result >>= 1
    values.push(isNegative ? -result : result)
  }

  return values
}

function fromBase64(charCode: number) {
  if (charCode >= 65 && charCode <= 90) return charCode - 65
  if (charCode >= 97 && charCode <= 122) return charCode - 97 + 26
  if (charCode >= 48 && charCode <= 57) return charCode - 48 + 52
  if (charCode === 43) return 62
  if (charCode === 47) return 63
  throw new Error(`Invalid base64 char code: ${charCode}`)
}

function traceSourcePosition(decoded: DecodedMap, generatedLine: number, generatedColumn: number) {
  const lineSegments = decoded[generatedLine] ?? []
  let best: DecodedSegment | undefined

  for (const segment of lineSegments) {
    if (segment.generatedColumn > generatedColumn) break
    if (segment.sourceLine !== undefined && segment.sourceColumn !== undefined) {
      best = segment
    }
  }

  if (!best || best.sourceLine === undefined || best.sourceColumn === undefined) {
    throw new Error(`No source mapping for generated position ${generatedLine}:${generatedColumn}`)
  }

  return {
    line: best.sourceLine,
    column: best.sourceColumn,
  }
}

describe('generateTSX source-map precision', () => {
  it('maps member property, constructor callee, template text, and JSX text columns', () => {
    const source = [
      'foo.bar',
      'new Date()',
      'const t = `hi ${name}`',
      'const el = <div>hello</div>',
    ].join('\n')

    const result = generateTSX(parseProgram(source), {
      sourceMap: {
        sourceFile: 'mapping-precision.nsx',
        generatedFile: 'mapping-precision.tsx',
        source,
      }
    })

    expect(result.map).toBeTruthy()
    const encodedMap = result.map!
    const decoded = decodeVLQ(encodedMap.mappings)

    const cases = [
      'bar',
      'Date',
      'hi',
      'hello',
    ]

    for (const token of cases) {
      const generatedOffset = indexOrThrow(result.code, token)
      const sourceOffset = indexOrThrow(source, token)
      const generatedPosition = offsetToLineColumn(result.code, generatedOffset)
      const sourcePosition = offsetToLineColumn(source, sourceOffset)
      const traced = traceSourcePosition(decoded, generatedPosition.line, generatedPosition.column)

      expect(traced.line).toBe(sourcePosition.line)
      expect(traced.column).toBe(sourcePosition.column)
    }
  })

  it('maps operator token columns', () => {
    const source = [
      'a + b',
      'x && y',
      'z = q',
      'k in obj',
      'v instanceof C',
    ].join('\n')

    const result = generateTSX(parseProgram(source), {
      sourceMap: {
        sourceFile: 'mapping-operators.nsx',
        generatedFile: 'mapping-operators.tsx',
        source,
      }
    })

    expect(result.map).toBeTruthy()
    const encodedMap = result.map!
    const decoded = decodeVLQ(encodedMap.mappings)

    const operators = ['+', '&&', '=', 'in', 'instanceof']

    for (const operator of operators) {
      const sourceOffset = indexOrThrow(source, ` ${operator} `) + 1
      const generatedOffset = indexOrThrow(result.code, ` ${operator} `) + 1

      const sourcePosition = offsetToLineColumn(source, sourceOffset)
      const generatedPosition = offsetToLineColumn(result.code, generatedOffset)
      const traced = traceSourcePosition(decoded, generatedPosition.line, generatedPosition.column)

      expect(traced.line).toBe(sourcePosition.line)
      expect(traced.column).toBe(sourcePosition.column)
    }
  })

  it('maps computed and optional member property columns', () => {
    const source = [
      'aObj[aKey]',
      'bObj?.bProp',
      'cObj?.[cIdx]',
    ].join('\n')

    const result = generateTSX(parseProgram(source), {
      sourceMap: {
        sourceFile: 'mapping-members.nsx',
        generatedFile: 'mapping-members.tsx',
        source,
      }
    })

    expect(result.map).toBeTruthy()
    const encodedMap = result.map!
    const decoded = decodeVLQ(encodedMap.mappings)

    const propertyTokens = ['aKey', 'bProp', 'cIdx']

    for (const token of propertyTokens) {
      const generatedOffset = indexOrThrow(result.code, token)
      const sourceOffset = indexOrThrow(source, token)
      const generatedPosition = offsetToLineColumn(result.code, generatedOffset)
      const sourcePosition = offsetToLineColumn(source, sourceOffset)
      const traced = traceSourcePosition(decoded, generatedPosition.line, generatedPosition.column)

      expect(traced.line).toBe(sourcePosition.line)
      expect(traced.column).toBe(sourcePosition.column)
    }
  })

  it('maps statement keyword columns for fallback-mapped visitors', () => {
    const source = [
      'if (ok) noop()',
      'while (ok) break',
      'for (let i = 0; i < 1; i++) noop()',
      'throw err',
    ].join('\n')

    const result = generateTSX(parseProgram(source), {
      sourceMap: {
        sourceFile: 'mapping-statements.nsx',
        generatedFile: 'mapping-statements.tsx',
        source,
      }
    })

    expect(result.map).toBeTruthy()
    const encodedMap = result.map!
    const decoded = decodeVLQ(encodedMap.mappings)

    const keywords = ['if', 'while', 'for', 'throw']

    for (const keyword of keywords) {
      const generatedOffset = indexOrThrow(result.code, `${keyword} `)
      const sourceOffset = indexOrThrow(source, `${keyword} `)
      const generatedPosition = offsetToLineColumn(result.code, generatedOffset)
      const sourcePosition = offsetToLineColumn(source, sourceOffset)
      const traced = traceSourcePosition(decoded, generatedPosition.line, generatedPosition.column)

      expect(traced.line).toBe(sourcePosition.line)
      expect(traced.column).toBe(sourcePosition.column)
    }
  })
})
