import { defineConfig } from 'vite'
import luent from '../plugins/vite-plugin-luent/dev.ts'


export default defineConfig({
   server: {
      fs: {
         cachedChecks: false
      }
   },
   plugins: [
      luent(),
   ],
  //  define: {
  //     __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  //     __INTERNAL__: JSON.stringify(process.env.NODE_ENV === 'development'),
  //     __SSR__: false,
  //     __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
  //  },
})