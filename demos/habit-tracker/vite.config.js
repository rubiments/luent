import { defineConfig } from 'vite'
import luent from '../../plugins/vite-plugin-luent/dev.ts'


export default defineConfig(async () => {

  return {
    oxc: {
      charset: 'utf8',
    },
    server: {
      fs: {
        cachedChecks: false
      }
    },
    plugins: [
      luent(),
    ]
  }
})