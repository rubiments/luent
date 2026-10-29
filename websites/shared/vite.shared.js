import tailwindcss from '@tailwindcss/vite'
import luent from '../../plugins/vite-plugin-luent/dev.ts'

export function createSharedViteConfig() {
  return {
    plugins: [
      tailwindcss(),
      luent()
    ],
  }
}