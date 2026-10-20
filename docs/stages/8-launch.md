# 8단계: 도메인 연결과 공개

목적, 끝난 상태, 하위 단계는 [진행 계획](../plan.md)의 8단계를 따른다. 이 문서는 이 단계에서만 쓰는 구체적인 선택과 이유를 담고, 여러 단계가 따를 것은 [design.md](../design.md)에 적는다.

- 상태: 진행 중

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
- 남은 확인: 머지 뒤 배포된 canonical·sitemap이 새 주소인지.
