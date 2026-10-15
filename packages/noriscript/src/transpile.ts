import { preprocessNSX } from "./1-preprocess.ts"
import { parseNSX } from "./2-parse.ts"
import { transformNSX } from "./3-transform.ts"
import { generateTSX } from "@luently/scribe"

export function transpileNoriScript(file: string, source: string) {
  const { code, edits } = preprocessNSX(source)
  const preTree = parseNSX(file, code)
  console.log('errors', preTree.errors)
  const { ast: transformedTree } = transformNSX(preTree.program, edits)
  const generatedFile = file.replace(/\.nsx$/, '.tsx')
  const generated = generateTSX(transformedTree, {
    sourceMap: {
      sourceFile: file,
      generatedFile,
      source,
    }
  })
  console.log('===================')
  console.log(generated.code)
  console.log('===================')
  return {
    source,
    transpiled: { ast: transformedTree, code: generated.code },
    mappings: generated.mappings,
    map: generated.map,
    sourceMap: generated.map
  }
}