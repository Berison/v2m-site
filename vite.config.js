import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        journey: resolve(__dirname, 'our-journey.html'),
        team: resolve(__dirname, 'team.html'),
        privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
        media: resolve(__dirname, 'media.html'),
        report: resolve(__dirname, 'report.html'),
      },
    },
  },
});