// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 도메인 연결 전 기본 주소. 8단계에서 https://mivomad33.dev로 바꾼다.
  site: 'https://mivomad33.github.io',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
});
