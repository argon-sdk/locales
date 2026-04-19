import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['@argon-sdk/core'],
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    banner: { js: '#!/usr/bin/env node' },
    clean: false,
    external: ['@argon-sdk/core'],
  },
])
