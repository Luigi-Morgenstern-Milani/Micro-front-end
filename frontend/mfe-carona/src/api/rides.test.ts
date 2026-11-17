import { describe, expect, it } from "vitest";
import { emptyFilters } from "../types/ride";
import { buildQuery, toApiDateTime } from "./rides";

describe("toApiDateTime", () => {
  it("completa segundos quando vem de datetime-local", () => {
    expect(toApiDateTime("2026-11-04T09:30")).toBe("2026-11-04T09:30:00");
  });

  it("mantem valor ja completo", () => {
    expect(toApiDateTime("2026-11-04T09:30:00")).toBe("2026-11-04T09:30:00");
  });

  it("retorna vazio sem alterar", () => {
    expect(toApiDateTime("")).toBe("");
  });
});

describe("buildQuery", () => {
  it("retorna string vazia sem filtros e onlyAvailable false", () => {
    expect(
      buildQuery({
        ...emptyFilters(),
        onlyAvailable: false,
      }),
    ).toBe("");
  });

  it("monta origem, destino e onlyAvailable", () => {
    const query = buildQuery({
      ...emptyFilters(),
      origin: " Campus ",
      destination: "Centro",
      onlyAvailable: true,
    });

    expect(query).toBe("?origin=Campus&destination=Centro&onlyAvailable=true");
  });

  it("converte datas dos filtros para o formato da API", () => {
    const query = buildQuery({
      ...emptyFilters(),
      departureFrom: "2026-11-04T08:00",
      departureTo: "2026-11-04T18:00",
      onlyAvailable: false,
    });

    expect(query).toBe(
      "?departureFrom=2026-11-04T08%3A00%3A00&departureTo=2026-11-04T18%3A00%3A00",
    );
  });
});
