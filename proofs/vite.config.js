import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import luent from '../plugins/vite-plugin-luent/src/index.ts'


export default defineConfig(() => {
  return {
    oxc: {
      charset: 'utf8',
      jsx: {
        throwIfNamespace: false,
      },
    },
    server: {
      fs: {
        cachedChecks: false
      }
    },
    plugins: [
      tailwindcss(),
      luent({ useWorkspace: true }),
    ],
    define: {
      __INTERNAL__: true
    }
  }
})