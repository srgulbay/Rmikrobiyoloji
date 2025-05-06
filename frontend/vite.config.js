// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <-- Eklentiyi import et

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ // <-- Eklentiyi ekle ve yapılandır
      registerType: 'autoUpdate', // Service Worker'ı otomatik günceller
      devOptions: {
        enabled: false // Geliştirme sırasında etkinleştirmek için true yapabilirsiniz
      },
      manifest: {
        // *** Kendi uygulamanıza göre bu bilgileri güncelleyin! ***
        name: 'Rmikrobiyoloji Platformu', // Tam uygulama adı
        short_name: 'Rmikro',           // Kısa ad (ikon etiketi)
        description: 'Mikrobiyoloji çalışma ve soru çözme platformu', // Açıklama
        theme_color: '#3182CE', // Ana tema renginiz (örn: Chakra blue.500) - Theme.js'e bakın!
        background_color: '#ffffff', // Splash screen arka planı
        display: 'standalone',    // Tam ekran uygulama gibi
        scope: '/',               // Uygulamanın kapsamı
        start_url: '/',           // Uygulama açıldığında gidilecek URL
        icons: [
          {
            src: 'pwa-192x192.png', // public klasöründe olmalı
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // public klasöründe olmalı
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png', // public klasöründe olmalı (Maskable icon)
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // 'maskable' amacı önemli
          }
          // Farklı boyutlar da eklenebilir
        ]
      },
      // Temel çevrimdışı yeteneği için Workbox ayarları
      workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'] // Önbelleğe alınacak dosyalar
          // Daha gelişmiş caching stratejileri eklenebilir
      }
    })
  ],
})