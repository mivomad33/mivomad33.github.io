// 검색 엔진 소유 확인 값(8단계 하위 단계 4). 페이지에 공개되는 값이라 비밀이 아니다.
// 빌드 결과 검사(scripts/check-build.ts)에도 같은 값을 따로 적어 두었다. 값을 바꾸면 두 곳을 함께 고친다.
// 콘솔에서 사이트를 다시 등록하면 값이 바뀐다. 기록은 docs/stages/8-launch.md에 있다.

// 홈(/)의 메타 태그로 확인한다. 콘솔에 등록한 주소가 https://mivomad33.dev/ 이기 때문이다.
export const SITE_VERIFICATION_META = [
  // Google Search Console(URL 접두어 속성). Bing은 Search Console에서 가져와 따로 값이 없다.
  {
    name: 'google-site-verification',
    content: 'ufokYjzwNsn16dwZOu1vXYfypS89gMRuKjH0k9JATHc',
  },
  // 네이버 서치어드바이저
  {
    name: 'naver-site-verification',
    content: '76fc5cada79ecd01270e406218364f6d9a679236',
  },
] as const;

// Daum 웹마스터도구. robots.txt 맨 아래에 넣는 인증 줄이다.
export const DAUM_WEBMASTER_LINE =
  '#DaumWebMasterTool:fc660409386d824914e6d26c3fae6b0a778fb6c44e66a59f42e2f852dc3c3b81:kHsTc7yt7rZFR+42wFNLLw==';
