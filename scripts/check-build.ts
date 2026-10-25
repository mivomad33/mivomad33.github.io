// 빌드 결과(dist/) 검사(7단계). pnpm build가 astro build 뒤에 실행하며, 실패하면 배포되지 않는다.
// 메타 태그 규칙은 docs/design.md의 "메타 태그", 동작과 이유는 docs/stages/7-seo.md에 있다.
// Astro가 만든 HTML만 읽으므로(속성 값은 항상 큰따옴표) 정규식으로 태그를 읽는다.
// Astro는 속성 값 안의 <, >를 이스케이프하지 않으므로, 태그 끝을 찾을 때 따옴표 안은 건너뛴다.
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ALLOW_INDEXING, siteUrl } from '../src/lib/site.ts';
import {
  DEFAULT_LOCALE,
  LOCALES,
  OG_LOCALE,
  X_DEFAULT_LOCALE,
  localeOfPath,
  localePath,
  otherLocale,
  pathWithoutLocale,
  type Locale,
} from '../src/lib/i18n.ts';
import {
  EXTERNAL_ICON_CLASS,
  EXTERNAL_LABEL_CLASS,
  EXTERNAL_LINK_ATTRS,
  WORD_JOINER,
  isExternalUrl,
  newTabLabel,
} from '../src/lib/link.ts';

const DIST = 'dist';

// 검색 엔진 소유 확인 값(8단계). 앱 코드(src/lib/search-verification.ts)의 값을 가져다 쓰지 않고
// 여기에 따로 적는다. 앱 쪽 값이 빠지거나 바뀌면 검사가 잡게 하기 위해서다. 값을 바꾸면 두 곳을 함께 고친다.
// 메타 태그는 홈(/)에만 있고, Daum 인증 줄은 robots.txt의 마지막 줄이다.
const EXPECTED_VERIFICATION_META = new Map([
  ['google-site-verification', 'ufokYjzwNsn16dwZOu1vXYfypS89gMRuKjH0k9JATHc'],
  ['naver-site-verification', '76fc5cada79ecd01270e406218364f6d9a679236'],
]);
const EXPECTED_DAUM_LINE =
  '#DaumWebMasterTool:fc660409386d824914e6d26c3fae6b0a778fb6c44e66a59f42e2f852dc3c3b81:kHsTc7yt7rZFR+42wFNLLw==';
const BLOG = 'src/content/blog';
// 언어별 OG 이미지 원본(변경 1). 원본의 한 줄 소개는 프로필의 그 언어 값과 같아야 한다.
const OG_SOURCES: Record<Locale, string> = {
  ko: 'docs/stages/7-seo/og-image.html',
  en: 'docs/stages/7-seo/og-image-en.html',
};
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
  // 글 보기 페이지 경로(/blog/<slug>/, /en/blog/<slug>/). 글 폴더 목록으로 정한다.
  articlePaths: Set<string>;
  profile: Record<string, unknown>;
  // 언어마다 페이지가 쓴 og:image(언어마다 하나여야 한다)
  ogImages: Map<Locale, Set<string>>;
}

function checkPage(
  file: string,
  html: string,
  { articlePaths, profile, ogImages }: Context,
): string | undefined {
  const where = file;
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const body = html.slice(html.indexOf('</head>'));
  const lang = attributes(html.match(tagPattern('html'))?.[0] ?? '').lang;
  const meta = new Map<string, string>();
  // og:locale:alternate는 다른 언어마다 하나씩 있으므로 따로 모은다.
  const localeAlternates: string[] = [];
  for (const [tag] of head.matchAll(tagPattern('meta'))) {
    const attrs = attributes(tag);
    const key = attrs.property ?? attrs.name;
    if (!key) continue;
    if (key === 'og:locale:alternate') {
      localeAlternates.push(attrs.content ?? '');
      continue;
    }
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
  // 언어별 버전(hreflang)과 언어 전환 링크(본문의 hreflang이 있는 링크). 변경 1.
  const hreflangs = links.filter(
    (link) => link.rel === 'alternate' && link.hreflang !== undefined,
  );
  const switchLinks = [...body.matchAll(tagPattern('a'))]
    .map(([tag]) => attributes(tag))
    .filter((attrs) => attrs.hreflang !== undefined);
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
  // 검색 엔진 소유 확인 태그: 홈에만 정한 값으로 있다.
  const isHome = file === join(DIST, 'index.html');
  for (const [name, content] of EXPECTED_VERIFICATION_META) {
    const actual = meta.get(name);
    if (isHome && actual !== content)
      fail(where, `${name} 값이 정한 값과 다릅니다: "${actual ?? ''}"`);
    if (!isHome && actual !== undefined)
      fail(where, `홈이 아닌 페이지에 ${name}가 있습니다.`);
  }
  checkLinks(where, body, lang);

  // 404: 주소를 대표하는 태그를 넣지 않는다.
  if (file === join(DIST, '404.html')) {
    const forbidden = [...meta.keys()].filter(
      (key) => key === 'description' || /^(og|twitter|article):/.test(key),
    );
    if (localeAlternates.length > 0) forbidden.push('og:locale:alternate');
    if (forbidden.length > 0)
      fail(where, `404에 넣지 않는 태그가 있습니다: ${forbidden.join(', ')}`);
    if (linkHref('canonical') !== undefined)
      fail(where, '404에 canonical이 있습니다.');
    if (jsonLd.length > 0) fail(where, '404에 구조화 데이터가 있습니다.');
    // 404는 사이트에 하나라 기본 언어 페이지이고, 언어별 버전과 언어 전환 링크가 없다.
    if (lang !== DEFAULT_LOCALE)
      fail(where, `html lang이 ${DEFAULT_LOCALE}가 아닙니다: ${lang}`);
    if (hreflangs.length > 0) fail(where, '404에 hreflang 링크가 있습니다.');
    if (switchLinks.length > 0) fail(where, '404에 언어 전환 링크가 있습니다.');
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
  checkLanguages(where, path, {
    lang,
    ogLocale: meta.get('og:locale'),
    localeAlternates,
    hreflangs,
    switchLinks,
  });
  const ogImage = meta.get('og:image');
  if (ogImage) {
    const locale = localeOfPath(path);
    ogImages.set(locale, (ogImages.get(locale) ?? new Set()).add(ogImage));
  }
  if (meta.get('og:description') !== meta.get('description'))
    fail(where, 'og:description이 description과 다릅니다.');
  if (meta.get('og:site_name') !== profile.name)
    fail(where, `og:site_name이 활동명(${String(profile.name)})이 아닙니다.`);
  if (linkHref('canonical') !== url)
    fail(where, `canonical이 ${url}이 아닙니다: ${linkHref('canonical')}`);
  if (meta.get('og:url') !== url)
    fail(where, `og:url이 ${url}이 아닙니다: ${meta.get('og:url')}`);
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
      if (data.inLanguage !== localeOfPath(path))
        fail(
          where,
          `구조화 데이터의 inLanguage가 ${localeOfPath(path)}가 아닙니다: ${String(data.inLanguage)}`,
        );
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

// 외부 링크(변경 2): 외부 링크는 새 탭 속성과, 링크 컴포넌트·md 플러그인이 만드는 마크업(링크 글자 span, 아이콘,
// 페이지 언어의 문구를 화면 낭독기 이름으로 가진 아이콘)을 그대로 갖고, 외부가 아닌 링크에는 target이 없다.
// 판단은 컴포넌트·플러그인과 같은 함수(src/lib/link.ts)로 한다. 둘을 거치지 않은 <a>(직접 쓴 <a>, md에 HTML로 쓴 <a>)를 잡는다.
function checkLinks(where: string, body: string, lang: string | undefined) {
  const locale = LOCALES.find((code) => code === lang);
  for (const match of body.matchAll(tagPattern('a'))) {
    const [tag] = match;
    const attrs = attributes(tag);
    const href = attrs.href ?? '';
    if (!isExternalUrl(href)) {
      if (attrs.target !== undefined)
        fail(where, `외부가 아닌 링크에 target이 있습니다: ${href}`);
      continue;
    }
    const start = match.index + tag.length;
    const content = body.slice(start, body.indexOf('</a>', start));
    const problems = [];
    if (attrs.target !== EXTERNAL_LINK_ATTRS.target)
      problems.push(`target이 ${EXTERNAL_LINK_ATTRS.target}가 아니다`);
    if (attrs.rel !== EXTERNAL_LINK_ATTRS.rel)
      problems.push(`rel이 ${EXTERNAL_LINK_ATTRS.rel}가 아니다`);
    if (!content.startsWith(`<span class="${EXTERNAL_LABEL_CLASS}">`))
      problems.push('링크 글자 span이 없다');
    if (
      !content.endsWith(
        `${WORD_JOINER}<span class="${EXTERNAL_ICON_CLASS}" role="img" aria-label="${locale ? newTabLabel(locale) : ''}"></span>`,
      )
    )
      problems.push(`아이콘이 없거나 아이콘 이름이 ${lang}의 문구가 아니다`);
    if (problems.length > 0)
      fail(
        where,
        `외부 링크가 링크 컴포넌트(Link.astro)나 md 플러그인의 모양이 아닙니다(${problems.join(', ')}): ${href}`,
      );
  }
}

// 언어별 버전 링크(HTML의 hreflang 링크, sitemap의 xhtml:link)가 정한 것과 같은지.
// 같은 언어가 두 번 있거나, 빠졌거나, 주소가 다르거나, 정해지지 않은 언어가 있으면 실패다.
function checkAlternates(
  where: string,
  what: string,
  found: [string, string][],
  expected: Map<string, string>,
) {
  const hreflangs = found.map(([hreflang]) => hreflang);
  const duplicated = hreflangs.filter(
    (hreflang, index) => hreflangs.indexOf(hreflang) !== index,
  );
  if (duplicated.length > 0)
    fail(
      where,
      `${what}에 같은 언어가 두 번 이상 있습니다: ${duplicated.join(', ')}`,
    );
  const hrefs = new Map(found);
  for (const [hreflang, href] of expected) {
    const actual = hrefs.get(hreflang);
    if (actual === undefined)
      fail(where, `${what}에 ${hreflang}가 없습니다(${href}이어야 한다).`);
    else if (actual !== href)
      fail(where, `${what}의 ${hreflang}가 ${href}가 아닙니다: ${actual}`);
  }
  for (const hreflang of hrefs.keys()) {
    if (!expected.has(hreflang))
      fail(where, `${what}에 정해지지 않은 언어가 있습니다: ${hreflang}`);
  }
}

interface LanguageTags {
  lang: string | undefined;
  ogLocale: string | undefined;
  localeAlternates: string[];
  hreflangs: Record<string, string>[];
  switchLinks: Record<string, string>[];
}

// 두 언어(변경 1): 문서 언어·og:locale이 주소의 언어와 맞고, 언어별 버전(hreflang)이 모든 언어와
// x-default를 가리키며, 언어 전환 링크가 같은 페이지의 다른 언어 버전을 가리키는지.
// 가리키는 페이지가 실제로 있는지도 보므로, 모든 페이지가 이 검사를 통과하면 언어별 버전이 서로를 가리킨다.
function checkLanguages(where: string, path: string, tags: LanguageTags) {
  const locale = localeOfPath(path);
  const base = pathWithoutLocale(locale, path);
  if (tags.lang !== locale)
    fail(where, `html lang이 ${locale}가 아닙니다: ${tags.lang}`);
  if (tags.ogLocale !== OG_LOCALE[locale])
    fail(
      where,
      `og:locale이 ${OG_LOCALE[locale]}가 아닙니다: ${tags.ogLocale}`,
    );
  const expectedAlternates = LOCALES.filter((code) => code !== locale)
    .map((code) => OG_LOCALE[code])
    .toSorted()
    .join(', ');
  if (tags.localeAlternates.toSorted().join(', ') !== expectedAlternates)
    fail(
      where,
      `og:locale:alternate가 ${expectedAlternates}가 아닙니다: ${tags.localeAlternates.join(', ')}`,
    );
  const expectedHreflangs = new Map<string, string>([
    ...LOCALES.map((code): [string, string] => [
      code,
      siteUrl(localePath(code, base)),
    ]),
    ['x-default', siteUrl(localePath(X_DEFAULT_LOCALE, base))],
  ]);
  checkAlternates(
    where,
    'hreflang 링크',
    tags.hreflangs.map((link) => [link.hreflang ?? '', link.href ?? '']),
    expectedHreflangs,
  );
  for (const [hreflang, href] of expectedHreflangs) {
    if (!existsInDist(href))
      fail(
        where,
        `hreflang="${hreflang}"가 가리키는 페이지가 없습니다: ${href}`,
      );
  }
  const other = otherLocale(locale);
  const switchHref = localePath(other, base);
  const [switchLink, ...extra] = tags.switchLinks;
  if (!switchLink || extra.length > 0)
    fail(
      where,
      `언어 전환 링크(hreflang이 있는 링크)가 ${tags.switchLinks.length}개입니다(1개여야 한다).`,
    );
  else if (switchLink.href !== switchHref || switchLink.hreflang !== other)
    fail(
      where,
      `언어 전환 링크가 ${switchHref}(${other})가 아닙니다: ${switchLink.href}(${switchLink.hreflang})`,
    );
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
    const xml = await readFile(file, 'utf8');
    for (const url of locs(xml)) listed.add(url);
    // 주소마다 모든 언어 버전(xhtml:link)이 붙어 있는지(변경 1). sitemap 통합은 다른 언어 버전이
    // 없는 주소에 링크를 붙이지 않고 넘어가므로 여기서 확인한다.
    for (const [, block = ''] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = locs(block)[0] ?? '';
      const base = pathWithoutLocale(
        localeOfPath(new URL(loc).pathname),
        new URL(loc).pathname,
      );
      checkAlternates(
        file,
        `${loc}의 언어 버전(xhtml:link)`,
        [...block.matchAll(tagPattern('xhtml:link'))].map(([tag]) => {
          const attrs = attributes(tag);
          return [attrs.hreflang ?? '', attrs.href ?? ''];
        }),
        new Map(LOCALES.map((code) => [code, siteUrl(localePath(code, base))])),
      );
    }
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
  const lastLine = lines.filter((line) => line.trim() !== '').at(-1);
  if (lastLine !== EXPECTED_DAUM_LINE)
    fail(where, `마지막 줄이 Daum 인증 줄이 아닙니다: "${lastLine ?? ''}"`);
}

// OG 이미지 원본의 활동명·한 줄 소개가 프로필과 같은지(이미지를 다시 만들지 않으면 옛 값이 남는다).
// 원본은 언어마다 하나이고, 한 줄 소개는 그 언어의 값과 비교한다(변경 1).
async function checkOgSource(profile: Record<string, unknown>, locale: Locale) {
  const ogSource = OG_SOURCES[locale];
  const source = await readFile(ogSource, 'utf8');
  const intro = profile.intro as Record<string, unknown> | undefined;
  const expected: Record<string, unknown> = {
    name: profile.name,
    intro: intro?.[locale],
  };
  for (const key of ['name', 'intro']) {
    const raw = source.match(
      new RegExp(`data-profile="${key}"[^>]*>([^<]*)<`),
    )?.[1];
    const text = raw === undefined ? undefined : decode(raw);
    if (text !== expected[key])
      fail(
        ogSource,
        `${key}가 프로필(${PROFILE})과 다릅니다: "${text}" ≠ "${String(expected[key])}". 원본을 고치고 sh docs/stages/7-seo/make-images.sh로 이미지를 다시 만든다.`,
      );
  }
}

const profile = parse(await readFile(PROFILE, 'utf8')) as Record<
  string,
  unknown
>;
// 글마다 글 폴더(<slug>/)가 있다(변경 1). 글이 0개면 폴더도 없을 수 있다(6단계).
const articlePaths = new Set(
  (existsSync(BLOG) ? await readdir(BLOG, { withFileTypes: true }) : [])
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .flatMap((entry) =>
      LOCALES.map((locale) => localePath(locale, `/blog/${entry.name}/`)),
    ),
);
const files = existsSync(DIST) ? await htmlFiles(DIST) : [];
if (files.length === 0) fail(DIST, 'HTML 파일이 없습니다(빌드 결과가 없음).');
const pageUrls: string[] = [];
const pagePaths = new Set<string>();
const ogImages = new Map<Locale, Set<string>>();
for (const file of files) {
  const url = checkPage(file, await readFile(file, 'utf8'), {
    articlePaths,
    profile,
    ogImages,
  });
  if (url) pageUrls.push(url);
  pagePaths.add(pagePath(file));
}
for (const path of articlePaths) {
  if (!pagePaths.has(path)) fail(DIST, `글 보기 페이지가 없습니다: ${path}`);
}
// 두 언어(변경 1): 404를 뺀 모든 페이지가 모든 언어로 있는지, 언어마다 OG 이미지가 하나이고 서로 다른지.
for (const path of pagePaths) {
  if (path === '/404.html') continue;
  const base = pathWithoutLocale(localeOfPath(path), path);
  for (const locale of LOCALES) {
    if (!pagePaths.has(localePath(locale, base)))
      fail(
        DIST,
        `${path}의 ${locale} 페이지가 없습니다: ${localePath(locale, base)}`,
      );
  }
}
for (const locale of LOCALES) {
  const images = [...(ogImages.get(locale) ?? [])];
  if (images.length !== 1)
    fail(
      DIST,
      `${locale} 페이지의 og:image가 ${images.length}종류입니다(1종류여야 한다): ${images.join(', ')}`,
    );
}
if (
  new Set(LOCALES.map((locale) => [...(ogImages.get(locale) ?? [])][0]))
    .size !== LOCALES.length
)
  fail(
    DIST,
    '언어마다 og:image가 달라야 합니다(이미지에 한 줄 소개가 글자로 들어 있다).',
  );
await checkSitemap(pageUrls);
await checkRobots();
for (const locale of LOCALES) await checkOgSource(profile, locale);

if (errors.length > 0) {
  console.error(`빌드 결과 검사 실패(${errors.length}건):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(
  `빌드 결과 검사 통과: HTML ${files.length}개, sitemap 주소 ${pageUrls.length}개`,
);
