#!/bin/sh
# OG 이미지와 파비콘 PNG를 원본(og-image.html, favicon.svg)에서 만들어 public/에 넣는다(7단계).
# 프로필의 활동명·한 줄 소개나 원본을 바꾸면 다시 실행한다: sh docs/stages/7-seo/make-images.sh
# macOS의 Google Chrome으로 렌더링한다(이미지 처리 패키지를 따로 설치하지 않기 위해서다).
set -eu
SRC="$(cd "$(dirname "$0")" && pwd)"
# 출력 위치는 실행한 폴더가 아니라 이 스크립트 위치(저장소의 docs/stages/7-seo/) 기준으로 정한다.
ROOT="$(cd "$SRC/../../.." && pwd)"
OUT="$ROOT/public"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"

# Chrome은 글꼴 파일을 못 읽어도 대체 글꼴로 조용히 렌더링하므로, _fonts.css가 읽는 파일이 있는지 먼저 확인한다.
for font in $(sed -n "s|.*url('\.\./\.\./\.\./\([^']*\)').*|\1|p" "$SRC/_fonts.css"); do
  if [ ! -f "$ROOT/$font" ]; then
    echo "글꼴 파일이 없습니다: $font (pnpm install 뒤 다시 실행한다)" >&2
    exit 1
  fi
done

"$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 \
  --screenshot="$OUT/og.png" "file://$SRC/og-image.html" 2>/dev/null

cp "$SRC/favicon.svg" "$OUT/favicon.svg"

# favicon-96.png: SVG를 지원하지 않는 브라우저용(Google 검색 결과는 48의 배수 크기를 권한다). 배경은 투명.
# apple-touch-icon.png: iOS 홈 화면용. 투명 부분이 검게 보이므로 사이트 배경색 위에 여백을 두고 넣는다.
# 렌더링용 HTML은 임시 폴더에 만든다(data: 주소에서는 로컬 파일을 읽지 못한다).
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp "$SRC/favicon.svg" "$TMP/"
# 헤드리스 Chrome은 창 폭을 지정값보다 넓게 잡을 수 있어, 가운데 정렬 대신 왼쪽 위 기준 여백으로 놓는다.
shot() { # 크기 파일 배경색 이미지-크기
  pad=$((($1 - $4) / 2))
  printf '<!doctype html><body style="margin:0;background:%s"><img src="favicon.svg" width="%s" height="%s" style="display:block;margin:%spx">' "$3" "$4" "$4" "$pad" >"$TMP/$2.html"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=1 --window-size="$1,$1" --default-background-color=00000000 \
    --screenshot="$OUT/$2" "file://$TMP/$2.html" 2>/dev/null
}
shot 96 favicon-96.png transparent 96
shot 180 apple-touch-icon.png "#fcfcfc" 132

echo "만든 파일: $OUT/og.png favicon.svg favicon-96.png apple-touch-icon.png"
