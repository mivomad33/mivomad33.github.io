import { getCollection } from 'astro:content';
import { orderById } from './yaml-loader';

// 포트폴리오 데이터(src/data/portfolio.yaml). 파일에 적은 순서대로 돌려준다.
export async function getPortfolio() {
  return orderById(await getCollection('portfolio')).map(({ data }) => data);
}

// 홈의 최근 포트폴리오: 파일 앞에서부터 3개(새 항목을 파일 맨 위에 적는다).
export async function getRecentPortfolio() {
  return (await getPortfolio()).slice(0, 3);
}
