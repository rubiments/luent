import { preprocessNSX } from "./1-preprocess.ts"
import { parseNSX } from "./2-parse.ts"
import { transformNSX } from "./3-transform.ts"
import { generateTSX } from "@luently/scribe"
import { codeMappingsToSourceMap } from "./sourceMap.ts"

export function transpileNoriScript(file: string, source: string) {
  const { code, edits } = preprocessNSX(source)
  const preTree = parseNSX(file, code)
  console.log('errors', preTree.errors)
  const { ast: transformedTree } = transformNSX(preTree.program, edits)
  const generated = generateTSX(transformedTree)
  const generatedFile = file.replace(/\.nsx$/, '.tsx')
  const sourceMap = codeMappingsToSourceMap(file, generatedFile, source, generated.code, generated.map)
  console.log('===================')
  console.log(generated.code)
  console.log('===================')
  return {
    source,
    transpiled: { ast: transformedTree, code: generated.code },
    map: generated.map,
    sourceMap
  }
}