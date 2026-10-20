// 3단계 시안 공용 코드: 예시 데이터, 화면 마크업, 화면 전환.
// 세 시안은 같은 마크업을 쓰고 CSS(디자인 값)와 날짜 형식만 다르다.
// 실제 사이트처럼 마크업 하나에 테마만 바꿔 비교하기 위해서다.
// 화면 전환은 주소의 # 뒤 경로로 한다(예: a-clean.html#/blog/).
window.Mock = (() => {
  const profile = {
    name: 'mivomad33',
    intro: '1인 사업가를 꿈꾸는 개발자',
    email: 'mivomad33@gmail.com',
    links: [
      { label: 'GitHub', url: 'https://github.com/mivomad33' },
      { label: '블로그', url: '#/blog/' },
    ],
  };

  // 파일에 적은 순서 = 표시 순서. 홈은 앞에서부터 3개.
  const portfolio = [
    {
      name: '개인 사이트 mivomad33.dev',
      description: '프로필, 포트폴리오, 블로그를 담은 정적 사이트. Astro로 만들고 GitHub Pages로 배포한다.',
      links: [
        { label: '사이트', url: 'https://example.com' },
        { label: 'GitHub', url: 'https://github.com/mivomad33' },
      ],
    },
    {
      name: '사내 주문 관리 시스템 개편',
      description:
        '10년 넘게 쓰던 주문 관리 화면을 새로 만들었다. 화면마다 따로 있던 주문 조회·수정 로직을 하나로 모으고, 느리던 목록 화면의 응답 시간을 크게 줄였다. 사내 시스템이라 공개 링크는 없다.',
      links: [],
    },
    {
      name: '1인 사업용 랜딩 페이지 템플릿',
      description: '작은 서비스를 빠르게 알리기 위한 한 페이지짜리 템플릿.',
      links: [{ label: 'GitHub', url: 'https://github.com/mivomad33' }],
    },
    {
      name: '오픈소스 기여: 날짜 처리 라이브러리',
      description: '시간대에 따라 날짜가 하루 밀리는 버그를 고쳤다.',
      links: [{ label: 'Pull Request', url: 'https://example.com/pr/1' }],
    },
  ];

  const richBody = `
<p>이 사이트는 <a href="https://astro.build">Astro</a>로 만든 정적 사이트다. 처음부터 코드를 쓰지 않고, 기술 스택과 공통 설계를 문서로 먼저 정했다. 이 글은 그 과정에서 무엇을 왜 정했는지 정리한다.</p>
<h2>왜 정적 사이트인가</h2>
<p>글과 포트폴리오는 자주 바뀌지 않는다. 서버를 따로 운영할 이유가 없어서 md 파일을 빌드해 <code>GitHub Pages</code>로 배포하기로 했다.</p>
<ul>
  <li>운영 비용이 들지 않는다.</li>
  <li>글을 md 파일로 관리하므로 버전 관리가 그대로 된다.</li>
  <li>빌드할 때 데이터 형식을 검사해, 틀린 글이 배포되지 않게 할 수 있다.</li>
</ul>
<h3>단계를 나눈 방법</h3>
<ol>
  <li>기술 스택을 정한다.</li>
  <li>페이지 구성과 데이터 형식을 정한다.</li>
  <li>디자인 시안을 고른다.</li>
</ol>
<blockquote><p>공개 뒤에 주소를 바꾸면 검색 노출이 나빠진다. 그래서 URL 구조는 구현 전에 정했다.</p></blockquote>
<p>날짜는 시간대에 따라 하루 밀리지 않게 UTC 기준으로 표시한다.</p>
<pre><code>const formatted = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(date);</code></pre>
<p>코드 블록의 배경색과 문법 색은 6단계에서 하이라이팅 테마를 정할 때 바뀐다. 아주 긴 주소도 화면 밖으로 넘치지 않아야 한다: https://example.com/a/very/long/path/that/should/wrap/inside/the/content/area</p>
`;

  const posts = [
    {
      slug: 'building-this-site',
      title: '이 사이트를 만든 과정: 기술 스택 선정부터 공통 설계까지 단계별로 정리한 기록',
      description:
        '정적 사이트를 만들기 전에 기술 스택, 페이지 구성, 데이터 형식을 문서로 먼저 정한 과정과 이유를 정리한다. 설명이 두 줄을 넘을 때의 모양을 보기 위한 긴 설명이다.',
      date: '2026-10-20',
      updated: '2026-11-01',
      body: richBody,
    },
    {
      slug: 'validating-business-idea',
      title: '1인 사업 아이디어를 검증하는 방법',
      description: '만들기 전에 수요를 확인하는 간단한 방법들.',
      date: '2026-10-12',
      body: '<p>아이디어를 바로 만들기보다 먼저 수요를 확인한다.</p><p>랜딩 페이지 하나로 관심을 모아 보는 것부터 시작했다.</p>',
    },
    {
      slug: 'astro-content-collections',
      title: 'Astro 콘텐츠 컬렉션으로 데이터 검증하기',
      description: '글 정보가 빠지면 빌드가 실패하게 만드는 방법.',
      date: '2026-10-05',
      body: '<p>콘텐츠 컬렉션 스키마를 정의하면 필수 값이 빠진 글은 빌드가 실패한다.</p>',
    },
    {
      slug: 'retrospective-8-years',
      title: '웹 개발 8년 회고',
      description: '8년 동안 일하며 배운 것과 앞으로 하고 싶은 것.',
      date: '2026-09-28',
      body: '<p>8년 동안 여러 회사에서 웹 서비스를 만들었다.</p>',
    },
    {
      slug: 'hello-world',
      title: '첫 글',
      description: '블로그를 시작한다.',
      date: '2026-09-28',
      body: '<p>블로그를 시작한다. 같은 날짜의 글은 slug 오름차순으로 정렬된다.</p>',
    },
  ];

  // design.md의 정렬 기준: date 최신순, 같으면 slug 오름차순
  posts.sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));

  // 날짜만 적은 값은 UTC 자정으로 읽고, UTC 기준으로 연·월·일을 꺼낸다.
  function dateParts(value) {
    const d = new Date(value);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }

  const menu = [
    { key: 'portfolio', label: '포트폴리오', href: '#/portfolio/' },
    { key: 'blog', label: '블로그', href: '#/blog/' },
    { key: 'about', label: '소개', href: '#/about/' },
  ];

  function build(fmt) {
    const time = (value) => `<time datetime="${value}">${fmt(dateParts(value))}</time>`;

    const linkList = (links, cls) =>
      links.length
        ? `<ul class="${cls}">${links.map((l) => `<li><a href="${l.url}">${l.label}</a></li>`).join('')}</ul>`
        : '';

    const card = (item, tag) => `
<li class="card">
  <${tag} class="card-title">${item.name}</${tag}>
  <p class="card-desc">${item.description}</p>
  ${linkList(item.links, 'card-links')}
</li>`;

    const postItem = (post, tag) => `
<li class="post-item">
  ${time(post.date).replace('<time', '<time class="post-item-date"')}
  <${tag} class="post-item-title"><a href="#/blog/${post.slug}/">${post.title}</a></${tag}>
  <p class="post-item-desc">${post.description}</p>
</li>`;

    const section = (title, moreHref, list) => `
<section class="home-section">
  <div class="section-head">
    <h2 class="section-title">${title}</h2>
    <a class="section-more" href="${moreHref}">전체 보기</a>
  </div>
  ${list}
</section>`;

    return {
      layout: (main, current) => `
<header class="site-header">
  <div class="wrap site-header-inner">
    <a class="site-name" href="#/">${profile.name}</a>
    <nav aria-label="주 메뉴">
      <ul class="menu">
        ${menu
          .map(
            (m) =>
              `<li><a href="${m.href}"${m.key === current ? ' aria-current="page"' : ''}>${m.label}</a></li>`,
          )
          .join('')}
      </ul>
    </nav>
  </div>
</header>
<main class="wrap site-main">${main}</main>
<footer class="site-footer">
  <div class="wrap site-footer-inner">
    <p class="copyright">© 2026 ${profile.name}</p>
    ${linkList([{ label: profile.email, url: `mailto:${profile.email}` }, ...profile.links], 'footer-links')}
  </div>
</footer>`,

      home: () => `
<p class="home-intro">${profile.intro}</p>
${section('최근 포트폴리오', '#/portfolio/', `<ul class="card-list">${portfolio.slice(0, 3).map((p) => card(p, 'h3')).join('')}</ul>`)}
${section('최근 글', '#/blog/', `<ul class="post-list">${posts.slice(0, 3).map((p) => postItem(p, 'h3')).join('')}</ul>`)}`,

      portfolio: () => `
<h1 class="page-title">포트폴리오</h1>
<ul class="card-list">${portfolio.map((p) => card(p, 'h2')).join('')}</ul>`,

      about: () => `
<h1 class="page-title">${profile.name}</h1>
<p class="about-intro">${profile.intro}</p>
<dl class="about-info">
  <dt>이메일</dt>
  <dd><a href="mailto:${profile.email}">${profile.email}</a></dd>
  <dt>링크</dt>
  <dd>${linkList(profile.links, 'about-links')}</dd>
</dl>`,

      blog: () => `
<h1 class="page-title">블로그</h1>
<ul class="post-list">${posts.map((p) => postItem(p, 'h2')).join('')}</ul>`,

      post: (post, prev, next) => `
<article class="post">
  <header class="post-header">
    <h1 class="post-title">${post.title}</h1>
    <p class="post-meta">
      ${time(post.date)}
      ${post.updated ? `<span class="post-updated">수정 ${time(post.updated)}</span>` : ''}
    </p>
  </header>
  <div class="prose">${post.body}</div>
</article>
${
  prev || next
    ? `<nav class="pager" aria-label="이전 글과 다음 글">
  ${prev ? `<a class="pager-link pager-prev" href="#/blog/${prev.slug}/"><span class="pager-label">이전 글</span><span class="pager-title">${prev.title}</span></a>` : ''}
  ${next ? `<a class="pager-link pager-next" href="#/blog/${next.slug}/"><span class="pager-label">다음 글</span><span class="pager-title">${next.title}</span></a>` : ''}
</nav>`
    : ''
}`,

      notFound: () => `
<h1 class="page-title">페이지를 찾을 수 없습니다</h1>
<p><a href="#/">홈으로 가기</a></p>`,
    };
  }

  // fmt: ({ y, m, d }) => 표시할 날짜 문자열
  function start(fmt) {
    const view = build(fmt);
    const render = () => {
      const path = location.hash.replace(/^#/, '') || '/';
      let main;
      let current = '';
      let match;
      if (path === '/') main = view.home();
      else if (path === '/portfolio/') (main = view.portfolio()), (current = 'portfolio');
      else if (path === '/about/') (main = view.about()), (current = 'about');
      else if (path === '/blog/') (main = view.blog()), (current = 'blog');
      else if ((match = path.match(/^\/blog\/([a-z0-9-]+)\/$/))) {
        const i = posts.findIndex((p) => p.slug === match[1]);
        current = 'blog';
        // 이전 글 = 바로 더 오래된 글, 다음 글 = 바로 더 최신 글
        main = i < 0 ? view.notFound() : view.post(posts[i], posts[i + 1], posts[i - 1]);
      } else main = view.notFound();
      document.getElementById('app').innerHTML = view.layout(main, current);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', render);
    render();
  }

  return { start };
})();
