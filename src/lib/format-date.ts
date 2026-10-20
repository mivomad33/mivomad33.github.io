// 날짜를 YYYY-MM-DD 문자열로 바꾼다(design.md 날짜 표시). 글의 날짜는 UTC 자정이므로 UTC 기준으로 꺼낸다.
// 화면 표시와 <time datetime>이 같은 값을 쓴다.
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
