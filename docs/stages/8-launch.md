# 8단계: 도메인 연결과 공개

목적, 끝난 상태, 하위 단계는 [진행 계획](../plan.md)의 8단계를 따른다. 이 문서는 이 단계에서만 쓰는 구체적인 선택과 이유를 담고, 여러 단계가 따를 것은 [design.md](../design.md)에 적는다.

- 상태: 완료(2026-10-25). 하위 단계 1·2 완료(2026-10-21), 하위 단계 3(README) 완료(2026-10-24, 사용자 검토 통과), 하위 단계 4(공개) 완료(2026-10-25, 공개·검색 엔진 등록과 운영 흐름 확인)

## 하위 단계 1: 도메인 연결

### 작업 전 상태

- 도메인 mivomad33.dev는 Cloudflare에서 샀고 네임서버도 Cloudflare다. DNS 레코드는 없었다.
- GitHub Pages(`mivomad33/mivomad33.github.io`, GitHub Actions 배포)에는 사용자 지정 도메인이 없고, 사이트는 `https://mivomad33.github.io/`로 배포된다.
- 사이트 주소는 `src/lib/site.ts`의 `SITE` 한 곳에서 정한다. canonical, OG, sitemap, robots.txt의 주소가 모두 이 값을 따른다.

### 결정

- 루트 도메인(`mivomad33.dev`)을 대표 주소로 하고 `www`는 루트로 넘긴다. 주소가 짧고, GitHub Pages는 루트를 사용자 지정 도메인으로 정하고 `www` CNAME을 두면 `www`를 루트로 넘겨 준다.
- Cloudflare 프록시는 끄고 DNS만 쓴다(회색 구름). 프록시를 켜면 GitHub이 도메인을 확인하지 못해 Let's Encrypt 인증서를 발급하지 못하고, Cloudflare의 HTTPS 설정까지 따로 맞춰야 하기 때문이다.
- 배포는 GitHub Actions로 하므로 저장소에 `CNAME` 파일을 두지 않는다. 사용자 지정 도메인은 저장소의 Pages 설정에만 둔다(Actions 배포에서는 `CNAME` 파일을 쓰지 않는다).
- GitHub 계정에서 도메인 인증을 하고, 저장소에 도메인을 연결하기 전에 한다. 인증하지 않은 도메인은 다른 사람이 자기 Pages 저장소에 연결할 수 있고(DNS가 GitHub을 가리키는 동안), 연결과 인증 사이에도 그럴 틈이 생기기 때문이다.
- `.dev`는 브라우저가 HTTPS로만 여는 도메인(HSTS preload)이라, 인증서가 발급되기 전에는 사이트가 열리지 않는다. 공개 전이라 문제 삼지 않는다.

### DNS 레코드

모두 DNS만 사용(프록시 끔), TTL 자동이다. 값은 [GitHub 문서](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)를 따른다.

- `A` `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `AAAA` `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- `CNAME` `www`: `mivomad33.github.io`
- `TXT` `_github-pages-challenge-mivomad33`: GitHub 계정의 도메인 인증 값

### 순서

1. GitHub 계정 설정(Pages)에서 도메인 인증을 시작해 TXT 값을 받는다.
2. Cloudflare에 TXT, A, AAAA, CNAME 레코드를 넣는다.
3. GitHub에서 도메인 인증을 마친다.
4. 저장소 Pages 설정에 사용자 지정 도메인을 넣고, 인증서가 발급되면 HTTPS를 강제한다.
5. `SITE`를 바꾼 이 브랜치를 머지해 canonical·sitemap 등이 새 주소로 배포되게 한다.

### 진행 기록(2026-10-21)

- GitHub 도메인 인증: mivomad33 계정의 Pages 설정에서 mivomad33.dev를 추가해 TXT 값을 받고, DNS 반영 뒤 인증했다(Verified).
- DNS: 위 레코드 10개를 BIND 존 파일로 만들어 Cloudflare의 DNS 가져오기(Import)로 한 번에 넣었다. "Proxy imported DNS records"는 끈 채로 가져와 모두 DNS only다. 권한 네임서버와 공용 DNS(1.1.1.1, 8.8.8.8)에서 조회되는 것을 확인했다.
- Cloudflare 로그인은 Claude 데스크톱 앱의 내장 브라우저에서 봇 확인(Turnstile)을 통과하지 못해, 사용자의 Chrome(Claude in Chrome)에서 했다.
- Pages 사용자 지정 도메인: `gh api -X PUT repos/mivomad33/mivomad33.github.io/pages -f cname=mivomad33.dev`로 넣었다(`protected_domain_state: verified`). HTTPS 강제는 인증서 발급 뒤 같은 API의 `https_enforced=true`로 켠다.
- 인증서(Let's Encrypt, `mivomad33.dev`·`www.mivomad33.dev`)가 몇 분 만에 발급돼 HTTPS 강제를 켰다.

### 확인 결과(머지 전, 2026-10-21)

- `pnpm verify` 통과. 빌드 결과의 canonical·OG·sitemap·robots.txt 주소가 `https://mivomad33.dev/` 기준이고, `mivomad33.github.io`는 남아 있지 않다.
- `https://mivomad33.dev/`가 200으로 열리고 인증서가 유효하다. `http://mivomad33.dev/`, `http://`·`https://www.mivomad33.dev/`, `https://mivomad33.github.io/`(하위 경로 포함)가 모두 301로 `https://mivomad33.dev/`의 같은 경로로 넘어간다.
- 배포된 페이지에 noindex가 그대로 있다.
- GitHub 계정의 Verified domains에 mivomad33.dev가 Verified로 보인다.

### 확인 결과(머지 뒤 배포, 2026-10-21)

- main 머지 뒤 검증·빌드·배포가 모두 성공했다.
- 배포된 홈·블로그 목록·글 보기·소개의 canonical, `og:url`, `og:image`가 `https://mivomad33.dev/` 기준이고 noindex가 있다. `og.png`가 열린다.
- robots.txt는 `Disallow: /`와 `Sitemap: https://mivomad33.dev/sitemap-index.xml`이고, sitemap의 주소 9개가 모두 새 도메인이다. 배포된 HTML·robots.txt·sitemap에 `github.io`가 남아 있지 않다.

## 하위 단계 2: 샘플 콘텐츠 제거

### 한 일

- 포트폴리오와 블로그 글 없이 공개한다는 결정(2026-10-21, [진행 계획](../plan.md)의 하위 단계 2)에 따라, 샘플 포트폴리오 4개를 지우고 `portfolio.yaml`을 `[]`로 두었다. "샘플" 주석도 지웠다.
- 샘플 글 5개와 글 이미지(`images/building-this-site/`)를 지웠다.
- 글 폴더(`src/content/blog/`)는 `.gitkeep`으로 남겼다. 글을 넣을 위치가 저장소에 보이게 하기 위해서다. 블로그 로더는 `.`으로 시작하는 파일을 검사에서 빼므로 빌드에 영향이 없고, 폴더가 없어도 글 0개로 보고 빌드된다(둘 다 확인했다).
- 빌드 때 Astro가 글·포트폴리오 컬렉션이 비었다는 경고를 낸다. 내용이 없어서 나는 경고라 그대로 둔다(빌드는 성공한다).
- 프로필(`profile.yaml`)은 개요의 프로필 자료와 같은 값이라 바꾸지 않았다. 바꾸지 않았으므로 OG 이미지도 다시 만들지 않는다.
- `docs/design.md`의 데이터 파일 형식 예시(`example.com`)와 3단계 시안의 예시 데이터는 형식과 시안을 설명하는 문서라 그대로 둔다.

### 확인 결과(2026-10-21)

- `pnpm verify` 통과(페이지 5개, sitemap 주소 4개). `src/`에 `example.com`이나 샘플 글·이미지가 남아 있지 않다.
- 빌드 미리보기: 포트폴리오와 블로그 목록에 "아직 항목이 없습니다."가 보이고, 홈 본문은 비어 있다(최근 포트폴리오·최근 글 영역이 없다). 소개는 실제 프로필(활동명, 한 줄 소개, 이메일, GitHub 링크)로 보인다.
- 홈·포트폴리오·블로그·소개 모두 데스크톱과 모바일(375px)에서 가로 스크롤이 없다.
- 사용자가 프로필 값(활동명, 한 줄 소개, 이메일, GitHub 링크)이 실제 값임을 확인했다.
- 머지 뒤 배포(2026-10-21): 검증·빌드·배포가 성공했다. 배포된 사이트에서 포트폴리오·블로그에 안내 문구, 홈 본문 없음, 소개에 실제 프로필이 보이고, 지운 글 주소(`/blog/hello-world/` 등)는 404다. sitemap에는 홈·소개·블로그·포트폴리오 4개만 있고, noindex는 그대로 있다.

## 하위 단계 3: 저장소 README

### 결정(2026-10-24, 사용자)

- 한국어를 기본으로 한다. `README.md`는 한국어, `README.en.md`는 영어다. 한국어가 원문이라는 사이트 원칙과 같고, `docs/`도 한국어라서다. 두 파일은 섹션·내용·명령·링크·이미지를 같게 두고, 고칠 때 함께 고친다(`CLAUDE.md`의 문서 규칙).
- 라이선스: 코드만 MIT(`LICENSE`)로 하고, 글·이미지·프로필·포트폴리오 내용(`src/content/`, `src/data/`, `src/assets/`, `public/`, `.github/assets/`)은 모든 권리를 보유한다. `LICENSE` 파일은 GitHub이 MIT로 알아보도록 원문 그대로 두고, 범위는 README의 라이선스 절에 적는다.
- 화면 이미지: 운영 사이트(이미 공개된 콘텐츠)를 데스크톱(1280px)과 모바일(375px)로 찍어 `.github/assets/`에 둔다. 빌드 결과물에 들어가지 않게 `public/`에 두지 않는다. 화면이 크게 바뀌면 다시 찍는다.
- 개발 과정(Claude Code와 `docs/` 문서 기준 진행)을 짧게 소개하는 절을 넣는다.
- 기술 스택은 표로 쓴다. 표 금지 규칙은 `docs/` 문서의 규칙이고 README에는 적용하지 않는다(사용자 결정).

### 구성

- 머리(아이콘, 한 줄 소개, 배지, 빠른 링크, 언어 전환), 대표 화면, 소개, 주요 기능, 화면, 동작 방식(Mermaid), 품질 관리, 기술 스택, 빠른 시작, 콘텐츠 넣기, 프로젝트 구조, 문서와 개발 과정, 라이선스
- 세부 규칙(데이터 형식, 검사 항목의 이유 등)은 `docs/` 링크로 보내고 README에는 요약만 둔다.

## 하위 단계 4: 공개와 검색 엔진 등록

### 결정(2026-10-25, 사용자)

- 공개를 다시 시작한다. `ALLOW_INDEXING`을 `true`로 바꿔 noindex를 빼고 robots.txt를 `Allow: /`로 한다.
- 등록할 검색 엔진: Google, Bing, 네이버, 다음 네 곳
  - Google: mivomad33 Google 계정(Chrome에 로그인된 계정). URL 접두어 속성 `https://mivomad33.dev/`, HTML 메타 태그로 확인한다. 계획에는 DNS TXT로 적었지만, Cloudflare 화면 작업 없이 되고 Bing 가져오기가 확실히 되는 메타 태그로 바꿨다.
  - Bing: 같은 Google 계정으로 Search Console에서 가져온다(소유 확인 값이 따로 없다). Bing은 Search Console 접근 권한으로 계속 확인하므로, 그 권한을 거두면 다시 확인해야 한다.
  - 네이버: 사용자의 네이버 계정, HTML 메타 태그. 서치어드바이저는 Claude의 브라우저에서 열리지 않아 화면 조작은 사용자가 한다.
  - 다음: 사이트별 PIN(사용자만 알고 문서에 적지 않는다), robots.txt 인증 줄. 이용 동의 뒤 24개월이 지나면 초기화되어 다시 등록해야 한다(2028-10 무렵).
- 운영 흐름 확인(콘텐츠만 바꾼 커밋을 main에 바로 push)은 확인용 내용을 넣지 않고, 다음 실제 글이나 포트폴리오를 넣을 때 한다. 그때 8단계를 완료로 표시한다.

### 소유 확인 값의 위치

- 앱: `src/lib/search-verification.ts`. 메타 태그는 홈(`/`)에만 넣고(`BaseLayout`), Daum 줄은 robots.txt 맨 아래에 넣는다(`src/pages/robots.txt.ts`).
- 검사: `scripts/check-build.ts`의 `EXPECTED_VERIFICATION_META`, `EXPECTED_DAUM_LINE`. 앱 값을 가져다 쓰지 않고 따로 적었다. 값을 바꾸면 두 곳을 함께 고친다.
- 다시 확인이 필요해지는 때: 콘솔에서 사이트를 다시 등록할 때(값이 바뀐다), 사이트 주소를 바꿀 때, Bing의 Search Console 권한을 거둘 때, 다음 24개월 초기화.

### 결과(2026-10-25)

- 배포: main 머지 뒤 검증·빌드·배포가 성공했다. 운영 사이트의 모든 페이지에서 noindex가 빠졌고, robots.txt는 `Allow: /`, sitemap 주소, Daum 인증 줄 순서다. 홈에만 Google·네이버 메타 태그가 있다. 앱의 값을 일부러 바꾸면 빌드 결과 검사가 실패하는 것도 확인했다.
- Google: 소유권 확인됨(HTML 태그). `sitemap-index.xml` 제출, 상태 성공. 색인 요청은 12개 중 9개를 했고, `/en/portfolio/`, `/en/blog/building-senseful/`, `/en/blog/building-wonbook/`는 계정 하루 할당량을 넘어 하지 못했다. 사이트맵(성공)과 한국어 페이지의 hreflang·언어 전환 링크로 수집되므로 따로 요청하지 않는다(2026-10-25 사용자 결정).
- Bing: Search Console에서 가져왔다(mivomad33 Google 계정, Search Console 읽기 권한 동의). 사이트맵이 함께 들어와 상태 Success. URL 제출로 12개를 제출했다.
- 네이버: 사용자가 소유확인, 사이트맵 제출(`https://mivomad33.dev/sitemap-index.xml`), 웹 페이지 수집 요청 12개를 했다.
- 다음: 로봇룰 테스트에서 인증 완료. 사용자가 PIN으로 로그인했고, 대시보드에서 응답코드 200, 수집 가능을 확인했다. 수집 Seed URL(사이트맵)에 `https://mivomad33.dev/sitemap-index.xml`, 문서등록에 12개를 요청했다.
- 운영 흐름 확인(2026-10-25): 첫 실제 글 `specs-then-ai`(콘텐츠만 바꾼 커밋 `8d7f279`)를 main에 바로 push했다. pre-push 훅의 `pnpm verify` 통과, CI의 검증·빌드·배포 성공, 운영 주소의 두 언어 글이 200으로 열리고 sitemap에 들어갔다. 글은 [변경 7](../changes/7-write-post-skill.md)의 `write-post` 스킬로 썼다.
- hreflang: Search Console의 hreflang 오류 보고서(International Targeting)는 Google이 2022년에 없애 확인할 수 없다. 대신 운영 사이트의 영어 글 페이지에서 hreflang 링크가 도메인 기준 주소로 서로를 가리키는 것을 확인했고, 모든 페이지는 빌드 결과 검사가 배포마다 확인한다.
- 남은 일(8단계 밖, 확인만): 색인이 잡혔는지(며칠~몇 주 뒤).
- 색인 확인 방법: Google은 Search Console의 페이지 보고서나 URL 검사, Bing은 URL Inspection, 네이버는 서치어드바이저 리포트, 다음은 웹마스터도구 대시보드. `site:mivomad33.dev` 검색으로도 볼 수 있다.
