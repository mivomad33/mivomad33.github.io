import type { APIRoute } from 'astro';
import { ALLOW_INDEXING, siteUrl } from '../lib/site';
import { DAUM_WEBMASTER_LINE } from '../lib/search-verification';

// 공개 전에는 전체 수집을 막는다. sitemap 주소는 수집 허용 여부와 관계없이 넣는다(7단계).
// Daum 웹마스터도구의 인증 줄은 맨 아래에 둔다(8단계).
export const GET: APIRoute = () => {
  const rule = ALLOW_INDEXING ? 'Allow: /' : 'Disallow: /';
  const body = `User-agent: *\n${rule}\n\nSitemap: ${siteUrl('/sitemap-index.xml')}\n\n${DAUM_WEBMASTER_LINE}\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
