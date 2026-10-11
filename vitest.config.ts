import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // gleicher Alias wie in Nuxt, damit Server-Utils in Tests laufen
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: { include: ['tests/**/*.test.ts'] },
})
