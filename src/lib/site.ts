// 사이트 설정 값. 빌드 결과 검사(scripts/check-build.ts)가 Node로 이 파일을 직접 불러오므로,
// Node가 타입 표기만 지워 실행할 수 있게 쓴다(다른 파일 import, enum 등 실행 코드가 되는 TS 문법을 쓰지 않는다).

// 사이트 주소. astro.config.mjs의 site와 빌드 결과 검사가 이 값을 쓴다.
// GitHub Pages에 연결한 도메인이다(8단계). 기본 주소(mivomad33.github.io)는 이 주소로 넘어간다.
export const SITE = 'https://mivomad33.dev';

// 검색 엔진 수집 허용 여부. 공개 전에는 false로 두어 모든 페이지에 noindex를 넣고 robots.txt로 전체를 막는다.
// 8단계(공개)에서 true로 바꾼다.
export const ALLOW_INDEXING = false;

// 사이트 안 경로(/로 시작)를 SITE 기준 절대 주소로 바꾼다(canonical, OG, sitemap 주소 등).
export function siteUrl(path: string): string {
  return new URL(path, SITE).href;
}
