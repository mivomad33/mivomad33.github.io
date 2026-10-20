# 설계

여러 단계가 같이 쓰는 설계(기술 스택, 데이터 모델, 앱 구조, 공통 UI)를 담는다. 단계에서만 쓰는 세부는 각 단계 파일에 있다.

## 기술 스택

1단계에서 정했다. 후보 비교와 결정 이유는 [1단계 문서](stages/1-tech-stack.md)에 있다.

- 프레임워크: Astro(정적 출력)
- 스타일링: Tailwind CSS(4.x, Vite 플러그인 `@tailwindcss/vite`로 연결). 색·글꼴·간격 등 공통 값은 Tailwind 테마(`@theme`)에 모은다. UI 컴포넌트 라이브러리는 쓰지 않는다.
- 언어: TypeScript(Astro strict 설정). 타입 검사 도구가 지원하는 6.x를 쓴다(아래 버전 참고).
- 패키지 매니저: pnpm(CI에서도 pnpm을 설치해 쓴다)
- lint·포맷터: ESLint(eslint-plugin-astro) + Prettier(prettier-plugin-astro, prettier-plugin-tailwindcss로 클래스 순서 정렬)
- md 처리: Astro 내장 md 처리와 콘텐츠 컬렉션. MDX는 쓰지 않는다.
- 코드 하이라이팅: Astro 내장 Shiki(테마는 6단계에서 정한다)
- 데이터 검증: 블로그 글 정보와 프로필·포트폴리오 데이터 파일은 콘텐츠 컬렉션 스키마(Zod)로 정의해, 빠지거나 틀리면 빌드가 실패하게 한다.
- 배포: GitHub Actions에서 검증 → 빌드 → GitHub Pages 배포(공식 `actions/upload-pages-artifact`, `actions/deploy-pages`). 검증이나 빌드가 실패하면 배포하지 않는다.
- 저장소: GitHub `mivomad33/mivomad33.github.io`(사용자 사이트). 기본 주소가 루트(`https://mivomad33.github.io/`)라서 도메인 연결 전후로 경로(`base`)가 바뀌지 않는다. 저장소는 4단계에서 만든다.
- SEO: sitemap은 `@astrojs/sitemap`. 메타 태그(noindex 포함)는 공통 레이아웃에서, robots.txt는 별도 파일로 라이브러리 없이 직접 만든다. 공개 전 수집 차단과 그 전환 방식은 4단계에서, 메타 태그 세부는 7단계에서 정한다.
- 검증 도구: `astro check`(타입 검사, `@astrojs/check`와 `typescript` 설치 필요), ESLint, Prettier 검사(`--check`). E2E 도구는 쓰지 않는다.
- 실행 환경: Node 22.22 이상(Astro 7 요구). 로컬과 CI가 같은 버전을 쓴다.
- 버전: 설치할 때의 최신 안정 버전을 쓰되, 서로의 peer 의존성 범위 안에서 정한다. 지금은 TypeScript 최신(7.x)을 타입 검사·lint 도구가 지원하지 않아 6.x를 쓴다.
