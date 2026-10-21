import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { blogLoader } from './lib/blog-loader';
import { HANGUL } from './lib/i18n';
import { yamlArrayLoader, yamlObjectLoader } from './lib/yaml-loader';

// 언어마다 다른 글자(변경 1): ko, en을 모두 적어야 하고, 영어 값에는 한글을 쓸 수 없다(번역을 잊은 것을 잡는다).
const localizedText = z.strictObject({
  ko: z.string().min(1),
  en: z
    .string()
    .min(1)
    .refine((value) => !HANGUL.test(value), {
      message: '영어 값(en)에는 한글을 쓸 수 없습니다.',
    }),
});

// 두 언어가 같을 수 있는 글자(링크명, 포트폴리오 명칭): 한 값 또는 ko·en.
// 한 값은 영어 페이지에도 그대로 나오므로 한글을 쓸 수 없다.
const sharedOrLocalizedText = z.union(
  [
    z
      .string()
      .min(1)
      .refine((value) => !HANGUL.test(value), {
        message:
          '한 값으로 적으면 두 언어가 같이 쓰므로 한글을 쓸 수 없습니다. 언어마다 다르면 ko, en으로 나눠 적습니다.',
      }),
    localizedText,
  ],
  {
    // 두 형식 모두 맞지 않을 때(예: ko만 적음) Zod 기본 메시지 대신 적는 방법을 알린다.
    error: '한 값(두 언어가 같이 씀) 또는 ko와 en을 모두 적은 값이어야 합니다.',
  },
);

// 링크: https:// 또는 mailto:로 시작하는 주소, 또는 /로 시작하는 사이트 안 주소.
// //와 /\로 시작하는 주소는 브라우저가 외부 주소로 읽으므로 막는다(브라우저는 \를 /로 바꿔 읽는다).
// https://와 mailto: 뒤에는 내용이 있어야 한다.
// 정해진 필드 외의 키는 오타일 수 있으므로 빌드를 실패시킨다(strictObject).
const linkSchema = z.strictObject({
  label: sharedOrLocalizedText,
  url: z
    .string()
    .regex(
      /^(https:\/\/[^\s/\\]|mailto:\S|\/(?![/\\]))/,
      'https://, mailto:, / 중 하나로 시작해야 합니다.',
    ),
});

const profile = defineCollection({
  loader: yamlObjectLoader('src/data/profile.yaml', 'profile'),
  schema: z.strictObject({
    name: z.string().min(1),
    intro: localizedText,
    email: z.email(),
    links: z.array(linkSchema).default([]),
  }),
});

const portfolio = defineCollection({
  loader: yamlArrayLoader('src/data/portfolio.yaml'),
  schema: z.strictObject({
    name: sharedOrLocalizedText,
    description: localizedText,
    links: z.array(linkSchema).default([]),
  }),
});

// 날짜: YYYY-MM-DD 형식의 실제 날짜(2026-02-30 같은 값은 실패). UTC 자정의 Date로 바꾼다.
// 로더가 frontmatter의 날짜를 문자열 그대로 넘긴다(blog-loader.ts).
const dateSchema = z.iso
  .date({ error: 'YYYY-MM-DD 형식의 날짜여야 합니다(예: 2026-10-20).' })
  .transform((value) => new Date(value));

// 블로그 글: 언어 파일(<slug>/ko.md, <slug>/en.md)마다 항목 하나. 두 파일의 짝, 날짜 일치,
// 영어 글의 한글 검사는 로더가 한다(스키마는 파일의 언어를 모른다).
const blog = defineCollection({
  loader: blogLoader(),
  schema: z
    .strictObject({
      title: z.string().min(1),
      description: z.string().min(1),
      date: dateSchema,
      updated: dateSchema.optional(),
    })
    .refine(({ date, updated }) => !updated || updated >= date, {
      message: 'updated(수정일)는 date(게시일)보다 이를 수 없습니다.',
      path: ['updated'],
    }),
});

export const collections = { profile, portfolio, blog };
