// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 도메인 연결 전 기본 주소. 8단계에서 https://mivomad33.dev로 바꾼다.
  site: 'https://mivomad33.github.io',
  trailingSlash: 'always',
  markdown: {
    // 코드 하이라이팅 테마(6단계). 코드 블록의 배경색과 문법 색을 정한다.
    shikiConfig: { theme: 'github-light-default' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
