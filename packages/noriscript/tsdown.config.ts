import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts'
    },
    format: 'esm',
    outDir: 'dist',
    dts: false,
    clean: true
  },
  {
    entry: {
      transpile: 'src/transpile.ts'
    },
    format: 'esm',
    outDir: 'dist',
    dts: false,
    deps: {
      alwaysBundle: [/^@luently\/utils$/, /^@luently\/tree-squirl$/]
    }
  }
])