import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'astro/loaders';
import type { Loader, ParseDataOptions } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';
import { HANGUL, LOCALES } from './i18n';

// 블로그 글(src/content/blog/<slug>/<언어>.md)을 읽는 콘텐츠 로더. Astro 기본 glob() 로더를 감싸 네 가지를 바꾼다.
// - 파일 검사: 글 폴더 바로 아래에는 글마다 <slug> 폴더만 두고, 그 안에는 언어별 파일(ko.md, en.md)과 images/만 둔다.
//   형식이 틀린 폴더·파일 이름, 다른 파일, 빠진 언어 파일이 있으면 빌드를 멈춘다.
//   기본 로더는 형식이 틀린 이름을 slug 형식으로 바꿔(`My Post` → `my-post`) 통과시키고,
//   `.MD`·`.markdown` 같은 확장자와 패턴 밖의 파일은 오류 없이 건너뛰기 때문이다.
// - 두 언어 검사(변경 1): 언어 파일의 date·updated가 서로 같아야 하고, 영어 글의 제목·설명에는 한글을 쓸 수 없다.
//   스키마는 파일의 언어를 모르므로 여기서 검사한다.
// - id: `<slug>/<언어>`(예: first-post/ko). 기본 동작은 frontmatter에 slug가 있으면 그것을 쓴다.
// - 스키마에 넘기는 frontmatter: 날짜를 Date로 바꾸지 않고 적힌 문자열 그대로 넘긴다.
//   Astro는 `2026-10-20` 같은 값을 Date로 바꾸는데, 이때 `2026-13-45`가 오류 없이 2027-02-14가 되고
//   `2026-2-3`도 통과해 버린다. 문자열을 받으면 스키마가 YYYY-MM-DD 형식과 실제 날짜인지 검사할 수 있다.
//   Astro가 바꾼 값에서는 원래 문자열을 알 수 없으므로, 파일의 frontmatter를 날짜 변환 없이 다시 읽는다.
// 읽기·frontmatter 문법·스키마 오류는 기본 로더가 그대로 던져 빌드가 멈춘다(세부는 6단계 문서).

const BASE = 'src/content/blog';
// 영문 소문자·숫자를 하이픈 하나로 이은 이름(하이픈을 연달아 쓰거나 맨 앞·뒤에 둘 수 없다).
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCALE_FILES: readonly string[] = LOCALES.map((locale) => `${locale}.md`);
// 언어 파일끼리 같아야 하는 frontmatter 항목과, 영어 글에서 한글을 쓸 수 없는 항목.
const SHARED_KEYS = ['date', 'updated'];
const ENGLISH_KEYS = ['title', 'description'];
// frontmatter를 찾는 규칙은 Astro(@astrojs/internal-helpers의 frontmatterRE)와 같게 둔다.
// 규칙이 다르면 Astro는 읽은 글을 여기서 못 읽어, 실제 원인과 다른 오류가 나기 때문이다.
const FRONTMATTER = /(?:^\uFEFF?|^\s*\n)(---|\+\+\+)([\s\S]*?\n)(?:---|\+\+\+)/;

export function blogLoader(): Loader {
  const inner = glob({
    pattern: '*/*.md',
    base: BASE,
    generateId: ({ entry }) => entry.slice(0, -'.md'.length),
  });
  return {
    name: 'blog-loader',
    load: async (context) => {
      await checkFiles(fileURLToPath(new URL(`${BASE}/`, context.config.root)));
      await inner.load({
        ...context,
        parseData: async <TData extends Record<string, unknown>>(
          props: ParseDataOptions<TData>,
        ) =>
          context.parseData({
            ...props,
            data: props.filePath
              ? ((await readFrontmatter(props.filePath)) as TData)
              : props.data,
          }),
      });
    },
  };
}

const slugRule =
  'slug는 영문 소문자·숫자를 하이픈 하나로 이은 이름이다(예: first-post. 하이픈을 연달아 쓰거나 맨 앞·뒤에 둘 수 없다)';
const layoutRule = `글은 ${BASE}/<slug>/ 폴더에 언어별 파일(${LOCALE_FILES.join(', ')})로 두고, 이미지는 그 폴더의 images/에 둔다`;

// 글 폴더의 구조와 언어 파일의 짝·날짜·영어 글을 검사해, 틀리면 빌드를 멈춘다. 폴더가 없으면 글 0개로 본다.
async function checkFiles(dir: string) {
  let entries;
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  // slug마다 찾은 언어 파일
  const posts = new Map<string, Set<string>>();
  for (const entry of entries) {
    const path = relative(dir, join(entry.parentPath, entry.name)).replaceAll(
      '\\',
      '/',
    );
    const [slug = '', ...rest] = path.split('/');
    // .으로 시작하는 파일·폴더(.DS_Store, .gitkeep 등)는 건너뛴다.
    if (path.split('/').some((part) => part.startsWith('.'))) continue;
    if (rest.length === 0) {
      if (!entry.isDirectory()) {
        throw new Error(
          `${BASE}/${path}: 글 폴더 바로 아래에는 파일을 두지 않는다. ${layoutRule}.`,
        );
      }
      if (!SLUG.test(slug)) {
        throw new Error(
          `${BASE}/${path}/: 폴더 이름이 slug 형식이 아니다. ${slugRule}.`,
        );
      }
      posts.set(slug, new Set());
      continue;
    }
    if (!entry.isFile()) continue;
    const file = rest.join('/');
    if (rest[0] === 'images' && rest.length > 1) continue;
    if (rest.length === 1 && LOCALE_FILES.includes(file)) {
      posts.get(slug)?.add(file);
      continue;
    }
    throw new Error(
      `${BASE}/${path}: 글 폴더에 둘 수 없는 파일이다. ${layoutRule}.`,
    );
  }
  for (const [slug, files] of posts) {
    const missing = LOCALE_FILES.filter((file) => !files.has(file));
    if (missing.length > 0) {
      throw new Error(
        `${BASE}/${slug}/: ${missing.join(', ')} 파일이 없다. 글마다 모든 언어 파일(${LOCALE_FILES.join(', ')})이 있어야 한다.`,
      );
    }
    await checkLocales(dir, slug);
  }
}

// 오류 메시지에 쓸 frontmatter 값. 적지 않은 항목은 "없음"으로 보인다.
function shown(value: unknown): string {
  return value === undefined ? '없음' : String(value);
}

// 한 글의 언어 파일들: date·updated가 같은지, 영어 글의 제목·설명에 한글이 없는지.
async function checkLocales(dir: string, slug: string) {
  const [first, ...others] = await Promise.all(
    LOCALES.map(async (locale) => ({
      locale,
      data: await readFrontmatter(join(dir, slug, `${locale}.md`)),
    })),
  );
  if (!first) return;
  for (const other of others) {
    for (const key of SHARED_KEYS) {
      if (first.data[key] !== other.data[key]) {
        throw new Error(
          `${BASE}/${slug}/: ${key}가 ${first.locale}.md(${shown(first.data[key])})와 ${other.locale}.md(${shown(other.data[key])})에서 다르다. 언어 파일의 ${SHARED_KEYS.join('·')}는 같아야 한다.`,
        );
      }
    }
    if (other.locale !== 'en') continue;
    for (const key of ENGLISH_KEYS) {
      const value = other.data[key];
      if (typeof value === 'string' && HANGUL.test(value)) {
        throw new Error(
          `${BASE}/${slug}/en.md: ${key}에 한글이 있다. 영어 글의 ${ENGLISH_KEYS.join('·')}에는 한글을 쓸 수 없다.`,
        );
      }
    }
  }
}

// frontmatter를 YAML 기본 규칙(날짜 변환 없음)으로 읽는다. 문법 오류에는 파일 경로를 붙인다.
// frontmatter가 없거나 객체가 아니면 빈 객체를 넘겨, 스키마가 필수 항목 누락으로 빌드를 멈추게 한다.
async function readFrontmatter(filePath: string) {
  const match = FRONTMATTER.exec(await readFile(filePath, 'utf-8'));
  if (!match) return {};
  if (match[1] === '+++') {
    throw new Error(
      `${filePath}: frontmatter는 --- 로 감싼 YAML로 적는다(+++ TOML은 쓰지 않는다).`,
    );
  }
  let data: unknown;
  try {
    data = parseYaml(match[2] ?? '');
  } catch (error) {
    throw new Error(
      `${filePath}의 frontmatter를 읽지 못했습니다: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  return isObject(data) ? data : {};
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
