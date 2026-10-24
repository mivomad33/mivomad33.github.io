# 설계

여러 단계가 같이 쓰는 설계(기술 스택, 데이터 모델, 앱 구조, 공통 UI)를 담는다. 단계에서만 쓰는 세부는 각 단계 파일에 있다.

## 기술 스택

1단계에서 정했다. 후보 비교와 결정 이유는 [1단계 문서](stages/1-tech-stack.md)에 있다.

- 프레임워크: Astro(정적 출력)
- 스타일링: Tailwind CSS(4.x, Vite 플러그인 `@tailwindcss/vite`로 연결). 색·글꼴·간격 등 공통 값은 Tailwind 테마(`@theme`)에 모은다. UI 컴포넌트 라이브러리는 쓰지 않는다.
- 언어: TypeScript(Astro strict 설정). 타입 검사 도구가 지원하는 6.x를 쓴다(아래 버전 참고).
- 패키지 매니저: pnpm(CI에서도 pnpm을 설치해 쓴다)
- lint·포맷터: ESLint(eslint-plugin-astro) + Prettier(prettier-plugin-astro, prettier-plugin-tailwindcss로 클래스 순서 정렬)
- md 처리: Astro 내장 md 처리(Astro 7의 기본 처리기 Sätteri)와 콘텐츠 컬렉션. MDX는 쓰지 않는다.
  - 글 본문의 외부 링크 플러그인을 처리기에 넣기 위해 `@astrojs/markdown-satteri`(`astro.config.mjs`의 `markdown.processor`)와 `satteri`(플러그인 정의)를 직접 의존성으로 둔다([변경 2](changes/2-external-links.md)). `@astrojs/markdown-satteri`는 Astro가 고정한 버전과 같게 고정하고, Astro를 올릴 때 함께 맞춘다(버전이 다르면 처리기가 두 벌 설치된다). 예전 플러그인 설정(`markdown.rehypePlugins`)은 쓰지 않는다. 쓰면 예전 처리기(unified)를 따로 설치해야 하기 때문이다.
- 코드 하이라이팅: Astro 내장 Shiki, 테마 `github-light-default`(6단계에서 정했다. 이유는 [6단계 문서](stages/6-blog.md#하이라이팅-테마))
- 데이터 검증: 블로그 글 정보와 프로필·포트폴리오 데이터 파일은 콘텐츠 컬렉션 스키마(Zod)로 정의해, 빠지거나 틀리면 빌드가 실패하게 한다.
- 배포: GitHub Actions에서 검증 → 빌드 → GitHub Pages 배포(공식 `actions/upload-pages-artifact`, `actions/deploy-pages`). 검증이나 빌드가 실패하면 배포하지 않는다.
- 저장소: GitHub `mivomad33/mivomad33.github.io`(사용자 사이트). 기본 주소가 루트(`https://mivomad33.github.io/`)라서 도메인 연결 전후로 경로(`base`)가 바뀌지 않는다. 저장소는 4단계에서 만든다.
- SEO: sitemap은 `@astrojs/sitemap`(`astro.config.mjs`의 통합. `sitemap-index.xml`과 `sitemap-0.xml`을 만들고 404는 스스로 뺀다. 통합의 `i18n` 설정으로 주소마다 다른 언어 버전(`xhtml:link`)을 붙인다. [변경 1](changes/1-english-version.md)). 메타 태그(noindex 포함)는 공통 레이아웃에서, robots.txt는 라이브러리 없이 직접 만든다(`src/pages/robots.txt.ts`). 메타 태그 규칙은 아래 [메타 태그](#메타-태그)에 있다.
  - 사이트 주소: `src/lib/site.ts`의 `SITE` 하나를 `astro.config.mjs`의 `site`와 빌드 결과 검사가 같이 쓴다. 절대 주소는 같은 파일의 `siteUrl()`로 만든다. 8단계에서 이 값을 도메인으로 바꾼다.
  - robots.txt에는 수집 허용 여부와 관계없이 sitemap 주소(`Sitemap: <사이트 주소>/sitemap-index.xml`)를 넣는다.
  - 공개 전 수집 차단: `src/lib/site.ts`의 `ALLOW_INDEXING` 값 하나로 모든 페이지의 noindex와 robots.txt(`Disallow: /`)를 함께 켜고 끈다. 지금은 `false`이고 8단계에서 `true`로 바꾼다. 이유는 [4단계 문서](stages/4-foundation.md#공개-전-수집-차단)에 있다.
- 검증 도구: `astro check`(타입 검사, `@astrojs/check`와 `typescript` 설치 필요), ESLint, Prettier 검사(`--check`). E2E 도구는 쓰지 않는다.
- 실행 환경: Node 24.16 이상(`eslint-plugin-astro` 요구. Astro 7은 22.22 이상). 로컬과 CI가 같은 버전을 쓴다(`.nvmrc`의 주 버전, `package.json`의 `packageManager`의 pnpm 버전).
- 버전: 설치할 때 공개된 지 하루 이상 지난 것 중 최신 안정 버전을 쓰되, 서로의 peer 의존성 범위 안에서 정한다. pnpm(12.x)의 기본 공급망 보호 정책(`minimumReleaseAge`, 1일)을 따르는 것이다. 악성 버전이 공개 직후 설치되는 것을 막고, 이 정책이 CI 설치에서도 lockfile을 검사하기 때문이다([4단계 문서](stages/4-foundation.md#패키지와-버전)). 지금은 TypeScript 최신(7.x)을 타입 검사·lint 도구가 지원하지 않아 6.x를 쓴다.

## 페이지 구성과 URL

2단계에서 정했다. 선택지 비교와 이유는 [2단계 문서](stages/2-common-design.md)에 있다.

- 경로는 루트에서 시작하고(사용자 사이트 저장소), 도메인 연결 전후로 같다.
- 두 언어([변경 1](changes/1-english-version.md)): 모든 페이지(404 제외)가 한국어와 영어로 있다. 한국어는 아래 주소 그대로, 영어는 앞에 `/en`을 붙인다(예: `/en/`, `/en/blog/<slug>/`). 브라우저 언어를 보고 자동으로 이동시키지 않는다. 언어 목록과 언어별 경로를 만드는 함수(`localePath`, `pathWithoutLocale`)는 `src/lib/i18n.ts`에 있고, 페이지와 컴포넌트는 내부 주소를 이 함수로 만든다(영어 페이지의 링크에서 `/en`을 빠뜨리지 않게 하기 위해서다).
- 모든 페이지 주소는 끝에 슬래시를 붙인다(Astro `trailingSlash: 'always'`). 내부 링크도 슬래시를 붙여 쓴다.
- 페이지:
  - `/`: 홈. 최근 포트폴리오 3개와 최근 글 3개. 활동명은 헤더에 있으므로 화면에 다시 보이지 않고, 화면에 보이지 않는 `h1`로 둔다(7단계). 한 줄 소개(`intro`)는 소개 페이지와 겹치므로 홈 화면에 두지 않는다(2026-10-21 사용자 결정, 설명 메타 태그에는 쓴다). 그래서 포트폴리오와 글이 모두 0개면 홈 본문이 빈다. 영역마다 전체 목록(`/portfolio/`, `/blog/`) 링크를 둔다. 항목이 3개보다 적으면 있는 만큼, 0개면 그 영역을 숨긴다.
    - "최근 포트폴리오"는 `portfolio.yaml`의 앞에서부터 3개다(날짜 필드가 없으므로, 새 항목을 파일 맨 위에 적는다).
  - `/portfolio/`: 포트폴리오. 모든 항목을 카드로 보여 준다(파일에 적은 순서).
    - 항목이 0개(빈 배열 `[]`)면 제목 아래에 "아직 항목이 없습니다."를 흐린 글자색으로 보여 준다(`EmptyNotice` 컴포넌트, 글 목록도 같이 쓴다). 메뉴로 들어온 방문자에게 빈 화면이 고장 난 것처럼 보이지 않게 하기 위해서다.
  - `/about/`: 소개. 프로필(활동명, 소개, 이메일, 링크)과 프로필 이미지([변경 3](changes/3-profile-image.md)).
  - `/blog/`: 글 목록. 모든 글을 날짜 최신순으로 한 페이지에 보여 준다(페이지 나누기 없음). 항목마다 제목, 날짜, 설명.
  - `/blog/<slug>/`: 글 보기. 제목, 날짜, 본문. 본문 아래에 이전 글·다음 글 링크를 둔다.
    - 링크마다 "이전 글"/"다음 글" 표시와 그 글의 제목을 보여 줘, 누르기 전에 내용을 짐작할 수 있게 한다. 모양은 [공통 UI](#공통-ui)에 있다.
    - 이전 글은 바로 더 오래된 글, 다음 글은 바로 더 최신 글이다(글 목록과 같은 정렬 기준). 해당 글이 없으면 그쪽 링크를 숨긴다.
    - "목록으로" 링크는 두지 않는다(헤더의 "블로그"가 같은 역할이다).
  - `404.html`: 없는 주소 안내. 공통 레이아웃을 쓴다. 사이트에 하나라(GitHub Pages) 한국어와 영어를 함께 쓰고, 두 언어의 홈 링크(`/`, `/en/`)를 둔다([변경 1](changes/1-english-version.md)).
- slug는 글 폴더 이름이다([변경 1](changes/1-english-version.md)). 영문 소문자·숫자를 하이픈 하나로 이은 이름으로 쓴다(하이픈을 연달아 쓰거나 맨 앞·뒤에 둘 수 없다. 예: `first-post`). 두 언어가 같은 slug를 쓴다. 공개 뒤에는 주소가 바뀌지 않게 폴더 이름을 바꾸지 않는다. 형식이 틀린 폴더 이름, 글 폴더 안의 정해지지 않은 파일(`.MD`, `.markdown` 등 포함), 빠진 언어 파일은 빌드가 실패한다(블로그 로더가 검사한다. 아래 [데이터 파일 형식](#데이터-파일-형식)).

## 내비게이션과 공통 레이아웃 구성

- 모든 페이지가 공통 레이아웃 하나(`BaseLayout`)를 쓴다. 문서 머리(`<head>`), 헤더, 본문, 푸터를 담는다.
- 사이트 이름: 프로필의 `name`을 쓴다(헤더, 푸터의 저작권 표시, 페이지 제목). 같은 값을 코드와 데이터 파일 두 곳에 두지 않기 위해서다.
- 헤더: 사이트 이름(그 언어의 홈 링크)과 메뉴 "포트폴리오"(`/portfolio/`), "블로그"(`/blog/`), "소개"(`/about/`), 언어 전환 링크. 메뉴 이름과 주소는 페이지 언어를 따른다(영어 페이지는 `/en/...`). 현재 위치의 메뉴를 표시한다(글 보기 페이지에서는 "블로그", 홈에서는 표시 없음).
  - 언어 전환 링크([변경 1](changes/1-english-version.md)): 지금 페이지의 다른 언어 버전으로 가는 일반 링크(`<a>`) 하나다(`/blog/abc/` ↔ `/en/blog/abc/`). 화면에는 `ko/en`을 보이고 지금 언어를 표시하며, 화면 낭독기에는 이동할 언어 이름(`English`/`한국어`)을 읽힌다(`aria-label`, `hreflang`, `lang`). 404에는 두지 않는다. 모양은 아래 [공통 레이아웃](#공통-레이아웃).
- 포트폴리오 카드와 글 목록 항목은 홈과 전체 목록 페이지가 같이 쓰므로 공통 컴포넌트로 만든다. 홈의 영역(제목과 "전체 보기" 링크, `HomeSection`)도 최근 포트폴리오와 최근 글이 같이 쓴다.
- 푸터: 저작권 표시, 이메일, 프로필 `links` 전체. 값은 프로필 데이터 파일에서 가져온다.
- 색·글꼴·간격 등 시각적 값과 각 부분의 모양은 아래 [공통 UI](#공통-ui)에 있다.

### 메타 태그

7단계에서 정했다. 선택지 비교와 이유는 [7단계 문서](stages/7-seo.md#하위-단계-1-메타-태그)에 있다. `BaseLayout`이 넣고, 페이지는 값만 넘긴다(`src/lib/seo.ts`는 OG 이미지 정보와 구조화 데이터를 만든다).

- 제목: `<제목> - <활동명>`, 홈은 `<활동명>`. `og:title`은 뒤의 활동명을 뺀 페이지 제목(홈은 활동명)이고, 활동명은 `og:site_name`으로 알린다.
- 설명(`description`): 페이지마다 필수로 넘긴다. 글은 글의 `description`, 홈·소개는 프로필의 `intro`, 포트폴리오·블로그 목록은 화면 문구 사전(`src/lib/i18n.ts`의 `UI`)의 고정 문구(활동명은 프로필 값으로 넣는다). 값은 모두 페이지 언어의 것을 쓴다. 새 페이지를 만들면 그 페이지의 설명을 정해 넘긴다.
- 페이지 종류별 태그:
  - 404를 뺀 모든 페이지: `description`, canonical, `og:type`(글은 `article`, 나머지는 `website`), `og:title`, `og:description`, `og:url`(canonical과 같은 값), `og:site_name`, `og:locale`(페이지 언어: `ko_KR`, `en_US`)과 `og:locale:alternate`(다른 언어), 언어별 버전 링크(`<link rel="alternate" hreflang>`: `ko`, `en`, `x-default`(영어 페이지), 자기 자신 포함), `og:image`(그 언어의 이미지)와 크기·대체 텍스트, `twitter:card`(`summary_large_image`). 언어에 관한 태그는 [변경 1](changes/1-english-version.md)에서 더했고, 이유는 [변경 1 문서](changes/1-english-version.md#seo)에 있다.
  - 글 보기: 위에 더해 `article:published_time`, `article:modified_time`(`updated`가 있을 때만), 구조화 데이터(JSON-LD `BlogPosting`의 `datePublished`, `dateModified`, `inLanguage`(글의 언어), 작성자는 그 언어의 소개 페이지 주소). 날짜는 `YYYY-MM-DD`.
  - 404: 설명·canonical·OG·Twitter 태그, 언어별 버전 링크와 구조화 데이터를 넣지 않는다(`notFound`). 없는 모든 주소에 같은 내용으로 나가 대표 주소가 없기 때문이다.
  - 모든 페이지: 제목, 파비콘, 공개 전 noindex([기술 스택](#기술-스택)의 공개 전 수집 차단).
- 주소: canonical, `og:url`, `og:image`, 언어별 버전 링크는 사이트 주소(`SITE`) 기준 절대 주소다. 8단계에서 `SITE`를 바꾸면 따라 바뀐다.
- 이미지: OG 이미지(1200×630, 언어마다 하나: 한국어 `public/og.png`, 영어 `public/og-en.png`. 그 언어의 모든 페이지가 같이 쓴다. [변경 1](changes/1-english-version.md))와 파비콘(`public/favicon.svg`, `favicon-96.png`, `apple-touch-icon.png`). 원본은 `docs/stages/7-seo/`에 있고(OG 이미지는 `og-image.html`, `og-image-en.html`) `sh docs/stages/7-seo/make-images.sh`로 만든다. OG 이미지에는 활동명과 그 언어의 한 줄 소개가 글자로 들어 있으므로, 프로필의 두 값을 바꾸면 원본도 고쳐 다시 만든다(원본 수정을 빼먹으면 빌드 결과 검사가 실패한다. 원본만 고치고 이미지를 다시 만들지 않은 것은 검사가 잡지 못한다). 이 변경은 콘텐츠만 바꾸는 커밋이 아니므로 작업용 브랜치에서 한다.

## 데이터 파일 형식

- 공통 규칙:
  - 모든 데이터는 콘텐츠 컬렉션 스키마로 검증하고, 필수 값이 빠지거나 형식이 틀리면 빌드가 실패한다.
  - 두 언어([변경 1](changes/1-english-version.md)): 언어마다 다른 글자는 `ko`와 `en`을 모두 적어야 하고(하나라도 빠지거나 비면 빌드 실패), 언어와 관계없는 값(활동명, 이메일, 링크 주소, 날짜)은 한 번만 적는다. 영어 값에는 한글을 쓸 수 없다(번역을 잊은 것을 잡는다. 글 본문은 제외). 링크명과 포트폴리오 명칭은 두 언어가 같을 때가 많아 한 값(한글 불가)이나 `ko`·`en` 중 하나로 적는다. 언어 목록과 값을 꺼내는 함수(`localize`)는 `src/lib/i18n.ts`에 있고, 데이터를 가져오는 함수(`getProfile` 등)가 언어를 받아 그 언어의 값으로 돌려준다.
  - 사용자는 아래 필드만 적는다(`id` 같은 추가 값을 요구하지 않는다). 다른 키를 적으면 빌드가 실패한다. `links`를 `link`로 잘못 쓰는 것 같은 오타가 조용히 무시되지 않게 하기 위해서다.
  - 링크는 `label`(링크명, 필수, 한 값 또는 `ko`·`en`)과 `url`(링크 주소, 필수, `https://`나 `mailto:`로 시작하는 주소, 또는 `/`로 시작하는 사이트 안 주소. 예: `/blog/first-post/`. `//`와 `/\`로 시작하는 주소는 브라우저가 외부 주소로 읽으므로 막는다. `https://`와 `mailto:` 뒤에는 내용이 있어야 한다. 사이트 안 주소가 실제로 있는지는 검사하지 않는다) 두 필드다. 사이트 안 주소는 기본 언어(한국어) 경로로 적고, 영어 페이지에서는 `/en`이 붙은 주소로 바뀐다(`localizeLink`, [변경 5](changes/5-localized-internal-links.md)).
  - 프로필은 헤더·푸터가 쓰므로 4단계에서, 포트폴리오는 5단계에서, 블로그는 6단계에서 만들었다.
  - Astro 기본 파일 로더(`file()`)의 동작(4단계에서 Astro 7.4 소스로 확인했다):
    - 단일 객체 파일: 최상위 키(`name`, `intro` 등)를 각각 다른 항목으로 나눠 읽는다.
    - 배열 파일: 항목마다 `id`(또는 `slug`) 필드를 요구한다. 위 공통 규칙과 맞지 않는다.
    - 파일을 읽지 못하면(YAML 문법 오류 등) 로그만 남기고, 이전 빌드에서 저장해 둔 데이터를 그대로 써서 빌드가 성공해 버린다.
  - 그래서 YAML 데이터 파일은 직접 만든 로더(`src/lib/yaml-loader.ts`)로 읽는다. 읽기 오류와 형식 오류(객체·배열이 아닌 파일, 빈 파일)에서 빌드를 멈춘다. 세부는 [5단계 문서](stages/5-home-portfolio-about.md#로더)에 있다.
    - 프로필(`yamlObjectLoader`): 파일 전체를 항목 하나로 읽는다.
    - 포트폴리오(`yamlArrayLoader`): 배열의 위치(1부터)를 `id`로 쓰고, 가져오는 함수가 `orderById`로 파일 순서대로 정렬한다.
  - 블로그 글은 기본 `glob()` 로더를 감싼 `blogLoader`(`src/lib/blog-loader.ts`)로 읽는다. 기본 로더는 읽기·문법·스키마 오류에서 빌드를 멈추지만(이전 빌드 데이터로 숨기지 않는다), 틀린 파일 이름을 slug 형식으로 바꿔 통과시키고, frontmatter의 날짜를 Date로 바꾸면서 `2026-13-45` 같은 값을 오류 없이 다른 날짜로 넘긴다. `.MD` 같은 확장자와 패턴 밖의 파일은 오류 없이 건너뛴다. 그래서 감싼 로더가 글 폴더의 구조를 모두 검사하고(글마다 `<slug>/` 폴더, 그 안에 `ko.md`·`en.md`와 `images/`만), 언어 파일의 `date`·`updated`가 같은지와 영어 글의 제목·설명에 한글이 없는지 검사한다([변경 1](changes/1-english-version.md)). 항목 id는 `<slug>/<언어>`이고, 글을 가져오는 함수(`getPosts` 등)가 언어를 받아 그 언어의 글에 `slug`를 붙여 돌려준다(주소는 id가 아니라 `slug`로 만든다). 날짜는 적힌 문자열 그대로 스키마에 넘겨 `YYYY-MM-DD` 형식의 실제 날짜인지 검사하게 한다. 세부는 [6단계 문서](stages/6-blog.md#로더)에 있다.
- 프로필: `src/data/profile.yaml`
  - `name`: 활동명(필수)
  - `intro`: 한 줄 소개(필수, `ko`·`en`)
  - `email`: 이메일 주소(필수, 이메일 형식)
  - `links`: 링크 목록(0개 이상, 예: GitHub)
- 포트폴리오: `src/data/portfolio.yaml`. 파일 전체가 항목 배열이고, 파일에 적은 순서대로 표시한다(순서 값은 따로 두지 않는다). 항목이 없으면 빈 배열 `[]`를 적는다(빈 파일은 빌드가 실패한다).
  - `name`: 명칭(필수, 한 값 또는 `ko`·`en`)
  - `description`: 설명(필수, `ko`·`en`)
  - `links`: 링크 목록(0개 이상)
- 블로그 글: 글마다 폴더 하나(`src/content/blog/<slug>/`)에 언어별 파일 `ko.md`, `en.md`를 둔다([변경 1](changes/1-english-version.md)). 둘 다 있어야 하고, 그 밖에는 `images/`만 둘 수 있다. 아래는 각 파일의 frontmatter이고 본문은 md다. `date`와 `updated`는 두 파일이 같아야 하고, `en.md`의 `title`·`description`에는 한글을 쓸 수 없다.
  - `title`: 제목(필수)
  - `description`: 한두 문장 요약(필수). 글 목록의 설명과 검색 결과 설명에 쓴다.
  - `date`: 게시일(필수, `YYYY-MM-DD`. 따옴표로 감싸도 된다. 시각을 붙이거나 없는 날짜를 적으면 빌드가 실패한다). 날짜만 적은 값은 UTC 자정으로 읽히므로, 표시할 때는 UTC 기준으로 연·월·일을 꺼낸다(`timeZone: 'UTC'`). 실행 환경의 시간대에 따라 날짜가 하루 밀리지 않게 하기 위해서다. 표시 형식은 [공통 UI](#공통-ui)에 있다.
  - `updated`: 수정일(선택, `YYYY-MM-DD`). 글을 크게 고쳤을 때만 적는다. 있으면 글 보기에 수정일을 함께 표시하고, 7단계에서 검색 엔진에 수정 시점을 알리는 데 쓴다. `date`와 같은 방식으로 UTC 기준으로 표시하며, `date`보다 이르면 빌드가 실패한다.
  - 정렬: `date` 최신순, 같으면 slug 오름차순.
  - 이미지: 글 폴더의 `images/`(`src/content/blog/<slug>/images/`)에 두고 두 언어 글이 같이 쓴다. 본문에서 상대 경로로 넣는다(예: `![화면 구성](./images/layout.png)`). 대체 텍스트는 그 글의 언어로 쓴다([변경 1](changes/1-english-version.md)). 빌드할 때 크기를 줄인 webp로 바뀌고 너비·높이가 붙으며, 파일이 없으면 빌드가 실패한다. `public/`에 두는 방식은 파일이 없어도 빌드가 통과해 쓰지 않는다. 대체 텍스트(`[` `]` 안)는 반드시 적는다. 이유는 [6단계 문서](stages/6-blog.md#이미지)에 있다.

예시:

```yaml
# src/data/profile.yaml
name: mivomad33
intro:
  ko: 1인 사업가를 꿈꾸는 개발자
  en: A developer who dreams of becoming a solo entrepreneur
email: mivomad33@gmail.com
links:
  - label: GitHub
    url: https://github.com/mivomad33
```

```yaml
# src/data/portfolio.yaml
- name: Sample project
  description:
    ko: 프로젝트 설명
    en: Project description
  links:
    - label:
        ko: 사이트
        en: Site
      url: https://example.com
    - label: GitHub
      url: https://github.com/mivomad33
- name:
    ko: 링크 없는 프로젝트
    en: Project without links
  description:
    ko: 공개 링크가 없는 항목도 넣을 수 있다.
    en: An item without a public link can be listed too.
```

```md
<!-- src/content/blog/first-post/ko.md (en.md도 같은 형식에 영어로 쓰고, date·updated는 같게 둔다) -->
---
title: 첫 글
description: 사이트를 만든 과정을 정리한다.
date: 2026-10-20
# updated: 2026-11-01  (크게 고쳤을 때만)
---

본문
```

## 디렉터리 구조

Astro 기본 구조를 따른다. `src/` 아래에 이 목록에 없는 폴더나 역할이 다른 파일을 새로 만들 때는 이 목록에 먼저 추가한다. 루트의 설정 파일(`astro.config.*`, `package.json`, ESLint·Prettier 설정 등)은 4단계에서 만들며 목록에 적지 않는다.

- `.github/workflows/`: 검증·빌드·배포 워크플로(`deploy.yml`)
- `.github/actions/`: 워크플로의 작업들이 같이 쓰는 단계(`setup/`: pnpm·Node·의존성 설치)
- `.github/assets/`: README에 넣는 화면 이미지(빌드에 들어가지 않는다)
- `.githooks/`: 저장소의 Git 훅(`pre-push`: push 전 검증). `pnpm install`의 `prepare` 스크립트가 이 폴더를 Git 훅 폴더로 연결한다([변경 1](changes/1-english-version.md)).
- `public/`: 가공 없이 그대로 복사할 파일(파비콘, OG 이미지)
- `src/assets/`: 페이지에서 import해 쓰는 이미지(소개 페이지의 프로필 이미지). 파일이 없으면 빌드가 실패한다.
- `scripts/`: 빌드 과정에서 Node로 실행하는 스크립트(`check-build.ts`: 빌드 결과 검사)
- `src/pages/`: 페이지. 파일 위치가 곧 URL이다. 언어마다 있는 페이지는 `[...locale]/` 아래에 두고(`index.astro`, `portfolio/index.astro`, `about/index.astro`, `blog/index.astro`, `blog/[slug].astro`), 페이지 파일 하나가 `getStaticPaths`(`localeStaticPaths`)로 두 언어 페이지를 모두 만든다(한국어는 접두어 없이, 영어는 `/en/`. [변경 1](changes/1-english-version.md)). 같은 화면을 언어마다 따로 두면 한쪽만 고치는 실수가 생기기 때문이다. 사이트에 하나뿐인 `404.astro`와 robots.txt를 만드는 `robots.txt.ts`는 `src/pages/` 바로 아래에 둔다.
- `src/layouts/`: 공통 레이아웃(`BaseLayout.astro`)
- `src/components/`: 여러 곳에서 쓰는 UI 부품
- `src/lib/`: 여러 페이지가 쓰는 로직(글 목록 정렬, 날짜 표시, 데이터 가져오기, 콘텐츠 로더, 사이트 설정 값, 메타 태그 값, 언어(`i18n.ts`), 외부 링크 규칙(`link.ts`)과 글 본문 md 플러그인(`markdown-external-links.ts`) 등)
- `src/content/blog/`: 블로그 글. 글마다 `<slug>/` 폴더에 언어별 md(`ko.md`, `en.md`)와 글에 넣는 이미지(`images/`)
- `src/data/`: 프로필·포트폴리오 데이터 파일
- `src/styles/global.css`: Tailwind 불러오기, 테마(`@theme`), 이름 붙인 유틸리티(`@utility`)
- `src/content.config.ts`: 콘텐츠 컬렉션과 스키마 정의
- `docs/`: 프로젝트 문서

## 코드 규칙

lint·포맷터가 자동으로 잡는 것은 적지 않는다.

- 파일 이름: 컴포넌트·레이아웃은 PascalCase(`PostList.astro`), `src/lib/`의 TS 파일은 kebab-case(`format-date.ts`), 페이지는 URL에 맞춰 소문자.
- 공통 코드: 두 곳 이상에서 쓰는 UI는 `src/components/`, 로직은 `src/lib/`에 두고 그것을 쓴다(CLAUDE.md 작업 규칙). 한 페이지에서만 쓰는 부분은 그 페이지에 둔다.
- 데이터 접근: 페이지는 컬렉션을 직접 정렬·가공하지 않고 `src/lib/`의 함수(예: 정렬된 글 목록)로 가져온다. 정렬 기준이 곳곳에 따로 생기지 않게 하기 위해서다.
- 스타일:
  - Tailwind 클래스를 마크업에 쓴다. 색·글꼴·간격 등은 `@theme`에 정의한 값만 쓰고, 임의 값(`text-[13px]`, `bg-[#333]`)과 인라인 스타일을 쓰지 않는다. 필요한 값이 없으면 테마에 추가한다.
  - 반복되는 클래스 묶음은 `@apply`가 아니라 컴포넌트로 뽑는다.
  - 테마 값으로 정할 수 없는 레이아웃 값(격자 칸 구성 등)이 필요하면 임의 값 대신 `global.css`에 `@utility`로 이름을 붙여 정의한다. 어떤 유틸리티가 있는지는 `global.css`의 주석을 본다.
  - 컴포넌트의 `<style>`은 Tailwind 클래스로 할 수 없는 경우(예: md 본문처럼 마크업을 직접 쓰지 않는 영역)에만 쓴다.
- Node 전역 변수: `src/`에서는 `process`, `Buffer` 같은 Node 전역 변수를 쓰지 않는다(lint로 막는다). Node 기능이 필요하면(콘텐츠 로더 등) `node:` 모듈을 import한다.
- 클라이언트 JS: 기본으로 쓰지 않는다. UI 프레임워크(React 등)와 `client:*` 지시어를 쓰지 않는다. 꼭 필요하면 이유를 해당 단계 문서에 적는다.
- TypeScript: 컴포넌트 props는 `Props` 인터페이스로 정의한다. `any`를 쓰지 않는다.
- 마크업: 의미에 맞는 태그를 쓴다(`header`, `nav`, `main`, `article`, `footer`). `<html lang>`은 페이지 언어(`ko`, `en`)다. 이미지에는 `alt`를 넣는다.
- 링크([변경 2](changes/2-external-links.md)): 데이터 파일의 링크처럼 외부인지 사이트 안인지 미리 알 수 없는 주소는 `Link` 컴포넌트로 쓴다. 외부 링크를 `<a>`로 직접 쓰지 않는다(새 탭 속성과 표시가 빠진다. 빌드 결과 검사가 막는다). 글 본문(md)의 링크는 md 플러그인이 같은 규칙으로 처리하므로 글에서는 마크다운 링크 문법을 쓰고, HTML `<a>`를 직접 쓰지 않는다(플러그인이 처리하지 못한다).
- 화면 문구(메뉴, "전체 보기", 빈 목록 안내, 목록 페이지 설명, 화면 낭독기용 이름 등)는 코드에 바로 쓰지 않고 `src/lib/i18n.ts`의 언어별 사전(`UI`)에 두고 쓴다([변경 1](changes/1-english-version.md)). 영어 사전의 타입을 한국어 사전으로 정해, 문구가 하나라도 빠지면 타입 검사가 실패한다. 새 문구를 넣으면 두 언어를 함께 적는다.

## 테스트 전략

- 빌드 시점 검증(필수): 다음이 모두 통과해야 배포한다. 로컬에서도 같은 명령으로 확인한다.
  - 명령: `pnpm check`(타입 검사, lint, 포맷 검사), `pnpm build`(빌드와 빌드 결과 검사), `pnpm verify`(둘을 차례로. 로컬에서 머지 전에 실행한다). 구성 이유는 [4단계 문서](stages/4-foundation.md#검증-명령)에 있다.
  - push 전 검증([변경 1](changes/1-english-version.md)): Git `pre-push` 훅(`.githooks/pre-push`, 실행 권한 755)이 `pnpm verify`를 실행해, 실패하면 push를 멈춘다. `pnpm install`의 `prepare` 스크립트(`git config core.hooksPath .githooks`)가 훅을 연결하므로 새로 클론해도 설치하면 켜진다. `.git`이 없는 폴더(ZIP으로 받은 경우 등)에서는 연결을 건너뛰어 설치가 실패하지 않는다. 다만 pnpm은 `node_modules`가 이미 최신이면 `prepare`를 건너뛰므로, 이미 설치된 폴더에서는 `pnpm run prepare`를 한 번 실행한다. pnpm을 찾지 못하면(GUI Git 도구처럼 PATH가 다른 곳) 검증할 수 없다고 알리고 push를 멈춘다. 훅은 커밋이 아니라 작업 폴더를 검사하고, 브랜치 삭제 push에도 검증을 돌린다(시간만 더 걸려 그대로 둔다). `git push --no-verify`나 GitHub 웹 편집으로 건너뛸 수 있다. 그래서 훅은 빨리 알려 주는 장치이고, 배포를 실제로 막는 것은 CI의 검증·빌드다. GitHub 브랜치 보호(필수 상태 검사)는 쓰지 않는다(이유는 [변경 1 문서](changes/1-english-version.md#두-언어-강제)).
  - 타입 검사: `astro check`
  - lint: ESLint
  - 포맷 검사: Prettier `--check`. 글(`src/content/blog/`)과 데이터 파일(`src/data/`)은 검사에서 뺀다(`.prettierignore`). 직접 쓴 글의 형식이 포맷 규칙과 조금 달라도 배포가 막히지 않게 하기 위해서다. 이 파일들의 형식은 스키마 검증이 맡는다. `docs/`와 `CLAUDE.md`도 배포되는 파일이 아니므로 검사에서 뺀다.
  - 데이터 형식: `astro build`(콘텐츠 컬렉션 스키마 검증 포함)
- 빌드 결과 검사: `scripts/check-build.ts`가 `astro build` 뒤에 `dist/`를 읽어 확인한다(`pnpm build`에 포함되어 CI의 빌드 작업에서도 실행되고, 실패하면 배포되지 않는다). 동작과 이유는 [7단계 문서](stages/7-seo.md#하위-단계-2-sitemaprobotstxt와-빌드-결과-검사)에 있다.
  - 모든 페이지: 제목, 파비콘(파일이 있는지 포함), noindex가 `ALLOW_INDEXING`과 맞는지, 같은 태그가 두 번 들어가지 않았는지
  - 메타 태그: [메타 태그](#메타-태그)의 페이지 종류별 규칙(있어야 할 태그, 정해진 값(`twitter:card`, `og:site_name`, `og:description`=`description`, 주소), 404에 없어야 할 태그). 글 보기는 글 폴더(`src/content/blog/<slug>/`)가 있는 `/blog/<slug>/`, `/en/blog/<slug>/` 페이지이고, 글마다 페이지가 있는지도 본다.
  - 두 언어([변경 1](changes/1-english-version.md)): 404를 뺀 모든 페이지가 모든 언어로 있는지, `<html lang>`·`og:locale`·`og:locale:alternate`가 주소의 언어에 맞는지, 언어별 버전 링크(`ko`, `en`, `x-default`)가 실제 있는 페이지를 가리키는지(모든 페이지가 통과하면 서로를 가리킨다), 언어 전환 링크가 같은 페이지의 다른 언어 버전을 가리키는지, 언어마다 `og:image`가 하나이고 서로 다른지, 글의 구조화 데이터 `inLanguage`. 404는 기본 언어이고 언어별 버전 링크와 언어 전환 링크가 없다. 언어 목록과 경로는 `src/lib/i18n.ts`의 값을 쓴다.
  - sitemap에 404를 뺀 모든 페이지가 있고 그 밖의 주소가 없는지, 주소마다 모든 언어 버전(`xhtml:link`)이 붙어 있는지, robots.txt의 규칙(반대 규칙이 없는지 포함)과 sitemap 주소
  - 언어별 OG 이미지 원본(`og-image.html`, `og-image-en.html`)의 활동명·한 줄 소개(`data-profile`)가 프로필 데이터(한 줄 소개는 그 언어의 값)와 같은지
  - 외부 링크([변경 2](changes/2-external-links.md)): 모든 페이지의 `<a>` 가운데 외부 링크(`src/lib/link.ts`의 `isExternalUrl`)는 새 탭 속성(`target="_blank"`, `rel="noopener"`)과 링크 컴포넌트·md 플러그인이 만드는 마크업(링크 글자, 페이지 언어의 문구를 화면 낭독기 이름으로 가진 아이콘)을 그대로 갖는지, 외부가 아닌 링크에 `target`이 없는지. 컴포넌트·플러그인을 거치지 않은 링크를 잡는다.
  - 새 페이지를 만들면 메타 태그 규칙만 지키면 되고 검사를 고칠 필요는 없다. 메타 태그 규칙을 바꾸면 검사도 함께 고친다.
- 사람 검토: 단계마다 로컬 빌드 미리보기(`astro build` 뒤 `astro preview`)로 화면을 확인한다.
- 하지 않는 것: 단위 테스트, 화면 비교 테스트, E2E. `src/lib/`의 로직이 화면만 보고 확인하기 어려울 만큼 복잡해지면 그 부분에 단위 테스트(Vitest)를 추가한다.

## 공통 UI

3단계에서 정했다. 시안 비교와 결정 이유는 [3단계 문서](stages/3-ui-design.md)에 있다.

- 방향: 개발자 모노형. 고정폭 글꼴로 쓴 기호와 날짜, 초록 강조색 하나로 개발자 사이트라는 것을 드러내고, 나머지는 장식 없이 둔다.
- 기준 시안: [c-mono.html](stages/3-ui-design/c-mono.html). 아래에 적지 않은 세부(여백, 정렬 등)는 이 시안을 따른다. 시안을 고치면 이 절도 함께 고친다.

### 디자인 값

`src/styles/global.css`의 `@theme`에 아래 이름 그대로 정의한다. Tailwind 기본 값은 모두 지우고(`--*: initial`) 아래 값만 쓴다. 그래서 아래에 없는 값(예: `text-red-500`, `shadow-md`)은 클래스가 만들어지지 않는다. 화면 폭 기준(`--breakpoint-sm: 40rem`)도 함께 다시 정의한다.

- 색:
  - `--color-bg: #fcfcfc` 배경
  - `--color-surface: #f3f4f6` 인라인 코드 등 회색 면
  - `--color-text: #1f2328` 본문 글자
  - `--color-muted: #656d76` 날짜, 설명 등 흐린 글자
  - `--color-border: #d0d7de` 구분선, 테두리
  - `--color-accent: #1a7f37` 강조(링크, 현재 메뉴, 기호)
  - 배경 대비: 본문 15.4:1, 흐린 글자 5.1:1, 강조 4.9:1(WCAG AA 4.5:1 이상)
- 글꼴:
  - `--font-sans: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`
  - `--font-mono: 'JetBrains Mono', 'Pretendard Variable', Pretendard, ui-monospace, Menlo, monospace`
- 글자 크기: `--text-xs: 0.75rem`, `--text-sm: 0.8125rem`, `--text-base: 0.9375rem`, `--text-lg: 1.0625rem`, `--text-xl: 1.25rem`, `--text-2xl: 1.625rem`
  - 글자 크기에는 줄 간격 짝(`--text-*--line-height`)을 두지 않는다. 그래서 `text-*`는 글자 크기만 바꾸고 줄 간격은 부모 값을 이어받는다(본문은 `leading-normal`, 글 본문은 `leading-relaxed`). 제목처럼 다른 줄 간격이 필요한 곳은 `leading-*`를 함께 쓴다. 시안이 글자 크기와 줄 간격을 따로 정한 것과 같은 방식이다.
- 줄 간격: `--leading-tight: 1.4`(제목), `--leading-normal: 1.65`(기본), `--leading-relaxed: 1.8`(글 본문)
- 굵기: 보통(400)과 굵게(`--font-weight-bold: 700`) 두 가지만 쓴다.
- Tailwind의 기본 스타일 초기화(preflight)는 제목(`h1`~`h6`)의 굵기·크기와 목록 기호를 지운다. 아래에서 "굵게"나 목록 기호를 적은 곳은 클래스나 본문 스타일로 직접 지정한다(시안은 브라우저 기본 스타일 덕분에 굵게 보인다).
- 간격: `--spacing: 0.25rem`(Tailwind 기본). 모든 여백은 이 값의 배수다(0.5 단위 포함. 예: `gap-1.5`, `pt-0.5`).
- 본문 최대 폭: `--container-content: 46rem`. 좌우 여백은 `--spacing`의 5배(1.25rem)다.
- 모서리: `--radius-sm: 0.25rem`(코드)
- 화면 폭 기준: Tailwind 기본 `sm`(40rem) 하나만 쓴다. 그보다 좁으면 한 줄에 하나씩 쌓는다.

### 글꼴 쓰는 규칙

- 한글이 들어가는 문장(제목, 소개, 링크명, 메뉴, 화면 문구)은 `font-sans`로 쓴다. JetBrains Mono에는 한글이 없고 공백이 넓어, 한글 문장에 쓰면 띄어쓰기가 벌어져 보이기 때문이다.
- `font-mono`는 기호(`~/`, `#`, `##`, `>`, `[ ]`, `→`, `←`), 날짜, 사이트 이름, 코드에만 쓴다.
  - 화살표 `→`, `←`는 JetBrains Mono의 라틴 부분 집합에 없어 실제로는 대체 글꼴(Pretendard)로 표시된다. 시안도 같은 모양이므로 그대로 둔다.
- 웹 폰트는 CDN이 아니라 npm 패키지로 설치해 사이트와 함께 배포한다(Pretendard 가변 글꼴의 dynamic subset, JetBrains Mono의 400·700 굵기와 라틴 문자만). 외부 서버에 요청하지 않아 방문자 정보가 넘어가지 않고, 버전이 lockfile로 고정되기 때문이다.
  - 패키지: `pretendard`(`dist/web/variable/pretendardvariable-dynamic-subset.css`), `@fontsource/jetbrains-mono`(`latin-400.css`, `latin-700.css`)
  - 불러오는 방법: `BaseLayout`에서 CSS를 import한다. 빌드할 때 글꼴 파일이 사이트에 함께 들어가고, 브라우저는 페이지에 쓰인 글자의 부분 집합만 받는다.
- 한글은 단어 단위로 줄바꿈하고(`word-break: keep-all`), 긴 주소처럼 끊을 곳이 없는 문자열은 아무 데서나 줄바꿈해(`overflow-wrap: anywhere`) 화면 밖으로 넘치지 않게 한다.

### 날짜 표시

- 형식: `YYYY-MM-DD`(예: `2026-10-20`). 월·일은 두 자리로 채운다. UTC 기준으로 꺼낸다([데이터 파일 형식](#데이터-파일-형식) 참고).
- `<time datetime="2026-10-20">`으로 감싸고 `font-mono`, `text-sm`, 흐린 글자색으로 쓴다.
- 수정일이 있으면 게시일 뒤에 `· 수정 2026-11-01`처럼 붙인다. "수정"은 한글이므로 `font-sans`로 쓴다.
- 날짜를 문자열로 바꾸는 함수(`formatDate`)는 `src/lib/`에 하나만 두고, `<time>` 마크업은 `PostDate` 컴포넌트로 같이 쓴다(글 목록, 글 보기).

### 공통 레이아웃

- 헤더: 사이트 이름 앞에 강조색 `~/`(고정폭, 굵게). 메뉴는 오른쪽에 두고 흐린 글자색으로 쓴다. 아래에 점선 구분선.
  - 현재 메뉴: 강조색 굵은 글자를 `[블로그]`처럼 고정폭 괄호로 감싼다. 다른 메뉴에도 투명한 괄호를 둬, 현재 메뉴가 바뀌어도 글자 위치가 움직이지 않게 한다.
  - 언어 전환 링크: 메뉴 뒤에 `--spacing`의 4배 간격을 두고 놓는다. 두 언어 코드를 `ko/en`처럼 고정폭 `text-sm`으로 붙여 쓰고(사이 간격 `--spacing`의 0.5배), 전체가 링크 하나다. 지금 언어는 강조색 굵게, 나머지(다른 언어와 `/`)는 흐린 글자색이고, 마우스를 올리면 나머지가 본문 글자색이 된다. 테두리는 두지 않는다. 시안 비교와 결정 이유는 [변경 1 문서](changes/1-english-version.md#언어-전환-링크)에 있다.
  - 화면이 좁아 한 줄에 들어가지 않으면 메뉴와 언어 전환 링크가 사이트 이름 아래 줄로 내려간다.
- 푸터: 위에 점선 구분선. 왼쪽에 저작권 표시(고정폭), 오른쪽에 이메일과 링크(흐린 글자색).
  - 내용이 적어도 푸터는 화면 맨 아래에 붙는다(`<body>`에 화면 높이 `min-h-dvh`를 최소로 주고 `<main>`이 남는 높이를 채운다). 시안은 내용 바로 뒤에 붙어 내용이 적으면 화면 중간에 떠 보였기 때문이다. 휴대폰 주소창이 나타났다 사라져도 맞도록 `dvh`를 쓴다.
- 페이지 제목(`h1`): `text-2xl` 굵게, 앞에 강조색 `# `(고정폭).
- 404: 페이지 제목(한국어) 아래에 영어 제목 "Page not found"(`text-xl`, 흐린 글자색, 소개 페이지의 한 줄 소개처럼 제목에 붙인다), 그 아래 한 줄에 "홈으로 가기"와 "Go to home" 링크(강조색, 마우스를 올리면 밑줄. 처음 시안은 일반 글자색이었지만 링크로 보이지 않아 바꿨다). 헤더 메뉴와 푸터는 한국어다. [변경 1 문서](changes/1-english-version.md#404)의 시안을 따른다.
- 홈의 영역 제목: 굵게, 앞에 강조색 `## `(고정폭). 오른쪽에 "전체 보기 →"(`text-sm`, 흐린 글자색).
- 소개 페이지의 프로필 이미지(`src/assets/profile.svg`, 사용자가 만든 아이보리 배경의 픽셀 그림): 64px, 원형(`rounded-full`, [변경 4](changes/4-profile-image-round.md)), 테두리 없음, 꾸밈 이미지(`alt=""`). 넓은 화면(`sm` 이상)에서는 소개 내용 전체 오른쪽에 위쪽을 맞춰 두고, 좁은 화면에서는 제목 위로 올린다(내용과의 간격은 `--spacing`의 6배). 크기·위치를 정한 이유는 [변경 3 문서](changes/3-profile-image.md#설계)에, 원형으로 바꾼 이유는 [변경 4 문서](changes/4-profile-image-round.md#배경)에 있다.

### 외부 링크

[변경 2](changes/2-external-links.md)에서 정했다. 시안 비교와 결정 이유는 변경 문서에 있다.

- 외부 링크(사이트 밖 http(s) 주소)는 새 탭에서 연다. 사이트 안 링크와 `mailto:`는 지금처럼 현재 탭에서 연다.
- 표시: 링크 글자 바로 뒤에 작은 아이콘(상자에서 나가는 화살표, 폭 0.8em, 링크 글자와 간격 `--spacing`의 1배). 색은 링크 글자색을 따르고(`currentColor`), 마우스를 올려 링크 색이 바뀌면 함께 바뀐다. 모양은 `global.css`의 `external-icon` 유틸리티 하나가 정한다.
- 화면 낭독기에는 링크 이름 뒤에 "(새 탭에서 열림)"/"(opens in a new tab)"을 읽힌다(사전의 `newTab`). 문구는 숨긴 글자가 아니라 아이콘의 이름(`role="img"`, `aria-label`)으로 둔다. 숨긴 글자로 두면 제목 안의 외부 링크에서 제목 id와 목차 글자에 문구가 섞이기 때문이다([변경 2 문서](changes/2-external-links.md#표시)).
- 링크가 줄바꿈되어도 아이콘은 마지막 글자와 같은 줄에 남고, 밑줄이 있는 링크(글 본문)에서 아이콘에는 밑줄이 없다. 이를 위한 마크업 구조와 규칙은 `src/lib/link.ts`에 있다.

### 목록 항목

- 포트폴리오 카드: 상자 없이 왼쪽 세로선(2px, 구분선 색)으로 묶고, 마우스를 올리면 선이 강조색이 된다. 명칭(굵게), 설명(흐린 글자색), 링크 순서로 쌓는다. 링크는 강조색 `text-sm`, 앞에 `→ `(고정폭). 외부 링크는 뒤에 [외부 링크](#외부-링크) 아이콘이 붙는다.
- 글 목록 항목: 넓은 화면에서는 날짜를 왼쪽 칸에, 제목과 설명을 오른쪽 칸에 둔다. 제목은 굵게 쓴다. 좁은 화면에서는 날짜, 제목, 설명 순서로 쌓는다. 설명은 `text-sm` 흐린 글자색.

### 글 보기

- 제목 `text-2xl` 굵게, 아래에 날짜.
- 이전·다음 글: 본문 아래에 점선으로 나눈 두 줄. 줄마다 강조색 표시(`← 이전 글`, `다음 글 →`, 화살표는 고정폭)와 그 글의 제목을 둔다. 넓은 화면에서는 표시와 제목을 한 줄에, 좁은 화면에서는 두 줄로 쓴다. 이전 글이 위, 다음 글이 아래다.
- 글 본문(md) 요소: 줄 간격 `leading-relaxed`, 요소 사이 간격 `--spacing`의 5배.
  - 제목: 굵게. `h2`는 `text-xl`, `h3`는 `text-lg`이고 앞에 강조색 `## `, `### `(고정폭)를 붙인다. 위쪽 간격을 넓게 둔다.
  - 목록: 순서 없는 목록의 기호는 `- `, 순서 있는 목록은 숫자. 기호는 직접 지정한다(preflight가 지우므로).
  - 링크: 강조색, 밑줄. 외부 링크는 밑줄을 링크 글자에만 긋고 뒤에 [외부 링크](#외부-링크) 아이콘이 붙는다.
  - 인용: 왼쪽 강조색 세로선(2px), 흐린 글자색.
  - 인라인 코드: `font-mono` `text-sm`, 회색 면, `radius-sm`.
  - 표: 가로선만 쓴다. 제목 줄은 굵게, 아래에 본문 글자색 실선(1px). 행 사이는 구분선 색 점선(1px). `text-sm`, 칸 안쪽 여백 위아래 `--spacing`의 2배·좌우 3배, 왼쪽 정렬. 칸 안에서는 단어 단위로만 줄바꿈하고(사이트 전체의 `overflow-wrap: anywhere`를 끈다), 넘치면 표 안에서 가로 스크롤. 상자 없이 가는 사이트에서 표만 무거워지지 않게, 헤더·푸터의 점선과 같은 결로 정했다(6단계).
  - 수평선: 구분선 색 점선(1px, 헤더·푸터와 같다), 위아래 간격 `--spacing`의 10배.
  - 코드(인라인, 블록)는 합자를 끈다(`font-variant-ligatures: none`). JetBrains Mono는 `=>`를 `⇒`처럼 합쳐 보여 주는데, 독자가 실제로 칠 글자 그대로 보이게 하기 위해서다.
  - 코드 블록: `font-mono` `text-sm`, 안쪽 여백 `--spacing`의 4배, 구분선 색 테두리, `radius-sm`, 넘치면 블록 안에서 가로 스크롤. 배경색(흰색)과 문법 색은 하이라이팅 테마(`github-light-default`)를 따른다.
