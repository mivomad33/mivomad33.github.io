// 빌드 결과(dist/) 검사(7단계). pnpm build가 astro build 뒤에 실행하며, 실패하면 배포되지 않는다.
// 메타 태그 규칙은 docs/design.md의 "메타 태그", 동작과 이유는 docs/stages/7-seo.md에 있다.
// Astro가 만든 HTML만 읽으므로(속성 값은 항상 큰따옴표) 정규식으로 태그를 읽는다.
// Astro는 속성 값 안의 <, >를 이스케이프하지 않으므로, 태그 끝을 찾을 때 따옴표 안은 건너뛴다.
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ALLOW_INDEXING, siteUrl } from '../src/lib/site.ts';

const DIST = 'dist';
const BLOG = 'src/content/blog';
const OG_SOURCE = 'docs/stages/7-seo/og-image.html';
const PROFILE = 'src/data/profile.yaml';

// 404를 뺀 모든 페이지에 값이 있어야 하는 태그(name 또는 property).
const REQUIRED_META = [
  'description',
  'og:type',
  'og:title',
  'og:description',
  'og:url',
  'og:site_name',
  'og:locale',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
];
// 404를 뺀 모든 페이지에서 값이 정해진 태그.
const FIXED_META: Record<string, string> = {
  'og:locale': 'ko_KR',
  'twitter:card': 'summary_large_image',
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const tagPattern = (name: string) =>
  new RegExp(`<${name}\\b(?:[^>"]|"[^"]*")*>`, 'g');

const errors: string[] = [];
const fail = (where: string, message: string) =>
  errors.push(`${where}: ${message}`);

function decode(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [, name, value] of tag.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
    if (name) result[name] = decode(value ?? '');
  }
  return result;
}

// 사이트 주소의 경로에 해당하는 dist/ 안 파일이 있는지.
function existsInDist(url: string): boolean {
  if (!url.startsWith(siteUrl('/'))) return false;
  const path = decodeURIComponent(new URL(url).pathname);
  return existsSync(
    join(DIST, path.endsWith('/') ? `${path}index.html` : path),
  );
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name));
}

// dist/ 안 파일 경로를 페이지 경로로 바꾼다(dist/blog/a/index.html → /blog/a/).
function pagePath(file: string): string {
  return `/${file.slice(DIST.length + 1).replace(/index\.html$/, '')}`;
}

interface Context {
  // 글 보기 페이지 경로(/blog/<slug>/). 글 파일 목록으로 정한다.
  articlePaths: Set<string>;
  profile: Record<string, unknown>;
}

function checkPage(
  file: string,
  html: string,
  { articlePaths, profile }: Context,
): string | undefined {
  const where = file;
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const meta = new Map<string, string>();
  for (const [tag] of head.matchAll(tagPattern('meta'))) {
    const attrs = attributes(tag);
    const key = attrs.property ?? attrs.name;
    if (!key) continue;
    if (meta.has(key)) fail(where, `${key} 태그가 두 번 이상 있습니다.`);
    meta.set(key, attrs.content ?? '');
  }
  const links = [...head.matchAll(tagPattern('link'))].map(([tag]) =>
    attributes(tag),
  );
  for (const rel of ['canonical', 'apple-touch-icon']) {
    if (links.filter((link) => link.rel === rel).length > 1)
      fail(where, `${rel} 링크가 두 번 이상 있습니다.`);
  }
  const linkHref = (rel: string) =>
    links.find((link) => link.rel === rel)?.href;
  const jsonLd = [
    ...head.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map(([, json]) => json ?? '');

  // 모든 페이지: 제목, 파비콘, noindex
  if (!/<title>[^<]+<\/title>/.test(head)) fail(where, '제목이 없습니다.');
  const icons = links.filter((link) =>
    ['icon', 'apple-touch-icon'].includes(link.rel ?? ''),
  );
  if (icons.length === 0) fail(where, '파비콘 링크가 없습니다.');
  for (const icon of icons) {
    const href = icon.href ?? '';
    if (
      !href.startsWith('/') ||
      href.endsWith('/') ||
      !existsInDist(siteUrl(href))
    )
      fail(where, `파비콘 파일이 없습니다: "${href}"`);
  }
  const noindex = (meta.get('robots') ?? '').includes('noindex');
  if (noindex === ALLOW_INDEXING)
    fail(
      where,
      ALLOW_INDEXING
        ? 'ALLOW_INDEXING이 true인데 noindex가 있습니다.'
        : 'ALLOW_INDEXING이 false인데 noindex가 없습니다.',
    );

  // 404: 주소를 대표하는 태그를 넣지 않는다.
  if (file === join(DIST, '404.html')) {
    const forbidden = [...meta.keys()].filter(
      (key) => key === 'description' || /^(og|twitter|article):/.test(key),
    );
    if (forbidden.length > 0)
      fail(where, `404에 넣지 않는 태그가 있습니다: ${forbidden.join(', ')}`);
    if (linkHref('canonical') !== undefined)
      fail(where, '404에 canonical이 있습니다.');
    if (jsonLd.length > 0) fail(where, '404에 구조화 데이터가 있습니다.');
    return undefined;
  }

  const path = pagePath(file);
  const url = siteUrl(path);
  for (const key of REQUIRED_META) {
    if (!meta.get(key)?.trim()) fail(where, `${key}가 없거나 비었습니다.`);
  }
  for (const [key, value] of Object.entries(FIXED_META)) {
    if (meta.has(key) && meta.get(key) !== value)
      fail(where, `${key}가 ${value}가 아닙니다: ${meta.get(key)}`);
  }
  if (meta.get('og:description') !== meta.get('description'))
    fail(where, 'og:description이 description과 다릅니다.');
  if (meta.get('og:site_name') !== profile.name)
    fail(where, `og:site_name이 활동명(${String(profile.name)})이 아닙니다.`);
  if (linkHref('canonical') !== url)
    fail(where, `canonical이 ${url}이 아닙니다: ${linkHref('canonical')}`);
  if (meta.get('og:url') !== url)
    fail(where, `og:url이 ${url}이 아닙니다: ${meta.get('og:url')}`);
  const ogImage = meta.get('og:image');
  if (ogImage && !existsInDist(ogImage))
    fail(where, `og:image 파일이 사이트에 없습니다: ${ogImage}`);

  if (articlePaths.has(path)) {
    // 글 보기: 날짜 태그와 구조화 데이터
    const published = meta.get('article:published_time');
    const modified = meta.get('article:modified_time');
    if (meta.get('og:type') !== 'article')
      fail(where, 'og:type이 article이 아닙니다.');
    if (!published || !DATE.test(published))
      fail(
        where,
        `article:published_time이 YYYY-MM-DD가 아닙니다: ${published}`,
      );
    if (modified !== undefined && !DATE.test(modified))
      fail(where, `article:modified_time이 YYYY-MM-DD가 아닙니다: ${modified}`);
    if (jsonLd.length !== 1) {
      fail(where, `구조화 데이터가 ${jsonLd.length}개입니다(1개여야 한다).`);
    } else {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(jsonLd[0] ?? '') as Record<string, unknown>;
      } catch (error) {
        fail(
          where,
          `구조화 데이터를 JSON으로 읽을 수 없습니다: ${String(error)}`,
        );
      }
      if (data['@type'] !== 'BlogPosting')
        fail(where, '구조화 데이터가 BlogPosting이 아닙니다.');
      if (data.headline !== meta.get('og:title'))
        fail(where, '구조화 데이터의 headline이 og:title과 다릅니다.');
      if (data.datePublished !== published)
        fail(where, 'datePublished가 article:published_time과 다릅니다.');
      if (data.dateModified !== modified)
        fail(where, 'dateModified가 article:modified_time과 다릅니다.');
    }
  } else {
    if (meta.get('og:type') !== 'website')
      fail(where, 'og:type이 website가 아닙니다.');
    const article = [...meta.keys()].filter((key) =>
      key.startsWith('article:'),
    );
    if (article.length > 0)
      fail(
        where,
        `글이 아닌 페이지에 날짜 태그가 있습니다: ${article.join(', ')}`,
      );
    if (jsonLd.length > 0)
      fail(where, '글이 아닌 페이지에 구조화 데이터가 있습니다.');
  }
  return url;
}

// sitemap: 404를 뺀 모든 페이지가 있고, 그 밖의 주소는 없다.
async function checkSitemap(pageUrls: string[]) {
  const where = join(DIST, 'sitemap-index.xml');
  if (!existsSync(where)) {
    fail(where, 'sitemap이 없습니다.');
    return;
  }
  const locs = (xml: string) =>
    [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, loc]) =>
      decode(loc ?? ''),
    );
  const listed = new Set<string>();
  for (const sitemap of locs(await readFile(where, 'utf8'))) {
    if (!existsInDist(sitemap)) {
      fail(where, `sitemap 파일이 없습니다: ${sitemap}`);
      continue;
    }
    const file = join(DIST, new URL(sitemap).pathname);
    for (const url of locs(await readFile(file, 'utf8'))) listed.add(url);
  }
  for (const url of pageUrls) {
    if (!listed.has(url)) fail(where, `sitemap에 페이지가 없습니다: ${url}`);
  }
  for (const url of listed) {
    if (!pageUrls.includes(url))
      fail(where, `sitemap에 페이지가 아닌 주소가 있습니다: ${url}`);
  }
}

async function checkRobots() {
  const where = join(DIST, 'robots.txt');
  const robots = existsSync(where) ? await readFile(where, 'utf8') : '';
  const lines = robots.split('\n');
  const [rule, opposite] = ALLOW_INDEXING
    ? ['Allow: /', 'Disallow: /']
    : ['Disallow: /', 'Allow: /'];
  if (!lines.includes(rule)) fail(where, `${rule}가 없습니다.`);
  if (lines.includes(opposite))
    fail(where, `ALLOW_INDEXING과 반대인 ${opposite}가 있습니다.`);
  const sitemap = `Sitemap: ${siteUrl('/sitemap-index.xml')}`;
  if (!lines.includes(sitemap)) fail(where, `${sitemap}가 없습니다.`);
}

// OG 이미지 원본의 활동명·한 줄 소개가 프로필과 같은지(이미지를 다시 만들지 않으면 옛 값이 남는다).
async function checkOgSource(profile: Record<string, unknown>) {
  const source = await readFile(OG_SOURCE, 'utf8');
  for (const key of ['name', 'intro']) {
    const raw = source.match(
      new RegExp(`data-profile="${key}"[^>]*>([^<]*)<`),
    )?.[1];
    const text = raw === undefined ? undefined : decode(raw);
    if (text !== profile[key])
      fail(
        OG_SOURCE,
        `${key}가 프로필(${PROFILE})과 다릅니다: "${text}" ≠ "${String(profile[key])}". 원본을 고치고 sh docs/stages/7-seo/make-images.sh로 이미지를 다시 만든다.`,
      );
  }
}

const profile = parse(await readFile(PROFILE, 'utf8')) as Record<
  string,
  unknown
>;
// 글 파일(<slug>.md)이 없으면(글 0개) 폴더도 없을 수 있다(6단계).
const articlePaths = new Set(
  (existsSync(BLOG) ? await readdir(BLOG) : [])
    .filter((name) => name.endsWith('.md'))
    .map((name) => `/blog/${name.slice(0, -'.md'.length)}/`),
);
const files = existsSync(DIST) ? await htmlFiles(DIST) : [];
if (files.length === 0) fail(DIST, 'HTML 파일이 없습니다(빌드 결과가 없음).');
const pageUrls: string[] = [];
const pagePaths = new Set<string>();
for (const file of files) {
  const url = checkPage(file, await readFile(file, 'utf8'), {
    articlePaths,
    profile,
  });
  if (url) pageUrls.push(url);
  pagePaths.add(pagePath(file));
}
for (const path of articlePaths) {
  if (!pagePaths.has(path)) fail(DIST, `글 보기 페이지가 없습니다: ${path}`);
}
await checkSitemap(pageUrls);
await checkRobots();
await checkOgSource(profile);

if (errors.length > 0) {
  console.error(`빌드 결과 검사 실패(${errors.length}건):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(
  `빌드 결과 검사 통과: HTML ${files.length}개, sitemap 주소 ${pageUrls.length}개`,
);
