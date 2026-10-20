import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { blogLoader } from './lib/blog-loader';
import { yamlArrayLoader, yamlObjectLoader } from './lib/yaml-loader';

// 링크: https:// 또는 mailto:로 시작하는 주소, 또는 /로 시작하는 사이트 안 주소.
// //와 /\로 시작하는 주소는 브라우저가 외부 주소로 읽으므로 막는다(브라우저는 \를 /로 바꿔 읽는다).
// https://와 mailto: 뒤에는 내용이 있어야 한다.
// 정해진 필드 외의 키는 오타일 수 있으므로 빌드를 실패시킨다(strictObject).
export const linkSchema = z.strictObject({
  label: z.string().min(1),
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
    intro: z.string().min(1),
    email: z.email(),
    links: z.array(linkSchema).default([]),
  }),
});

const portfolio = defineCollection({
  loader: yamlArrayLoader('src/data/portfolio.yaml'),
  schema: z.strictObject({
    name: z.string().min(1),
    description: z.string().min(1),
    links: z.array(linkSchema).default([]),
  }),
});

// 날짜: YYYY-MM-DD 형식의 실제 날짜(2026-02-30 같은 값은 실패). UTC 자정의 Date로 바꾼다.
// 로더가 frontmatter의 날짜를 문자열 그대로 넘긴다(blog-loader.ts).
const dateSchema = z.iso
  .date({ error: 'YYYY-MM-DD 형식의 날짜여야 합니다(예: 2026-10-20).' })
  .transform((value) => new Date(value));

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
