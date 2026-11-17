import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessToken,
  getAccessToken,
  getStoredUser,
  login,
  logout,
  setAccessToken,
  setStoredUser,
} from "./auth";

describe("auth session", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persiste token e usuario", () => {
    setAccessToken("token-abc");
    setStoredUser({ id: 7, name: "Bruno", email: "bruno@teste.com" });

    expect(getAccessToken()).toBe("token-abc");
    expect(getStoredUser()).toEqual({
      id: 7,
      name: "Bruno",
      email: "bruno@teste.com",
    });
  });

  it("logout limpa sessao", () => {
    setAccessToken("token-abc");
    setStoredUser({ id: 7, name: "Bruno", email: "bruno@teste.com" });
    logout();

    expect(getAccessToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it("login salva accessToken e usuario", async () => {
    const payload = {
      accessToken: "jwt-chat",
      user: { id: 2, name: "Carla", email: "carla@teste.com" },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    await login("carla@teste.com", "senha");

    expect(getAccessToken()).toBe("jwt-chat");
    expect(getStoredUser()).toEqual(payload.user);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8090/api/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("clearAccessToken remove apenas o token", () => {
    setAccessToken("token-abc");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
