import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    hookTimeout: 60_000,
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    root: '.',
    teardownTimeout: 120_000,
    testTimeout: 30_000,
  },
})
