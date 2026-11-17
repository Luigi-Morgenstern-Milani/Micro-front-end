import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC_ROOT = dirname(fileURLToPath(import.meta.url));

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

/** Portas dos microservicos — o MFE so pode falar com o gateway (:8090). */
const FORBIDDEN_SERVICE_URLS = [
  /localhost:8080\b/,
  /localhost:8081\b/,
  /localhost:8082\b/,
  /localhost:8083\b/,
];

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listSourceFiles(full));
      continue;
    }
    if (entry.includes(".test.") || entry.includes(".spec.")) {
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      files.push(full);
    }
  }

  return files;
}

describe("arquitetura mfe-apartment", () => {
  const sources = listSourceFiles(SRC_ROOT);

  it("nao chama microservicos diretamente (apenas gateway)", () => {
    const violations: string[] = [];

    for (const file of sources) {
      const content = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_SERVICE_URLS) {
        if (pattern.test(content)) {
          violations.push(`${relative(SRC_ROOT, file)} → ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("clientes HTTP usam o gateway na porta 8090 por padrao", () => {
    const apiFiles = sources.filter((f) => f.includes(`${join("api")}`));
    expect(apiFiles.length).toBeGreaterThan(0);

    for (const file of apiFiles) {
      const content = readFileSync(file, "utf8");
      expect(content).toMatch(/localhost:8090/);
    }
  });

  it("mantem separacao de pastas api / components / pages", () => {
    const expectedDirs = ["api", "components", "pages", "types"];
    for (const dir of expectedDirs) {
      expect(statSync(join(SRC_ROOT, dir)).isDirectory()).toBe(true);
    }
  });
});
