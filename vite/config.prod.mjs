import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const phasermsg = () => {
  return {
    name: 'phasermsg',
    buildStart() {
      process.stdout.write(`Building for production...\n`);
    },
    buildEnd() {
      const line = "---------------------------------------------------------";
      const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
      process.stdout.write(`${line}\n${msg}\n${line}\n`);

      process.stdout.write(`✨ Done ✨\n`);
    }
  }
}

export default defineConfig({
  base: './',
  logLevel: 'warning',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    }
  },
  server: {
    port: 8080
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'The Elder Prism',
        short_name: 'Elder Prism',
        description: 'A tower-climbing puzzle game.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: './icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: './icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        // Precache everything the game needs so it runs fully offline.
        globPatterns: ['**/*.{js,css,html,png,json,xml,mp3,ogg}'],
        // Phaser's chunk is well over the 2MB default.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    }),
    phasermsg()
  ]
});
