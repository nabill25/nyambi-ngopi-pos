import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      // Hanya precache app shell (JS/CSS/HTML/ikon). Panggilan ke Supabase
      // sengaja TIDAK di-cache Workbox — data offline ditangani sendiri
      // secara eksplisit di level hook (lihat src/lib/offlineCache.ts),
      // supaya tidak ada data basi/salah-scope RLS yang ke-cache HTTP.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        name: 'Nyambi Ngopi POS',
        short_name: 'Nyambi Ngopi',
        description: 'Sistem Point of Sale untuk Nyambi Ngopi Depok',
        theme_color: '#0d3d20',
        background_color: '#0d3d20',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
        },
      },
    },
  },
});
