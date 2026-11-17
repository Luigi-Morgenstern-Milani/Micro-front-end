import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = dirname(fileURLToPath(import.meta.url));
const SHELL_ROOT = join(SRC_ROOT, '..');

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

describe('arquitetura shell (host Module Federation)', () => {
  const sources = listSourceFiles(SRC_ROOT);

  it('nao chama microservicos diretamente', () => {
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

  it('carrega remotes via Module Federation (sem imports relativos de outros MFEs)', () => {
    const app = readFileSync(join(SRC_ROOT, 'App.jsx'), 'utf8');

    expect(app).toMatch(/import\('mfeUsuario\//);
    expect(app).toMatch(/import\('caronaMfe\//);
    expect(app).toMatch(/import\('apartmentMfe\//);
    expect(app).toMatch(/import\('chatMfe\//);
    expect(app).not.toMatch(/\.\.\/mfe-/);
    expect(app).not.toMatch(/\.\.\/\.\.\/mfe-/);
  });

  it('vite.config declara remotes do federation', () => {
    const viteConfig = readFileSync(join(SHELL_ROOT, 'vite.config.js'), 'utf8');

    expect(viteConfig).toMatch(/remotes\s*:/);
    expect(viteConfig).toMatch(/mfeUsuario/);
    expect(viteConfig).toMatch(/caronaMfe/);
    expect(viteConfig).toMatch(/apartmentMfe/);
    expect(viteConfig).toMatch(/chatMfe/);
  });
});
