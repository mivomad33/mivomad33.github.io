// 변경 1(영어 버전) 시안: 예시 데이터, 화면 문구, 화면 마크업, 화면 전환.
// 화면 마크업은 3단계 시안(docs/stages/3-ui-design/shared.js)과 같고, 실제 사이트에서 달라진 점(홈 한 줄 소개 없음)과
// 언어(ko/en), 언어 전환 링크 3안을 더했다.
// 주소: index.html?v=a#/en/blog/  (v: 언어 전환 링크 안 a|b|c, # 뒤: 화면 경로. frame=1이면 도구 막대를 숨긴다)
(() => {
  const params = new URLSearchParams(location.search);
  // 언어 전환 링크 안. b1·b2는 B안을 사용자 의견(전체를 토글 하나로, 간격을 좁게)대로 바꾼 것이다.
  const VARIANTS = ['a', 'b', 'b1', 'b2', 'c'];
  // 기본은 사용자가 고른 B1안(2026-10-21). 나머지 안은 비교 기록으로 남긴다.
  const variant = VARIANTS.includes(params.get('v')) ? params.get('v') : 'b1';
  const inFrame = params.get('frame') === '1';

  // ---- 화면 문구(실제 구현에서는 src/lib/i18n.ts의 사전) ----
  const strings = {
    ko: {
      menu: { portfolio: '포트폴리오', blog: '블로그', about: '소개' },
      navLabel: '주 메뉴',
      recentPortfolio: '최근 포트폴리오',
      recentPosts: '최근 글',
      viewAll: '전체 보기',
      empty: '아직 항목이 없습니다.',
      email: '이메일',
      links: '링크',
      updated: '수정',
      prev: '이전 글',
      next: '다음 글',
      pagerLabel: '이전 글과 다음 글',
      portfolioDescription: (name) => `${name}의 포트폴리오. 만든 것과 참여한 프로젝트.`,
      blogDescription: (name) => `${name}의 개발과 사업 활동 기록.`,
      // 언어 전환 링크: 이동할 언어로 쓴다.
      switchTo: 'English',
    },
    en: {
      menu: { portfolio: 'Portfolio', blog: 'Blog', about: 'About' },
      navLabel: 'Main menu',
      recentPortfolio: 'Recent projects',
      recentPosts: 'Recent posts',
      viewAll: 'View all',
      empty: 'Nothing here yet.',
      email: 'Email',
      links: 'Links',
      updated: 'Updated',
      prev: 'Previous post',
      next: 'Next post',
      pagerLabel: 'Previous and next posts',
      portfolioDescription: (name) => `Portfolio of ${name}: things I have built and projects I have worked on.`,
      blogDescription: (name) => `Notes by ${name} on software development and building a business.`,
      switchTo: '한국어',
    },
  };
  const notFound = {
    ko: { title: '페이지를 찾을 수 없습니다', home: '홈으로 가기' },
    en: { title: 'Page not found', home: 'Go to home' },
  };

  // ---- 예시 데이터. 언어마다 다른 글자만 ko/en으로 나눈다(실제 데이터 형식과 같은 방식). ----
  const profile = {
    name: 'mivomad33',
    intro: {
      ko: '1인 사업가를 꿈꾸는 개발자',
      en: 'A developer who dreams of becoming a solo entrepreneur',
    },
    email: 'mivomad33@gmail.com',
    links: [{ label: 'GitHub', url: 'https://github.com/mivomad33' }],
  };

  const portfolio = [
    {
      name: { ko: '개인 사이트 mivomad33.dev', en: 'Personal site mivomad33.dev' },
      description: {
        ko: '프로필, 포트폴리오, 블로그를 담은 정적 사이트. Astro로 만들고 GitHub Pages로 배포한다.',
        en: 'A static site with my profile, portfolio, and blog. Built with Astro and deployed to GitHub Pages.',
      },
      links: [
        { label: { ko: '사이트', en: 'Site' }, url: 'https://example.com' },
        { label: 'GitHub', url: 'https://github.com/mivomad33' },
      ],
    },
    {
      name: { ko: '사내 주문 관리 시스템 개편', en: 'Rebuilding an internal order management system' },
      description: {
        ko: '10년 넘게 쓰던 주문 관리 화면을 새로 만들었다. 화면마다 따로 있던 주문 조회·수정 로직을 하나로 모으고, 느리던 목록 화면의 응답 시간을 크게 줄였다. 사내 시스템이라 공개 링크는 없다.',
        en: 'Rebuilt an order management screen that had been in use for over ten years. Consolidated the order lookup and editing logic that was duplicated across screens, and greatly reduced the response time of the slow list view. It is an internal system, so there is no public link.',
      },
      links: [],
    },
    {
      name: { ko: '1인 사업용 랜딩 페이지 템플릿', en: 'Landing page template for solo businesses' },
      description: {
        ko: '작은 서비스를 빠르게 알리기 위한 한 페이지짜리 템플릿.',
        en: 'A one-page template for quickly introducing a small service.',
      },
      links: [{ label: 'GitHub', url: 'https://github.com/mivomad33' }],
    },
  ];

  const richBody = {
    ko: `
<p>이 사이트는 <a href="https://astro.build">Astro</a>로 만든 정적 사이트다. 처음부터 코드를 쓰지 않고, 기술 스택과 공통 설계를 문서로 먼저 정했다.</p>
<h2>왜 정적 사이트인가</h2>
<p>글과 포트폴리오는 자주 바뀌지 않는다. 서버를 따로 운영할 이유가 없어서 md 파일을 빌드해 <code>GitHub Pages</code>로 배포하기로 했다.</p>
<ul>
  <li>운영 비용이 들지 않는다.</li>
  <li>빌드할 때 데이터 형식을 검사해, 틀린 글이 배포되지 않게 할 수 있다.</li>
</ul>
<blockquote><p>공개 뒤에 주소를 바꾸면 검색 노출이 나빠진다. 그래서 URL 구조는 구현 전에 정했다.</p></blockquote>`,
    en: `
<p>This site is a static site built with <a href="https://astro.build">Astro</a>. Instead of starting with code, I first wrote down the tech stack and the shared design as documents.</p>
<h2>Why a static site</h2>
<p>Posts and portfolio items do not change often. There was no reason to run a server, so I decided to build Markdown files and deploy them to <code>GitHub Pages</code>.</p>
<ul>
  <li>It costs nothing to run.</li>
  <li>The data format is checked at build time, so a broken post never gets deployed.</li>
</ul>
<blockquote><p>Changing URLs after launch hurts search visibility, so I settled the URL structure before implementation.</p></blockquote>`,
  };

  const posts = [
    {
      slug: 'building-this-site',
      title: {
        ko: '이 사이트를 만든 과정: 기술 스택 선정부터 공통 설계까지 단계별로 정리한 기록',
        en: 'How I built this site: a step-by-step record from choosing the tech stack to the shared design',
      },
      description: {
        ko: '정적 사이트를 만들기 전에 기술 스택, 페이지 구성, 데이터 형식을 문서로 먼저 정한 과정과 이유를 정리한다. 설명이 두 줄을 넘을 때의 모양을 보기 위한 긴 설명이다.',
        en: 'Before building a static site, I documented the tech stack, page structure, and data format first. This post explains that process and the reasons behind it. It is a long description to show how two or more lines look.',
      },
      date: '2026-10-20',
      updated: '2026-11-01',
      body: richBody,
    },
    {
      slug: 'validating-business-idea',
      title: { ko: '1인 사업 아이디어를 검증하는 방법', en: 'How to validate a solo business idea' },
      description: {
        ko: '만들기 전에 수요를 확인하는 간단한 방법들.',
        en: 'Simple ways to check demand before you build.',
      },
      date: '2026-10-12',
      body: {
        ko: '<p>아이디어를 바로 만들기보다 먼저 수요를 확인한다.</p>',
        en: '<p>Before building an idea, check whether anyone wants it.</p>',
      },
    },
    {
      slug: 'astro-content-collections',
      title: {
        ko: 'Astro 콘텐츠 컬렉션으로 데이터 검증하기',
        en: 'Validating data with Astro content collections',
      },
      description: {
        ko: '글 정보가 빠지면 빌드가 실패하게 만드는 방법.',
        en: 'How to make the build fail when post metadata is missing.',
      },
      date: '2026-10-05',
      body: {
        ko: '<p>콘텐츠 컬렉션 스키마를 정의하면 필수 값이 빠진 글은 빌드가 실패한다.</p>',
        en: '<p>With a content collection schema, a post missing a required field fails the build.</p>',
      },
    },
    {
      slug: 'retrospective-8-years',
      title: { ko: '웹 개발 8년 회고', en: 'Looking back on eight years of web development' },
      description: {
        ko: '8년 동안 일하며 배운 것과 앞으로 하고 싶은 것.',
        en: 'What I learned in eight years of work and what I want to do next.',
      },
      date: '2026-09-28',
      body: {
        ko: '<p>8년 동안 여러 회사에서 웹 서비스를 만들었다.</p>',
        en: '<p>For eight years I built web services at several companies.</p>',
      },
    },
  ];

  // 한 값(두 언어가 같다) 또는 { ko, en }
  const text = (value, lang) => (typeof value === 'string' ? value : value[lang]);
  // 언어별 경로: 한국어는 그대로, 영어는 /en을 붙인다.
  const localePath = (lang, path) => (lang === 'en' ? `/en${path}` : path);
  const href = (lang, path) => `?v=${variant}${inFrame ? '&frame=1' : ''}#${localePath(lang, path)}`;
  const time = (value) => `<time datetime="${value}">${value}</time>`;

  function linkList(links, lang, cls) {
    return links.length
      ? `<ul class="${cls}">${links.map((l) => `<li><a href="${l.url}">${text(l.label, lang)}</a></li>`).join('')}</ul>`
      : '';
  }

  // ---- 언어 전환 링크 3안 ----
  function langSwitch(lang, path) {
    const other = lang === 'ko' ? 'en' : 'ko';
    const to = href(other, path);
    const label = strings[lang].switchTo;
    if (variant === 'a') return `<a class="lang-a" href="${to}" hreflang="${other}" lang="${other}">${label}</a>`;
    if (variant === 'b1' || variant === 'b2') {
      // 전체가 링크 하나. 어디를 눌러도 다른 언어로 간다. 화면 낭독기에는 이동할 언어 이름을 읽힌다.
      const code = (l) => (l === lang ? `<span class="on">${l}</span>` : `<span>${l}</span>`);
      return `<a class="lang-${variant}" href="${to}" hreflang="${other}" lang="${other}" aria-label="${label}">${code('ko')}<span aria-hidden="true">/</span>${code('en')}</a>`;
    }
    if (variant === 'b') {
      const code = (l) =>
        l === lang
          ? `<span aria-current="true">${l}</span>`
          : `<a href="${to}" hreflang="${l}" lang="${l}" aria-label="${strings[lang].switchTo}">${l}</a>`;
      return `<span class="lang-b">${code('ko')}<span aria-hidden="true">/</span>${code('en')}</span>`;
    }
    return `<li><a href="${to}" hreflang="${other}" lang="${other}">${label}</a></li>`;
  }

  function layout(lang, path, current, main, { showSwitch = true } = {}) {
    const s = strings[lang];
    const menuItems = ['portfolio', 'blog', 'about']
      .map(
        (key) =>
          `<li><a href="${href(lang, `/${key}/`)}"${key === current ? ' aria-current="page"' : ''}>${s.menu[key]}</a></li>`,
      )
      .join('');
    const inMenu = showSwitch && variant === 'c' ? langSwitch(lang, path) : '';
    const outside = showSwitch && variant !== 'c' ? langSwitch(lang, path) : '';
    return `
<header class="site-header">
  <div class="wrap site-header-inner">
    <a class="site-name" href="${href(lang, '/')}">${profile.name}</a>
    <div class="header-right">
      <nav aria-label="${s.navLabel}"><ul class="menu">${menuItems}${inMenu}</ul></nav>
      ${outside}
    </div>
  </div>
</header>
<main class="wrap site-main">${main}</main>
<footer class="site-footer">
  <div class="wrap site-footer-inner">
    <p class="copyright">© 2026 ${profile.name}</p>
    ${linkList([{ label: profile.email, url: `mailto:${profile.email}` }, ...profile.links], lang, 'footer-links')}
  </div>
</footer>`;
  }

  const card = (item, lang, tag) => `
<li class="card">
  <${tag} class="card-title">${text(item.name, lang)}</${tag}>
  <p class="card-desc">${text(item.description, lang)}</p>
  ${linkList(item.links, lang, 'card-links')}
</li>`;

  const postItem = (post, lang, tag) => `
<li class="post-item">
  ${time(post.date).replace('<time', '<time class="post-item-date"')}
  <${tag} class="post-item-title"><a href="${href(lang, `/blog/${post.slug}/`)}">${text(post.title, lang)}</a></${tag}>
  <p class="post-item-desc">${text(post.description, lang)}</p>
</li>`;

  const section = (lang, title, morePath, list) => `
<section class="home-section">
  <div class="section-head">
    <h2 class="section-title">${title}</h2>
    <a class="section-more" href="${href(lang, morePath)}">${strings[lang].viewAll}</a>
  </div>
  ${list}
</section>`;

  const views = {
    home: (lang) => {
      const s = strings[lang];
      return `
${section(lang, s.recentPortfolio, '/portfolio/', `<ul class="card-list">${portfolio.map((p) => card(p, lang, 'h3')).join('')}</ul>`)}
${section(lang, s.recentPosts, '/blog/', `<ul class="post-list">${posts.slice(0, 3).map((p) => postItem(p, lang, 'h3')).join('')}</ul>`)}`;
    },
    portfolio: (lang) => `
<h1 class="page-title">${strings[lang].menu.portfolio}</h1>
<ul class="card-list">${portfolio.map((p) => card(p, lang, 'h2')).join('')}</ul>`,
    about: (lang) => `
<h1 class="page-title">${profile.name}</h1>
<p class="about-intro">${profile.intro[lang]}</p>
<dl class="about-info">
  <dt>${strings[lang].email}</dt>
  <dd><a href="mailto:${profile.email}">${profile.email}</a></dd>
  <dt>${strings[lang].links}</dt>
  <dd>${linkList(profile.links, lang, 'about-links')}</dd>
</dl>`,
    blog: (lang) => `
<h1 class="page-title">${strings[lang].menu.blog}</h1>
<ul class="post-list">${posts.map((p) => postItem(p, lang, 'h2')).join('')}</ul>`,
    post: (lang, post, prev, next) => {
      const s = strings[lang];
      const pagerLink = (p, cls, label) =>
        `<a class="pager-link ${cls}" href="${href(lang, `/blog/${p.slug}/`)}"><span class="pager-label">${label}</span><span class="pager-title">${text(p.title, lang)}</span></a>`;
      return `
<article class="post">
  <header class="post-header">
    <h1 class="post-title">${text(post.title, lang)}</h1>
    <p class="post-meta">
      ${time(post.date)}
      ${post.updated ? `<span class="post-updated">${s.updated} ${time(post.updated)}</span>` : ''}
    </p>
  </header>
  <div class="prose">${post.body[lang]}</div>
</article>
${
  prev || next
    ? `<nav class="pager" aria-label="${s.pagerLabel}">
  ${prev ? pagerLink(prev, 'pager-prev', s.prev) : ''}
  ${next ? pagerLink(next, 'pager-next', s.next) : ''}
</nav>`
    : ''
}`;
    },
    // 404: 사이트에 하나. 한국어 제목 아래 영어 제목, 그 아래 두 언어의 홈 링크.
    notFound: () => `
<h1 class="page-title">${notFound.ko.title}</h1>
<p class="not-found-sub" lang="en">${notFound.en.title}</p>
<p class="not-found-links">
  <a href="${href('ko', '/')}">${notFound.ko.home}</a>
  <a href="${href('en', '/')}" lang="en">${notFound.en.home}</a>
</p>`,
  };

  // ---- 시안 보기용 페이지(사이트에는 없다) ----
  const screens = [
    ['/', '홈'],
    ['/portfolio/', '포트폴리오'],
    ['/about/', '소개'],
    ['/blog/', '글 목록'],
    [`/blog/${posts[0].slug}/`, '글 보기'],
  ];
  const variantNames = {
    a: 'A 점선 구분 글자',
    b: 'B 언어 코드',
    b1: 'B1 토글 하나·붙인 글자',
    b2: 'B2 토글 하나·테두리',
    c: 'C 메뉴 항목',
  };

  function mockBar(path) {
    const link = (target, label, v = variant) =>
      `<a href="?v=${v}#${target}"${target === path && v === variant ? ' aria-current="true"' : ''}>${label}</a>`;
    return `
<div class="mock-bar"><div class="mock-bar-inner">
  <span class="mock-group"><b>전환 링크</b>${VARIANTS.map((v) => link(path, variantNames[v], v)).join('')}</span>
  <span class="mock-group"><b>한국어</b>${screens.map(([p, l]) => link(p, l)).join('')}</span>
  <span class="mock-group"><b>영어</b>${screens.map(([p, l]) => link(localePath('en', p), l)).join('')}</span>
  <span class="mock-group"><b>기타</b>${link('/404/', '404')}${link('/compare/', '헤더 비교')}${link('/strings/', '영어 문구')}${link('/og/', 'OG 이미지')}</span>
</div></div>`;
  }

  function frame(v, path, width, height) {
    return `<figure><figcaption>${width}px · ${path}</figcaption><iframe src="?v=${v}&frame=1#${path}" width="${width}" height="${height}" scrolling="no"></iframe></figure>`;
  }

  const mockPages = {
    '/compare/': () => `
<div class="mock-page">
  <p>언어 전환 링크 3안을 한국어·영어, 홈(현재 메뉴 없음)과 블로그(현재 메뉴 있음), 데스크톱 폭과 모바일 폭(375px)에서 비교한다. 각 칸은 실제 화면을 그대로 넣은 것이다.</p>
  ${VARIANTS
    .map(
      (v) => `
  <h2>${variantNames[v]}</h2>
  <div class="mock-frames">
    ${frame(v, '/', 760, 150)}${frame(v, '/en/blog/', 760, 150)}
    ${frame(v, '/', 375, 190)}${frame(v, '/en/blog/', 375, 190)}
  </div>`,
    )
    .join('')}
</div>`,
    '/strings/': () => {
      const s = strings;
      const row = (label, ko, en) => `<li>${label} · 한국어 「${ko}」 · 영어 「<b>${en}</b>」</li>`;
      return `
<div class="mock-page">
  <h2>영어 화면 문구 초안</h2>
  <p>코드에 쓰는 화면 문구다(실제 구현에서는 src/lib/i18n.ts의 사전에 둔다). 글·포트폴리오의 영어 내용은 데이터 파일에 따로 넣는다.</p>
  <h3>헤더·푸터</h3>
  <ul class="mock-list">
    ${row('메뉴', '포트폴리오 / 블로그 / 소개', 'Portfolio / Blog / About')}
    ${row('언어 전환 링크', 'English(한국어 페이지)', '한국어(영어 페이지)')}
    ${row('메뉴 화면 낭독기 이름', s.ko.navLabel, s.en.navLabel)}
  </ul>
  <h3>홈·목록</h3>
  <ul class="mock-list">
    ${row('홈 영역 제목', `${s.ko.recentPortfolio} / ${s.ko.recentPosts}`, `${s.en.recentPortfolio} / ${s.en.recentPosts}`)}
    ${row('전체 목록 링크', `${s.ko.viewAll} →`, `${s.en.viewAll} →`)}
    ${row('빈 목록 안내', s.ko.empty, s.en.empty)}
    ${row('페이지 제목', '포트폴리오 / 블로그', 'Portfolio / Blog')}
  </ul>
  <h3>소개</h3>
  <ul class="mock-list">
    ${row('정보 이름', `${s.ko.email}: / ${s.ko.links}:`, `${s.en.email}: / ${s.en.links}:`)}
    ${row('한 줄 소개(프로필 데이터)', profile.intro.ko, profile.intro.en)}
  </ul>
  <h3>글 보기</h3>
  <ul class="mock-list">
    ${row('수정일', `${s.ko.updated} 2026-11-01`, `${s.en.updated} 2026-11-01`)}
    ${row('이전·다음 글', `← ${s.ko.prev} / ${s.ko.next} →`, `← ${s.en.prev} / ${s.en.next} →`)}
    ${row('이전·다음 글 화면 낭독기 이름', s.ko.pagerLabel, s.en.pagerLabel)}
  </ul>
  <h3>404</h3>
  <ul class="mock-list">
    ${row('제목', notFound.ko.title, notFound.en.title)}
    ${row('홈 링크', notFound.ko.home, notFound.en.home)}
  </ul>
  <h3>페이지 제목(브라우저 탭)과 설명(검색 결과)</h3>
  <ul class="mock-list">
    ${row('소개 제목', `소개 - ${profile.name}`, `About - ${profile.name}`)}
    ${row('포트폴리오 설명', s.ko.portfolioDescription(profile.name), s.en.portfolioDescription(profile.name))}
    ${row('블로그 설명', s.ko.blogDescription(profile.name), s.en.blogDescription(profile.name))}
  </ul>
</div>`;
    },
    '/og/': () => `
<div class="mock-page">
  <h2>OG 이미지(1200×630, 절반 크기로 표시)</h2>
  <p>링크를 공유할 때 보이는 이미지다. 영어 이미지는 지금 이미지와 같은 모양에 영어 한 줄 소개만 바꿨다. 원본은 og-image-en.html이다.</p>
  <h3>지금(한국어 페이지)</h3>
  <img class="mock-og" src="../../../public/og.png" alt="한국어 OG 이미지" />
  <h3>영어 페이지(새로 만듦)</h3>
  <img class="mock-og" src="og-en.png" alt="영어 OG 이미지 시안" />
</div>`,
  };

  function render() {
    const raw = location.hash.replace(/^#/, '') || '/';
    let html;
    let lang = 'ko';
    if (mockPages[raw]) {
      html = mockPages[raw]();
    } else {
      const path = raw.startsWith('/en/') ? raw.slice(3) : raw;
      lang = raw.startsWith('/en/') ? 'en' : 'ko';
      let match;
      if (path === '/') html = layout(lang, path, '', views.home(lang));
      else if (path === '/portfolio/') html = layout(lang, path, 'portfolio', views.portfolio(lang));
      else if (path === '/about/') html = layout(lang, path, 'about', views.about(lang));
      else if (path === '/blog/') html = layout(lang, path, 'blog', views.blog(lang));
      else if ((match = path.match(/^\/blog\/([a-z0-9-]+)\/$/)) && posts.some((p) => p.slug === match[1])) {
        const i = posts.findIndex((p) => p.slug === match[1]);
        // 이전 글 = 바로 더 오래된 글, 다음 글 = 바로 더 최신 글
        html = layout(lang, path, 'blog', views.post(lang, posts[i], posts[i + 1], posts[i - 1]));
      } else {
        lang = 'ko';
        html = layout('ko', path, '', views.notFound(), { showSwitch: false });
      }
    }
    document.documentElement.lang = lang;
    document.getElementById('app').innerHTML = (inFrame ? '' : mockBar(raw)) + html;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', render);
  render();
})();
