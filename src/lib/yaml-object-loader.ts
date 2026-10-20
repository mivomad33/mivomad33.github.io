import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';

// 객체 하나가 든 YAML 파일(예: 프로필)을 항목 하나(id)로 읽는 콘텐츠 로더.
// Astro 기본 파일 로더는 객체의 최상위 키를 각각 다른 항목으로 읽고, 파일을 읽지 못하면(YAML 문법 오류 등)
// 로그만 남긴 채 이전 빌드의 데이터를 그대로 써서 빌드가 성공해 버린다. 그래서 읽기 오류를 그대로 던져 빌드를 멈춘다.
export function yamlObjectLoader(path: string, id: string): Loader {
  return {
    name: 'yaml-object-loader',
    load: async ({ config, store, parseData, watcher, logger }) => {
      const filePath = fileURLToPath(new URL(path, config.root));
      const sync = async () => {
        let data: unknown;
        try {
          data = parseYaml(await readFile(filePath, 'utf-8'));
        } catch (error) {
          // 오류 메시지에 파일 이름을 붙인다(yaml 패키지의 메시지에는 줄·열만 있다).
          throw new Error(
            `${path}을 읽지 못했습니다: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          throw new Error(`${path}에는 객체 하나(키: 값)가 있어야 합니다.`);
        }
        const parsed = await parseData({
          id,
          data: data as Record<string, unknown>,
        });
        store.clear();
        store.set({ id, data: parsed });
      };
      await sync();
      // 개발 서버: 파일이 바뀌면 다시 읽는다. 오류는 서버를 멈추지 않고 로그로 알린다.
      watcher?.add(filePath);
      watcher?.on('change', async (changedPath) => {
        if (changedPath !== filePath) return;
        try {
          await sync();
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
        }
      });
    },
  };
}
