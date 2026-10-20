# 4단계: 기반 구축과 배포 파이프라인

목적, 끝난 상태, 하위 단계는 [진행 계획](../plan.md)의 4단계를 따른다. 이 문서는 이 단계에서만 쓰는 구체적인 선택과 이유를 담고, 여러 단계가 따를 것은 [design.md](../design.md)에 적는다.

- 상태: 진행 중(하위 단계 1 완료 2026-10-20, 사용자 검토 통과. 하위 단계 2 완료 2026-10-20, 사용자 검토 통과. 하위 단계 3 완료 2026-10-20, 사용자 검토 통과). 4단계 완료(2026-10-20, main 배포 확인)

## 하위 단계 1: 프로젝트 골격과 검증 명령

### 패키지와 버전

설치할 때(2026-10-20) 공개된 지 하루 이상 지난 것 중 최신 안정 버전이고, 서로의 peer 의존성 범위 안에 있다.

- 하루 기준: pnpm 12의 기본 공급망 보호 정책(`minimumReleaseAge`, 1440분)을 따른다.
  - 처음에는 정책이 없는 pnpm 10으로 그날의 최신 버전(astro 7.4.1, `@astrojs/check` 0.9.11, `typescript-eslint` 8.72.0 등, 모두 10-19 공개)을 설치했다.
  - 검토에서 pnpm을 최신(12.x)으로 올리자 이 정책 때문에 설치가 거부됐다.
  - 비교한 선택지:
    - 정책 끄기: 공급망 보호를 일부러 버리게 된다.
    - 막힌 패키지만 예외 목록에 넣기: 올릴 때마다 목록을 손봐야 한다.
  - 정책을 따르기로 했다(사용자 결정). 악성 버전은 보통 공개 몇 시간 안에 내려가므로 하루를 기다리면 그 위험을 피할 수 있고, 정책이 CI 설치(`--frozen-lockfile`)에서도 lockfile을 검사해 로컬과 CI가 같은 기준으로 움직이기 때문이다.
- `astro` 7.4.0
- `tailwindcss`, `@tailwindcss/vite` 4.3.3
- `typescript` 6.0.3
  - 최신은 7.0.2지만 `typescript-eslint`가 `<6.1.0`, `@astrojs/check`가 `^5 || ^6`만 지원한다([memory.md](../memory.md)의 보류 항목).
- `@astrojs/check` 0.9.10
- `eslint` 10.13.0, `@eslint/js` 10.0.1, `typescript-eslint` 8.71.2, `eslint-plugin-astro` 3.2.1, `globals` 17.13.0
- `prettier` 3.9.10, `prettier-plugin-astro` 0.14.1, `prettier-plugin-tailwindcss` 0.8.1
  - `prettier-plugin-astro`는 최신(1.1.1)이 아니라 0.14.1을 쓴다.
    - 1.x에서는 Tailwind 클래스 정렬이 `.astro` 파일에 적용되지 않는다. 오류 없이 조용히 빠져서 검토에서 발견했다.
    - 정렬 플러그인이 astro 플러그인을 peer `*`로 받아 버전 충돌로도 드러나지 않는다.
    - 0.14.1에서는 정렬된다. design.md의 "클래스 순서 정렬"을 지키기 위해 내렸다([memory.md](../memory.md)의 보류 항목).
- 버전 범위 표기:
  - 모두 `^`(같은 주 버전 안에서 올림)이다. 실제 설치 버전은 `pnpm-lock.yaml`이 고정한다.
  - `typescript`만 `~`(6.0.x 안에서만 올림)로 둔다. 6.1이 나와도 `typescript-eslint` 범위를 벗어나지 않게 하기 위해서다.
- 모두 개발 의존성(`devDependencies`)이다. 정적 사이트라 실행할 때 필요한 패키지가 없기 때문이다.
- sitemap(`@astrojs/sitemap`)은 쓰는 7단계에서 설치한다.

### 실행 환경 고정

- Node: `.nvmrc`에 `24`를 적는다.
  - CI(`actions/setup-node`의 `node-version-file`)와 로컬 버전 관리 도구가 같은 파일을 읽는다.
  - 주 버전만 적는다. 로컬(24.22.0)과 CI가 같은 주 버전의 최신 버전을 쓰게 해, 보안 업데이트 때마다 파일을 고치지 않기 위해서다.
  - `package.json`의 `engines.node`는 `>=24.16.0`이다. 의존성 중 가장 좁은 요구 범위(`eslint-plugin-astro`: `^22.22.3 || ^24.16.0 || >=26.3.0`)에서 `.nvmrc`의 주 버전(24)에 해당하는 하한이다. Astro만 보면 `>=22.22.0`이지만 그보다 좁혀야 한다.
- pnpm: `package.json`의 `packageManager`에 `pnpm@12.14.0`(최신)을 적는다. CI의 pnpm 설치 액션이 이 값을 읽는다. 로컬 pnpm도 `pnpm self-update`로 같은 버전에 맞췄다.

### 검증 명령

- `pnpm check`: 검사만 한다. `astro check`(타입 검사) → `eslint .` → `prettier --check .`
- `pnpm build`: `astro build`(콘텐츠 컬렉션 스키마 검증 포함)
- `pnpm verify`: `check`와 `build`를 차례로 실행한다. 로컬에서 머지 전에 확인하는 명령이다.
- `pnpm format`: `prettier --write .`로 포맷을 고친다(검증 명령은 아니다).
- 나눈 이유: CI가 검사와 빌드를 다른 작업에서 부를 때 빌드가 두 번 실행되지 않게 하기 위해서다.

### 설정

- `astro.config.mjs`: `site: 'https://mivomad33.github.io'`(8단계에서 도메인으로 바꾼다), `trailingSlash: 'always'`, Tailwind는 Vite 플러그인으로 연결한다.
- `tsconfig.json`: `astro/tsconfigs/strict`를 확장한다.
- ESLint(`eslint.config.js`):
  - 권장 규칙 세 묶음(`@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`)만 쓴다. 규칙을 따로 더하지 않고, 문제가 생기면 그때 추가한다.
  - `tseslint.config()`는 deprecated라서 ESLint의 `defineConfig()`로 묶는다.
  - `docs/`는 lint하지 않는다(시안 HTML의 스크립트가 들어 있다).
  - Node 전역 변수(`process` 등)는 루트의 설정 파일(`*.config.{js,mjs,ts}`)에만 허용한다. `src/`는 브라우저나 빌드 결과물에서 쓰는 코드라 Node 전용 변수를 쓰면 검사에서 걸리게 하기 위해서다.
    - 하위 단계 2 검토에서 고쳤다: 원래 이 검사는 lint가 아니라 타입 검사가 해 주고 있었다(TS 파일에서는 `typescript-eslint`가 `no-undef`를 끈다). 하위 단계 2에서 `@types/node`를 추가하자 타입 검사도 통과해 버려서, `src/**`에 `no-restricted-globals`(`process`, `Buffer`, `global`, `require`, `module`, `__dirname`, `__filename`)를 걸어 lint로 막았다.
- Prettier(`.prettierrc.json`):
  - 작은따옴표를 쓴다(Astro 공식 예제와 같다).
  - Tailwind 클래스 정렬 플러그인이 Tailwind 4 테마를 읽도록 `tailwindStylesheet`에 `src/styles/global.css`를 지정한다.
- `.prettierignore`:
  - 글(`src/content/blog/`)과 데이터 파일(`src/data/`)은 design.md 테스트 전략대로 뺀다.
  - 배포되지 않는 파일(`docs/`, `CLAUDE.md`, `.claude/`, `.serena/`)과 `pnpm-lock.yaml`도 뺀다.
- `src/pages/index.astro`는 빌드를 확인하기 위한 임시 페이지다. 하위 단계 2에서 공통 레이아웃을 쓰는 페이지로 바꾼다.

### 확인 결과(2026-10-20, 검토 반영 뒤)

- 새로 클론한 저장소에서 `pnpm install --frozen-lockfile`(pnpm 12, 공급망 정책 검사 포함) 뒤 `pnpm verify`가 통과했다.
- 다음 오류를 하나씩 넣었을 때마다 `pnpm verify`가 실패했다(exit 1).
  - 타입 오류(`.ts`)
  - lint 오류: 쓰지 않는 변수(`.ts`, `.astro`)
  - `src/`에서 Node 전역 변수 사용: 이때는 타입 검사가 잡았다(위 ESLint 항목 참고. 하위 단계 2부터는 lint가 잡는다)
  - 포맷 오류(`.ts`, `.astro`), `.astro`의 순서가 틀린 Tailwind 클래스
- 설정 파일(`astro.config.mjs`)에서 Node 전역 변수를 쓰는 것은 lint를 통과했다.

### 검토에서 고친 것(2026-10-20)

작업과 다른 세션(서브에이전트)에서 검토했고, 다음을 고쳤다.

- `.astro` 파일에서 클래스 정렬이 안 되는 문제: `prettier-plugin-astro`를 0.14.1로 내렸다.
- pnpm이 최신이 아니던 문제: 12.14.0으로 올렸고, 그에 따라 공급망 정책을 적용했다(위 "패키지와 버전").
- `engines.node`가 실제 요구보다 넓던 문제: `>=24.16.0`으로 좁혔다.
- Node 전역 변수가 모든 파일에 허용되던 문제: 설정 파일로 좁혔다.
- 검토 전에 진행 상태를 완료로 적었던 것: 검토 대기로 되돌렸다.

## 하위 단계 2: 공통 레이아웃

여러 단계가 따를 값과 규칙(테마, 글꼴 패키지, 데이터 로더, 수집 차단 방법)은 [design.md](../design.md)에 적었고, 여기에는 고른 이유와 이 단계에서만 쓰는 세부를 적는다.

### 테마(`src/styles/global.css`)

- Tailwind 기본 값을 모두 지운다(`--*: initial`). 색만 지우는 것과 비교했다.
  - 색만 지우면 글자 크기·줄 간격·모서리 등은 Tailwind 기본 값(`text-sm`이 0.875rem 등)이 design.md 값과 같은 이름으로 섞이거나 남는다. 그러면 design.md에 없는 값을 실수로 써도 검사에서 드러나지 않는다.
  - 모두 지우면 design.md에 없는 값은 클래스가 만들어지지 않아(스타일이 적용되지 않아) 바로 드러난다. 그 대신 쓰는 값은 모두 직접 정의해야 한다. 화면 폭 기준 `--breakpoint-sm`도 그래서 다시 정의했다.
- 글자 크기에 줄 간격 짝을 두지 않는다. 두는 방식과 비교했다.
  - 짝을 두면 `text-sm`이 줄 간격까지 정해, 글 본문(`leading-relaxed`) 안의 작은 글자가 본문과 다른 줄 간격을 갖게 된다.
  - 짝을 두지 않으면 시안처럼 줄 간격을 부모에서 이어받는다. 빌드 결과에서 `.text-sm`이 `font-size`만 정하는 것을 확인했다.
- 본문 기본 값(배경, 글자색, 글꼴, 크기, 줄 간격, 한글 줄바꿈)은 `BaseLayout`의 `<body>` 클래스로 준다(`break-keep`, `wrap-anywhere`).

### 웹 폰트

- `pretendard` 1.3.9: 시안이 CDN으로 쓰던 것과 같은 파일(가변 글꼴 dynamic subset)이 들어 있는 공식 패키지다.
- `@fontsource/jetbrains-mono` 5.3.0: 굵기·문자 집합별 CSS가 나뉘어 있어 400·700과 라틴만 불러올 수 있다.
- 빌드 결과에 woff2 94개(Pretendard 부분 집합 92개, JetBrains Mono 2개)가 들어가고, 페이지에서는 쓰인 글자의 부분 집합만 받는다(한 페이지에서 Pretendard 8개 내외).

### 프로필 데이터와 로더

- 헤더·푸터가 프로필을 쓰므로 `src/data/profile.yaml`과 스키마(`src/content.config.ts`)를 이 단계에서 만들었다. 링크 스키마(`linkSchema`)는 5단계 포트폴리오도 쓰도록 따로 내보낸다.
- 페이지와 레이아웃은 `src/lib/profile.ts`의 `getProfile()`로 가져온다(design.md 코드 규칙의 데이터 접근).
- 로더: Astro 기본 파일 로더(`file()`)를 쓰려다 직접 만든 로더(`src/lib/yaml-object-loader.ts`)로 바꿨다.
  - 처음에는 `file()`의 `parser` 옵션으로 파일 전체를 항목 하나로 감쌌다. 그런데 확인해 보니, YAML 문법 오류를 넣어도 로더가 로그만 남기고 이전 빌드의 데이터를 써서 빌드가 성공했다(캐시가 없는 CI에서는 실패한다). 로컬 검증과 CI 결과가 달라지므로 읽기 오류를 그대로 던지는 로더를 만들었다.
  - YAML 파서는 `yaml` 패키지를 쓴다. Astro 안의 파서(`@astrojs/internal-helpers`)는 내부용이라 직접 쓰지 않는다.
  - 로더가 Node 내장 모듈을 쓰므로 `@types/node`(Node 24에 맞춰 `^24`)를 추가했다.

### 공통 레이아웃과 페이지

- `BaseLayout`: 문서 머리, 헤더, 본문, 푸터. 헤더와 푸터는 이 레이아웃에서만 쓰므로 따로 컴포넌트로 나누지 않았다.
- 현재 메뉴는 페이지가 넘기지 않고 주소로 정한다(주소가 메뉴 주소로 시작하면 그 메뉴). 글 보기(`/blog/<slug>/`)도 따로 처리하지 않아도 "블로그"가 되고, 페이지마다 값을 넘기다 틀릴 일이 없기 때문이다.
- 장식 기호(`~/`, `# `, `> `, 메뉴의 `[ ]`)는 시안의 `::before` 대신 `<span>`으로 넣는다. Tailwind 클래스로 쓰기 위해서다. 사이트 이름의 `~/`을 뺀 나머지는 화면 낭독기가 읽지 않게 `aria-hidden`을 붙였다.
- 공통 컴포넌트:
  - `Container`: 본문 폭과 좌우 여백. 헤더·본문·푸터가 같은 클래스 묶음을 쓰므로 뽑았다.
  - `PageTitle`: 앞에 `# `이 붙은 페이지 제목. 포트폴리오·블로그·소개·404가 쓴다.
- 문서 제목(`<title>`): 지금은 `페이지 제목 - 사이트 이름`(홈은 사이트 이름만)이다. 형식은 7단계에서 정한다.
- 저작권 표시의 연도는 빌드한 해다.
- 빈 페이지: 홈은 한 줄 소개, 포트폴리오·블로그는 제목, 소개는 활동명 제목만 둔다. 내용은 5·6단계에서 채운다.
- 404: 시안처럼 제목과 "홈으로 가기" 링크를 둔다. 시안에서는 이 링크가 일반 글자색이라 링크로 보이지 않아, 강조색(마우스를 올리면 밑줄)으로 바꿨다.

### 공개 전 수집 차단

- `src/lib/site.ts`의 `ALLOW_INDEXING`(지금 `false`) 하나로 모든 페이지의 `<meta name="robots" content="noindex, nofollow">`와 robots.txt의 `Disallow: /`를 함께 정한다. 8단계에서 `true`로 바꾸면 둘 다 풀린다.
- 환경 변수로 바꾸는 방식과 비교했다.
  - 환경 변수: 같은 코드로 공개용·비공개용을 따로 빌드할 수 있다. 그러나 이 사이트는 배포가 한 곳뿐이고, CI 설정과 로컬 설정 두 곳을 맞춰야 하며, 값을 빠뜨리면 조용히 다른 쪽으로 빌드된다.
  - 코드의 값 하나: 바꿀 곳이 한 줄이고, 바꾼 기록이 커밋으로 남는다.
- robots.txt는 `public/`의 고정 파일이 아니라 엔드포인트(`src/pages/robots.txt.ts`)로 만든다. 같은 값을 읽어야 하고, 7단계에서 sitemap 주소를 넣을 때도 사이트 주소(`site`)를 쓸 수 있기 때문이다.
- noindex와 `Disallow`를 함께 쓰면, 크롤러가 robots.txt 때문에 페이지를 읽지 않아 noindex를 보지 못한다. 그래도 공개 전에는 사이트로 들어오는 링크가 없어 두 가지를 함께 두는 것으로 충분하다(plan.md의 끝난 상태대로 둘 다 둔다).

### 확인 결과(2026-10-20)

- `pnpm verify`가 통과하고, 6개 파일(`/`, `/portfolio/`, `/blog/`, `/about/`, `/404.html`, `/robots.txt`)이 만들어진다.
- 빌드 미리보기(`pnpm preview`)를 시안(`c-mono.html`)과 같은 화면 크기로 띄워, 글 목록 화면의 다음 요소를 숫자로 비교했다. 위치·크기·글꼴·굵기·글자 크기·줄 간격·색이 모두 같았다.
  - 사이트 이름, 메뉴 3개(현재 메뉴 포함), 페이지 제목, 헤더, 푸터, 저작권 표시, 푸터 링크
  - 푸터의 세로 위치와 링크 개수는 시안의 예시 데이터(글 목록, 링크 3개)가 더 많아서만 다르다.
- 현재 메뉴: 홈은 없음, `/portfolio/`·`/blog/`·`/about/`은 각각 해당 메뉴, 404는 없음
- 없는 주소(`/no-such-page/`)에서 404 페이지가 상태 코드 404로 나온다.
- 375px 폭: 가로 스크롤이 없고, 헤더와 제목의 위치가 시안과 같다.
- 글꼴: 네트워크 요청이 모두 사이트 자체(`/_astro/`)로 가고, 외부 서버로 가는 요청이 없다.
- 수집 차단: 빌드 결과의 HTML 5개에 모두 noindex가 있고, robots.txt가 `Disallow: /`다.
- 데이터 오류에서 빌드 실패: `name` 누락, 이메일 형식 오류, `//`로 시작하는 링크, YAML 문법 오류(이전 빌드 데이터가 있을 때도), 빈 파일, 파일 없음
- `.astro`에 순서가 틀린 Tailwind 클래스를 넣으면 `pnpm check`가 실패한다.
- 미리보기용으로 `.claude/launch.json`에 `site-preview`(`pnpm preview --port 4321`, 먼저 `pnpm build` 필요)를 추가했다.

### 검토에서 고친 것(2026-10-20)

작업과 다른 세션(서브에이전트)에서 검토했다. 완료 기준은 모두 통과했고, 다음을 고쳤다.

- `src/`에서 Node 전역 변수를 써도 검사를 통과하던 문제: `@types/node` 추가로 하위 단계 1의 보장이 깨졌다. ESLint `no-restricted-globals`로 막았다(하위 단계 1의 ESLint 항목).
- 링크 주소 규칙의 빈틈: `/\evil.com`(브라우저가 `//evil.com`으로 읽는다), 내용 없는 `https://`, `mailto:`가 통과했다. 정규식을 고쳤다.
- 모르는 키가 조용히 버려지던 문제: 프로필과 링크 스키마를 `z.strictObject`로 바꿔 다른 키가 있으면 빌드가 실패하게 했다.
- YAML 문법 오류 메시지에 파일 이름이 없던 문제: 로더가 `src/data/profile.yaml을 읽지 못했습니다: ...`로 감싸 던지고, 원래 오류는 `cause`로 붙인다(ESLint 10 권장 규칙 `preserve-caught-error`). 파일 내용이 객체가 아니면(빈 파일, 배열) 같은 방식으로 알린다.
- 404 "홈으로 가기"의 모양이 시안과 다른데 design.md에 기록이 없던 것: 강조색을 유지하고 design.md 공통 레이아웃에 적었다(사용자 결정).

다시 확인한 결과:

- `src/`의 `.ts`에서 `process`, `.astro`에서 `Buffer`를 쓰면 `pnpm check`가 실패하고, `astro.config.mjs`에서 `process`를 쓰는 것은 통과한다.
- 링크 주소: `/\evil.com`, `//evil.com`, `https://`, `https:///x`, `mailto:`, `http://x.com`은 빌드 실패, `/`, `/blog/first-post/`, `https://github.com/x`, `mailto:me@example.com`은 통과
- 프로필의 `link:`(오타), 링크의 `title:`(모르는 키)는 빌드 실패, `links` 생략(0개)은 통과
- YAML 문법 오류, 빈 파일, 배열은 파일 이름이 든 메시지로 빌드 실패
- `pnpm verify` 통과

### 사용자 검토에서 바꾼 것(2026-10-20)

- 내용이 적은 페이지에서 푸터가 화면 중간에 떠 보여, 푸터를 화면 맨 아래에 붙였다(design.md 공통 레이아웃).
  - 비교한 선택지:
    - `<main>`에 고정 최소 높이 주기: 화면이 크면 다시 뜨고, 작으면 쓸데없는 스크롤이 생긴다.
    - 그대로 두기: 5·6단계에서 내용이 차도 404, 소개, 글이 적은 초기 블로그는 계속 떠 보인다.
  - 결정: `<body>`를 화면 높이(`min-h-dvh`) 이상의 세로 배치로 두고 `<main>`이 남는 높이를 채운다(`flex-1`).
  - 확인:
    - 데스크톱(846×856)과 375×812 모두 푸터 아래쪽이 화면 아래쪽과 같고, 스크롤이 생기지 않는다(문서 높이 = 화면 높이).
    - 내용을 2000px 늘리면 푸터가 내용 뒤로 밀려난다.

## 하위 단계 3: 배포 파이프라인

### 워크플로(`.github/workflows/deploy.yml`)

- 모든 브랜치 push에서 실행한다. 작업은 세 개이고 `needs`로 한 줄로 잇는다.
  - 검증(`pnpm check`) → 빌드(`pnpm build`) → 배포
  - 앞 작업이 실패하면 뒤 작업은 실행되지 않는다(skipped).
- main push에서만 빌드 결과를 Pages용으로 올리고(`actions/upload-pages-artifact`) 배포한다(`actions/deploy-pages`). 작업 브랜치에서는 검증과 빌드만 한다.
- 권한: 기본은 읽기만(`contents: read`) 준다. 배포 작업에만 `pages: write`, `id-token: write`를 준다.
- 배포가 겹치면 먼저 시작한 배포를 끝까지 마친다(`concurrency: pages`, `cancel-in-progress: false`). 중간에 끊긴 배포가 남지 않게 하기 위해서다.
- 체크아웃은 인증 정보를 남기지 않는다(`persist-credentials: false`). 뒤 단계가 저장소에 쓸 일이 없기 때문이다.
- `actions/configure-pages`는 쓰지 않는다. Pages 설정은 저장소에서 이미 GitHub Actions로 정했고, 경로(`base`)도 루트라서 받아 쓸 값이 없다.
- 실행 환경 준비(pnpm 설치 → Node 설치와 pnpm 캐시 → `pnpm install --frozen-lockfile`)는 검증과 빌드가 같이 쓰므로 저장소 안의 공통 액션(`.github/actions/setup/`)으로 뽑았다.
  - pnpm 버전은 `package.json`의 `packageManager`를, Node 버전은 `.nvmrc`를 읽는다.
  - pnpm 12의 공급망 정책은 CI 설치에서도 lockfile을 검사한다.
- 액션 버전(2026-10-20 최신 주 버전): `actions/checkout@v7`, `pnpm/action-setup@v6`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`
  - pnpm은 Node 없이 pnpm과 Node를 함께 설치하는 새 액션 `pnpm/setup`도 낸다. 그래도 기존 `pnpm/action-setup`이 pnpm 12까지 지원하고, Node 설치를 널리 쓰이는 `actions/setup-node`에 맡기는 편이 익숙해서 기존 액션을 쓴다.
- push 전에 워크플로 검사 도구(actionlint 1.7.12)로 문법을 확인했다.

### 원격 저장소와 첫 push

- 저장소 생성과 Pages 설정(배포 방식 GitHub Actions)은 이 하위 단계를 시작하기 전에 마쳤다(plan.md).
- 첫 push 전에 공개되면 안 되는 정보를 확인했다.
  - 비밀 값(토큰, 비밀번호 등)은 없었다.
  - 커밋 작성자 이메일(개인 주소)과 memory.md의 다른 GitHub 계정 이름이 공개 기록에 남는 문제가 있었다.
  - 사용자 결정에 따라 push 전에 모든 커밋(main 포함 22개)의 작성자를 `mivomad33 <344780894+mivomad33@users.noreply.github.com>`(GitHub 비공개 주소)로 바꾸고, 기록 속 memory.md의 계정 이름도 지웠다(`git filter-branch`).
  - 최종 파일 내용은 바뀌지 않았고, 기록 전체에서 개인 이메일과 계정 이름이 0건인 것을 확인했다.
  - 앞으로의 작성자는 로컬 git 설정으로 같은 값을 쓴다([memory.md](../memory.md)).
- main을 먼저 push하고 기본 브랜치가 main인 것을 확인한 뒤, 작업 브랜치를 push했다.
- 작업 브랜치 push가 처음에 거부됐다. gh 로그인에 워크플로 파일을 올리는 `workflow` 권한이 없었기 때문이다. 사용자가 권한 추가를 승인한 뒤 다시 push했다.

### 확인 결과(2026-10-20)

- 첫 실행(작업 브랜치): 검증 성공 → 빌드 성공 → 배포 skipped(main이 아니므로)
- 실패 시험: 작업 브랜치에 포맷 오류(`src/lib/site.ts`)를 넣은 커밋을 push했다.
  - 검증이 실패했고(로그에 Prettier가 이 파일을 짚었다), 빌드와 배포는 skipped됐다.
  - 되돌리는 커밋을 push하자 검증과 빌드가 다시 성공했다. 두 커밋은 squash merge로 main 기록에 남지 않는다.
- main 배포(머지 뒤, 2026-10-20): main push로 실행된 워크플로에서 검증·빌드·배포가 모두 성공했다. 실제 사이트(`https://mivomad33.github.io/`)에서 다음을 확인했다.
  - `/`, `/portfolio/`, `/blog/`, `/about/`이 200, 없는 주소(`/no-such-page/`)는 404 페이지가 상태 코드 404로 나온다. 끝 슬래시가 없는 `/portfolio`는 `/portfolio/`로 넘어간다.
  - `/robots.txt`는 `Disallow: /`이고, 다섯 페이지 모두 noindex가 있다.
  - 글꼴과 CSS를 사이트에서 불러오고 외부 요청이 없다. 현재 메뉴 표시와 화면 아래에 붙는 푸터도 미리보기와 같다.
