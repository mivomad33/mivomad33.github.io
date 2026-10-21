import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

// 블로그 글(src/content/blog/<slug>/<언어>.md). 항목 id는 `<slug>/<언어>`이므로,
// 주소에 쓸 slug를 따로 붙여 돌려준다(id를 주소에 쓰면 /blog/<slug>/ko/가 된다).
export type Post = CollectionEntry<'blog'> & { slug: string };

// 그 언어의 글. 게시일 최신순, 같은 날이면 slug 오름차순.
// 두 언어 글의 날짜가 같으므로(로더가 검사한다) 순서도 두 언어가 같다.
export async function getPosts(locale: Locale): Promise<Post[]> {
  const suffix = `/${locale}`;
  return (await getCollection('blog', ({ id }) => id.endsWith(suffix)))
    .map((entry) => ({ ...entry, slug: entry.id.slice(0, -suffix.length) }))
    .toSorted(
      (a, b) =>
        b.data.date.getTime() - a.data.date.getTime() ||
        (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
    );
}

// 홈의 최근 글: 최신 3개.
export async function getRecentPosts(locale: Locale) {
  return (await getPosts(locale)).slice(0, 3);
}

// 글 보기 페이지마다 쓸 글과 이전·다음 글. 이전 글은 바로 더 오래된 글, 다음 글은 바로 더 최신 글이다(글 목록과 같은 순서).
export async function getPostsWithNeighbors(locale: Locale) {
  const posts = await getPosts(locale);
  return posts.map((post, index) => ({
    post,
    // at()과 조건식으로 써서 "없을 수 있음"이 타입에 드러나게 한다(배열 인덱스 접근은 undefined가 타입에서 빠진다).
    prev: posts.at(index + 1),
    next: index > 0 ? posts[index - 1] : undefined,
  }));
}
