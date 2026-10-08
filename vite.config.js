import { defineConfig, normalizePath } from 'vite';
import { resolve } from 'path';
import handlebarsPlugin from '@yoichiro/vite-plugin-handlebars';

export default defineConfig({
  base: './',
  plugins: [
    handlebarsPlugin({
      partialsDirectoryPath: normalizePath(
        resolve(__dirname, 'src/partials'),
      ),
      transformIndexHtmlOptions: {},
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        journey: resolve(__dirname, 'our-journey.html'),
        team: resolve(__dirname, 'team.html'),
        privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
        media: resolve(__dirname, 'media.html'),
        report: resolve(__dirname, 'report.html'),
        news: resolve(__dirname, 'news.html'),
        product: resolve(__dirname, 'product.html'),
        evolutionOfV2mOne: resolve(__dirname, 'evolution-of-v2m-one.html'),
      },
    },
  },
});