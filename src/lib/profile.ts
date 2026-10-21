import { getEntry } from 'astro:content';
import { localize, type Locale } from './i18n';

// 프로필 데이터(src/data/profile.yaml). 글자 값은 그 언어의 것으로 꺼내 돌려준다.
export async function getProfile(locale: Locale) {
  const entry = await getEntry('profile', 'profile');
  if (!entry) {
    throw new Error('프로필 데이터가 없습니다(src/data/profile.yaml).');
  }
  const { intro, links, ...rest } = entry.data;
  return {
    ...rest,
    intro: intro[locale],
    links: links.map(({ label, url }) => ({
      label: localize(label, locale),
      url,
    })),
  };
}
