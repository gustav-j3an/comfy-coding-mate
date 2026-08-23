// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
    VitePWA({
      registerType: 'prompt',
        includeAssets: ['favicon.ico', 'icons/*.png'],
        manifest: {
          name: 'Rota do Promotor',
          short_name: 'RotaPromotor',
          description: 'Sistema de gestão de promotores e rotas',
          theme_color: '#0F172A',
          background_color: '#0F172A',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/sign\/.*/i,
              handler: 'NetworkOnly', // Never cache signed URLs or private media
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
              handler: 'NetworkOnly', // Never cache API data
            }
          ]
        }
      })
    ]
  }
});
