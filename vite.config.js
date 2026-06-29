import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Turns the site into an installable app ("Add to Home Screen").
    // The service worker auto-updates whenever you `git push` a new build.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'OctoScore — Octopus Tournament',
        short_name: 'OctoScore',
        description: 'Live standings, scores, top scorers and quiz for the Octopus Tournament.',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell so it opens instantly / works offline-ish.
        // API calls (cross-origin to Render) are NOT cached — always fresh data.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // Pull in the web-push handlers (showNotification / notificationclick).
        importScripts: ['push-sw.js'],
      },
    }),
  ],
})
