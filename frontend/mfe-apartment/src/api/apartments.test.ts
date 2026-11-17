import { describe, expect, it } from "vitest";
import { emptyFilters } from "../types/apartment";
import { buildQuery } from "./apartments";

describe("buildQuery", () => {
  it("retorna string vazia quando nao ha filtros", () => {
    expect(buildQuery(emptyFilters())).toBe("");
  });

  it("monta query com cidade e bairro", () => {
    const filters = {
      ...emptyFilters(),
      city: " Sao Paulo",
      neighborhood: " Pinheiros ",
    };

    expect(buildQuery(filters)).toBe("?city=Sao+Paulo&neighborhood=Pinheiros");
  });

  it("inclui faixa de aluguel e quartos", () => {
    const filters = {
      ...emptyFilters(),
      minRent: "1000",
      maxRent: "2500",
      bedrooms: "2",
      available: "true" as const,
    };

    expect(buildQuery(filters)).toBe(
      "?minRent=1000&maxRent=2500&bedrooms=2&available=true",
    );
  });
});
