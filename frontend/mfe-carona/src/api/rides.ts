import { getAccessToken } from "./auth";
import type {
  Ride,
  RideFilters,
  RideFormData,
  RideRequest,
  RideRequestFormData,
} from "../types/ride";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; title?: string; message?: string };
    return body.detail || body.title || body.message || fallback;
  } catch {
    return fallback;
  }
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

/** datetime-local (YYYY-MM-DDTHH:mm) → ISO LocalDateTime sem timezone. */
export function toApiDateTime(value: string): string {
  if (!value) {
    return value;
  }
  return value.length === 16 ? `${value}:00` : value;
}

function fromForm(form: RideFormData) {
  return {
    origin: form.origin.trim(),
    destination: form.destination.trim(),
    departureAt: toApiDateTime(form.departureAt),
    totalSeats: Number(form.totalSeats),
    pricePerSeat: form.pricePerSeat.trim() ? Number(form.pricePerSeat) : null,
    notes: form.notes.trim() || null,
  };
}

export function buildQuery(filters: RideFilters): string {
  const params = new URLSearchParams();

  if (filters.origin.trim()) {
    params.set("origin", filters.origin.trim());
  }
  if (filters.destination.trim()) {
    params.set("destination", filters.destination.trim());
  }
  if (filters.departureFrom) {
    params.set("departureFrom", toApiDateTime(filters.departureFrom));
  }
  if (filters.departureTo) {
    params.set("departureTo", toApiDateTime(filters.departureTo));
  }
  if (filters.onlyAvailable) {
    params.set("onlyAvailable", "true");
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function handle<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 401) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  if (!response.ok) {
    throw new Error(await parseError(response, fallback));
  }
  return (await response.json()) as T;
}

export async function listRides(filters: RideFilters): Promise<Ride[]> {
  const response = await fetch(`${API_BASE}/api/v1/rides${buildQuery(filters)}`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar as caronas");
}

export async function listMyRides(): Promise<Ride[]> {
  const response = await fetch(`${API_BASE}/api/v1/rides/my`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar suas ofertas");
}

export async function createRide(form: RideFormData): Promise<Ride> {
  const response = await fetch(`${API_BASE}/api/v1/rides`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(fromForm(form)),
  });
  return handle(response, "Nao foi possivel criar a carona");
}

export async function cancelRide(rideId: number): Promise<Ride> {
  const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/cancel`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel cancelar a carona");
}

export async function completeRide(rideId: number): Promise<Ride> {
  const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/complete`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel encerrar a carona");
}

export async function requestSeat(
  rideId: number,
  form: RideRequestFormData,
): Promise<RideRequest> {
  const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/requests`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({
      seatsRequested: Number(form.seatsRequested),
      message: form.message.trim() || null,
    }),
  });
  return handle(response, "Nao foi possivel solicitar a carona");
}

export async function listRideRequests(rideId: number): Promise<RideRequest[]> {
  const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/requests`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar as solicitacoes");
}

export async function acceptRequest(rideId: number, requestId: number): Promise<RideRequest> {
  const response = await fetch(
    `${API_BASE}/api/v1/rides/${rideId}/requests/${requestId}/accept`,
    { method: "POST", headers: authHeaders() },
  );
  return handle(response, "Nao foi possivel aceitar a solicitacao");
}

export async function rejectRequest(rideId: number, requestId: number): Promise<RideRequest> {
  const response = await fetch(
    `${API_BASE}/api/v1/rides/${rideId}/requests/${requestId}/reject`,
    { method: "POST", headers: authHeaders() },
  );
  return handle(response, "Nao foi possivel recusar a solicitacao");
}

export async function cancelRequest(rideId: number, requestId: number): Promise<RideRequest> {
  const response = await fetch(
    `${API_BASE}/api/v1/rides/${rideId}/requests/${requestId}/cancel`,
    { method: "POST", headers: authHeaders() },
  );
  return handle(response, "Nao foi possivel cancelar a solicitacao");
}

export async function listMyRequests(): Promise<RideRequest[]> {
  const response = await fetch(`${API_BASE}/api/v1/ride-requests/my`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar suas solicitacoes");
}
