// 사이트 언어(변경 1, docs/changes/1-english-version.md). 언어 목록과 언어별 값·경로를 다루는 함수를 이곳 한 곳에 둔다.
// 콘텐츠 스키마와 로더도 이 파일을 쓰므로 astro:content 같은 Astro 전용 모듈을 import하지 않는다.

export const LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
// 기본 언어(원문). 주소에 접두어가 붙지 않는다.
export const DEFAULT_LOCALE: Locale = 'ko';

// 데이터 파일의 글자 값: 언어마다 다른 값({ ko, en }) 또는 두 언어가 같이 쓰는 한 값.
export type LocalizedText = Record<Locale, string>;
export type SharedOrLocalizedText = string | LocalizedText;

// 그 언어의 값을 꺼낸다. 한 값이면 그대로 쓴다.
export function localize(value: SharedOrLocalizedText, locale: Locale): string {
  return typeof value === 'string' ? value : value[locale];
}

// 한글(유니코드 Hangul 문자 전체). 영어 값에 한국어가 남았는지(번역을 잊었는지) 검사하는 데 쓴다.
export const HANGUL = /\p{Script=Hangul}/u;

// 사이트 안 경로(/로 시작)를 그 언어의 경로로 바꾼다. 기본 언어는 그대로, 다른 언어는 앞에 /<언어>를 붙인다.
export function localePath(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

// 경로에서 언어 접두어를 뗀다(/en/blog/ → /blog/). localePath의 반대다.
export function pathWithoutLocale(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : path.slice(`/${locale}`.length);
}

// 주소(/로 시작)의 언어. /<언어>/로 시작하면 그 언어, 아니면 기본 언어다.
export function localeOfPath(path: string): Locale {
  return (
    LOCALES.find(
      (locale) => locale !== DEFAULT_LOCALE && path.startsWith(`/${locale}/`),
    ) ?? DEFAULT_LOCALE
  );
}

// 지금 언어가 아닌 언어(언어 전환 링크가 가는 언어). 언어가 둘이라 하나다.
export function otherLocale(locale: Locale): Locale {
  return locale === 'ko' ? 'en' : 'ko';
}

// 언어마다 페이지를 하나씩 만드는 getStaticPaths 값. 페이지는 src/pages/[...locale]/ 아래에 있고,
// 기본 언어는 접두어 없이(locale 매개변수 없음), 다른 언어는 /<언어>/로 만든다.
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}

// og:locale 값
export const OG_LOCALE: Record<Locale, string> = { ko: 'ko_KR', en: 'en_US' };

// hreflang x-default(어느 언어에도 맞지 않는 검색자에게 보일 버전)가 가리키는 언어.
// 한국어도 영어도 아닌 언어로 검색한 사람에게는 영어가 더 읽기 쉽기 때문이다(변경 1).
export const X_DEFAULT_LOCALE: Locale = 'en';

// 코드에 쓰는 화면 문구. 영어 문구는 변경 1 하위 단계 1의 시안에서 승인한 것이다.
// 영어 사전의 타입을 한국어 사전으로 정해, 문구가 하나라도 빠지면 타입 검사가 실패한다.
const ko = {
  // 이 언어의 이름(언어 전환 링크가 화면 낭독기에 읽히는 이름)
  languageName: '한국어',
  menu: { portfolio: '포트폴리오', blog: '블로그', about: '소개' },
  navLabel: '주 메뉴',
  recentPortfolio: '최근 포트폴리오',
  recentPosts: '최근 글',
  viewAll: '전체 보기',
  empty: '아직 항목이 없습니다.',
  email: '이메일',
  links: '링크',
  updated: '수정',
  prev: '이전 글',
  next: '다음 글',
  pagerLabel: '이전 글과 다음 글',
  // 목록 페이지의 설명 메타 태그(활동명은 프로필 값으로 넣는다)
  portfolioDescription: (name: string) =>
    `${name}의 포트폴리오. 만든 것과 참여한 프로젝트.`,
  blogDescription: (name: string) => `${name}의 개발과 사업 활동 기록.`,
  notFound: '페이지를 찾을 수 없습니다',
  goHome: '홈으로 가기',
};

const en: typeof ko = {
  languageName: 'English',
  menu: { portfolio: 'Portfolio', blog: 'Blog', about: 'About' },
  navLabel: 'Main menu',
  recentPortfolio: 'Recent projects',
  recentPosts: 'Recent posts',
  viewAll: 'View all',
  empty: 'Nothing here yet.',
  email: 'Email',
  links: 'Links',
  updated: 'Updated',
  prev: 'Previous post',
  next: 'Next post',
  pagerLabel: 'Previous and next posts',
  portfolioDescription: (name: string) =>
    `Portfolio of ${name}: things I have built and projects I have worked on.`,
  blogDescription: (name: string) =>
    `Notes by ${name} on software development and building a business.`,
  notFound: 'Page not found',
  goHome: 'Go to home',
};

export const UI: Record<Locale, typeof ko> = { ko, en };
