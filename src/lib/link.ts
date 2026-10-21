// 외부 링크 규칙(변경 2, docs/changes/2-external-links.md). 외부 링크는 새 탭에서 열고, 아이콘과 화면 낭독기 문구를 붙인다.
// 링크 컴포넌트(Link.astro), 글 본문 md 플러그인(markdown-external-links.ts), 빌드 결과 검사가 모두 이 파일을 쓴다.
// 빌드 결과 검사가 Node로 이 파일을 직접 불러오므로, import에 확장자(.ts)를 붙인다.
import { SITE } from './site.ts';
import { UI, type Locale } from './i18n.ts';

const SITE_HOST = new URL(SITE).host;

// 외부 링크인지. 주소를 사이트 주소 기준으로 해석해(브라우저와 같게) http(s)이고 호스트가 사이트와 다르면 외부다.
// 글자로 http(s)://를 보지 않는 이유: //example.com, HTTPS://... 를 사이트 안 링크로 잘못 보지 않기 위해서다.
export function isExternalUrl(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href, SITE);
  } catch {
    return false;
  }
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.host !== SITE_HOST
  );
}

// 외부 링크에 붙이는 속성. noreferrer는 붙이지 않는다(이동한 사이트가 이 사이트에서 온 것을 알 수 있게).
export const EXTERNAL_LINK_ATTRS = { target: '_blank', rel: 'noopener' };

// 외부 링크 안의 마크업. 컴포넌트와 md 플러그인이 같은 구조를 만든다.
//   <span class="external-label">링크 글자</span>(U+2060)<span class="external-icon" role="img" aria-label="(새 탭에서 열림)"></span>
// - 링크 글자 span: 글 본문은 밑줄을 여기에만 긋는다(링크 전체에 그으면 아이콘까지 이어진다).
// - U+2060(줄바꿈하지 않는 글자): 링크가 줄바꿈될 때 아이콘만 다음 줄로 떨어지지 않게 한다.
//   그래서 아이콘은 inline-block이 아니라 일반 인라인이다(inline-block 앞은 U+2060이 있어도 줄바꿈될 수 있다).
// - 아이콘은 화면 낭독기에 "(새 탭에서 열림)"이라는 이름의 이미지로 읽힌다(role="img", aria-label).
//   문구를 숨긴 글자(sr-only)로 두지 않는 이유: 글자로 두면 제목 안의 링크에서 제목 id(앵커)와 목차 글자에 문구가 섞인다
//   (제목 id 플러그인이 이 플러그인 뒤에 돌며 제목의 글자를 모두 읽는다. 변경 2 검토에서 나왔다).
// - 아이콘 모양은 global.css의 external-icon 유틸리티가 정한다.
export const EXTERNAL_LABEL_CLASS = 'external-label';
export const EXTERNAL_ICON_CLASS = 'external-icon';
export const WORD_JOINER = '⁠';

// 아이콘이 화면 낭독기에 읽히는 이름(페이지 언어의 문구).
export function newTabLabel(locale: Locale): string {
  return UI[locale].newTab;
}
