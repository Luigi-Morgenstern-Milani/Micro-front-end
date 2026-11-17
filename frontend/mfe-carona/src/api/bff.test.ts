import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardUrl, fetchDashboard } from "./bff";

describe("dashboardUrl", () => {
  it("aponta para o endpoint BFF do gateway", () => {
    expect(dashboardUrl()).toMatch(/\/api\/bff\/dashboard$/);
  });
});

describe("fetchDashboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("exige token de autenticacao", async () => {
    await expect(fetchDashboard()).rejects.toThrow(/autenticado/i);
  });

  it("chama apenas a URL do gateway BFF com Bearer", async () => {
    localStorage.setItem("cc_access_token", "token-teste");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        totalUsuarios: 2,
        totalApartamentos: 3,
        totalApartamentosDisponiveis: 1,
        menorAluguelDisponivel: 900,
        totalCaronas: 4,
        totalCaronasAbertas: 2,
        totalConversas: 1,
        statusMicrosservicos: {},
        timestampGeracao: "2026-11-04T09:00:00",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await fetchDashboard();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(dashboardUrl());
    expect(url).not.toMatch(/:808[0-3]/);
    expect(options.headers).toMatchObject({
      Authorization: "Bearer token-teste",
      Accept: "application/json",
    });
    expect(data.totalCaronasAbertas).toBe(2);
    expect(data.totalConversas).toBe(1);
  });
});
