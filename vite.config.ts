/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    testTimeout: 30000,
    environmentMatchGlobs: [
      ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'jsdom'],
      ['server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'node']
    ],
  },
})
