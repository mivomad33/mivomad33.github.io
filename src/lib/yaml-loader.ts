import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';

// YAML 데이터 파일을 읽는 콘텐츠 로더(프로필, 포트폴리오).
// Astro 기본 파일 로더는 객체의 최상위 키를 각각 다른 항목으로 읽고, 배열 항목마다 id 필드를 요구하며,
// 파일을 읽지 못하면(YAML 문법 오류 등) 로그만 남긴 채 이전 빌드의 데이터를 그대로 써서 빌드가 성공해 버린다.
// 그래서 읽기 오류와 형식 오류를 그대로 던져 빌드를 멈춘다.

type Entry = { id: string; data: Record<string, unknown> };

// 파일을 읽고, toEntries가 바꾼 항목들로 컬렉션을 채운다. toEntries는 형식이 틀리면 오류를 던진다.
function yamlLoader(
  name: string,
  path: string,
  toEntries: (data: unknown) => Entry[],
): Loader {
  return {
    name,
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
        // 모든 항목을 검증한 뒤에 저장소를 바꾼다(일부만 바뀐 상태가 남지 않게).
        const parsed = await Promise.all(
          toEntries(data).map(async (entry) => ({
            id: entry.id,
            data: await parseData(entry),
          })),
        );
        store.clear();
        for (const entry of parsed) store.set(entry);
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// 객체 하나가 든 파일(예: 프로필)을 항목 하나(id)로 읽는다.
export function yamlObjectLoader(path: string, id: string): Loader {
  return yamlLoader('yaml-object-loader', path, (data) => {
    if (!isObject(data)) {
      throw new Error(`${path}에는 객체 하나(키: 값)가 있어야 합니다.`);
    }
    return [{ id, data }];
  });
}

// 항목 배열이 든 파일(예: 포트폴리오)을 읽는다. id는 파일에 적은 위치(1부터)이고,
// 컬렉션은 순서를 보장하지 않으므로 가져오는 쪽에서 id의 숫자 순서로 정렬한다(orderById).
// 빈 배열([])은 항목 0개로 읽는다. 빈 파일은 배열이 아니므로 오류다.
export function yamlArrayLoader(path: string): Loader {
  return yamlLoader('yaml-array-loader', path, (data) => {
    if (!Array.isArray(data)) {
      throw new Error(
        `${path}에는 항목 배열(- 로 시작하는 목록)이 있어야 합니다. 항목이 없으면 []를 적습니다.`,
      );
    }
    return data.map((item, index) => {
      const id = String(index + 1);
      if (!isObject(item)) {
        throw new Error(`${path}의 ${id}번째 항목은 객체(키: 값)여야 합니다.`);
      }
      return { id, data: item };
    });
  });
}

// yamlArrayLoader로 읽은 항목을 파일에 적은 순서로 정렬한다.
export function orderById<T extends { id: string }>(entries: T[]): T[] {
  return entries.toSorted((a, b) => Number(a.id) - Number(b.id));
}
