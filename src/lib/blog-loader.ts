import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'astro/loaders';
import type { Loader, ParseDataOptions } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';

// 블로그 글(src/content/blog/<slug>.md)을 읽는 콘텐츠 로더. Astro 기본 glob() 로더를 감싸 세 가지를 바꾼다.
// - 파일 검사: 글 폴더의 모든 파일(images/ 아래와 .으로 시작하는 파일은 빼고)이 `<slug>.md`가 아니면 빌드를 멈춘다.
//   기본 로더는 형식이 틀린 이름을 slug 형식으로 바꿔(`My Post.md` → `my-post`) 통과시키고,
//   `.MD`·`.markdown` 같은 확장자와 패턴 밖의 하위 폴더 글은 오류 없이 건너뛰기 때문이다.
// - id: 파일 이름(확장자 뺀 것)을 그대로 slug로 쓴다(기본 동작은 frontmatter에 slug가 있으면 그것을 쓴다).
// - 스키마에 넘기는 frontmatter: 날짜를 Date로 바꾸지 않고 적힌 문자열 그대로 넘긴다.
//   Astro는 `2026-10-20` 같은 값을 Date로 바꾸는데, 이때 `2026-13-45`가 오류 없이 2027-02-14가 되고
//   `2026-2-3`도 통과해 버린다. 문자열을 받으면 스키마가 YYYY-MM-DD 형식과 실제 날짜인지 검사할 수 있다.
//   Astro가 바꾼 값에서는 원래 문자열을 알 수 없으므로, 파일의 frontmatter를 날짜 변환 없이 다시 읽는다.
// 읽기·frontmatter 문법·스키마 오류는 기본 로더가 그대로 던져 빌드가 멈춘다(세부는 6단계 문서).

const BASE = 'src/content/blog';
// 영문 소문자·숫자를 하이픈 하나로 이은 이름(하이픈을 연달아 쓰거나 맨 앞·뒤에 둘 수 없다).
const SLUG_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
// frontmatter를 찾는 규칙은 Astro(@astrojs/internal-helpers의 frontmatterRE)와 같게 둔다.
// 규칙이 다르면 Astro는 읽은 글을 여기서 못 읽어, 실제 원인과 다른 오류가 나기 때문이다.
const FRONTMATTER = /(?:^\uFEFF?|^\s*\n)(---|\+\+\+)([\s\S]*?\n)(?:---|\+\+\+)/;

export function blogLoader(): Loader {
  const inner = glob({
    pattern: '*.md',
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

// 글 폴더에 `<slug>.md`가 아닌 파일이 있으면 빌드를 멈춘다. 폴더가 없으면 글 0개로 본다.
async function checkFiles(dir: string) {
  let entries;
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue;
    const file = relative(dir, join(entry.parentPath, entry.name)).replaceAll(
      '\\',
      '/',
    );
    if (file.startsWith('images/')) continue;
    if (SLUG_FILE.test(file)) continue;
    throw new Error(
      `${BASE}/${file}: 글 파일은 ${BASE}/ 바로 아래에 <slug>.md 이름으로 둔다. slug는 영문 소문자·숫자를 하이픈 하나로 이은 이름이다(예: first-post.md. 하이픈을 연달아 쓰거나 맨 앞·뒤에 둘 수 없다). 이미지는 images/<slug>/에 둔다.`,
    );
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
