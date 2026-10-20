// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default defineConfig(
  globalIgnores(['dist/', '.astro/', 'docs/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    // Node에서 실행되는 설정 파일에 Node 전역 변수를 허용한다(scripts/의 TS 파일은 typescript-eslint가 no-undef를 꺼 따로 적지 않는다).
    files: ['*.config.{js,mjs,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // src/는 브라우저와 빌드 결과물에서 쓰는 코드라 Node 전용 전역 변수를 막는다.
    // TS 파일에서는 typescript-eslint가 no-undef를 끄고, @types/node가 이 변수들의 타입을 주므로
    // 타입 검사도 잡지 못한다. 그래서 이름으로 막는다. Node 기능이 필요하면 node: 모듈을 import한다.
    files: ['src/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'process',
          'Buffer',
          'global',
          'require',
          'module',
          '__dirname',
          '__filename',
        ].map((name) => ({
          name,
          message:
            'src/에서는 Node 전역 변수를 쓰지 않는다. 필요하면 node: 모듈을 import한다.',
        })),
      ],
    },
  },
);
