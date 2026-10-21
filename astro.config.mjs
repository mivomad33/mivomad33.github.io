// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/lib/site.ts';
import { DEFAULT_LOCALE, LOCALES } from './src/lib/i18n.ts';

export default defineConfig({
  // 사이트 주소는 src/lib/site.ts에서 정한다(빌드 결과 검사도 같은 값을 쓴다).
  site: SITE,
  trailingSlash: 'always',
  markdown: {
    // 코드 하이라이팅 테마(6단계). 코드 블록의 배경색과 문법 색을 정한다.
    shikiConfig: { theme: 'github-light-default' },
  },
  // sitemap(7단계). 404는 통합이 스스로 뺀다.
  // 두 언어(변경 1): 주소마다 다른 언어 버전(xhtml:link)을 붙인다. 언어 코드를 그대로 hreflang으로 쓴다.
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: Object.fromEntries(LOCALES.map((locale) => [locale, locale])),
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
