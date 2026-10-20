import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { yamlObjectLoader } from './lib/yaml-object-loader';

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

export const collections = { profile };
