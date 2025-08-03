/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only in analysis mode
    ...(process.env.NODE_ENV === 'analysis' || process.argv.includes('--mode=analysis') ? [
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    ] : []),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache strategy configuration
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\/songs\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'songs-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'HSA Songbook',
        short_name: 'HSA Songbook',
        description: 'Offline-first songbook for worship teams',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    })
  ],
  build: {
    // Stricter performance budgets for better optimization
    chunkSizeWarningLimit: 600, // 600KB warning limit (reduced from 1MB)
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          
          // Auth vendor (heavy - only load when needed)
          'auth-vendor': ['@clerk/clerk-react', '@clerk/express'],
          
          // Data fetching vendor
          'query-vendor': ['@tanstack/react-query'],
          
          // Drag and drop vendor (for setlist builder)
          'dnd-vendor': [
            '@dnd-kit/core',
            '@dnd-kit/modifiers', 
            '@dnd-kit/sortable',
            '@dnd-kit/utilities'
          ],
          
          // Music/chord editor vendor chunks (heaviest dependencies)
          'chord-editor-vendor': [
            'ace-builds',
            'chordproject-editor'
          ],
          'music-theory-vendor': [
            'chordsheetjs'  
          ],
          
          // Storage and state management
          'storage-vendor': ['idb', 'zustand'],
          
          // Server utilities (when used)
          'server-vendor': [
            'compression',
            'cors', 
            'express',
            'helmet',
            'mongoose',
            'express-rate-limit',
            'express-validator'
          ],
          
          // Utilities
          'utils-vendor': ['clsx', 'zod'],
          
          // Development only
          ...(process.env.NODE_ENV === 'development' && {
            'dev-vendor': ['mongodb-memory-server']
          })
        }
      }
    },
    // Enable source maps for debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: 'es2020',
  },
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  test: {
    globals: true,
    testTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Vitest workspace configuration
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.{js,ts}',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.d.ts',
        '**/coverage/**',
        '**/build/**',
        'server/test/**',
        'src/test/**'
      ],
      include: [
        'src/**/*.{js,ts,jsx,tsx}',
        'server/**/*.{js,ts}'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
})
