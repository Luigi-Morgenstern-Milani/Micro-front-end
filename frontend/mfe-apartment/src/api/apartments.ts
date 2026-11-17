import { getAccessToken } from "./auth";
import type { Apartment, ApartmentFilters, ApartmentFormData } from "../types/apartment";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

export function buildQuery(filters: ApartmentFilters): string {
  const params = new URLSearchParams();

  if (filters.city.trim()) {
    params.set("city", filters.city.trim());
  }
  if (filters.neighborhood.trim()) {
    params.set("neighborhood", filters.neighborhood.trim());
  }
  if (filters.minRent.trim()) {
    params.set("minRent", filters.minRent.trim());
  }
  if (filters.maxRent.trim()) {
    params.set("maxRent", filters.maxRent.trim());
  }
  if (filters.bedrooms.trim()) {
    params.set("bedrooms", filters.bedrooms.trim());
  }
  if (filters.available) {
    params.set("available", filters.available);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Formulario (strings) → payload aceito por ApartmentCreateRequest/ApartmentUpdateRequest. */
export function toApartmentPayload(form: ApartmentFormData) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    address: form.address.trim(),
    number: form.number.trim(),
    complement: form.complement.trim() || null,
    neighborhood: form.neighborhood.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase(),
    cep: form.cep.trim(),
    bedrooms: Number(form.bedrooms),
    bathrooms: Number(form.bathrooms),
    rentPrice: Number(form.rentPrice),
    condominiumPrice: form.condominiumPrice.trim() ? Number(form.condominiumPrice) : null,
    available: form.available,
  };
}

function authHeaders(jsonBody = false): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Nao autenticado");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  if (jsonBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; title?: string; message?: string };
    return body.detail || body.title || body.message || fallback;
  } catch {
    return fallback;
  }
}

async function handle<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 401) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  if (response.status === 403) {
    throw new Error("Voce so pode alterar os seus proprios anuncios.");
  }
  if (!response.ok) {
    throw new Error(await parseError(response, fallback));
  }
  return (await response.json()) as T;
}

export async function listApartments(filters: ApartmentFilters): Promise<Apartment[]> {
  const response = await fetch(`${API_BASE}/api/v1/apartments${buildQuery(filters)}`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar os apartamentos");
}

export async function listMyApartments(): Promise<Apartment[]> {
  const response = await fetch(`${API_BASE}/api/v1/apartments/my`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar seus anuncios");
}

export async function getApartment(id: number): Promise<Apartment> {
  const response = await fetch(`${API_BASE}/api/v1/apartments/${id}`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar o anuncio");
}

export async function createApartment(form: ApartmentFormData): Promise<Apartment> {
  const response = await fetch(`${API_BASE}/api/v1/apartments`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(toApartmentPayload(form)),
  });
  return handle(response, "Nao foi possivel publicar o anuncio");
}

export async function updateApartment(
  id: number,
  form: ApartmentFormData,
): Promise<Apartment> {
  const response = await fetch(`${API_BASE}/api/v1/apartments/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(toApartmentPayload(form)),
  });
  return handle(response, "Nao foi possivel atualizar o anuncio");
}

export async function deleteApartment(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/apartments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (response.status === 401) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  if (response.status === 403) {
    throw new Error("Voce so pode remover os seus proprios anuncios.");
  }
  if (response.status === 404) {
    throw new Error("Anuncio nao encontrado.");
  }
  if (!response.ok) {
    throw new Error(await parseError(response, "Nao foi possivel remover o anuncio"));
  }
}
