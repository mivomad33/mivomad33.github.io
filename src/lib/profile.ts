import { getEntry } from 'astro:content';

// 프로필 데이터(src/data/profile.yaml).
export async function getProfile() {
  const entry = await getEntry('profile', 'profile');
  if (!entry) {
    throw new Error('프로필 데이터가 없습니다(src/data/profile.yaml).');
  }
  return entry.data;
}
