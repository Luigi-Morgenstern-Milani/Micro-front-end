import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = dirname(fileURLToPath(import.meta.url));

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const FORBIDDEN_SERVICE_URLS = [
  /localhost:8080\b/,
  /localhost:8081\b/,
  /localhost:8082\b/,
  /localhost:8083\b/,
];

function listSourceFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listSourceFiles(full));
      continue;
    }
    if (entry.includes('.test.') || entry.includes('.spec.')) {
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      files.push(full);
    }
  }

  return files;
}

describe('arquitetura mfe-usuario', () => {
  const sources = listSourceFiles(SRC_ROOT);

  it('nao chama microservicos diretamente (apenas gateway)', () => {
    const violations = [];

    for (const file of sources) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_SERVICE_URLS) {
        if (pattern.test(content)) {
          violations.push(`${relative(SRC_ROOT, file)} → ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('cliente HTTP usa o gateway na porta 8090 por padrao', () => {
    const client = readFileSync(join(SRC_ROOT, 'api', 'client.js'), 'utf8');
    expect(client).toMatch(/localhost:8090/);
  });

  it('mantem separacao de pastas api / components', () => {
    expect(statSync(join(SRC_ROOT, 'api')).isDirectory()).toBe(true);
    expect(statSync(join(SRC_ROOT, 'components')).isDirectory()).toBe(true);
  });
});
