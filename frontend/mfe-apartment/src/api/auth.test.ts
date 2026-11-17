import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessToken,
  getAccessToken,
  login,
  logout,
  setAccessToken,
} from "./auth";

describe("auth session", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persiste e limpa o token", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("token-abc");
    expect(getAccessToken()).toBe("token-abc");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("logout remove o token", () => {
    setAccessToken("token-abc");
    logout();
    expect(getAccessToken()).toBeNull();
  });

  it("login salva o accessToken retornado pela API", async () => {
    const payload = {
      accessToken: "jwt-xyz",
      user: { id: 1, name: "Ana", email: "ana@teste.com" },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    const result = await login("ana@teste.com", "senha");

    expect(result).toEqual(payload);
    expect(getAccessToken()).toBe("jwt-xyz");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8090/api/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
