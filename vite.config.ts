import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['adfare_logo.png', 'adfare_logo_black.png'],
          manifest: {
            name: 'Gestão de Escalas ADFARE',
            short_name: 'Escalas ADFARE',
            description: 'Aplicativo de Gestão de Escalas do Ministério ADFARE.',
            theme_color: '#252830',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: '/adfare_logo_black.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/adfare_logo_black.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/adfare_logo_black.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
