import { getCollection } from 'astro:content';
import { localize, type Locale } from './i18n';
import { orderById } from './yaml-loader';

// 포트폴리오 데이터(src/data/portfolio.yaml). 파일에 적은 순서대로, 글자 값은 그 언어의 것으로 돌려준다.
export async function getPortfolio(locale: Locale) {
  return orderById(await getCollection('portfolio')).map(({ data }) => ({
    name: localize(data.name, locale),
    description: data.description[locale],
    links: data.links.map(({ label, url }) => ({
      label: localize(label, locale),
      url,
    })),
  }));
}

export type PortfolioItem = Awaited<ReturnType<typeof getPortfolio>>[number];

// 홈의 최근 포트폴리오: 파일 앞에서부터 3개(새 항목을 파일 맨 위에 적는다).
export async function getRecentPortfolio(locale: Locale) {
  return (await getPortfolio(locale)).slice(0, 3);
}
