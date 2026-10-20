import type { APIRoute } from 'astro';
import { ALLOW_INDEXING } from '../lib/site';

// 공개 전에는 전체 수집을 막는다. sitemap 주소는 7단계에서 추가한다.
export const GET: APIRoute = () => {
  const rule = ALLOW_INDEXING ? 'Allow: /' : 'Disallow: /';
  return new Response(`User-agent: *\n${rule}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
