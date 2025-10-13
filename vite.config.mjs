import { defineConfig } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import viteImagemin from 'vite-plugin-imagemin';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Сборка
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shop: "shop.html",
        map: "map.html",
        card: "card.html",
      },
    },
  },

  // dev server (важно для ngrok)
  server: {
    host: true, // или '0.0.0.0' — чтобы Vite слушал внешние подключения
    // Разрешаем хосты ngrok — шаблон с точкой разрешает все поддомены
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app'
    ],
    // Если после этого будут проблемы с HMR (особенно при HTTPS через ngrok),
    // можно раскомментировать и настроить пример ниже (замени host/port на конкретный ngrok-host при необходимости):
    //
    // hmr: {
    //   protocol: 'wss',
    //   host: 'humorless-nonadjustably-pilar.ngrok-free.dev', // или динамически подставь свой ngrok-host
    //   port: 443
    // }
  },

  // Плагины
  plugins: [
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 20,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
    }),
  ],
});
