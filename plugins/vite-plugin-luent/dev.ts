import { compileLuent } from '../../packages/luent-compiler/src/index.ts'
import luent from './src/index.ts'
import type { LuentPluginOptions } from './src/index.ts'

// Imported by workspace Vite configs so both files are config dependencies.
// Vite bundles and watches them; a save rebundles the config. A package-name
// import is externalized and stays cached in Node for the process.
export default function luentDev(options: LuentPluginOptions = {}) {
  return luent({ ...options, compileLuent })
}
