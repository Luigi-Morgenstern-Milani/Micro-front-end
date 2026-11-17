import { getAccessToken } from "./auth";
import type { DashboardBff } from "../types/bff";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

export function dashboardUrl(): string {
  return `${API_BASE}/api/bff/dashboard`;
}

export async function fetchDashboard(): Promise<DashboardBff> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Nao autenticado");
  }

  const response = await fetch(dashboardUrl(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o dashboard BFF");
  }

  return (await response.json()) as DashboardBff;
}
