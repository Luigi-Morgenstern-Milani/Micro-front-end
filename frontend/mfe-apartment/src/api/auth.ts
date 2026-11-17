const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";
/** Mesma chave do mfe-usuario para compartilhar sessao com o shell. */
const TOKEN_KEY = "cc_access_token";
const USER_KEY = "cc_user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginResult = {
  accessToken: string;
  user: AuthUser;
};

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Email ou senha invalidos");
  }

  const data = (await response.json()) as LoginResult;
  setAccessToken(data.accessToken);
  setStoredUser(data.user);
  return data;
}

export function logout(): void {
  clearAccessToken();
  localStorage.removeItem(USER_KEY);
}
