import { getCollection } from 'astro:content';

// 블로그 글(src/content/blog/). 게시일 최신순, 같은 날이면 slug(id) 오름차순.
export async function getPosts() {
  return (await getCollection('blog')).toSorted(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

// 홈의 최근 글: 최신 3개.
export async function getRecentPosts() {
  return (await getPosts()).slice(0, 3);
}

// 글 보기 페이지마다 쓸 글과 이전·다음 글. 이전 글은 바로 더 오래된 글, 다음 글은 바로 더 최신 글이다(글 목록과 같은 순서).
export async function getPostsWithNeighbors() {
  const posts = await getPosts();
  return posts.map((post, index) => ({
    post,
    // at()과 조건식으로 써서 "없을 수 있음"이 타입에 드러나게 한다(배열 인덱스 접근은 undefined가 타입에서 빠진다).
    prev: posts.at(index + 1),
    next: index > 0 ? posts[index - 1] : undefined,
  }));
}
