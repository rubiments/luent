import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import luent from '../plugins/vite-plugin-luent/dev.ts'


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
      luent(),
    ],
    define: {
      __INTERNAL__: true
    }
  }
})