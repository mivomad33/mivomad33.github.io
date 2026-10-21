import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Element } from 'hast';
import { defineHastPlugin } from 'satteri';
import { LOCALES } from './i18n';
import {
  EXTERNAL_ICON_CLASS,
  EXTERNAL_LABEL_CLASS,
  EXTERNAL_LINK_ATTRS,
  WORD_JOINER,
  isExternalUrl,
  newTabLabel,
} from './link';

// 글 본문(md)의 외부 링크를 링크 컴포넌트(Link.astro)와 같은 마크업으로 만드는 플러그인(변경 2).
// 본문은 마크업을 직접 쓰지 않아 컴포넌트를 쓸 수 없으므로, 같은 규칙(src/lib/link.ts)으로 같은 마크업을 만든다.
// Astro 기본 마크다운 처리기(Sätteri)의 hast 플러그인이다(astro.config.mjs의 markdown.processor에 넣는다).
// 아이콘이 화면 낭독기에 읽히는 문구의 언어는 글 파일 이름(<slug>/ko.md, en.md)으로 정한다.
// md에 HTML로 직접 쓴 <a>는 처리기가 element로 만들지 않아 여기서 바꾸지 못한다. 빌드 결과 검사가 잡는다.
export const externalLinks = defineHastPlugin({
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties.href;
      if (typeof href !== 'string' || !isExternalUrl(href)) return;
      const path = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '(경로 없음)';
      const name = basename(path, '.md');
      const locale = LOCALES.find((code) => code === name);
      if (!locale)
        throw new Error(
          `${path}: 외부 링크 문구의 언어를 정하지 못했습니다(글 파일 이름은 ${LOCALES.join(', ')} 중 하나여야 한다).`,
        );
      const link: Element = {
        type: 'element',
        tagName: 'a',
        properties: {
          ...node.properties,
          target: EXTERNAL_LINK_ATTRS.target,
          rel: [EXTERNAL_LINK_ATTRS.rel],
        },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: [EXTERNAL_LABEL_CLASS] },
            children: [...node.children],
          },
          { type: 'text', value: WORD_JOINER },
          {
            type: 'element',
            tagName: 'span',
            properties: {
              className: [EXTERNAL_ICON_CLASS],
              role: 'img',
              ariaLabel: newTabLabel(locale),
            },
            children: [],
          },
        ],
      };
      return link;
    },
  },
});
