import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts'
  },
  format: 'esm',
  outDir: 'dist',
  dts: false,
  clean: false,
  deps: {
    // Bundle workspace TS deps to avoid executing raw TypeScript via Node during Vite config load.
    alwaysBundle: [/^@luently\/utils$/, /^@luently\/tree-squirl$/, /^@luently\/scribe$/]
  }
})
