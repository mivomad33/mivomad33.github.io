import { formatDate } from './format-date';
import type { Locale } from './i18n';

// 메타 태그에 쓰는 값(7단계). 태그 규칙은 docs/design.md의 "메타 태그"를 따른다.

// OG 이미지. 언어마다 하나이고(한 줄 소개가 글자로 들어 있다. 변경 1), 그 언어의 모든 페이지가 같이 쓴다.
export const OG_IMAGE: {
  path: Record<Locale, string>;
  width: number;
  height: number;
} = { path: { ko: '/og.png', en: '/og-en.png' }, width: 1200, height: 630 };

// 글 보기 페이지의 날짜. 수정일은 updated가 있을 때만 넣는다.
export interface ArticleDates {
  published: Date;
  modified?: Date | undefined;
}

interface BlogPostingInput {
  url: string;
  // 글의 언어(ko, en)
  inLanguage: Locale;
  title: string;
  description: string;
  dates: ArticleDates;
  image: string;
  author: { name: string; url: string };
}

// 글 보기의 구조화 데이터(JSON-LD BlogPosting). <script>에 그대로 넣을 문자열을 돌려준다.
// 글 제목에 </script>가 있어도 태그가 끝나지 않도록 <를 이스케이프한다.
export function blogPostingJsonLd({
  url,
  inLanguage,
  title,
  description,
  dates,
  image,
  author,
}: BlogPostingInput): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage,
    image,
    datePublished: formatDate(dates.published),
    ...(dates.modified && { dateModified: formatDate(dates.modified) }),
    author: { '@type': 'Person', name: author.name, url: author.url },
  };
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
